import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { orders, orderItems, products, users } from "@db/schema";
import { eq, desc, and, gte, inArray, sql } from "drizzle-orm";
import { verifyToken } from "./auth";

// ============================================
// Admin check helper
// ============================================
async function requireAdmin(ctx: any) {
  const authHeader = ctx.req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const payload = await verifyToken(authHeader.slice(7));
  if (!payload) return null;

  const db = getDb();
  const [user] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, Number(payload.sub)))
    .limit(1);

  if (!user || user.role !== "admin") return null;
  return payload;
}

// ============================================
// Order Router
// ============================================
export const orderRouter = createRouter({
  // ===== User: Create Order =====
  create: publicQuery
    .input(z.object({
      items: z.array(z.object({
        productId: z.number(),
        quantity: z.number().default(1),
      })),
      shippingName: z.string().min(1, "请填写收货人"),
      shippingPhone: z.string().regex(/^1[3-9]\d{9}$/, "手机号格式错误"),
      shippingAddress: z.string().min(1, "请填写收货地址"),
      note: z.string().default(""),
    }))
    .mutation(async ({ input, ctx }) => {
      const authHeader = ctx.req.headers.get("authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return { success: false, message: "请先登录" };
      }
      const payload = await verifyToken(authHeader.slice(7));
      if (!payload) return { success: false, message: "登录已过期" };
      const userId = Number(payload.sub);

      const db = getDb();

      // 价格/名称以服务端数据库为准,不信任前端传参
      const productRows = await db
        .select()
        .from(products)
        .where(inArray(products.id, input.items.map(i => i.productId)));
      const byId = new Map(productRows.map(p => [p.id, p]));

      for (const item of input.items) {
        const product = byId.get(item.productId);
        if (!product) return { success: false, message: `商品 #${item.productId} 不存在` };
        if (product.status !== "active") return { success: false, message: `商品「${product.name}」已下架` };
      }

      // 原子扣减库存:单条 UPDATE ... WHERE stock >= qty,靠 affectedRows 判断成败。
      // 条件写在 SQL 里由数据库行锁保证原子性,避免"先查再扣"的 TOCTOU 竞态(并发超卖)。
      const deducted: { productId: number; quantity: number }[] = [];
      for (const item of input.items) {
        const result = await db
          .update(products)
          .set({ stock: sql`stock - ${item.quantity}` })
          .where(and(eq(products.id, item.productId), gte(products.stock, item.quantity)));
        const affected = Number(
          (result as any)?.affectedRows ?? (result as any)?.[0]?.affectedRows ?? 0
        );
        if (affected === 0) {
          // 补偿回滚:把本轮已扣掉的库存还回去
          for (const d of deducted) {
            await db
              .update(products)
              .set({ stock: sql`stock + ${d.quantity}` })
              .where(eq(products.id, d.productId));
          }
          const product = byId.get(item.productId);
          return { success: false, message: `商品「${product?.name ?? item.productId}」库存不足` };
        }
        deducted.push({ productId: item.productId, quantity: item.quantity });
      }

      // 以服务端价格计算总额
      const totalPrice = input.items.reduce(
        (sum, item) => sum + (byId.get(item.productId)?.price ?? 0) * item.quantity,
        0
      );

      // Create order
      const [order] = await db.insert(orders).values({
        userId,
        totalPrice,
        status: "pending",
        shippingName: input.shippingName,
        shippingPhone: input.shippingPhone,
        shippingAddress: input.shippingAddress,
        note: input.note || "",
      });

      const orderId = Number(order.insertId);

      // Create order items
      for (const item of input.items) {
        const product = byId.get(item.productId)!;
        await db.insert(orderItems).values({
          orderId,
          productId: item.productId,
          productName: product.name,
          price: product.price,
          quantity: item.quantity,
        });
      }

      return { success: true, message: "下单成功！", orderId };
    }),

  // ===== User: My Orders =====
  myOrders: publicQuery.query(async ({ ctx }) => {
    const authHeader = ctx.req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return [];
    const payload = await verifyToken(authHeader.slice(7));
    if (!payload) return [];

    const db = getDb();

    const orderList = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, Number(payload.sub)))
      .orderBy(desc(orders.createdAt));

    // Fetch items for each order
    const result = [];
    for (const order of orderList) {
      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id));
      result.push({ ...order, items });
    }

    return result;
  }),

  // ===== Admin: List All Orders =====
  listAll: publicQuery.query(async ({ ctx }) => {
    const admin = await requireAdmin(ctx);
    if (!admin) return [];

    const db = getDb();
    const allOrders = await db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt));

    const result = [];
    for (const order of allOrders) {
      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id));
      // Get user phone
      const [user] = await db
        .select({ phone: users.phone, nickname: users.nickname })
        .from(users)
        .where(eq(users.id, order.userId))
        .limit(1);
      result.push({ ...order, items, userPhone: user?.phone || "", userNickname: user?.nickname || "" });
    }

    return result;
  }),

  // ===== Admin: Update Order Status =====
  updateStatus: publicQuery
    .input(z.object({
      orderId: z.number(),
      status: z.enum(["pending", "paid", "shipped", "completed", "cancelled"]),
    }))
    .mutation(async ({ input, ctx }) => {
      const admin = await requireAdmin(ctx);
      if (!admin) return { success: false, message: "无权限" };

      const db = getDb();
      await db
        .update(orders)
        .set({ status: input.status })
        .where(eq(orders.id, input.orderId));

      return { success: true, message: "订单状态已更新" };
    }),

  // ===== Admin: Get Order Detail =====
  getDetail: publicQuery
    .input(z.object({ orderId: z.number() }))
    .query(async ({ input, ctx }) => {
      const admin = await requireAdmin(ctx);
      if (!admin) return null;

      const db = getDb();
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, input.orderId))
        .limit(1);

      if (!order) return null;

      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, input.orderId));

      const [user] = await db
        .select({ phone: users.phone, nickname: users.nickname })
        .from(users)
        .where(eq(users.id, order.userId))
        .limit(1);

      return { ...order, items, userPhone: user?.phone || "", userNickname: user?.nickname || "" };
    }),
});
