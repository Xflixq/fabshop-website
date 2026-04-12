import { Router } from "express";
import { db, categoriesTable, productsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { CreateCategoryBody, GetCategoryParams } from "@workspace/api-zod";

const router = Router();

router.get("/categories", async (req, res) => {
  try {
    const rows = await db
      .select({
        id: categoriesTable.id,
        name: categoriesTable.name,
        slug: categoriesTable.slug,
        description: categoriesTable.description,
        imageUrl: categoriesTable.imageUrl,
        productCount: sql<number>`cast(count(${productsTable.id}) as unsigned)`,
      })
      .from(categoriesTable)
      .leftJoin(productsTable, eq(productsTable.categoryId, categoriesTable.id))
      .groupBy(categoriesTable.id);
    res.json(rows.map((r) => ({ ...r, productCount: Number(r.productCount) })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/categories", async (req, res) => {
  try {
    const body = CreateCategoryBody.parse(req.body);
    const result = await db.insert(categoriesTable).values(body);
    const insertId = Number((result[0] as any).insertId);
    const [cat] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, insertId));
    if (!cat) return res.status(500).json({ error: "Insert failed" });
    res.status(201).json({ ...cat, productCount: 0 });
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid request" });
  }
});

router.get("/categories/:id", async (req, res) => {
  try {
    const { id } = GetCategoryParams.parse({ id: Number(req.params.id) });
    const [row] = await db
      .select({
        id: categoriesTable.id,
        name: categoriesTable.name,
        slug: categoriesTable.slug,
        description: categoriesTable.description,
        imageUrl: categoriesTable.imageUrl,
        productCount: sql<number>`cast(count(${productsTable.id}) as unsigned)`,
      })
      .from(categoriesTable)
      .leftJoin(productsTable, eq(productsTable.categoryId, categoriesTable.id))
      .where(eq(categoriesTable.id, id))
      .groupBy(categoriesTable.id);
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json({ ...row, productCount: Number(row.productCount) });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/categories/:id", async (req, res) => {
  try {
    const { id } = GetCategoryParams.parse({ id: Number(req.params.id) });
    const body = CreateCategoryBody.parse(req.body);
    await db.update(categoriesTable).set(body).where(eq(categoriesTable.id, id));
    const [row] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, id));
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json({ ...row, productCount: 0 });
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid request" });
  }
});

router.delete("/categories/:id", async (req, res) => {
  try {
    const { id } = GetCategoryParams.parse({ id: Number(req.params.id) });
    await db.delete(categoriesTable).where(eq(categoriesTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
