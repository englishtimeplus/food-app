"use server";

import { getSql } from "@/lib/db";
import type { Product } from "@/lib/types";
import { revalidatePath } from "next/cache";

export async function getProducts(): Promise<Product[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT id, name, image_url, price::text, category, created_at::text
    FROM products
    ORDER BY created_at DESC
  `;
  return rows as Product[];
}

export async function searchProducts(
  query?: string,
  from?: string,
  to?: string
): Promise<Product[]> {
  const sql = getSql();
  const q = query?.trim() ? `%${query.trim()}%` : null;
  const rows = await sql`
    SELECT id, name, image_url, price::text, category, created_at::text
    FROM products
    WHERE (${q}::text IS NULL OR name ILIKE ${q} OR category ILIKE ${q})
      AND (${from ?? null}::timestamptz IS NULL OR created_at >= ${from ?? null}::timestamptz)
      AND (${to ?? null}::timestamptz IS NULL OR created_at <= ${to ?? null}::timestamptz)
    ORDER BY created_at DESC
  `;
  return rows as Product[];
}

export async function createProduct(data: {
  name: string;
  image_url: string;
  price: number;
  category: string;
}) {
  const sql = getSql();
  await sql`
    INSERT INTO products (name, image_url, price, category)
    VALUES (${data.name}, ${data.image_url}, ${data.price}, ${data.category})
  `;
  revalidatePath("/");
  revalidatePath("/admin/products");
}

export async function updateProduct(
  id: number,
  data: { name: string; image_url: string; price: number; category: string }
) {
  const sql = getSql();
  await sql`
    UPDATE products
    SET name = ${data.name}, image_url = ${data.image_url},
        price = ${data.price}, category = ${data.category}
    WHERE id = ${id}
  `;
  revalidatePath("/");
  revalidatePath("/admin/products");
}

export async function deleteProduct(id: number) {
  const sql = getSql();
  await sql`DELETE FROM products WHERE id = ${id}`;
  revalidatePath("/");
  revalidatePath("/admin/products");
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
      created_at: p.created_at,
    }))
  );
}
