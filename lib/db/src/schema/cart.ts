import { mysqlTable, varchar, int, float } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { productsTable } from "./products";

export const cartItemsTable = mysqlTable("cart_items", {
  id: int("id").primaryKey().autoincrement(),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  productId: int("product_id").notNull().references(() => productsTable.id),
  quantity: int("quantity").notNull().default(1),
  price: float("price").notNull(),
});

export const insertCartItemSchema = createInsertSchema(cartItemsTable).omit({ id: true });
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type CartItem = typeof cartItemsTable.$inferSelect;
