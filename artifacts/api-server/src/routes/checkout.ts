import { Router } from "express";
import Stripe from "stripe";
import { db, cartItemsTable, ordersTable, orderItemsTable, productsTable, addressesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_TEST_API_KEY;
    if (!key) {
      throw new Error("STRIPE_TEST_API_KEY environment variable is not set");
    }
    _stripe = new Stripe(key, { apiVersion: "2025-01-27.acacia" });
  }
  return _stripe;
}

function getBaseUrl(req: any): string {
  if (process.env.REPLIT_DEV_DOMAIN) {
    return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  }
  const proto = req.headers["x-forwarded-proto"] ?? req.protocol ?? "http";
  const host = req.headers["x-forwarded-host"] ?? req.get("host") ?? "localhost";
  return `${proto}://${host}`;
}

type ShippingOption = {
  id: string;
  carrier: "Royal Mail" | "DPD";
  label: string;
  eta: string;
  price: number;
  freeEligible: boolean;
};

type CartShippingRow = {
  price: number | string;
  quantity: number;
  weightKg?: number | string | null;
};

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function calculatePackageWeightKg(rows: CartShippingRow[]) {
  const weight = rows.reduce((sum, item) => {
    const itemWeight = Math.max(0.01, Number(item.weightKg ?? 1) || 1);
    return sum + itemWeight * item.quantity;
  }, 0);
  return Math.max(0.1, roundMoney(weight));
}

function calculateSubtotal(rows: CartShippingRow[]) {
  return roundMoney(rows.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0));
}

function buildShippingOptions(rows: CartShippingRow[]) {
  const subtotal = calculateSubtotal(rows);
  const packageWeightKg = calculatePackageWeightKg(rows);
  const royalExtra = Math.max(0, packageWeightKg - 2) * 1.2;
  const dpdExtra = Math.max(0, packageWeightKg - 5) * 0.95;
  const options: ShippingOption[] = [
    { id: "royal-mail-tracked-48", carrier: "Royal Mail", label: "Tracked 48", eta: "2–3 working days", price: roundMoney(3.95 + royalExtra), freeEligible: true },
    { id: "royal-mail-tracked-24", carrier: "Royal Mail", label: "Tracked 24", eta: "1–2 working days", price: roundMoney(4.95 + royalExtra), freeEligible: false },
    { id: "royal-mail-special-delivery", carrier: "Royal Mail", label: "Special Delivery Guaranteed", eta: "Next working day", price: roundMoney(7.95 + royalExtra * 1.5), freeEligible: false },
    { id: "dpd-tracked", carrier: "DPD", label: "Tracked Standard", eta: "1–2 working days", price: roundMoney(5.95 + dpdExtra), freeEligible: false },
    { id: "dpd-next-day", carrier: "DPD", label: "Next Day Tracked", eta: "Next working day", price: roundMoney(8.95 + dpdExtra * 1.25), freeEligible: false },
  ].map((option) => ({
    ...option,
    price: option.id === "royal-mail-tracked-48" && subtotal >= 50 ? 0 : option.price,
  }));
  return { options, subtotal, packageWeightKg, freeShippingThreshold: 50, freeShippingMethod: "royal-mail-tracked-48" };
}

async function getCartRows(sessionId: string) {
  return db
    .select({
      id: cartItemsTable.id,
      productId: cartItemsTable.productId,
      productName: productsTable.name,
      productImageUrl: productsTable.imageUrl,
      price: cartItemsTable.price,
      quantity: cartItemsTable.quantity,
      weightKg: productsTable.weightKg,
    })
    .from(cartItemsTable)
    .innerJoin(productsTable, eq(productsTable.id, cartItemsTable.productId))
    .where(eq(cartItemsTable.sessionId, sessionId));
}

router.post("/checkout/shipping-options", async (req, res) => {
  try {
    const { sessionId } = req.body ?? {};
    if (!sessionId) return res.status(400).json({ error: "Missing session ID" });

    const cartRows = await getCartRows(sessionId);
    if (cartRows.length === 0) return res.status(400).json({ error: "Cart is empty" });

    res.json(buildShippingOptions(cartRows));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to calculate shipping options" });
  }
});

router.post("/checkout/create-session", async (req, res) => {
  try {
    const { sessionId, customerName, customerEmail, shippingAddress, address, shippingMethod, vatIncluded = 0 } = req.body ?? {};

    if (!sessionId || !customerName || !customerEmail || !shippingAddress || !shippingMethod) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const cartRows = await getCartRows(sessionId);

    if (cartRows.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    const shippingQuote = buildShippingOptions(cartRows);
    const selectedShipping = shippingQuote.options.find((option) => option.id === shippingMethod);
    if (!selectedShipping) return res.status(400).json({ error: "Invalid shipping method" });

    const domain = getBaseUrl(req);

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = cartRows.map((item) => ({
      price_data: {
        currency: "gbp",
        product_data: {
          name: item.productName,
          ...(item.productImageUrl ? { images: [item.productImageUrl] } : {}),
        },
        unit_amount: Math.round(Number(item.price) * 100),
      },
      quantity: item.quantity,
    }));

    const shippingAmount = selectedShipping.price;
    if (shippingAmount > 0) {
      lineItems.push({
        price_data: {
          currency: "gbp",
          product_data: {
            name: `${selectedShipping.carrier} ${selectedShipping.label}`,
          },
          unit_amount: Math.round(shippingAmount * 100),
        },
        quantity: 1,
      });
    }

    const user = req.user as any;
    if (user?.id && address?.street && address?.city && address?.zipCode) {
      const existingAddresses = await db.select().from(addressesTable).where(eq(addressesTable.userId, user.id));
      const alreadySaved = existingAddresses.some((saved) =>
        saved.street === address.street &&
        saved.city === address.city &&
        saved.zipCode === address.zipCode
      );
      if (!alreadySaved) {
        await db.insert(addressesTable).values({
          userId: user.id,
          type: "shipping",
          fullName: address.fullName || customerName,
          street: address.street,
          city: address.city,
          state: address.state || "",
          zipCode: address.zipCode,
          country: address.country || "United Kingdom",
          isDefault: existingAddresses.length === 0,
        });
      }
    }

    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      customer_email: customerEmail,
      success_url: `${domain}/checkout/success?stripe_session_id={CHECKOUT_SESSION_ID}&native_session_id=${encodeURIComponent(sessionId)}`,
      cancel_url: `${domain}/cart`,
      metadata: {
        nativeSessionId: sessionId,
        customerName,
        customerEmail,
        shippingAddress,
        shippingMethod: selectedShipping.id,
        shippingLabel: `${selectedShipping.carrier} ${selectedShipping.label}`,
        shippingCost: String(shippingAmount),
        packageWeightKg: String(shippingQuote.packageWeightKg),
        vatIncluded: String(vatIncluded),
        userId: user?.id ? String(user.id) : "",
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

router.post("/checkout/confirm", async (req, res) => {
  try {
    const { stripeSessionId, nativeSessionId } = req.body ?? {};

    if (!stripeSessionId) {
      return res.status(400).json({ error: "Missing stripe session ID" });
    }

    const session = await getStripe().checkout.sessions.retrieve(stripeSessionId);

    if (session.payment_status !== "paid") {
      return res.status(402).json({ error: "Payment not completed" });
    }

    const dedupKey = `stripe:${stripeSessionId}`;
    const existing = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.sessionId, dedupKey));

    if (existing.length > 0) {
      return res.json({ orderId: existing[0].id });
    }

    const sessionId = session.metadata?.nativeSessionId ?? nativeSessionId ?? "";
    const customerName = session.metadata?.customerName ?? "Customer";
    const customerEmail = session.metadata?.customerEmail ?? session.customer_email ?? "";
    const shippingAddress = session.metadata?.shippingAddress ?? "";
    const userId = session.metadata?.userId ? Number(session.metadata.userId) : undefined;
    const total = ((session.amount_total ?? 0) / 100).toFixed(2);
    const shippingCost = Number(session.metadata?.shippingCost ?? 0);
    const packageWeightKg = Number(session.metadata?.packageWeightKg ?? 0);

    const cartRows = await getCartRows(sessionId);

    const insertResult = await db.insert(ordersTable).values({
      sessionId: dedupKey,
      status: "confirmed",
      total,
      customerName,
      customerEmail,
      shippingAddress,
      shippingMethod: session.metadata?.shippingMethod ?? null,
      shippingLabel: session.metadata?.shippingLabel ?? null,
      shippingCost,
      packageWeightKg,
      ...(userId ? { userId } : {}),
    });

    const orderId = Number((insertResult[0] as any).insertId);

    if (cartRows.length > 0) {
      await db.insert(orderItemsTable).values(
        cartRows.map((item) => ({
          orderId,
          productId: item.productId,
          productName: item.productName,
          price: item.price,
          quantity: item.quantity,
          weightKg: Number(item.weightKg ?? 1),
        }))
      );
      await db.delete(cartItemsTable).where(eq(cartItemsTable.sessionId, sessionId));
    }

    res.status(201).json({ orderId });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to confirm order" });
  }
});

export default router;
