import { Router } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const router = Router();

router.get("/banners", async (req, res) => {
  try {
    const [rows] = await db.execute(
      sql`SELECT id, title, content, type, template_name, position FROM banners WHERE active = TRUE ORDER BY id ASC`
    );
    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/admin/banners", async (req, res) => {
  try {
    const [rows] = await db.execute(sql`SELECT * FROM banners ORDER BY id DESC`);
    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/admin/banners", async (req, res) => {
  try {
    const { title, content, type = "template", templateName = null, position = "top", active = true } = req.body ?? {};
    if (!title || !content) return res.status(400).json({ error: "Title and content required" });

    const result = await db.execute(sql`
      INSERT INTO banners (title, content, type, template_name, position, active)
      VALUES (${String(title)}, ${String(content)}, ${String(type)}, ${templateName}, ${String(position)}, ${Boolean(active) ? 1 : 0})
    `);
    const insertId = (result[0] as any).insertId;
    const [rows] = await db.execute(sql`SELECT * FROM banners WHERE id = ${insertId}`);
    res.status(201).json((rows as any[])[0]);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/admin/banners/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { title, content, type, templateName, position, active } = req.body ?? {};

    await db.execute(sql`
      UPDATE banners SET
        title = ${title !== undefined ? String(title) : sql`title`},
        content = ${content !== undefined ? String(content) : sql`content`},
        type = ${type !== undefined ? String(type) : sql`type`},
        template_name = ${templateName !== undefined ? (templateName ? String(templateName) : null) : sql`template_name`},
        position = ${position !== undefined ? String(position) : sql`position`},
        active = ${active !== undefined ? (Boolean(active) ? 1 : 0) : sql`active`}
      WHERE id = ${id}
    `);
    const [rows] = await db.execute(sql`SELECT * FROM banners WHERE id = ${id}`);
    if ((rows as any[]).length === 0) return res.status(404).json({ error: "Banner not found" });
    res.json((rows as any[])[0]);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/admin/banners/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.execute(sql`DELETE FROM banners WHERE id = ${id}`);
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
