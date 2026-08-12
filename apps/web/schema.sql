-- Local D1 schema + seed data for QADemo
-- Reverse-engineered from worker routes and live qademo.com catalog

PRAGMA foreign_keys = ON;

-- Users
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  user_type     TEXT NOT NULL CHECK (user_type IN ('standard', 'locked', 'admin')),
  email         TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  price       REAL NOT NULL,
  stock       INTEGER NOT NULL DEFAULT 0,
  image_key   TEXT,
  is_active   INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id              INTEGER NOT NULL,
  total_amount         REAL NOT NULL,
  status               TEXT NOT NULL DEFAULT 'pending',
  shipping_first_name  TEXT NOT NULL,
  shipping_last_name   TEXT NOT NULL,
  shipping_address     TEXT NOT NULL,
  payment_last_four    TEXT,
  created_at           TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at           TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Order items
CREATE TABLE IF NOT EXISTS order_items (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id   INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity   INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Sessions (refresh tokens)
CREATE TABLE IF NOT EXISTS sessions (
  id                 TEXT PRIMARY KEY,
  user_id            INTEGER NOT NULL,
  refresh_token_hash TEXT NOT NULL,
  expires_at         TEXT NOT NULL,
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Seed users
-- password_hash = 'legacy' triggers the app's built-in test-password fallback in auth.ts
INSERT INTO users (username, password_hash, user_type, email) VALUES
  ('standard_user', 'legacy', 'standard', 'standard@qademo.test'),
  ('locked_user',   'legacy', 'locked',   'locked@qademo.test'),
  ('admin_user',    'legacy', 'admin',    'admin@qademo.test');

-- Seed products (mirrors live qademo.com catalog)
INSERT INTO products (id, name, slug, description, price, stock, image_key, is_active, created_at, updated_at) VALUES
  (1, 'Wireless Headphones', 'wireless-headphones',
   'High-quality wireless headphones with noise cancellation and 20-hour battery life.',
   199.99, 99, 'products/wireless_headphones.jpg', 1, '2025-12-29 09:11:50', '2026-05-27 15:08:50'),

  (2, 'Smart Watch', 'smart-watch',
   'Feature-rich smartwatch with heart rate monitoring, GPS, and water resistance.',
   299.99, 187, 'products/smartwatch.jpg', 1, '2025-12-29 09:11:50', '2026-07-27 09:58:15'),

  (3, 'Laptop Backpack', 'laptop-backpack',
   'Durable laptop backpack with multiple compartments and USB charging port.',
   49.99, 0, 'products/laptop_backpack.jpg', 1, '2025-12-29 09:11:50', '2026-07-16 05:42:33'),

  (4, 'Bluetooth Speaker', 'bluetooth-speaker',
   'Portable Bluetooth speaker with 360-degree sound and 12-hour battery life.',
   159.99, 0, 'products/1783414430049-e232a0f7.jpeg', 1, '2025-12-29 09:11:50', '2026-07-14 01:37:18'),

  (5, 'Fitness Tracker', 'fitness-tracker',
   'Water-resistant fitness tracker with sleep monitoring and smartphone notifications.',
   89.99, 0, 'products/fitness_tracker.jpg', 1, '2025-12-29 09:11:50', '2026-07-10 08:15:47'),

  (7, 'Mechanical Keyboard', 'mechanical-keyboard',
   'RGB mechanical gaming keyboard with customizable keys and wrist rest.',
   149.99, 8, 'products/mechanical_keyboard.jpg', 1, '2025-12-29 09:11:50', '2026-07-19 13:22:10'),

  (8, 'Wireless Mouse', 'wireless-mouse',
   'Ergonomic wireless mouse with precision tracking and long battery life.',
   39.99, 0, 'products/wireless_mouse.jpg', 1, '2025-12-29 09:11:50', '2026-07-20 09:20:50'),

  (9, 'Power Bank', 'power-bank',
   '20000mAh power bank with fast charging and multiple USB ports.',
   59.99, 45, 'products/powerbank.jpg', 1, '2025-12-29 09:11:50', '2025-12-29 09:11:50'),

  (10, 'Webcam', 'webcam',
   '1080p HD webcam with built-in microphone and privacy cover.',
   69.99, 998, 'products/webcam.jpg', 1, '2025-12-29 09:11:50', '2026-06-04 10:07:00');
