import { Router } from "express";
import { db, cartItemsTable, productsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { GetCartQueryParams, AddToCartBody, UpdateCartItemParams, UpdateCartItemBody, RemoveCartItemParams } from "@workspace/api-zod";

const router = Router();

async function buildCart(sessionId: string) {
  const items = await db
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

  const cartItems = items.map((item) => ({
    ...item,
    price: Number(item.price),
    subtotal: Number(item.price) * item.quantity,
  }));

  const total = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return { sessionId, items: cartItems, total, itemCount };
}

router.get("/cart", async (req, res) => {
  try {
    const { sessionId } = GetCartQueryParams.parse({ sessionId: req.query.sessionId });
    const cart = await buildCart(sessionId);
    res.json(cart);
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid request" });
  }
});

router.post("/cart", async (req, res) => {
  try {
    const body = AddToCartBody.parse(req.body);
    const { sessionId, productId, quantity } = body;

    const [product] = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, productId));
    if (!product) return res.status(404).json({ error: "Product not found" });

    const [existing] = await db
      .select()
      .from(cartItemsTable)
      .where(
        and(
          eq(cartItemsTable.sessionId, sessionId),
          eq(cartItemsTable.productId, productId)
        )
      );

    if (existing) {
      await db
        .update(cartItemsTable)
        .set({ quantity: existing.quantity + quantity })
        .where(eq(cartItemsTable.id, existing.id));
    } else {
      await db.insert(cartItemsTable).values({
        sessionId,
        productId,
        quantity,
        price: product.price,
      });
    }

    const cart = await buildCart(sessionId);
    res.json(cart);
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid request" });
  }
});

router.put("/cart/item/:cartItemId", async (req, res) => {
  try {
    const { cartItemId } = UpdateCartItemParams.parse({ cartItemId: Number(req.params.cartItemId) });
    const { quantity } = UpdateCartItemBody.parse(req.body);

    const [existing] = await db
      .select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.id, cartItemId));
    if (!existing) return res.status(404).json({ error: "Cart item not found" });

    if (quantity <= 0) {
      await db.delete(cartItemsTable).where(eq(cartItemsTable.id, cartItemId));
    } else {
      await db
        .update(cartItemsTable)
        .set({ quantity })
        .where(eq(cartItemsTable.id, cartItemId));
    }

    const cart = await buildCart(existing.sessionId);
    res.json(cart);
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid request" });
  }
});

router.delete("/cart/item/:cartItemId", async (req, res) => {
  try {
    const { cartItemId } = RemoveCartItemParams.parse({ cartItemId: Number(req.params.cartItemId) });

    const [existing] = await db
      .select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.id, cartItemId));
    if (!existing) return res.status(404).json({ error: "Cart item not found" });

    await db.delete(cartItemsTable).where(eq(cartItemsTable.id, cartItemId));
    const cart = await buildCart(existing.sessionId);
    res.json(cart);
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid request" });
  }
});

export default router;
