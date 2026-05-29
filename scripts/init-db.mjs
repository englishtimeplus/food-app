import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const MENU_SEED_VERSION = 2;

const CLUB_MENU = [
  { name: "Kimbap", price: 150, category: "main", image_url: "https://images.unsplash.com/photo-1529042410759-befb1204bda8?w=400" },
  { name: "Tteokbokki", price: 150, category: "main", image_url: "https://images.unsplash.com/photo-1553163147-622ab57be1c7?w=400" },
  { name: "Kimchi Fried Rice", price: 150, category: "main", image_url: "https://images.unsplash.com/photo-1603133872871-684f608f2617?w=400" },
  { name: "Kimchi", price: 200, category: "side", image_url: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=400" },
  { name: "Kimchi stew", price: 200, category: "soup/stew", image_url: "https://images.unsplash.com/photo-1604908176997-4310ef922b86?w=400" },
  { name: "Bibimbap", price: 150, category: "main", image_url: "https://images.unsplash.com/photo-1553163147-622ab57be1c7?w=400" },
  { name: "Samgyupsal (K-BBQ)", price: 200, category: "main", image_url: "https://images.unsplash.com/photo-1529193591184-b1d58069ec66?w=400" },
];

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "..", ".env.local");
try {
  const env = readFileSync(envPath, "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  }
} catch {
  /* use existing env */
}

const sql = neon(process.env.DATABASE_URL);

await sql`
  CREATE TABLE IF NOT EXISTS food_app_meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS food_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    image_url TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    category TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS food_orders (
    id SERIAL PRIMARY KEY,
    user_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'pending'
      CHECK (status IN ('pending', 'preparing', 'completed', 'cancelled'))
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS food_order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES food_orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    option TEXT
  )
`;

await sql`DELETE FROM food_order_items`;
await sql`DELETE FROM products`;

for (const item of CLUB_MENU) {
  await sql`
    INSERT INTO products (name, image_url, price, category)
    VALUES (${item.name}, ${item.image_url}, ${item.price}, ${item.category})
  `;
}

await sql`
  INSERT INTO food_app_meta (key, value)
  VALUES ('menu_version', ${String(MENU_SEED_VERSION)})
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
`;

console.log("Menu reset: 7 products inserted");
