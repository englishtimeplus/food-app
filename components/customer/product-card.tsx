"use client";

import Image from "next/image";
import Link, { useLinkStatus } from "next/link";
import { Heart, Share2, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Product } from "@/lib/types";
import {
  formatProductPrice,
  productHasOptions,
} from "@/lib/product-options";
import { AddToCartDialog, buildCartItemPayload } from "./add-to-cart-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useCart } from "./cart-context";

function OrderNowButton({ productId }: { productId: number }) {
  return (
    <Button size="sm" asChild>
      <Link href={`/order?product=${productId}`}>
        <OrderNowButtonLabel />
      </Link>
    </Button>
  );
}

function OrderNowButtonLabel() {
  const { pending } = useLinkStatus();

  return (
    <>
      {pending ? <Spinner /> : null}
      Order Now
    </>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [liked, setLiked] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const hasOptions = productHasOptions(product);

  const handleAddToCart = () => {
    if (hasOptions) {
      setAddDialogOpen(true);
      return;
    }
    addItem(buildCartItemPayload(product, null));
    toast.success(`${product.name} added to cart`);
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
          <Button size="sm" variant="secondary" onClick={handleAddToCart}>
            <ShoppingCart className="h-4 w-4" />
            Add to Cart
          </Button>
          <OrderNowButton productId={product.id} />
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
      {hasOptions && (
        <AddToCartDialog
          product={product}
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          onConfirm={(item) => {
            addItem(item);
            toast.success(`${product.name} added to cart`);
          }}
        />
      )}
    </Card>
  );
}
