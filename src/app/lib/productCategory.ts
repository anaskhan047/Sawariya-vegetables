/** Trim + lowercase for comparing product.category values. */
export function normalizeCategoryName(value: unknown): string {
  return (value ?? "").toString().trim().toLowerCase();
}

/** Match fruit products (handles "Fruits", "Fruits ", "Fruit", etc.). */
export function isFruitCategory(category: unknown): boolean {
  const n = normalizeCategoryName(category);
  if (!n) return false;
  return n === "fruits" || n === "fruit" || n.startsWith("fruit");
}

/** Match vegetable products (handles "Vegetable", "Vegetables", etc.). */
export function isVegetableCategory(category: unknown): boolean {
  const n = normalizeCategoryName(category);
  if (!n) return false;
  return n === "vegetables" || n === "vegetable" || n.startsWith("vegetab");
}

/** Shop sidebar / URL filter — trim-aware exact match. */
export function productMatchesCategoryFilter(
  productCategory: unknown,
  selectedCategory: string | null | undefined
): boolean {
  if (!selectedCategory) return true;
  return (productCategory ?? "").toString().trim() === selectedCategory.trim();
}
