import { Router } from "express";
import { db, productsTable, categoriesTable } from "@workspace/db";
import { eq, like, and, sql } from "drizzle-orm";
import {
  CreateProductBody,
  GetProductParams,
  UpdateProductParams,
  UpdateProductBody,
  ListProductsQueryParams,
} from "@workspace/api-zod";

const router = Router();

function mapProduct(row: any) {
  return {
    ...row,
    price: Number(row.price),
    featured: Boolean(row.featured),
    lowStockThreshold: Number(row.lowStockThreshold ?? 5),
    stockQty: Number(row.stockQty),
  };
}

router.get("/products", async (req, res) => {
  try {
    const params = ListProductsQueryParams.parse({
      categoryId: req.query.categoryId ? Number(req.query.categoryId) : undefined,
      search: req.query.search,
      inStock: req.query.inStock === "true" ? true : req.query.inStock === "false" ? false : undefined,
      featured: req.query.featured === "true" ? true : req.query.featured === "false" ? false : undefined,
    });

    const conditions = [];
    if (params.categoryId !== undefined) conditions.push(eq(productsTable.categoryId, params.categoryId));
    if (params.search) conditions.push(like(productsTable.name, `%${params.search}%`));
    if (params.inStock === true) conditions.push(sql`${productsTable.stockQty} > 0`);
    if (params.featured === true) conditions.push(eq(productsTable.featured, true));

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
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    res.json(rows.map(mapProduct));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/products", async (req, res) => {
  try {
    const body = CreateProductBody.parse(req.body);
    const [product] = await db.insert(productsTable).values(body).returning();
    if (!product) return res.status(500).json({ error: "Insert failed" });
    res.status(201).json(mapProduct({ ...product, categoryName: null }));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid request" });
  }
});

router.get("/products/:id", async (req, res) => {
  try {
    const { id } = GetProductParams.parse({ id: Number(req.params.id) });
    const [row] = await db
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
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(mapProduct(row));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/products/:id", async (req, res) => {
  try {
    const { id } = UpdateProductParams.parse({ id: Number(req.params.id) });
    const body = UpdateProductBody.parse(req.body);
    const [product] = await db.update(productsTable).set(body).where(eq(productsTable.id, id)).returning();
    if (!product) return res.status(404).json({ error: "Not found" });
    res.json(mapProduct({ ...product, categoryName: null }));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid request" });
  }
});

router.delete("/products/:id", async (req, res) => {
  try {
    const { id } = GetProductParams.parse({ id: Number(req.params.id) });
    await db.delete(productsTable).where(eq(productsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
