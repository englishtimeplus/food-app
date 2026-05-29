"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { placeOrder } from "@/actions/orders";
import type { Product } from "@/lib/types";
import { cartLineKey } from "@/lib/cart-line";
import {
  buildOptionString,
  formatProductPrice,
  getDefaultOptionLabel,
  getProductOptions,
  productHasOptions,
} from "@/lib/product-options";
import { formatPeso } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ProductOptionPicker } from "./product-option-picker";
import { useCart } from "./cart-context";
import { useCustomerName } from "./customer-name-context";

type OrderLine = {
  lineKey: string;
  productId: number;
  quantity: number;
  optionLabel: string | null;
};

function cartItemsToOrderLines(
  items: { productId: number; quantity: number; optionLabel: string | null }[]
): OrderLine[] {
  return items.map((item) => ({
    lineKey: cartLineKey(item.productId, item.optionLabel),
    productId: item.productId,
    quantity: item.quantity,
    optionLabel: item.optionLabel,
  }));
}

export function OrderForm({ products }: { products: Product[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselect = searchParams.get("product");
  const fromCart = searchParams.get("from") === "cart";
  const { items: cartItems, clearCart } = useCart();
  const { customerName, setCustomerName, hydrated } = useCustomerName();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [checkedIds, setCheckedIds] = useState<number[]>(
    preselect ? [parseInt(preselect, 10)] : []
  );
  const [weightByProduct, setWeightByProduct] = useState<Record<number, string>>({});
  const [orderLines, setOrderLines] = useState<OrderLine[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && customerName) setName(customerName);
  }, [hydrated, customerName]);

  useEffect(() => {
    if (!preselect) return;
    const id = parseInt(preselect, 10);
    const product = products.find((p) => p.id === id);
    if (product && productHasOptions(product)) {
      setWeightByProduct((prev) => ({
        ...prev,
        [id]: prev[id] ?? getDefaultOptionLabel(product),
      }));
    }
  }, [preselect, products]);

  useEffect(() => {
    if (!fromCart || cartItems.length === 0) return;
    setOrderLines(cartItemsToOrderLines(cartItems));
  }, [fromCart, cartItems]);

  const toggleChecked = (product: Product) => {
    const id = product.id;
    setCheckedIds((prev) => {
      if (prev.includes(id)) {
        setWeightByProduct((w) => {
          const next = { ...w };
          delete next[id];
          return next;
        });
        return prev.filter((x) => x !== id);
      }
      if (productHasOptions(product)) {
        setWeightByProduct((w) => ({
          ...w,
          [id]: w[id] ?? getDefaultOptionLabel(product),
        }));
      }
      return [...prev, id];
    });
  };

  const buildOrderOption = (product: Product, optionLabel: string | null) => {
    if (!productHasOptions(product)) return null;
    const label = optionLabel ?? getDefaultOptionLabel(product);
    return buildOptionString(product, label);
  };

  const updateOrderLineQuantity = (lineKey: string, quantity: number) => {
    if (quantity < 1) return;
    setOrderLines((prev) =>
      prev.map((line) => (line.lineKey === lineKey ? { ...line, quantity } : line))
    );
  };

  const updateOrderLineOption = (lineKey: string, optionLabel: string) => {
    setOrderLines((prev) => {
      const line = prev.find((l) => l.lineKey === lineKey);
      if (!line) return prev;

      const updated: OrderLine = {
        ...line,
        optionLabel,
        lineKey: cartLineKey(line.productId, optionLabel),
      };
      const without = prev.filter((l) => l.lineKey !== lineKey);
      const existing = without.find((l) => l.lineKey === updated.lineKey);
      if (existing) {
        return without.map((l) =>
          l.lineKey === updated.lineKey
            ? { ...l, quantity: l.quantity + updated.quantity }
            : l
        );
      }
      return [...without, updated];
    });
  };

  const saveNameAndSubmit = (submitFn: () => void) => {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setCustomerName(name.trim());
    setError(null);
    submitFn();
  };

  const submitOrderLines = (lines: OrderLine[]) => {
    if (lines.length === 0) {
      setError("Select at least one item");
      return;
    }
    startTransition(async () => {
      try {
        const order = await placeOrder({
          userName: name.trim(),
          items: lines.map((line) => {
            const p = products.find((x) => x.id === line.productId)!;
            return {
              productId: line.productId,
              quantity: line.quantity,
              option: buildOrderOption(p, line.optionLabel),
            };
          }),
        });
        if (fromCart) clearCart();
        router.push(`/order/success?id=${order.id}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to place order");
      }
    });
  };

  const submitFromCart = () => {
    saveNameAndSubmit(() => {
      if (cartItems.length === 0) {
        setError("Your cart is empty");
        return;
      }
      submitOrderLines(cartItemsToOrderLines(cartItems));
    });
  };

  const submitOrder = () => {
    saveNameAndSubmit(() => {
      if (orderLines.length > 0) {
        submitOrderLines(orderLines);
        return;
      }
      if (checkedIds.length === 0) {
        setError("Select at least one item");
        return;
      }
      startTransition(async () => {
        try {
          const order = await placeOrder({
            userName: name.trim(),
            items: checkedIds.map((productId) => {
              const p = products.find((x) => x.id === productId)!;
              return {
                productId,
                quantity: 1,
                option: buildOrderOption(p, weightByProduct[productId] ?? null),
              };
            }),
          });
          router.push(`/order/success?id=${order.id}`);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Failed to place order");
        }
      });
    });
  };

  const showCartLines = orderLines.length > 0;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Customer name *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          required
        />
      </div>

      {showCartLines && (
        <div className="space-y-2">
          <Label>Your selections</Label>
          <div className="space-y-3">
            {orderLines.map((line, index) => {
              const p = products.find((x) => x.id === line.productId);
              if (!p) return null;
              const needsOption = productHasOptions(p);
              return (
                <div
                  key={`${line.productId}-${index}`}
                  className="rounded-lg border border-orange-200 bg-orange-50/30 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-sm text-orange-600">{formatProductPrice(p)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        onClick={() =>
                          updateOrderLineQuantity(line.lineKey, line.quantity - 1)
                        }
                        disabled={line.quantity <= 1}
                      >
                        −
                      </Button>
                      <span className="w-6 text-center text-sm">{line.quantity}</span>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        onClick={() =>
                          updateOrderLineQuantity(line.lineKey, line.quantity + 1)
                        }
                      >
                        +
                      </Button>
                    </div>
                  </div>
                  {needsOption && (
                    <div className="mt-3 space-y-2 border-t border-orange-100 pt-3">
                      <p className="text-xs font-medium text-orange-800">Select option</p>
                      <ProductOptionPicker
                        product={p}
                        value={line.optionLabel ?? getDefaultOptionLabel(p)}
                        onValueChange={(label) => updateOrderLineOption(line.lineKey, label)}
                        idPrefix={`order-line-${line.lineKey}`}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!fromCart && (
        <div className="space-y-2">
          <Label>Menu selection</Label>
          <div className="space-y-3">
            {products.map((p) => {
              const checked = checkedIds.includes(p.id);
              const needsWeight = productHasOptions(p);
              const productOptions = getProductOptions(p);
              return (
                <div
                  key={p.id}
                  className={`rounded-lg border p-3 ${checked ? "border-orange-200 bg-orange-50/30" : ""}`}
                >
                  <label className="flex cursor-pointer items-center gap-3">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggleChecked(p)}
                    />
                    <div className="flex-1">
                      <p className="font-medium">{p.name}</p>
                      <p className="text-sm text-orange-600">{formatProductPrice(p)}</p>
                    </div>
                  </label>
                  {checked && needsWeight && (
                    <div className="mt-3 space-y-2 border-t border-orange-100 pt-3 pl-7">
                      <p className="text-xs font-medium text-orange-800">Select option</p>
                      <ProductOptionPicker
                        product={p}
                        value={weightByProduct[p.id] ?? getDefaultOptionLabel(p)}
                        onValueChange={(v) =>
                          setWeightByProduct((prev) => ({ ...prev, [p.id]: v }))
                        }
                        idPrefix={`weight-${p.id}`}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Button className="w-full" disabled={pending} onClick={submitOrder}>
        {pending ? "Placing order…" : "Place Order"}
      </Button>

      {!fromCart && cartItems.length > 0 && (
        <div className="rounded-lg border border-dashed border-zinc-300 p-4">
          <p className="mb-2 text-sm text-zinc-600">
            Or place order from cart ({cartItems.length} item
            {cartItems.length !== 1 ? "s" : ""})
          </p>
          <Button variant="secondary" className="w-full" disabled={pending} onClick={submitFromCart}>
            Place Order from Cart
          </Button>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
