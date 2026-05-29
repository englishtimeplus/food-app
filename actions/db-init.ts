"use server";

import { getSql } from "@/lib/db";
import { CLUB_MENU, MENU_SEED_VERSION } from "@/lib/menu-seed";

async function syncClubMenu() {
  const sql = getSql();
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
}

export async function ensureDatabase() {
  const sql = getSql();

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

  const userCount = await sql`SELECT COUNT(*)::int AS c FROM food_users`;
  if (userCount[0].c === 0) {
    await sql`
      INSERT INTO food_users (name, email) VALUES
      ('Club Member A', 'membera@club.local'),
      ('Club Member B', null)
    `;
  }

  const versionRow = await sql`
    SELECT value FROM food_app_meta WHERE key = 'menu_version'
  `;
  const currentVersion = versionRow[0]?.value ? parseInt(versionRow[0].value, 10) : 0;
  if (currentVersion !== MENU_SEED_VERSION) {
    await syncClubMenu();
  }
}
