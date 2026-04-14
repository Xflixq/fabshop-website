import { mysqlTable, varchar, int, float, timestamp, longtext } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { productsTable } from "./products";
import { usersTable } from "./users";

export const ordersTable = mysqlTable("orders", {
  id: int("id").primaryKey().autoincrement(),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  userId: int("user_id").references(() => usersTable.id),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  total: float("total").notNull(),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  customerEmail: varchar("customer_email", { length: 255 }).notNull(),
  shippingAddress: longtext("shipping_address").notNull(),
  shippingMethod: varchar("shipping_method", { length: 100 }),
  shippingLabel: varchar("shipping_label", { length: 255 }),
  shippingCost: float("shipping_cost").notNull().default(0),
  packageWeightKg: float("package_weight_kg").notNull().default(0),
  shipmentProvider: varchar("shipment_provider", { length: 100 }),
  shipmentTrackingNumber: varchar("shipment_tracking_number", { length: 255 }),
  shipmentLabelUrl: varchar("shipment_label_url", { length: 1000 }),
  clerkUserId: varchar("clerk_user_id", { length: 255 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const orderItemsTable = mysqlTable("order_items", {
  id: int("id").primaryKey().autoincrement(),
  orderId: int("order_id").notNull().references(() => ordersTable.id),
  productId: int("product_id").notNull().references(() => productsTable.id),
  productName: varchar("product_name", { length: 255 }).notNull(),
  price: float("price").notNull(),
  quantity: int("quantity").notNull(),
  weightKg: float("weight_kg").notNull().default(0),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
export type OrderItem = typeof orderItemsTable.$inferSelect;
