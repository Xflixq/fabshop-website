import { Router } from "express";
import { db, productsTable, categoriesTable, ordersTable, orderItemsTable } from "@workspace/db";
import { eq, sql, lte } from "drizzle-orm";
import { AdjustStockParams, AdjustStockBody, GetProductLabelParams, SendLowStockAlertBody } from "@workspace/api-zod";

const router = Router();

function mapInventoryItem(row: any) {
  return {
    ...row,
    price: Number(row.price),
    stockQty: Number(row.stockQty),
    lowStockThreshold: Number(row.lowStockThreshold ?? 5),
    featured: Boolean(row.featured),
    categoryName: row.categoryName ?? null,
    categoryId: row.categoryId ?? null,
    imageUrl: row.imageUrl ?? null,
    specs: row.specs ?? null,
  };
}

router.get("/admin/inventory", async (req, res) => {
  try {
    const rows = await db
      .select({
        id: productsTable.id,
        name: productsTable.name,
        slug: productsTable.slug,
        description: productsTable.description,
        price: productsTable.price,
        sku: productsTable.sku,
        stockQty: productsTable.stockQty,
        lowStockThreshold: productsTable.lowStockThreshold,
        imageUrl: productsTable.imageUrl,
        featured: productsTable.featured,
        categoryId: productsTable.categoryId,
        categoryName: categoriesTable.name,
        specs: productsTable.specs,
      })
      .from(productsTable)
      .leftJoin(categoriesTable, eq(categoriesTable.id, productsTable.categoryId));
    res.json(rows.map(mapInventoryItem));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/admin/inventory/:id/adjust", async (req, res) => {
  try {
    const { id } = AdjustStockParams.parse({ id: Number(req.params.id) });
    const { delta, reason } = AdjustStockBody.parse(req.body);

    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, id));
    if (!product) return res.status(404).json({ error: "Product not found" });

    const newQty = Math.max(0, Number(product.stockQty) + delta);
    await db.update(productsTable).set({ stockQty: newQty }).where(eq(productsTable.id, id));

    const [updated] = await db
      .select({
        id: productsTable.id,
        name: productsTable.name,
        slug: productsTable.slug,
        description: productsTable.description,
        price: productsTable.price,
        sku: productsTable.sku,
        stockQty: productsTable.stockQty,
        lowStockThreshold: productsTable.lowStockThreshold,
        imageUrl: productsTable.imageUrl,
        featured: productsTable.featured,
        categoryId: productsTable.categoryId,
        categoryName: categoriesTable.name,
        specs: productsTable.specs,
      })
      .from(productsTable)
      .leftJoin(categoriesTable, eq(categoriesTable.id, productsTable.categoryId))
      .where(eq(productsTable.id, id));

    res.json(mapInventoryItem(updated));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid request" });
  }
});

router.get("/admin/low-stock", async (req, res) => {
  try {
    const rows = await db
      .select({
        id: productsTable.id,
        name: productsTable.name,
        slug: productsTable.slug,
        description: productsTable.description,
        price: productsTable.price,
        sku: productsTable.sku,
        stockQty: productsTable.stockQty,
        lowStockThreshold: productsTable.lowStockThreshold,
        imageUrl: productsTable.imageUrl,
        featured: productsTable.featured,
        categoryId: productsTable.categoryId,
        categoryName: categoriesTable.name,
        specs: productsTable.specs,
      })
      .from(productsTable)
      .leftJoin(categoriesTable, eq(categoriesTable.id, productsTable.categoryId))
      .where(sql`${productsTable.stockQty} <= ${productsTable.lowStockThreshold}`);
    res.json(rows.map(mapInventoryItem));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/admin/dashboard", async (req, res) => {
  try {
    const [productStats] = await db
      .select({
        totalProducts: sql<number>`cast(count(*) as unsigned)`,
        inStockCount: sql<number>`cast(sum(case when ${productsTable.stockQty} > 0 then 1 else 0 end) as unsigned)`,
        lowStockCount: sql<number>`cast(sum(case when ${productsTable.stockQty} <= ${productsTable.lowStockThreshold} then 1 else 0 end) as unsigned)`,
        outOfStockCount: sql<number>`cast(sum(case when ${productsTable.stockQty} = 0 then 1 else 0 end) as unsigned)`,
      })
      .from(productsTable);

    const [orderStats] = await db
      .select({
        totalOrders: sql<number>`cast(count(*) as unsigned)`,
        totalRevenue: sql<number>`cast(coalesce(sum(total), 0) as decimal(10,2))`,
        pendingOrders: sql<number>`cast(sum(case when status = 'pending' then 1 else 0 end) as unsigned)`,
        confirmedOrders: sql<number>`cast(sum(case when status = 'confirmed' then 1 else 0 end) as unsigned)`,
      })
      .from(ordersTable);

    const [catCount] = await db
      .select({ totalCategories: sql<number>`cast(count(*) as unsigned)` })
      .from(categoriesTable);

    res.json({
      totalProducts: Number(productStats?.totalProducts ?? 0),
      totalCategories: Number(catCount?.totalCategories ?? 0),
      inStockCount: Number(productStats?.inStockCount ?? 0),
      lowStockCount: Number(productStats?.lowStockCount ?? 0),
      outOfStockCount: Number(productStats?.outOfStockCount ?? 0),
      totalOrders: Number(orderStats?.totalOrders ?? 0),
      totalRevenue: Number(orderStats?.totalRevenue ?? 0),
      pendingOrders: Number(orderStats?.pendingOrders ?? 0),
      confirmedOrders: Number(orderStats?.confirmedOrders ?? 0),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/admin/orders", async (req, res) => {
  try {
    const orders = await db.select().from(ordersTable).orderBy(ordersTable.createdAt);
    const result = await Promise.all(
      orders.map(async (order) => {
        const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));
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
      })
    );
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/admin/send-low-stock-alert", async (req, res) => {
  try {
    const { email } = SendLowStockAlertBody.parse(req.body);

    const rows = await db
      .select({ id: productsTable.id, name: productsTable.name, sku: productsTable.sku, stockQty: productsTable.stockQty, lowStockThreshold: productsTable.lowStockThreshold })
      .from(productsTable)
      .where(sql`${productsTable.stockQty} <= ${productsTable.lowStockThreshold}`);

    const lowStockItems = rows.map((r) => ({
      id: r.id,
      name: r.name,
      sku: r.sku,
      stockQty: Number(r.stockQty),
      lowStockThreshold: Number(r.lowStockThreshold ?? 5),
    }));

    req.log.info({ email, count: lowStockItems.length }, "Low stock alert requested");

    res.json({
      sent: true,
      recipient: email,
      itemCount: lowStockItems.length,
      message: `Alert for ${lowStockItems.length} low-stock item(s) would be sent to ${email}`,
    });
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid request" });
  }
});

router.get("/admin/label/:productId", async (req, res) => {
  try {
    const { productId } = GetProductLabelParams.parse({ productId: Number(req.params.productId) });
    const [product] = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, productId));
    if (!product) return res.status(404).json({ error: "Product not found" });

    res.json({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      price: Number(product.price),
      barcode: `FAB-${product.sku}`,
      imageUrl: product.imageUrl ?? null,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
