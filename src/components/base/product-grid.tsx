"use client";

import type { Product } from "@/shared/types/product";
import { ProductCard } from "./product-card";

interface ProductGridProps {
  products: Product[];
}

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg font-medium text-muted-foreground">
          Nenhum produto encontrado
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Tente ajustar os filtros ou a busca.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product, index) => (
        <div
          key={product.id}
          className="animate-fade-in-up animate-stagger"
          style={{ "--stagger": Math.min(index, 11) } as React.CSSProperties}
        >
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  );
}
