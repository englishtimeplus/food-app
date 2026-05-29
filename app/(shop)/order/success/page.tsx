import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderById } from "@/actions/orders";
import { formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const orderId = parseInt(id ?? "", 10);
  if (!orderId) notFound();

  const order = await getOrderById(orderId);
  if (!order) notFound();

  return (
    <div className="space-y-6 py-8">
      <Card className="border-green-200 bg-green-50/50">
        <CardHeader>
          <CardTitle className="text-green-800">
            Thank you! Your order has been placed.
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="font-medium">Order number:</span> #{order.id}
          </p>
          <p>
            <span className="font-medium">Customer name:</span> {order.user_name}
          </p>
          <p>
            <span className="font-medium">Order date/time:</span>{" "}
            {formatDateTime(order.created_at)}
          </p>
          <ul className="mt-4 space-y-1 border-t border-green-200 pt-3">
            {order.items.map((item) => (
              <li key={item.id}>
                {item.product_name} × {item.quantity}
                {item.option ? ` — ${item.option}` : ""}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <Button asChild className="w-full">
        <Link href="/">Back to Menu</Link>
      </Button>
    </div>
  );
}
