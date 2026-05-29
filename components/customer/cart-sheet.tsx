"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { getProducts } from "@/actions/products";
import { cartLineKey } from "@/lib/cart-line";
import type { Product } from "@/lib/types";
import { formatPeso } from "@/lib/format";
import { productHasOptions } from "@/lib/product-options";
import { Button } from "@/components/ui/button";
import { PendingButtonLink } from "./pending-nav-link";
import { buildCartItemPayload } from "./add-to-cart-dialog";
import { ProductOptionPicker } from "./product-option-picker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCart } from "./cart-context";

export function CartSheet() {
  const { items, totalItems, totalPrice, updateQuantity, updateLineOption, removeItem } =
    useCart();
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/order") setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    getProducts().then(setProducts);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingBag className="h-5 w-5" />
          {totalItems > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-600 text-[10px] font-bold text-white">
              {totalItems}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Your Cart ({totalItems})</DialogTitle>
        </DialogHeader>
        {items.length === 0 ? (
          <p className="py-8 text-center text-zinc-500">Your cart is empty</p>
        ) : (
          <div className="space-y-4">
            {items.map((item) => {
              const lineKey = cartLineKey(item.productId, item.optionLabel);
              const product = products.find((p) => p.id === item.productId);
              const hasOptions = product ? productHasOptions(product) : false;

              return (
                <div key={lineKey} className="flex gap-3 border-b pb-3">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-zinc-100">
                    <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                  </div>
                  <div className="flex flex-1 flex-col gap-2">
                    <div>
                      <p className="font-medium">{product?.name ?? item.name}</p>
                      <p className="text-sm text-orange-600">{formatPeso(item.price)}</p>
                    </div>
                    {hasOptions && product && (
                      <div className="rounded-md border border-zinc-100 bg-zinc-50/80 p-2">
                        <p className="mb-1.5 text-xs font-medium text-zinc-600">Option</p>
                        <ProductOptionPicker
                          product={product}
                          value={item.optionLabel ?? ""}
                          onValueChange={(label) =>
                            updateLineOption(
                              lineKey,
                              label,
                              buildCartItemPayload(product, label)
                            )
                          }
                          idPrefix={`cart-${lineKey}`}
                        />
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(lineKey, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center text-sm">{item.quantity}</span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(lineKey, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="ml-auto h-7 w-7 text-red-500"
                        onClick={() => removeItem(lineKey)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="flex items-center justify-between font-semibold">
              <span>Total</span>
              <span className="text-orange-600">{formatPeso(totalPrice)}</span>
            </div>
            <PendingButtonLink href="/order?from=cart" className="w-full">
              Place Order
            </PendingButtonLink>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
