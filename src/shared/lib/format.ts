export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatDiscount(
  price: number,
  discountPercentage: number,
): number {
  return price * (1 - discountPercentage / 100);
}
