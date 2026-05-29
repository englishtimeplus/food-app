import { ensureDatabase } from "@/actions/db-init";
import { getProducts } from "@/actions/products";
import { ProductsManager } from "@/components/admin/products-manager";

export default async function AdminProductsPage() {
  await ensureDatabase();
  const products = await getProducts();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Products</h1>
      <ProductsManager initialProducts={products} />
    </div>
  );
}
