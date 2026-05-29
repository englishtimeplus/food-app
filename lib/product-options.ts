import type { Product, ProductOption } from "./types";
import { formatPeso } from "./format";

export function productHasOptions(product: Pick<Product, "options">): boolean {
  return (product.options?.length ?? 0) > 0;
}

/** @deprecated use productHasOptions */
export function productNeedsWeightOption(product: Pick<Product, "options">): boolean {
  return productHasOptions(product);
}

/** @deprecated use productHasOptions */
export function productNeedsOption(product: Pick<Product, "options">): boolean {
  return productHasOptions(product);
}

export function getProductOptions(product: Pick<Product, "options">): ProductOption[] {
  return product.options ?? [];
}

export function getDefaultOptionLabel(product: Pick<Product, "options">): string {
  const opts = getProductOptions(product);
  return opts[0]?.label ?? "";
}

export function getOptionPrice(product: Pick<Product, "options" | "price">, label: string): number {
  const opt = getProductOptions(product).find((o) => o.label === label);
  if (opt) return parseFloat(opt.price);
  return parseFloat(product.price);
}

/** @deprecated use getOptionPrice */
export function getWeightPrice(product: Pick<Product, "options" | "price">, label: string): number {
  return getOptionPrice(product, label);
}

export function formatProductPrice(product: Pick<Product, "options" | "price">): string {
  const opts = getProductOptions(product);
  if (opts.length > 0) {
    const prices = opts.map((o) => parseFloat(o.price));
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    if (min === max) return formatPeso(min);
    return `${formatPeso(min)} – ${formatPeso(max)}`;
  }
  return formatPeso(product.price);
}

export function buildOptionString(
  product: Pick<Product, "options" | "price">,
  selectedLabel: string
): string {
  const price = getOptionPrice(product, selectedLabel);
  return `Weight: ${selectedLabel} (${formatPeso(price)})`;
}
