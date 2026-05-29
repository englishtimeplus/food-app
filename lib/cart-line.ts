export function cartLineKey(productId: number, optionLabel: string | null): string {
  return `${productId}:${optionLabel ?? ""}`;
}
