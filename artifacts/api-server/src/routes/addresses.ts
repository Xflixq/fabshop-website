import { Router, type Request, type Response } from "express";
import { db, addressesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "./auth";

const router = Router();

// Get all addresses for authenticated user
router.get("/addresses", requireAuth as any, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as any;
    const addresses = await db.select().from(addressesTable).where(eq(addressesTable.userId, user.id));
    res.json(addresses);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create new address
router.post("/addresses", requireAuth as any, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as any;
    const { type, fullName, street, city, state, zipCode, country = "US", isDefault = false } = req.body;

    // Validate required fields
    if (!type || !fullName || !street || !city || !state || !zipCode) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    // If this is set as default, unset other defaults
    if (isDefault) {
      await db.update(addressesTable).set({ isDefault: false }).where(eq(addressesTable.userId, user.id));
    }

    const result = await db.insert(addressesTable).values({
      userId: user.id,
      type,
      fullName,
      street,
      city,
      state,
      zipCode,
      country,
      isDefault,
    });

    const addressId = Number(result[0].insertId);
    const [newAddress] = await db.select().from(addressesTable).where(eq(addressesTable.id, addressId));

    res.status(201).json(newAddress);
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid request" });
  }
});

// Update address
router.put("/addresses/:id", requireAuth as any, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as any;
    const addressId = Number(req.params.id);
    const { type, fullName, street, city, state, zipCode, country, isDefault } = req.body;

    // Check ownership
    const [address] = await db.select().from(addressesTable).where(eq(addressesTable.id, addressId));
    if (!address || address.userId !== user.id) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    // If this is set as default, unset other defaults
    if (isDefault) {
      await db.update(addressesTable)
        .set({ isDefault: false })
        .where(eq(addressesTable.userId, user.id));
    }

    await db.update(addressesTable)
      .set({
        ...(type && { type }),
        ...(fullName && { fullName }),
        ...(street && { street }),
        ...(city && { city }),
        ...(state && { state }),
        ...(zipCode && { zipCode }),
        ...(country && { country }),
        ...(isDefault !== undefined && { isDefault }),
      })
      .where(eq(addressesTable.id, addressId));

    const [updatedAddress] = await db.select().from(addressesTable).where(eq(addressesTable.id, addressId));
    res.json(updatedAddress);
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid request" });
  }
});

// Delete address
router.delete("/addresses/:id", requireAuth as any, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as any;
    const addressId = Number(req.params.id);

    // Check ownership
    const [address] = await db.select().from(addressesTable).where(eq(addressesTable.id, addressId));
    if (!address || address.userId !== user.id) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    await db.delete(addressesTable).where(eq(addressesTable.id, addressId));
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid request" });
  }
});

export default router;
