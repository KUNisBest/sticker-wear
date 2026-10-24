// ============================================================
// Sticker Wear 初始化数据:管理员账号 + 示例商品
// 用法: npm run db:seed(需先配好 .env 的 DATABASE_URL 并建表)
// ============================================================
import "dotenv/config";
import crypto from "crypto";
import mysql from "mysql2/promise";

// 与 api/routers/auth.ts 的 hashPassword 保持同一种格式(salt:hash)
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

const ADMIN = { phone: "13800000000", password: "admin123", nickname: "管理员" };

const PRODUCTS = [
  { name: "城市漫游系列贴纸包", price: 39.9, stock: 100, category: "精选", image: "/assets/images/prod-1.jpg", description: "8 座城市地标手绘贴纸,防水磨砂材质", sortOrder: 1 },
  { name: "手账复古贴纸 50 枚", price: 29.9, stock: 200, category: "配饰", image: "/assets/images/prod-2.jpg", description: "复古拼贴风,手账拼贴必备", sortOrder: 2 },
  { name: "赛博朋克霓虹贴纸", price: 49.9, stock: 80, category: "精选", image: "/assets/images/prod-3.jpg", description: "夜光油墨,关灯也有惊喜", sortOrder: 3 },
  { name: "猫咪日常表情贴纸", price: 19.9, stock: 300, category: "配饰", image: "/assets/images/prod-4.jpg", description: "28 种猫咪表情,贴遍全世界", sortOrder: 4 },
  { name: "极简字母 Logo 卫衣", price: 199, stock: 50, category: "潮服", image: "/assets/images/prod-5.jpg", description: "重磅纯棉,宽松落肩版型", sortOrder: 5 },
  { name: "复古帆布托特包", price: 89, stock: 60, category: "包袋", image: "/assets/images/prod-6.jpg", description: "加厚帆布,可装 14 寸笔记本", sortOrder: 6 },
  { name: "星空幻想亚克力挂件", price: 25.9, stock: 150, category: "配饰", image: "/assets/images/prod-7.jpg", description: "双面印刷,透明亚克力", sortOrder: 7 },
  { name: "植物图鉴装饰画卡片", price: 45, stock: 90, category: "家居", image: "/assets/images/prod-8.jpg", description: "6 张一套,复古植物图鉴风", sortOrder: 8 },
];

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ 请先在 .env 里配置 DATABASE_URL");
    process.exit(1);
  }
  const db = await mysql.createConnection(process.env.DATABASE_URL);

  // 管理员账号(幂等:已存在则跳过)
  const [admins] = await db.query("SELECT id FROM users WHERE phone = ?", [ADMIN.phone]);
  if (admins.length === 0) {
    await db.query(
      "INSERT INTO users (phone, nickname, password_hash, role) VALUES (?, ?, ?, 'admin')",
      [ADMIN.phone, ADMIN.nickname, hashPassword(ADMIN.password)]
    );
    console.log(`✅ 管理员已创建:${ADMIN.phone} / ${ADMIN.password}`);
  } else {
    console.log(`ℹ️  管理员已存在:${ADMIN.phone}`);
  }

  // 示例商品(商品表为空时才插入,可重复执行)
  const [rows] = await db.query("SELECT COUNT(*) AS c FROM products");
  if (rows[0].c === 0) {
    for (const p of PRODUCTS) {
      await db.query(
        "INSERT INTO products (name, price, stock, category, image, description, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [p.name, p.price, p.stock, p.category, p.image, p.description, p.sortOrder]
      );
    }
    console.log(`✅ 已插入 ${PRODUCTS.length} 个示例商品`);
  } else {
    console.log("ℹ️  商品表非空,跳过示例商品");
  }

  await db.end();
  console.log("完成。npm run dev 启动后,用管理员账号登录即可进入 /admin");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
