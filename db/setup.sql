-- ============================================================
-- Sticker Wear 建表脚本(与 db/schema.ts 保持一致)
-- 用法:
--   1. 先创建数据库(名称与 .env 里 DATABASE_URL 中的库名一致):
--        CREATE DATABASE sticker_wear DEFAULT CHARACTER SET utf8mb4;
--   2. 在已选中的库上执行本脚本:
--        mysql -u root -p sticker_wear < db/setup.sql
-- ============================================================

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  nickname VARCHAR(50),
  password_hash VARCHAR(255),
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX phone_idx (phone)
);

-- 手机验证码表
CREATE TABLE IF NOT EXISTS verification_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(10) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX vc_phone_idx (phone)
);

-- 商品表
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  price DOUBLE NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  category VARCHAR(50) NOT NULL DEFAULT '精选',
  image VARCHAR(500) NOT NULL,
  description VARCHAR(2000) DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX prod_status_idx (status),
  INDEX prod_category_idx (category)
);

-- 订单表
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  total_price DOUBLE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  shipping_name VARCHAR(50) NOT NULL DEFAULT '',
  shipping_phone VARCHAR(20) NOT NULL DEFAULT '',
  shipping_address VARCHAR(500) NOT NULL DEFAULT '',
  note VARCHAR(500) DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX ord_user_idx (user_id),
  INDEX ord_status_idx (status)
);

-- 订单明细表
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  product_id INT NOT NULL,
  product_name VARCHAR(200) NOT NULL,
  price DOUBLE NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX oi_order_idx (order_id)
);
