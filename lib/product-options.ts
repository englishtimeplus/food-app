import type { Product } from "./types";
import { formatPeso } from "./format";

export function productNeedsWeightOption(
  product: Pick<Product, "name" | "category">
): boolean {
  const n = product.name.toLowerCase().trim();
  return n === "kimchi" || n === "kimchi stew";
}

/** @deprecated use productNeedsWeightOption */
export function productNeedsOption(product: Pick<Product, "name" | "category">): boolean {
  return productNeedsWeightOption(product);
}

export const WEIGHT_OPTIONS = [
  { value: "500g", label: "500g", price: 200 },
  { value: "750g", label: "750g", price: 300 },
  { value: "1000g", label: "1000g", price: 400 },
] as const;

export function getWeightPrice(weight: string): number {
  return WEIGHT_OPTIONS.find((o) => o.value === weight)?.price ?? 200;
}

export function formatProductPrice(product: Pick<Product, "name" | "price" | "category">): string {
  if (productNeedsWeightOption(product)) {
    const min = Math.min(...WEIGHT_OPTIONS.map((o) => o.price));
    const max = Math.max(...WEIGHT_OPTIONS.map((o) => o.price));
    return `${formatPeso(min)} – ${formatPeso(max)}`;
  }
  return formatPeso(product.price);
}
