import {
  mysqlTable,
  serial,
  varchar,
  int,
  double,
  timestamp,
  bigint,
  index,
} from "drizzle-orm/mysql-core";

// ===== Users =====
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  phone: varchar("phone", { length: 20 }).notNull(),
  nickname: varchar("nickname", { length: 50 }),
  passwordHash: varchar("password_hash", { length: 255 }),
  role: varchar("role", { length: 20 }).notNull().default("user"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => [
  index("phone_idx").on(table.phone),
]);

// ===== Verification codes (phone auth) =====
export const verificationCodes = mysqlTable("verification_codes", {
  id: serial("id").primaryKey(),
  phone: varchar("phone", { length: 20 }).notNull(),
  code: varchar("code", { length: 10 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: int("used").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("vc_phone_idx").on(table.phone),
]);

// ===== Products =====
export const products = mysqlTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  price: double("price").notNull(),         // Price in RMB (e.g. 149.9)
  stock: int("stock").notNull().default(0), // 库存数量(下单时原子扣减)
  category: varchar("category", { length: 50 }).notNull().default("精选"),
  image: varchar("image", { length: 500 }).notNull(),
  description: varchar("description", { length: 2000 }).default(""),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  sortOrder: int("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => [
  index("prod_status_idx").on(table.status),
  index("prod_category_idx").on(table.category),
]);

// ===== Orders =====
export const orders = mysqlTable("orders", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
  totalPrice: double("total_price").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  shippingName: varchar("shipping_name", { length: 50 }).notNull().default(""),
  shippingPhone: varchar("shipping_phone", { length: 20 }).notNull().default(""),
  shippingAddress: varchar("shipping_address", { length: 500 }).notNull().default(""),
  note: varchar("note", { length: 500 }).default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => [
  index("ord_user_idx").on(table.userId),
  index("ord_status_idx").on(table.status),
]);

// ===== Order Items =====
export const orderItems = mysqlTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: bigint("order_id", { mode: "number", unsigned: true }).notNull(),
  productId: int("product_id").notNull(),
  productName: varchar("product_name", { length: 200 }).notNull(),
  price: double("price").notNull(),
  quantity: int("quantity").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("oi_order_idx").on(table.orderId),
]);