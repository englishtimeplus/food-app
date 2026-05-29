"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/lib/types";
import {
  getDefaultOptionLabel,
  getOptionPrice,
  productHasOptions,
} from "@/lib/product-options";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProductOptionPicker } from "./product-option-picker";
import type { CartItem } from "@/lib/types";

export function buildCartItemPayload(
  product: Product,
  optionLabel: string | null
): Omit<CartItem, "quantity"> {
  const hasOptions = productHasOptions(product);
  const label = hasOptions ? (optionLabel ?? getDefaultOptionLabel(product)) : null;
  const price = hasOptions
    ? getOptionPrice(product, label!)
    : parseFloat(product.price);

  return {
    productId: product.id,
    name: hasOptions ? `${product.name} (${label})` : product.name,
    price,
    imageUrl: product.image_url,
    optionLabel: label,
  };
}

export function AddToCartDialog({
  product,
  open,
  onOpenChange,
  onConfirm,
}: {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (item: Omit<CartItem, "quantity">) => void;
}) {
  const [selectedLabel, setSelectedLabel] = useState(getDefaultOptionLabel(product));

  useEffect(() => {
    if (open) setSelectedLabel(getDefaultOptionLabel(product));
  }, [open, product]);

  const handleConfirm = () => {
    onConfirm(buildCartItemPayload(product, selectedLabel));
    onOpenChange(false);
    setSelectedLabel(getDefaultOptionLabel(product));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Select option</DialogTitle>
          <p className="text-sm text-zinc-500">{product.name}</p>
        </DialogHeader>
        <ProductOptionPicker
          product={product}
          value={selectedLabel}
          onValueChange={setSelectedLabel}
          idPrefix={`add-cart-${product.id}`}
        />
        <Button className="w-full" onClick={handleConfirm}>
          Add to Cart
        </Button>
      </DialogContent>
    </Dialog>
  );
}
