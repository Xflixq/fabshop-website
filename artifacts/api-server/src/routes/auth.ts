import { Router, type Request, type Response } from "express";
import passport from "passport";
import bcryptjs from "bcryptjs";
import { db, usersTable, addressesTable, ordersTable, orderItemsTable, savedPaymentMethodsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

// Middleware to check authentication
export function requireAuth(req: Request, res: Response, next: Function): void {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized. Please sign in." });
    return;
  }
  next();
}

// Get current authenticated user
router.get("/me", (req: Request, res: Response) => {
  if (req.user) {
    const { id, email, firstName, lastName, profileImage } = req.user as any;
    res.json({ id, email, firstName, lastName, profileImage });
  } else {
    res.json(null);
  }
});

// Email/Password Login
router.post("/login", (req: Request, res: Response, next: Function) => {
  passport.authenticate("local", (err: any, user: any, info: any) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({ error: info?.message || "Incorrect email or password" });
    }
    req.logIn(user, (loginErr) => {
      if (loginErr) return next(loginErr);
      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImage: user.profileImage,
        },
      });
    });
  })(req, res, next);
});

// Email/Password Registration
router.post("/register", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName } = req.body;
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!normalizedEmail || !password || password.length < 8) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const existingUsers = await db.select().from(usersTable).where(eq(usersTable.email, normalizedEmail)).limit(1);
    if (existingUsers.length > 0) {
      res.status(400).json({ error: "Email already exists" });
      return;
    }

    const hashedPassword = await bcryptjs.hash(password, 12);

    await db.insert(usersTable).values({
      email: normalizedEmail,
      password: hashedPassword,
      firstName: firstName || "",
      lastName: lastName || "",
    });

    const newUsers = await db.select().from(usersTable).where(eq(usersTable.email, normalizedEmail)).limit(1);
    const user = newUsers[0];

    // Log the user in
    req.logIn(user, (err) => {
      if (err) {
        res.status(500).json({ error: "Login failed" });
        return;
      }
      res.status(201).json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImage: user.profileImage,
        },
      });
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Registration failed" });
  }
});

// Google OAuth routes
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/sign-in?error=auth_failed",
  }),
  (req: Request, res: Response) => {
    // Successful authentication - redirect to frontend with success message
    res.redirect("/auth-success");
  },
);

// OAuth success page - redirects to frontend
router.get("/success", (req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Login Successful</title>
        <script>
          window.location.href = '/';
        </script>
      </head>
      <body>
        <p>Redirecting to home page...</p>
      </body>
    </html>
  `);
});

// Update profile
router.patch("/profile", async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const { firstName, lastName } = req.body;
    const userId = (req.user as any).id;
    await db
      .update(usersTable)
      .set({
        ...(firstName !== undefined ? { firstName } : {}),
        ...(lastName !== undefined ? { lastName } : {}),
      })
      .where(eq(usersTable.id, userId));

    const updated = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    const user = updated[0];
    res.json({ id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, profileImage: user.profileImage });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

router.get("/privacy/export", requireAuth as any, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as any;
    const addresses = await db.select().from(addressesTable).where(eq(addressesTable.userId, user.id));
    const paymentMethods = await db.select().from(savedPaymentMethodsTable).where(eq(savedPaymentMethodsTable.userId, user.id));
    const orders = await db.select().from(ordersTable).where(eq(ordersTable.userId, user.id));
    const orderItems = await Promise.all(
      orders.map((order) => db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id)))
    );
    res.json({
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImage: user.profileImage,
        phone: user.phone,
        createdAt: user.createdAt,
      },
      addresses,
      paymentMethods: paymentMethods.map((method) => ({
        id: method.id,
        cardBrand: method.cardBrand,
        last4: method.last4,
        expiryMonth: method.expiryMonth,
        expiryYear: method.expiryYear,
        isDefault: method.isDefault,
        createdAt: method.createdAt,
      })),
      orders: orders.map((order, index) => ({ ...order, items: orderItems[index] })),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to export account data" });
  }
});

router.delete("/privacy/delete", requireAuth as any, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as any;
    const anonymizedEmail = `deleted-${user.id}-${Date.now()}@fabshop.local`;
    await db.delete(addressesTable).where(eq(addressesTable.userId, user.id));
    await db.delete(savedPaymentMethodsTable).where(eq(savedPaymentMethodsTable.userId, user.id));
    await db.update(ordersTable).set({
      customerName: "Deleted customer",
      customerEmail: anonymizedEmail,
      shippingAddress: "Deleted under GDPR request",
    }).where(eq(ordersTable.userId, user.id));
    await db.update(usersTable).set({
      email: anonymizedEmail,
      password: null,
      firstName: "",
      lastName: "",
      profileImage: null,
      phone: null,
      googleId: null,
      googleEmail: null,
      deletedAt: new Date(),
    }).where(eq(usersTable.id, user.id));
    req.logout(() => {
      req.session?.destroy(() => {
        res.clearCookie("connect.sid");
        res.json({ success: true });
      });
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete account data" });
  }
});

// Logout
router.post("/logout", (req: Request, res: Response, next: Function) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.json({ success: true });
  });
});

// Check authentication status
router.get("/status", (req: Request, res: Response) => {
  const user = req.user as any;
  res.json({
    authenticated: !!req.user,
    user: user ? {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImage: user.profileImage,
    } : null,
  });
});

export default router;
