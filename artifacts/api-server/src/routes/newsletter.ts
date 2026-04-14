import { Router } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import crypto from "crypto";

const router = Router();

function generateCode(email: string): string {
  const hash = crypto.createHash("sha256").update(email + Date.now()).digest("hex").slice(0, 8).toUpperCase();
  return `FAB-${hash}`;
}

router.post("/newsletter/subscribe", async (req, res) => {
  try {
    const { email } = req.body ?? {};
    if (!email || !String(email).includes("@")) {
      return res.status(400).json({ error: "Valid email required" });
    }
    const normalised = String(email).toLowerCase().trim();

    const [existing] = await db.execute(sql`SELECT id, verified, discount_code, unsubscribed_at FROM newsletter_subscribers WHERE email = ${normalised}`);
    const rows = existing as any[];

    if (rows.length > 0) {
      const row = rows[0];
      if (row.unsubscribed_at) {
        await db.execute(sql`UPDATE newsletter_subscribers SET unsubscribed_at = NULL WHERE email = ${normalised}`);
      }
      return res.json({
        alreadySubscribed: true,
        verified: Boolean(row.verified),
        discountCode: row.discount_code ?? null,
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const code = generateCode(normalised);

    await db.execute(sql`
      INSERT INTO newsletter_subscribers (email, verified, verification_token, discount_code)
      VALUES (${normalised}, TRUE, ${token}, ${code})
    `);

    return res.status(201).json({
      success: true,
      discountCode: code,
      message: "Subscribed successfully! Use your discount code at checkout.",
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/newsletter/unsubscribe", async (req, res) => {
  try {
    const { email } = req.body ?? {};
    if (!email) return res.status(400).json({ error: "Email required" });
    await db.execute(sql`UPDATE newsletter_subscribers SET unsubscribed_at = NOW() WHERE email = ${String(email).toLowerCase().trim()}`);
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/admin/newsletter/subscribers", async (req, res) => {
  try {
    const [rows] = await db.execute(sql`SELECT id, email, verified, discount_code, subscribed_at, unsubscribed_at FROM newsletter_subscribers ORDER BY subscribed_at DESC`);
    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/admin/newsletter/send", async (req, res) => {
  try {
    const { subject, body } = req.body ?? {};
    if (!subject || !body) return res.status(400).json({ error: "Subject and body required" });

    const [rows] = await db.execute(sql`SELECT email FROM newsletter_subscribers WHERE unsubscribed_at IS NULL`);
    const subscribers = rows as any[];

    req.log.info({ subject, count: subscribers.length }, "Newsletter send requested");

    res.json({
      success: true,
      sent: subscribers.length,
      message: `Email would be sent to ${subscribers.length} subscriber(s). Connect an SMTP service to enable actual sending.`,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
