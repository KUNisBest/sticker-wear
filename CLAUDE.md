# Sticker Wear — 个人潮牌商城

## 项目概述

STICKER WEAR 是一个面向 Z 世代的潮牌电商平台，主打商品展示与在线下单。已精简为**纯商城系统**（原抽奖/贴纸/积分功能已于 2026-08-08 移除，备份见桌面 `sticker-wear-备份-2026-08-08.zip`）。

**MVP 阶段**：本地开发测试中，功能快速迭代。

## 技术栈

| 层 | 技术 | 版本 |
|----|------|------|
| 前端框架 | React | 19.x |
| 类型系统 | TypeScript | 5.9 |
| 构建工具 | Vite | 7.x |
| CSS | Tailwind CSS | 3.4 |
| UI 组件库 | shadcn/ui (Radix UI) | 40+ 组件 |
| 路由 | React Router | 7.x |
| API 通信 | tRPC | 11.x |
| 请求管理 | TanStack React Query | 5.x |
| 后端框架 | Hono (Node.js) | 4.x |
| ORM | Drizzle ORM (MySQL) | 0.45 |
| 数据库 | MySQL | 8.0 |
| 认证 | JWT (jose) | 6.x |
| 校验 | Zod | 4.x |

## 项目结构

```
D:\kimi\app\
├── CLAUDE.md                    ← 本文件
├── .env                         ← 环境变量（DATABASE_URL, JWT_SECRET, PORT）
├── package.json                 ← 依赖 & 脚本
├── vite.config.ts               ← Vite 配置（端口3000, 别名, Hono dev server 插件）
├── drizzle.config.ts            ← Drizzle ORM 配置
├── index.html                   ← 入口 HTML（lang="zh-CN", dark）
│
├── api/                         ← 后端
│   ├── boot.ts                  ← 服务启动入口（Hono + tRPC fetch handler）
│   ├── router.ts                ← 主路由注册（auth, admin, order）
│   ├── context.ts               ← tRPC context
│   ├── middleware.ts            ← tRPC middleware（createRouter, publicQuery）
│   ├── lib/
│   │   ├── env.ts               ← 环境变量加载
│   │   ├── http.ts              ← HTTP 工具
│   │   └── vite.ts              ← 静态文件服务（生产环境）
│   ├── queries/
│   │   └── connection.ts        ← 数据库连接
│   └── routers/
│       ├── auth.ts              ← 认证：验证码登录、密码登录、设置密码、获取用户
│       ├── order.ts             ← 订单：创建订单、我的订单、管理订单
│       └── admin.ts             ← 管理后台：商品 CRUD、权限检查
│
├── db/                          ← 数据库
│   ├── schema.ts                ← Drizzle schema 定义（5 张表）
│   ├── relations.ts             ← 表关系
│   ├── check.ts                 ← 数据库连接测试
│   ├── setup.sql                ← 历史手动建表 SQL（含已废弃的充值/抽奖表，仅存档）
│   └── migrations/              ← Drizzle 迁移文件
│
├── src/                         ← 前端
│   ├── main.tsx                 ← React 入口（BrowserRouter + TRPCProvider）
│   ├── App.tsx                  ← 根组件：Intro → Home 路由
│   ├── App.css                  ← 全局样式
│   ├── index.css                ← Tailwind + 主题变量
│   ├── components/
│   │   ├── Navbar.tsx           ← 导航栏（商城/社区/我的 + Admin 入口）
│   │   ├── ParticleRain.tsx     ← 粒子特效组件
│   │   └── ui/                  ← shadcn/ui 40+ 组件
│   ├── pages/
│   │   ├── Intro.tsx            ← 赛博朋克 Intro 动画（509行 Canvas 2D）
│   │   ├── Home.tsx             ← 主页容器（页面切换 + 登录弹窗）
│   │   ├── Shop.tsx             ← 商城（从 API 获取商品，分类筛选，下单弹窗）
│   │   ├── Login.tsx            ← 登录弹窗（密码登录/验证码登录 + 记住手机号）
│   │   ├── Profile.tsx          ← 个人中心（我的订单）
│   │   ├── Recommend.tsx        ← 社区/推荐
│   │   └── Admin.tsx            ← 管理后台（商品 CRUD，仅 admin 角色可见）
│   ├── hooks/
│   │   ├── useAuth.ts           ← 认证 Hook（user, isLoggedIn, logout, setToken）
│   │   └── use-mobile.ts        ← 移动端检测
│   ├── providers/
│   │   └── trpc.tsx             ← tRPC Provider（token 注入，superjson 序列化）
│   └── lib/
│       └── utils.ts             ← 工具函数
│
├── public/
│   └── assets/
│       ├── images/              ← 商品图片
│       └── videos/              ← hero-video.mp4（参考视频，代码未引用）
│
└── contracts/
    ├── types.ts                 ← 共享类型定义
    └── errors.ts                ← 错误类型
```

## 数据库表

| 表名 | 说明 | 关键字段 |
|------|------|---------|
| `users` | 用户 | id, phone, nickname, password_hash, role(user/admin) |
| `verification_codes` | 验证码 | phone, code, expires_at, used |
| `products` | 商品 | name, price(元), category, image, status(active/inactive), sort_order |
| `orders` | 订单 | user_id, total_price, status, shipping_*, note |
| `order_items` | 订单明细 | order_id, product_id, product_name, price, quantity |

> 原 `recharge_packages` / `recharge_orders` / `lottery_records` / `stickers` / `user_stickers` 五张表已随抽奖系统移除（2026-08-08）。

## API 路由

```
tRPC Router
├── ping                     ← 健康检查
├── auth.sendCode            ← 发送验证码（mock，返回 code）
├── auth.verifyCode          ← 验证码登录/注册 → 返回 JWT + hasPassword
├── auth.loginPassword       ← 密码登录 → JWT
├── auth.setPassword         ← 设置密码（需登录）
├── auth.me                  ← 获取当前用户（需 Bearer token）
├── order.create             ← 创建订单（需登录）
├── order.myOrders           ← 我的订单列表
├── order.listAll            ← 全部订单（需 admin）
├── order.updateStatus       ← 更新订单状态（需 admin）
├── order.getDetail          ← 订单详情（需 admin）
├── admin.listProducts       ← 商品列表（需 admin）
├── admin.createProduct      ← 添加商品
├── admin.updateProduct      ← 更新商品
├── admin.deleteProduct      ← 删除商品
├── admin.checkAdmin         ← 检查是否管理员
└── admin.getPublicProducts  ← 公开商品列表（商城用）
```

## 开发命令

```bash
npm run dev          # 启动开发服务器 → http://localhost:3000
npm run build        # 构建（前端 dist/public + 后端 dist/boot.js）
npm run start        # 生产环境启动
npm run db:push      # 同步数据库 schema
npm run db:generate  # 生成迁移文件
npm run test         # 运行测试
npm run check        # TypeScript 类型检查
```

## 环境变量 (.env)

```
DATABASE_URL=mysql://root:root@localhost:3306/sticker_wear
JWT_SECRET=sticker-wear-2026-secret-key-change-this-in-production
PORT=3000
NODE_ENV=development
```

## 业务规则

- **商品**：商品按分类展示（精选/鞋类/潮服/数码/美妆/家居/包袋/配饰），可上架/下架
- **下单**：需登录，填写收货人/手机号/地址，mock 支付直接创建订单
- **订单状态**：pending → paid → shipped → completed / cancelled（由 admin 后台流转）

## 当前状态

### 已完成
- ✅ 用户认证（手机验证码 + 密码登录 + JWT）
- ✅ 商品管理后台（仅 admin，CRUD + 上下架）
- ✅ Shop 商城（从数据库读取，分类筛选，下单弹窗）
- ✅ 订单系统（创建订单 + 订单明细 + 我的订单 + 后台管理）
- ✅ 赛博朋克 Intro 动画（Canvas 2D）
- ✅ 响应式 Navbar（商城/社区/我的 + Admin 入口）

### 待开发
- 🔜 购物车 + 订单流程完善
- 🔜 真实短信验证码接入（阿里云 SMS）
- 🔜 真实支付接入（微信/支付宝）
- 🔜 移动端适配

## 注意事项

- **密码**：使用 Node.js `crypto.scryptSync` 哈希存储，格式 `salt:hash`
- **验证码**：当前 mock 模式直接返回 code 到前端，**生产必须删除**
- **支付**：当前 mock 模式直接创建订单，**生产需要真实的支付回调**
- **图片上传**：当前需手动放文件到 `public/assets/images/`，后端无上传接口
- **Admin 权限**：需手动在数据库设 `role = 'admin'`，无 UI 自助升级

## 管理员设置

```sql
UPDATE users SET role = 'admin' WHERE phone = '你的手机号';
```