import { ensureDatabase } from "@/actions/db-init";
import { getProducts } from "@/actions/products";
import { HomePageContent } from "@/components/customer/home-page-content";

export default async function HomePage() {
  await ensureDatabase();
  const products = await getProducts();

  return <HomePageContent products={products} />;
}
