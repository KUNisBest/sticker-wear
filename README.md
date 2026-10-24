<div align="center">

# Sticker Wear · 全栈电商

一个从零构建的全栈电商项目:贴纸 / 潮品商城,含用户认证、商品管理、下单与订单流转、管理后台。

**React 19 + TypeScript + tRPC + Hono + Drizzle ORM + MySQL**

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![tRPC](https://img.shields.io/badge/tRPC-11-2596BE?logo=trpc&logoColor=white)
![Hono](https://img.shields.io/badge/Hono-4-E36002?logo=hono&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?logo=mysql&logoColor=white)
![Drizzle](https://img.shields.io/badge/Drizzle-ORM-C5F74F?logo=drizzle&logoColor=black)

</div>

## ✨ 功能

**用户端**

- 📱 手机验证码登录 / 注册(验证码 5 分钟有效、一次性使用、模拟短信服务)
- 🔑 密码登录(密码 scrypt 加盐哈希存储)+ JWT 鉴权(7 天有效期)
- 🛍 商品分类浏览、库存展示、售罄拦截、下单(收货信息校验)
- 📦 我的订单:列表 + 明细

**管理端**

- 🗂 商品 CRUD:名称 / 价格 / 库存 / 分类 / 图片 / 上下架 / 排序
- 📋 订单管理:全部订单、按状态筛选、发货 / 完成流转
- 👮 角色鉴权:管理员权限校验,非管理员 403

**工程亮点**

- 🔒 **并发安全的库存扣减**:单条条件 `UPDATE ... WHERE stock >= qty` + affectedRows 判断,靠数据库行锁保证原子性,根治"先查再扣"的 TOCTOU 竞态(超卖)问题
- 💰 **服务端计价**:订单价格 / 商品名以数据库为准,不信任前端传参
- ✅ 全链路 zod 入参校验 + tRPC 端到端类型安全

## 🛠 技术栈

| 层 | 技术 |
|----|------|
| 前端 | React 19 · TypeScript · Vite · Tailwind CSS · shadcn/ui · TanStack Query |
| 通信 | tRPC(前端直接调用后端函数,端到端类型安全) |
| 后端 | Node.js · Hono · jose(JWT) |
| 数据库 | MySQL 8 · Drizzle ORM |
| 校验 | zod |

## 🏗 架构

```
┌──────────────┐   tRPC over HTTP    ┌───────────┐    Drizzle ORM    ┌─────────┐
│  React 前端   │ ──────────────────► │ Hono 后端  │ ────────────────► │  MySQL  │
│ (Vite + SPA) │                     │  (api/)   │                   │ (5 张表) │
└──────────────┘                     └───────────┘                   └─────────┘
```

## 📂 目录结构

```
├── src/                  # 前端
│   ├── pages/            #   Home / Shop / Login / Profile / Admin
│   ├── components/       #   Navbar、shadcn/ui 组件
│   ├── hooks/            #   useAuth(JWT 状态管理)
│   └── providers/        #   tRPC client
├── api/                  # 后端(Hono + tRPC)
│   ├── boot.ts           #   服务入口
│   ├── middleware.ts     #   tRPC 初始化
│   └── routers/          #   auth(认证) / order(订单) / admin(管理)
├── db/
│   ├── schema.ts         #   Drizzle 表结构(5 张表)
│   ├── setup.sql         #   手动建表脚本
│   └── seed.js           #   初始化数据:管理员 + 示例商品
└── public/assets/        # 静态图片资源
```

**数据库设计(5 张表)**:`users` · `verification_codes` · `products` · `orders` · `order_items`

## 🚀 本地运行

**环境要求**:Node.js 20+、MySQL 8+

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env
#    填写 DATABASE_URL(如 mysql://root:password@localhost:3306/sticker_wear)
#    JWT_SECRET 用 openssl rand -hex 32 生成

# 3. 建库建表(二选一)
mysql -u root -p -e "CREATE DATABASE sticker_wear DEFAULT CHARACTER SET utf8mb4"
mysql -u root -p sticker_wear < db/setup.sql
#    或(已配好 drizzle):npm run db:push

# 4. 初始化数据(管理员 + 示例商品,可重复执行)
npm run db:seed

# 5. 启动开发服务器
npm run dev
```

**管理员账号**(seed 创建):`13800000000` / `admin123` → 登录后进入管理后台

**生产构建**:`npm run build` → `npm start`

## 🔒 并发安全:库存扣减的设计

下单时最容易踩的坑是"先查库存、再扣库存"——两个请求同时读到 `stock=1`,都下单成功,库存被扣成 -1(超卖)。本项目用**单条条件更新**根治:

```sql
UPDATE products SET stock = stock - 1 WHERE id = ? AND stock >= 1
```

- 判断条件(`stock >= qty`)写进 SQL 的 WHERE 里,由 MySQL 行锁保证原子性:两个并发请求只有拿到锁的那个能通过条件检查
- 通过 affectedRows 判断成败:0 行受影响 = 库存不足,直接返回失败
- 多商品下单时任一商品扣减失败,对已扣商品做补偿回滚

## 📄 License

[MIT](LICENSE)
