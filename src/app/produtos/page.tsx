import type { Metadata } from "next";
import { Suspense } from "react";
import { getActiveProducts } from "@/shared/constants/products";
import { ProductsClient } from "@/components/base/products-client";

export const metadata: Metadata = {
  title: "Produtos",
  description:
    "Explore nosso catálogo de moda country: bonés, carteiras, camisas e acessórios no atacado.",
};

export default function ProdutosPage() {
  // Mock products are only used when NEXT_PUBLIC_USE_MOCK=true
  // The config is read client-side, but we always pass mock data
  // (it will be ignored by ProductsClient when useMock=false)
  const products = getActiveProducts();

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl">
        Produtos
      </h1>
      <Suspense
        fallback={
          <div className="py-10 text-center text-muted-foreground">
            Carregando...
          </div>
        }
      >
        <ProductsClient allProducts={products} />
      </Suspense>
    </div>
  );
}
