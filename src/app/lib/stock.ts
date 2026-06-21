/** Max quantity a customer can order: limited by admin maxQty and available stockQty. */
export function getOrderableMaxQty(product: {
  maxQty?: number | null;
  stockQty?: number | null;
}): number {
  const maxQty =
    typeof product.maxQty === "number" && product.maxQty > 0
      ? product.maxQty
      : Number.MAX_SAFE_INTEGER;
  const stock =
    typeof product.stockQty === "number" && product.stockQty >= 0 ? product.stockQty : 0;
  if (stock <= 0) return 0;
  return Math.min(maxQty, stock);
}

export function stockExceededMessage(
  product: { name?: string; unit?: string; stockQty?: number | null },
  requested: number
): string {
  const stock = typeof product.stockQty === "number" ? product.stockQty : 0;
  const unit = product.unit || "units";
  const name = product.name || "This product";
  if (stock <= 0) {
    return `${name} is out of stock.`;
  }
  return `Only ${stock} ${unit} available for ${name}. You requested ${requested} ${unit}.`;
}
