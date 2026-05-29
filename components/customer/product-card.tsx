"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Share2, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Product } from "@/lib/types";
import { formatPeso } from "@/lib/format";
import {
  formatProductPrice,
  getWeightPrice,
  productNeedsWeightOption,
} from "@/lib/product-options";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "./cart-context";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [liked, setLiked] = useState(false);
  const hasWeight = productNeedsWeightOption(product);
  const price = hasWeight ? getWeightPrice("500g") : parseFloat(product.price);

  const cartPayload = {
    productId: product.id,
    name: hasWeight ? `${product.name} (500g)` : product.name,
    price,
    imageUrl: product.image_url,
  };

  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-[4/3] w-full bg-zinc-100">
        <Image
          src={product.image_url}
          alt={product.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </div>
      <CardContent className="space-y-3 p-4">
        <div>
          <h3 className="font-semibold text-zinc-900">{product.name}</h3>
          <p className="text-lg font-bold text-orange-600">{formatProductPrice(product)}</p>
          <p className="text-xs capitalize text-zinc-500">{product.category}</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              addItem(cartPayload);
              toast.success(`${product.name} added to cart`);
            }}
          >
            <ShoppingCart className="h-4 w-4" />
            Add to Cart
          </Button>
          <Button size="sm" asChild>
            <Link href={`/order?product=${product.id}`}>Order Now</Link>
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => {
              setLiked((v) => !v);
              toast(liked ? "Removed from favorites" : "Added to favorites ❤️");
            }}
          >
            <Heart className={`h-4 w-4 ${liked ? "fill-red-500 text-red-500" : ""}`} />
            Like
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={async () => {
              const url = window.location.href;
              if (navigator.share) {
                await navigator.share({ title: product.name, url });
              } else {
                await navigator.clipboard.writeText(url);
                toast.success("Link copied to clipboard");
              }
            }}
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
