"use server";

import { getSql } from "@/lib/db";
import type { User } from "@/lib/types";
import { revalidatePath } from "next/cache";

export async function getUsers(): Promise<User[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT id::text, name, email, created_at::text
    FROM food_users
    ORDER BY created_at DESC
  `;
  return rows as User[];
}

export async function searchUsers(
  query?: string,
  from?: string,
  to?: string
): Promise<User[]> {
  const sql = getSql();
  const q = query?.trim() ? `%${query.trim()}%` : null;
  const rows = await sql`
    SELECT id::text, name, email, created_at::text
    FROM food_users
    WHERE (${q}::text IS NULL OR name ILIKE ${q} OR email ILIKE ${q})
      AND (${from ?? null}::timestamptz IS NULL OR created_at >= ${from ?? null}::timestamptz)
      AND (${to ?? null}::timestamptz IS NULL OR created_at <= ${to ?? null}::timestamptz)
    ORDER BY created_at DESC
  `;
  return rows as User[];
}

export async function createUser(data: { name: string; email?: string | null }) {
  const sql = getSql();
  await sql`
    INSERT INTO food_users (name, email)
    VALUES (${data.name}, ${data.email ?? null})
  `;
  revalidatePath("/admin/users");
}

export async function updateUser(
  id: string,
  data: { name: string; email?: string | null }
) {
  const sql = getSql();
  await sql`
    UPDATE food_users SET name = ${data.name}, email = ${data.email ?? null}
    WHERE id = ${id}::uuid
  `;
  revalidatePath("/admin/users");
}

export async function deleteUser(id: string) {
  const sql = getSql();
  await sql`DELETE FROM food_users WHERE id = ${id}::uuid`;
  revalidatePath("/admin/users");
}

export async function exportUsersCsv(): Promise<string> {
  const users = await getUsers();
  const { toCsv } = await import("@/lib/format");
  return toCsv(
    users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email ?? "",
      created_at: u.created_at,
    }))
  );
}
