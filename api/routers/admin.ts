import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { products } from "@db/schema";
import { eq, asc, desc } from "drizzle-orm";
import { verifyToken } from "./auth";

// ============================================
// Admin middleware check
// ============================================
async function requireAdmin(ctx: any) {
  const authHeader = ctx.req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const payload = await verifyToken(authHeader.slice(7));
  if (!payload) return null;

  const db = getDb();
  const { users } = await import("@db/schema");
  const [user] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, Number(payload.sub)))
    .limit(1);

  if (!user || user.role !== "admin") return null;
  return payload;
}

// ============================================
// Admin Router
// ============================================
export const adminRouter = createRouter({
  // ── Products CRUD ──────────────────────────────

  // List all products (admin view, includes inactive)
  listProducts: publicQuery.query(async ({ ctx }) => {
    const admin = await requireAdmin(ctx);
    if (!admin) return [];

    const db = getDb();
    return db
      .select()
      .from(products)
      .orderBy(asc(products.sortOrder), desc(products.createdAt));
  }),

  // Create product
  createProduct: publicQuery
    .input(
      z.object({
        name: z.string().min(1, "商品名不能为空"),
        price: z.number().min(0.01, "价格必须大于0"),
        stock: z.number().int().min(0).default(0),
        category: z.string().default("精选"),
        image: z.string().default(""),
        description: z.string().default(""),
        sortOrder: z.number().default(0),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const admin = await requireAdmin(ctx);
      if (!admin) return { success: false, message: "无权限" };

      const db = getDb();
      await db.insert(products).values({
        name: input.name,
        price: input.price,
        stock: input.stock,
        category: input.category,
        image: input.image,
        description: input.description,
        sortOrder: input.sortOrder,
      });

      return { success: true, message: "商品已添加" };
    }),

  // Update product
  updateProduct: publicQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        price: z.number().min(0.01).optional(),
        stock: z.number().int().min(0).optional(),
        category: z.string().optional(),
        image: z.string().optional(),
        description: z.string().optional(),
        status: z.string().optional(),
        sortOrder: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const admin = await requireAdmin(ctx);
      if (!admin) return { success: false, message: "无权限" };

      const db = getDb();
      const { id, ...fields } = input;
      await db.update(products).set(fields).where(eq(products.id, id));

      return { success: true, message: "商品已更新" };
    }),

  // Delete product
  deleteProduct: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const admin = await requireAdmin(ctx);
      if (!admin) return { success: false, message: "无权限" };

      const db = getDb();
      await db.delete(products).where(eq(products.id, input.id));

      return { success: true, message: "商品已删除" };
    }),

  // Check if current user is admin
  checkAdmin: publicQuery.query(async ({ ctx }) => {
    const admin = await requireAdmin(ctx);
    return { isAdmin: !!admin };
  }),

  // Get all products (public - for shop page)
  getPublicProducts: publicQuery.query(async () => {
    const db = getDb();
    return db
      .select()
      .from(products)
      .where(eq(products.status, "active"))
      .orderBy(asc(products.sortOrder), desc(products.createdAt));
  }),
});
