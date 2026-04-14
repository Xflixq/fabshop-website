import { Router, type Request, type Response, type NextFunction } from "express";
import { db, productsTable, categoriesTable, ordersTable, orderItemsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { AdjustStockParams, AdjustStockBody, GetProductLabelParams, SendLowStockAlertBody } from "@workspace/api-zod";

const router = Router();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "fabshop-admin";
const COOKIE_NAME = "fab_admin";

function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const token = (req as any).signedCookies?.[COOKIE_NAME];
  if (token === "authenticated") return next();
  res.status(401).json({ error: "Unauthorized" });
}

router.use((req: Request, res: Response, next: NextFunction) => {
  // Only apply admin auth to admin routes
  if (!req.path.startsWith("/admin/")) return next();
  
  const publicPaths = ["/admin/auth", "/admin/login", "/admin/logout"];
  if (publicPaths.includes(req.path)) return next();
  return requireAdminAuth(req, res, next);
});

router.get("/admin/auth", (req: Request, res: Response) => {
  const token = (req as any).signedCookies?.[COOKIE_NAME];
  res.json({ authenticated: token === "authenticated" });
});

router.post("/admin/login", (req: Request, res: Response) => {
  const { password } = req.body ?? {};
  if (password === ADMIN_PASSWORD) {
    res.cookie(COOKIE_NAME, "authenticated", {
      httpOnly: true,
      signed: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: "lax",
    });
    res.json({ success: true });
  } else {
    res.status(401).json({ error: "Invalid password" });
  }
});

router.post("/admin/logout", (req: Request, res: Response) => {
  res.clearCookie(COOKIE_NAME);
  res.json({ success: true });
});

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
    const { adjustment } = AdjustStockBody.parse(req.body);

    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, id));
    if (!product) return res.status(404).json({ error: "Product not found" });

    const newQty = Math.max(0, Number(product.stockQty) + adjustment);
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

router.post("/admin/test-order", async (req, res) => {
  try {
    const [firstProduct] = await db.select().from(productsTable).limit(1);
    if (!firstProduct) {
      return res.status(400).json({ error: "No products available to create test order" });
    }

    const testSessionId = `test-${Date.now()}`;
    const testTotal = Number(firstProduct.price);

    const result = await db.insert(ordersTable).values({
      sessionId: testSessionId,
      status: "confirmed",
      total: testTotal,
      customerName: "Test Customer",
      customerEmail: "test@fabshop.dev",
      shippingAddress: "123 Test Street\nWeld City, WC 12345",
    });

    const orderId = Number((result[0] as any).insertId);

    await db.insert(orderItemsTable).values({
      orderId,
      productId: firstProduct.id,
      productName: firstProduct.name,
      price: firstProduct.price,
      quantity: 1,
    });

    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId));
    const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, orderId));

    res.status(201).json({
      ...order!,
      total: Number(order!.total),
      createdAt: order!.createdAt instanceof Date ? order!.createdAt.toISOString() : order!.createdAt,
      items: items.map((i) => ({
        ...i,
        price: Number(i.price),
        subtotal: Number(i.price) * i.quantity,
      })),
    });
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
