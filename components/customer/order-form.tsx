"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { placeOrder } from "@/actions/orders";
import type { Product } from "@/lib/types";
import {
  formatProductPrice,
  getWeightPrice,
  productNeedsWeightOption,
  WEIGHT_OPTIONS,
} from "@/lib/product-options";
import { formatPeso } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCart } from "./cart-context";
import { useCustomerName } from "./customer-name-context";

export function OrderForm({ products }: { products: Product[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselect = searchParams.get("product");
  const { items: cartItems, clearCart } = useCart();
  const { customerName, setCustomerName, hydrated } = useCustomerName();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [checkedIds, setCheckedIds] = useState<number[]>(
    preselect ? [parseInt(preselect, 10)] : []
  );
  const [weightByProduct, setWeightByProduct] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && customerName) setName(customerName);
  }, [hydrated, customerName]);

  useEffect(() => {
    if (!preselect) return;
    const id = parseInt(preselect, 10);
    const product = products.find((p) => p.id === id);
    if (product && productNeedsWeightOption(product)) {
      setWeightByProduct((prev) => ({ ...prev, [id]: prev[id] ?? "500g" }));
    }
  }, [preselect, products]);

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
      if (productNeedsWeightOption(product)) {
        setWeightByProduct((w) => ({ ...w, [id]: w[id] ?? "500g" }));
      }
      return [...prev, id];
    });
  };

  const buildOptionString = (product: Product) => {
    if (!productNeedsWeightOption(product)) return null;
    const w = weightByProduct[product.id] ?? "500g";
    return `Weight: ${w} (${formatPeso(getWeightPrice(w))})`;
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

  const submitFromCart = () => {
    saveNameAndSubmit(() => {
      if (cartItems.length === 0) {
        setError("Your cart is empty");
        return;
      }
      startTransition(async () => {
        try {
          const order = await placeOrder({
            userName: name.trim(),
            items: cartItems.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
              option: null,
            })),
          });
          clearCart();
          router.push(`/order/success?id=${order.id}`);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Failed to place order");
        }
      });
    });
  };

  const submitOrder = () => {
    saveNameAndSubmit(() => {
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
                option: buildOptionString(p),
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

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">주문자명 *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Menu selection</Label>
        <div className="space-y-3">
          {products.map((p) => {
            const checked = checkedIds.includes(p.id);
            const needsWeight = productNeedsWeightOption(p);
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
                    <p className="text-xs font-medium text-orange-800">용량 선택</p>
                    <RadioGroup
                      value={weightByProduct[p.id] ?? "500g"}
                      onValueChange={(v) =>
                        setWeightByProduct((prev) => ({ ...prev, [p.id]: v }))
                      }
                      className="space-y-1.5"
                    >
                      {WEIGHT_OPTIONS.map((o) => (
                        <div key={o.value} className="flex items-center gap-2">
                          <RadioGroupItem value={o.value} id={`weight-${p.id}-${o.value}`} />
                          <Label
                            htmlFor={`weight-${p.id}-${o.value}`}
                            className="text-sm font-normal"
                          >
                            {o.label} — {formatPeso(o.price)}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Button className="w-full" disabled={pending} onClick={submitOrder}>
        {pending ? "Placing order…" : "Place Order"}
      </Button>

      {cartItems.length > 0 && (
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
