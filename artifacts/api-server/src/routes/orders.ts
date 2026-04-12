import { Router } from "express";
import { db, ordersTable, orderItemsTable, cartItemsTable, productsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateOrderBody, GetOrderParams, UpdateOrderStatusParams, UpdateOrderStatusBody } from "@workspace/api-zod";

const router = Router();

function mapOrder(order: any, items: any[]) {
  return {
    ...order,
    total: Number(order.total),
    createdAt: order.createdAt instanceof Date ? order.createdAt.toISOString() : order.createdAt,
    items: items.map((i) => ({
      ...i,
      price: Number(i.price),
      subtotal: Number(i.price) * i.quantity,
    })),
  };
}

async function buildOrder(orderId: number) {
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId));
  if (!order) return null;
  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, orderId));
  return mapOrder(order, items);
}

router.get("/orders", async (req, res) => {
  try {
    const orders = await db.select().from(ordersTable).orderBy(ordersTable.createdAt);
    const result = await Promise.all(orders.map((o) => buildOrder(o.id)));
    res.json(result.filter(Boolean));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/orders", async (req, res) => {
  try {
    const body = CreateOrderBody.parse(req.body);
    const { sessionId, customerName, customerEmail, shippingAddress } = body;

    const cartItems = await db
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

    if (cartItems.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    const total = cartItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

    const result = await db
      .insert(ordersTable)
      .values({ sessionId, status: "confirmed", total: total.toString(), customerName, customerEmail, shippingAddress });

    const orderId = Number(result[0].insertId);

    await db.insert(orderItemsTable).values(
      cartItems.map((item) => ({
        orderId,
        productId: item.productId,
        productName: item.productName,
        price: item.price,
        quantity: item.quantity,
      }))
    );

    await db.delete(cartItemsTable).where(eq(cartItemsTable.sessionId, sessionId));

    const order = await buildOrder(orderId);
    res.status(201).json(order);
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid request" });
  }
});

router.get("/orders/:id", async (req, res) => {
  try {
    const { id } = GetOrderParams.parse({ id: Number(req.params.id) });
    const order = await buildOrder(id);
    if (!order) return res.status(404).json({ error: "Not found" });
    res.json(order);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/orders/:id", async (req, res) => {
  try {
    const { id } = UpdateOrderStatusParams.parse({ id: Number(req.params.id) });
    const { status } = UpdateOrderStatusBody.parse(req.body);
    await db.update(ordersTable).set({ status }).where(eq(ordersTable.id, id));
    const order = await buildOrder(id);
    if (!order) return res.status(404).json({ error: "Not found" });
    res.json(order);
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid request" });
  }
});

export default router;
