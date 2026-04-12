import { mysqlTable, varchar, int, text, timestamp, boolean, decimal } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }), // bcrypt hash, nullable for OAuth users
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  profileImage: varchar("profile_image", { length: 500 }),
  phone: varchar("phone", { length: 20 }),
  googleId: varchar("google_id", { length: 255 }).unique(),
  googleEmail: varchar("google_email", { length: 255 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  deletedAt: timestamp("deleted_at"),
});

export const addressesTable = mysqlTable("addresses", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull().references(() => usersTable.id),
  type: varchar("type", { length: 50 }).notNull().default("shipping"), // "shipping" or "billing"
  fullName: varchar("full_name", { length: 255 }).notNull(),
  street: varchar("street", { length: 255 }).notNull(),
  city: varchar("city", { length: 255 }).notNull(),
  state: varchar("state", { length: 255 }).notNull(),
  zipCode: varchar("zip_code", { length: 20 }).notNull(),
  country: varchar("country", { length: 255 }).notNull().default("US"),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const savedPaymentMethodsTable = mysqlTable("saved_payment_methods", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull().references(() => usersTable.id),
  stripePaymentMethodId: varchar("stripe_payment_method_id", { length: 255 }).notNull().unique(),
  cardBrand: varchar("card_brand", { length: 50 }).notNull(), // "visa", "mastercard", etc
  last4: varchar("last4", { length: 4 }).notNull(),
  expiryMonth: int("expiry_month").notNull(),
  expiryYear: int("expiry_year").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Schemas for validation
export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true, deletedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;

export const insertAddressSchema = createInsertSchema(addressesTable).omit({ id: true, createdAt: true });
export type InsertAddress = z.infer<typeof insertAddressSchema>;
export type Address = typeof addressesTable.$inferSelect;

export const insertPaymentMethodSchema = createInsertSchema(savedPaymentMethodsTable).omit({ id: true, createdAt: true });
export type InsertPaymentMethod = z.infer<typeof insertPaymentMethodSchema>;
export type PaymentMethod = typeof savedPaymentMethodsTable.$inferSelect;
