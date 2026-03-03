"use client";

import React, { memo, useState } from "react";
import Image from "next/image";
import { Plus, Minus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/shared/types/product";
import { formatCurrency, formatDiscount } from "@/shared/lib/format";
import { useCartStore } from "@/shared/store/cart.store";
import { useHydrated } from "@/shared/lib/use-hydrated";
import { ProductModal } from "./product-modal";

function QtyInput({
  qty,
  maxStock,
  onCommit,
}: {
  qty: number;
  maxStock: number;
  onCommit: (val: number) => void;
}) {
  const [value, setValue] = useState(String(qty));

  const handleBlur = () => {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed) || parsed <= 0) {
      onCommit(1);
      setValue("1");
    } else {
      const clamped = Math.min(parsed, maxStock);
      onCommit(clamped);
      setValue(String(clamped));
    }
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={value}
      onChange={(e) => setValue(e.target.value.replace(/\D/g, ""))}
      onBlur={handleBlur}
      onClick={(e) => (e.target as HTMLInputElement).select()}
      className="h-7 w-10 rounded-md border bg-background text-center text-sm font-medium outline-none focus:ring-2 focus:ring-ring"
      aria-label="Quantidade"
    />
  );
}

interface ProductCardProps {
  product: Product;
}

export const ProductCard = memo(function ProductCard({
  product,
}: ProductCardProps) {
  const hydrated = useHydrated();
  const addItem = useCartStore((s) => s.addItem);
  const inc = useCartStore((s) => s.inc);
  const dec = useCartStore((s) => s.dec);
  const setQty = useCartStore((s) => s.setQty);
  const cartItem = useCartStore((s) =>
    s.items.find((i) => i.productId === product.id),
  );
  const [modalOpen, setModalOpen] = useState(false);

  const outOfStock = product.quantity <= 0;
  const qtyInCart = cartItem?.qty ?? 0;
  const hasDiscount =
    product.discount_percentage && product.discount_percentage > 0;
  const finalPrice = hasDiscount
    ? formatDiscount(product.price, product.discount_percentage!)
    : product.price;

  return (
    <>
      <Card
        className="group flex h-full cursor-pointer flex-col overflow-hidden border transition-shadow hover:shadow-lg"
        onClick={() => setModalOpen(true)}
      >
        {/* Image */}
        <div className="relative aspect-square shrink-0 overflow-hidden bg-muted">
          <Image
            src={product.image}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {outOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60">
              <Badge variant="secondary" className="text-xs">
                Sem estoque
              </Badge>
            </div>
          )}
          {hasDiscount && !outOfStock && (
            <Badge className="absolute top-2 left-2 bg-destructive text-[10px]">
              -{product.discount_percentage}%
            </Badge>
          )}
        </div>

        <CardContent className="flex grow flex-col space-y-2 p-3">
          {/* Title */}
          <h3 className="line-clamp-2 text-sm font-semibold leading-tight">
            {product.title}
          </h3>
          {product.subtitle && (
            <p className="line-clamp-1 text-xs text-muted-foreground">
              {product.subtitle}
            </p>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-1.5">
            {product.is_price_visible ? (
              <>
                <span className="text-base font-bold">
                  {formatCurrency(finalPrice)}
                </span>
                {hasDiscount && (
                  <span className="text-xs text-muted-foreground line-through">
                    {formatCurrency(product.price)}
                  </span>
                )}
              </>
            ) : (
              <span className="text-sm italic text-muted-foreground">
                Preço sob consulta
              </span>
            )}
          </div>

          {/* Add to cart / Stepper */}
          <div className="mt-auto pt-1" onClick={(e) => e.stopPropagation()}>
            {hydrated && qtyInCart > 0 ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => dec(product.id)}
                  aria-label="Diminuir quantidade"
                >
                  <Minus className="size-3.5" />
                </Button>
                <QtyInput
                  key={qtyInCart}
                  qty={qtyInCart}
                  maxStock={product.quantity}
                  onCommit={(val) => setQty(product.id, val)}
                />
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => inc(product.id)}
                  disabled={qtyInCart >= product.quantity}
                  aria-label="Aumentar quantidade"
                >
                  <Plus className="size-3.5" />
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                className="w-full gap-1.5"
                disabled={outOfStock}
                onClick={() => addItem(product)}
                aria-label={
                  outOfStock
                    ? "Produto sem estoque"
                    : `Adicionar ${product.title} ao carrinho`
                }
              >
                <ShoppingCart className="size-3.5" />
                {outOfStock ? "Sem estoque" : "Adicionar"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <ProductModal
        product={product}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
});
