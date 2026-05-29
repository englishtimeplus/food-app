import { Suspense } from "react";
import { ensureDatabase } from "@/actions/db-init";
import { getProducts } from "@/actions/products";
import { OrderForm } from "@/components/customer/order-form";

export default async function OrderPage() {
  await ensureDatabase();
  const products = await getProducts();

  return (
    <div className="space-y-6 py-4">
      <section>
        <h1 className="text-2xl font-bold">Place Your Order</h1>
        <p className="text-sm text-zinc-500">Fill in your details below</p>
      </section>
      <Suspense fallback={<p className="text-zinc-500">Loading form…</p>}>
        <OrderForm products={products} />
      </Suspense>
    </div>
  );
}
