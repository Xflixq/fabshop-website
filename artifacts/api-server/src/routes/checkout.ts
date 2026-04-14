import { Router } from "express";
import Stripe from "stripe";
import { db, cartItemsTable, ordersTable, orderItemsTable, productsTable } from "@workspace/db";
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

router.post("/checkout/create-session", async (req, res) => {
  try {
    const { sessionId, customerName, customerEmail, shippingAddress } = req.body ?? {};

    if (!sessionId || !customerName || !customerEmail || !shippingAddress) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const cartRows = await db
      .select({
        id: cartItemsTable.id,
        productId: cartItemsTable.productId,
        productName: productsTable.name,
        productImageUrl: productsTable.imageUrl,
        price: cartItemsTable.price,
        quantity: cartItemsTable.quantity,
      })
      .from(cartItemsTable)
      .innerJoin(productsTable, eq(productsTable.id, cartItemsTable.productId))
      .where(eq(cartItemsTable.sessionId, sessionId));

    if (cartRows.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    const domain = getBaseUrl(req);

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = cartRows.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.productName,
          ...(item.productImageUrl ? { images: [item.productImageUrl] } : {}),
        },
        unit_amount: Math.round(Number(item.price) * 100),
      },
      quantity: item.quantity,
    }));

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
    const total = ((session.amount_total ?? 0) / 100).toFixed(2);

    const cartRows = await db
      .select({
        id: cartItemsTable.id,
        productId: cartItemsTable.productId,
        productName: productsTable.name,
        price: cartItemsTable.price,
        quantity: cartItemsTable.quantity,
      })
      .from(cartItemsTable)
      .innerJoin(productsTable, eq(productsTable.id, cartItemsTable.productId))
      .where(eq(cartItemsTable.sessionId, sessionId));

    const insertResult = await db.insert(ordersTable).values({
      sessionId: dedupKey,
      status: "confirmed",
      total,
      customerName,
      customerEmail,
      shippingAddress,
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
