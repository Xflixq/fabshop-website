import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as LocalStrategy } from "passport-local";
import bcryptjs from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || "http://localhost:8080/api/auth/google/callback";

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.warn("⚠️  Google OAuth credentials not configured. OAuth login will be disabled.");
}

// Configure Google Strategy
if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          // Find or create user
          const existingUsers = await db.select().from(usersTable).where(eq(usersTable.googleId, profile.id)).limit(1);
          const existingUser = existingUsers[0];

          if (existingUser) {
            return done(null, existingUser);
          }

          // Create new user
          const emailAddress = profile.emails?.[0]?.value;
          if (!emailAddress) {
            return done(new Error("No email provided by Google"));
          }

          await db.insert(usersTable).values({
            email: emailAddress,
            googleId: profile.id,
            googleEmail: emailAddress,
            firstName: profile.name?.givenName || "",
            lastName: profile.name?.familyName || "",
            profileImage: profile.photos?.[0]?.value,
          });

          const newUsers = await db.select().from(usersTable).where(eq(usersTable.googleId, profile.id)).limit(1);
          const user = newUsers[0];

          done(null, user);
        } catch (err) {
          done(err);
        }
      },
    ),
  );
}

// Configure Local Strategy for email/password
passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (email: string, password: string, done) => {
      try {
        // Find user by email
        const users = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
        const user = users[0];

        if (!user) {
          return done(null, false, { message: "Incorrect email or password" });
        }

        // Check if user has a password (email/password signup)
        if (!user.password) {
          return done(null, false, { message: "This account uses OAuth login. Please use Google Sign In." });
        }

        // Verify password
        const isPasswordValid = await bcryptjs.compare(password, user.password);
        if (!isPasswordValid) {
          return done(null, false, { message: "Incorrect email or password" });
        }

        return done(null, user);
      } catch (err) {
        done(err);
      }
    },
  ),
);

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, (user as any).id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const users = await db.select().from(usersTable).where(eq(usersTable.id, id as number)).limit(1);
    const user = users[0];
    done(null, user);
  } catch (err) {
    done(err);
  }
});

export default passport;
