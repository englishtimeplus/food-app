"use client";

import type { Product } from "@/lib/types";
import { formatPeso } from "@/lib/format";
import { getDefaultOptionLabel, getProductOptions } from "@/lib/product-options";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export function ProductOptionPicker({
  product,
  value,
  onValueChange,
  idPrefix,
}: {
  product: Product;
  value: string;
  onValueChange: (label: string) => void;
  idPrefix: string;
}) {
  const options = getProductOptions(product);

  return (
    <RadioGroup
      value={value || getDefaultOptionLabel(product)}
      onValueChange={onValueChange}
      className="space-y-1.5"
    >
      {options.map((o) => (
        <div key={o.id} className="flex items-center gap-2">
          <RadioGroupItem value={o.label} id={`${idPrefix}-${o.id}`} />
          <Label htmlFor={`${idPrefix}-${o.id}`} className="text-sm font-normal">
            {o.label} — {formatPeso(o.price)}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
}
