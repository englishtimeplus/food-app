"use server";

import { getSql } from "@/lib/db";
import type { Order, OrderItem, OrderStatus, OrderWithItems } from "@/lib/types";
import { revalidatePath } from "next/cache";

export type PlaceOrderInput = {
  userName: string;
  items: { productId: number; quantity: number; option?: string | null }[];
};

export async function placeOrder(input: PlaceOrderInput): Promise<OrderWithItems> {
  const sql = getSql();
  if (!input.userName.trim()) {
    throw new Error("Name is required");
  }
  if (input.items.length === 0) {
    throw new Error("At least one item is required");
  }

  const orderRows = await sql`
    INSERT INTO food_orders (user_name, status)
    VALUES (${input.userName.trim()}, 'pending')
    RETURNING id, user_name, created_at::text, status
  `;
  const order = orderRows[0] as Order;

  for (const item of input.items) {
    await sql`
      INSERT INTO food_order_items (order_id, product_id, quantity, option)
      VALUES (${order.id}, ${item.productId}, ${item.quantity}, ${item.option ?? null})
    `;
  }

  const items = await getOrderItems(order.id);
  revalidatePath("/admin/orders");
  revalidatePath("/");
  return { ...order, items };
}


export async function getOrderItems(orderId: number): Promise<OrderItem[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT oi.id, oi.order_id, oi.product_id, oi.quantity, oi.option,
           p.name AS product_name
    FROM food_order_items oi
    JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = ${orderId}
  `;
  return rows as OrderItem[];
}

export async function getOrderById(id: number): Promise<OrderWithItems | null> {
  const sql = getSql();
  const rows = await sql`
    SELECT id, user_name, created_at::text, status
    FROM food_orders WHERE id = ${id}
  `;
  if (rows.length === 0) return null;
  const order = rows[0] as Order;
  const items = await getOrderItems(id);
  return { ...order, items };
}

export async function searchOrders(
  query?: string,
  from?: string,
  to?: string
): Promise<OrderWithItems[]> {
  const sql = getSql();
  const q = query?.trim() ? `%${query.trim()}%` : null;
  const orderRows = await sql`
    SELECT id, user_name, created_at::text, status
    FROM food_orders
    WHERE (
      ${q}::text IS NULL
      OR user_name ILIKE ${q}
      OR id::text ILIKE ${q}
    )
    AND (${from ?? null}::timestamptz IS NULL OR created_at >= ${from ?? null}::timestamptz)
    AND (${to ?? null}::timestamptz IS NULL OR created_at <= ${to ?? null}::timestamptz)
    ORDER BY created_at DESC
  `;
  const orders = orderRows as Order[];
  const result: OrderWithItems[] = [];
  for (const o of orders) {
    result.push({ ...o, items: await getOrderItems(o.id) });
  }
  return result;
}

export async function updateOrderStatus(id: number, status: OrderStatus) {
  const sql = getSql();
  await sql`UPDATE food_orders SET status = ${status} WHERE id = ${id}`;
  revalidatePath("/admin/orders");
}

export async function updateOrder(
  id: number,
  data: { user_name: string; status: OrderStatus }
) {
  const sql = getSql();
  await sql`
    UPDATE food_orders SET user_name = ${data.user_name}, status = ${data.status}
    WHERE id = ${id}
  `;
  revalidatePath("/admin/orders");
}

export async function deleteOrder(id: number) {
  const sql = getSql();
  await sql`DELETE FROM food_orders WHERE id = ${id}`;
  revalidatePath("/admin/orders");
}

async function assertOrderOwner(orderId: number, userName: string) {
  const sql = getSql();
  const rows = await sql`
    SELECT id FROM food_orders
    WHERE id = ${orderId} AND user_name = ${userName.trim()}
  `;
  if (rows.length === 0) {
    throw new Error("Order not found or access denied");
  }
}

export async function getOrdersByUserName(userName: string): Promise<OrderWithItems[]> {
  const trimmed = userName.trim();
  if (!trimmed) return [];

  const sql = getSql();
  const orderRows = await sql`
    SELECT id, user_name, created_at::text, status
    FROM food_orders
    WHERE user_name = ${trimmed}
    ORDER BY created_at DESC
  `;
  const orders = orderRows as Order[];
  const result: OrderWithItems[] = [];
  for (const o of orders) {
    result.push({ ...o, items: await getOrderItems(o.id) });
  }
  return result;
}

export type PaginatedOrdersResult = {
  orders: OrderWithItems[];
  hasMore: boolean;
};

export async function getOrdersByUserNamePaginated(
  userName: string,
  limit: number,
  offset: number
): Promise<PaginatedOrdersResult> {
  const trimmed = userName.trim();
  if (!trimmed) return { orders: [], hasMore: false };

  const sql = getSql();
  const orderRows = await sql`
    SELECT id, user_name, created_at::text, status
    FROM food_orders
    WHERE user_name = ${trimmed}
    ORDER BY created_at DESC
    LIMIT ${limit + 1}
    OFFSET ${offset}
  `;
  const hasMore = orderRows.length > limit;
  const orders = (hasMore ? orderRows.slice(0, limit) : orderRows) as Order[];
  const result: OrderWithItems[] = [];
  for (const o of orders) {
    result.push({ ...o, items: await getOrderItems(o.id) });
  }
  return { orders: result, hasMore };
}

export type UpdateCustomerOrderInput = {
  orderId: number;
  userName: string;
  items: { productId: number; quantity: number; option?: string | null }[];
};

export async function updateCustomerOrder(input: UpdateCustomerOrderInput) {
  const sql = getSql();
  if (input.items.length === 0) {
    throw new Error("At least one item is required");
  }
  await assertOrderOwner(input.orderId, input.userName);

  await sql`DELETE FROM food_order_items WHERE order_id = ${input.orderId}`;
  for (const item of input.items) {
    await sql`
      INSERT INTO food_order_items (order_id, product_id, quantity, option)
      VALUES (${input.orderId}, ${item.productId}, ${item.quantity}, ${item.option ?? null})
    `;
  }
  revalidatePath("/admin/orders");
}

export async function deleteCustomerOrder(orderId: number, userName: string) {
  await assertOrderOwner(orderId, userName);
  const sql = getSql();
  await sql`DELETE FROM food_orders WHERE id = ${orderId}`;
  revalidatePath("/admin/orders");
}

export async function exportOrdersCsv(): Promise<string> {
  const orders = await searchOrders();
  const { toCsv } = await import("@/lib/format");
  const rows: Record<string, unknown>[] = [];
  for (const o of orders) {
    if (o.items.length === 0) {
      rows.push({
        order_id: o.id,
        user_name: o.user_name,
        status: o.status,
        order_created_at: o.created_at,
        product_id: "",
        product_name: "",
        quantity: "",
        option: "",
      });
      continue;
    }
    for (const item of o.items) {
      rows.push({
        order_id: o.id,
        user_name: o.user_name,
        status: o.status,
        order_created_at: o.created_at,
        product_id: item.product_id,
        product_name: item.product_name ?? "",
        quantity: item.quantity,
        option: item.option ?? "",
      });
    }
  }
  return toCsv(rows);
}
