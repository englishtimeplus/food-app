"use client";

import type { Product } from "@/lib/types";
import { HomeNamePrompt } from "./home-name-prompt";
import { ProductCard } from "./product-card";

export function HomePageContent({ products }: { products: Product[] }) {
  return (
    <>
      <HomeNamePrompt />
      <div className="space-y-6 py-4">
        <section>
          <h1 className="text-2xl font-bold text-zinc-900">Today&apos;s Menu</h1>
          <p className="text-sm text-zinc-500">Order for your club — no payment needed</p>
        </section>
        <div className="grid gap-4 sm:grid-cols-2">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        {products.length === 0 && (
          <p className="text-center text-zinc-500">No products yet. Add some in the admin panel.</p>
        )}
      </div>
    </>
  );
}
