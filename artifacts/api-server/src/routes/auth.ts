import { Router, type Request, type Response } from "express";
import passport from "passport";
import bcryptjs from "bcryptjs";
import { db, usersTable } from "@workspace/db";
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

    // Validate input
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    // Check if user already exists
    const existingUsers = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existingUsers.length > 0) {
      res.status(400).json({ error: "Email already exists" });
      return;
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create new user
    await db.insert(usersTable).values({
      email,
      password: hashedPassword,
      firstName: firstName || "",
      lastName: lastName || "",
    });

    // Fetch the newly created user
    const newUsers = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
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
    console.error("Registration error:", err);
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
  res.json({
    authenticated: !!req.user,
    user: req.user || null,
  });
});

export default router;
