"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, X, ShoppingBag, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CartItem } from "@/components/base/cart-item";
import { CartSummary } from "@/components/base/cart-summary";
import { useCartStore, selectCartItems } from "@/shared/store/cart.store";
import { useHydrated } from "@/shared/lib/use-hydrated";

export function CartPageClient() {
  const hydrated = useHydrated();
  const items = useCartStore(selectCartItems);
  const [search, setSearch] = useState("");

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.idControl.toLowerCase().includes(q),
    );
  }, [items, search]);

  if (!hydrated) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        Carregando carrinho...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ShoppingBag className="mb-4 size-16 text-muted-foreground/40" />
        <p className="mb-2 text-lg font-medium text-muted-foreground">
          Seu carrinho está vazio
        </p>
        <p className="mb-6 text-sm text-muted-foreground">
          Explore nossos produtos e adicione itens ao carrinho.
        </p>
        <Button asChild>
          <Link href="/produtos" className="gap-2">
            <ShoppingBag className="size-4" />
            Ver Produtos
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      {/* Items column */}
      <div className="space-y-4">
        {/* Search */}
        {items.length > 3 && (
          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar no carrinho..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-9"
              maxLength={60}
              aria-label="Buscar no carrinho"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Limpar busca"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        )}

        {/* Item count */}
        <p className="text-sm text-muted-foreground">
          {filteredItems.length} de {items.length} ite
          {items.length !== 1 ? "ns" : "m"}
        </p>

        {/* Items list */}
        <div className="space-y-2">
          {filteredItems.map((item) => (
            <CartItem key={item.productId} item={item} />
          ))}
        </div>

        {filteredItems.length === 0 && search && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhum item encontrado para &quot;{search}&quot;
          </p>
        )}

        <Separator />

        {/* Continue shopping */}
        <Button variant="outline" className="gap-2" asChild>
          <Link href="/produtos">
            <ArrowLeft className="size-4" />
            Continuar comprando
          </Link>
        </Button>
      </div>

      {/* Summary column */}
      <div className="lg:sticky lg:top-20">
        <CartSummary />
      </div>
    </div>
  );
}
