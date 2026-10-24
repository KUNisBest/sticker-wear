import { createRouter, publicQuery } from "./middleware";
import { authRouter } from "./routers/auth";
import { adminRouter } from "./routers/admin";
import { orderRouter } from "./routers/order";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  admin: adminRouter,
  order: orderRouter,
});

export type AppRouter = typeof appRouter;
