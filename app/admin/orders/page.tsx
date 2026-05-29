import { searchOrders } from "@/actions/orders";
import { OrdersManager } from "@/components/admin/orders-manager";

export default async function AdminOrdersPage() {
  const orders = await searchOrders();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Orders</h1>
      <OrdersManager initialOrders={orders} />
    </div>
  );
}
