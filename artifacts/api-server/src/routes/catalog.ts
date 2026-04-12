import { Router } from "express";
import { db, productsTable, categoriesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router = Router();

router.get("/catalog/summary", async (req, res) => {
  try {
    const [totals] = await db
      .select({
        totalProducts: sql<number>`cast(count(*) as unsigned)`,
        featuredCount: sql<number>`cast(sum(case when ${productsTable.featured} then 1 else 0 end) as unsigned)`,
        inStockCount: sql<number>`cast(sum(case when ${productsTable.stockQty} > 0 then 1 else 0 end) as unsigned)`,
      })
      .from(productsTable);

    const [catCount] = await db
      .select({ totalCategories: sql<number>`cast(count(*) as unsigned)` })
      .from(categoriesTable);

    res.json({
      totalProducts: Number(totals?.totalProducts ?? 0),
      totalCategories: Number(catCount?.totalCategories ?? 0),
      featuredCount: Number(totals?.featuredCount ?? 0),
      inStockCount: Number(totals?.inStockCount ?? 0),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/catalog/featured", async (req, res) => {
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
      .where(eq(productsTable.featured, true))
      .limit(8);
    res.json(rows.map((r) => ({ ...r, price: Number(r.price), featured: Boolean(r.featured), lowStockThreshold: Number(r.lowStockThreshold ?? 5) })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/catalog/category-counts", async (req, res) => {
  try {
    const rows = await db
      .select({
        categoryId: categoriesTable.id,
        categoryName: categoriesTable.name,
        count: sql<number>`cast(count(${productsTable.id}) as unsigned)`,
      })
      .from(categoriesTable)
      .leftJoin(productsTable, eq(productsTable.categoryId, categoriesTable.id))
      .groupBy(categoriesTable.id, categoriesTable.name);
    res.json(rows.map((r) => ({ ...r, count: Number(r.count) })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
