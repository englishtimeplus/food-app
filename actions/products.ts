"use server";

import { getSql } from "@/lib/db";
import type { Product, ProductOption, ProductOptionInput } from "@/lib/types";
import { revalidatePath } from "next/cache";

type ProductRow = Omit<Product, "options">;

async function fetchOptionsForProducts(
  productIds: number[]
): Promise<Map<number, ProductOption[]>> {
  const map = new Map<number, ProductOption[]>();
  if (productIds.length === 0) return map;

  const sql = getSql();
  const rows = await sql`
    SELECT id, product_id, label, price::text, sort_order
    FROM product_options
    WHERE product_id = ANY(${productIds})
    ORDER BY product_id, sort_order, id
  `;

  for (const row of rows as ProductOption[]) {
    const list = map.get(row.product_id) ?? [];
    list.push(row);
    map.set(row.product_id, list);
  }
  return map;
}

function attachOptions(products: ProductRow[], optionsMap: Map<number, ProductOption[]>): Product[] {
  return products.map((p) => ({
    ...p,
    options: optionsMap.get(p.id) ?? [],
  }));
}

export async function getProducts(): Promise<Product[]> {
  const sql = getSql();
  const rows = (await sql`
    SELECT id, name, image_url, price::text, category, created_at::text
    FROM products
    ORDER BY created_at DESC
  `) as ProductRow[];

  const optionsMap = await fetchOptionsForProducts(rows.map((p) => p.id));
  return attachOptions(rows, optionsMap);
}

export async function searchProducts(
  query?: string,
  from?: string,
  to?: string
): Promise<Product[]> {
  const sql = getSql();
  const q = query?.trim() ? `%${query.trim()}%` : null;
  const rows = (await sql`
    SELECT id, name, image_url, price::text, category, created_at::text
    FROM products
    WHERE (${q}::text IS NULL OR name ILIKE ${q} OR category ILIKE ${q})
      AND (${from ?? null}::timestamptz IS NULL OR created_at >= ${from ?? null}::timestamptz)
      AND (${to ?? null}::timestamptz IS NULL OR created_at <= ${to ?? null}::timestamptz)
    ORDER BY created_at DESC
  `) as ProductRow[];

  const optionsMap = await fetchOptionsForProducts(rows.map((p) => p.id));
  return attachOptions(rows, optionsMap);
}

async function saveProductOptions(productId: number, options: ProductOptionInput[]) {
  const sql = getSql();
  await sql`DELETE FROM product_options WHERE product_id = ${productId}`;

  const valid = options.filter((o) => o.label.trim() && !isNaN(o.price) && o.price >= 0);
  for (let i = 0; i < valid.length; i++) {
    const o = valid[i];
    await sql`
      INSERT INTO product_options (product_id, label, price, sort_order)
      VALUES (${productId}, ${o.label.trim()}, ${o.price}, ${i})
    `;
  }
}

export async function createProduct(
  data: {
    name: string;
    image_url: string;
    price: number;
    category: string;
  },
  options: ProductOptionInput[] = []
) {
  const sql = getSql();
  const rows = await sql`
    INSERT INTO products (name, image_url, price, category)
    VALUES (${data.name}, ${data.image_url}, ${data.price}, ${data.category})
    RETURNING id
  `;
  const id = rows[0].id as number;
  await saveProductOptions(id, options);
  revalidatePath("/");
  revalidatePath("/admin/products");
  revalidatePath("/order");
}

export async function updateProduct(
  id: number,
  data: { name: string; image_url: string; price: number; category: string },
  options: ProductOptionInput[] = []
) {
  const sql = getSql();
  await sql`
    UPDATE products
    SET name = ${data.name}, image_url = ${data.image_url},
        price = ${data.price}, category = ${data.category}
    WHERE id = ${id}
  `;
  await saveProductOptions(id, options);
  revalidatePath("/");
  revalidatePath("/admin/products");
  revalidatePath("/order");
}

export async function deleteProduct(id: number) {
  const sql = getSql();
  await sql`DELETE FROM products WHERE id = ${id}`;
  revalidatePath("/");
  revalidatePath("/admin/products");
  revalidatePath("/order");
}

export async function exportProductsCsv(): Promise<string> {
  const products = await getProducts();
  const { toCsv } = await import("@/lib/format");
  return toCsv(
    products.map((p) => ({
      id: p.id,
      name: p.name,
      image_url: p.image_url,
      price: p.price,
      category: p.category,
      options: (p.options ?? []).map((o) => `${o.label}:${o.price}`).join("; "),
      created_at: p.created_at,
    }))
  );
}
