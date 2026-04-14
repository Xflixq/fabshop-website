import { mysqlTable, varchar, longtext, int, boolean, float } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { categoriesTable } from "./categories";

export const productsTable = mysqlTable("products", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: longtext("description").notNull(),
  price: float("price").notNull(),
  sku: varchar("sku", { length: 100 }).notNull().unique(),
  stockQty: int("stock_qty").notNull().default(0),
  lowStockThreshold: int("low_stock_threshold").notNull().default(10),
  imageUrl: varchar("image_url", { length: 500 }),
  featured: boolean("featured").notNull().default(false),
  categoryId: int("category_id").references(() => categoriesTable.id),
  specs: longtext("specs"),
  weightKg: float("weight_kg").notNull().default(1),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
