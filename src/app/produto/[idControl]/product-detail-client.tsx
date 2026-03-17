"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Plus, Minus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Product } from "@/shared/types/product";
import { formatCurrency, formatDiscount } from "@/shared/lib/format";
import { useCartStore } from "@/shared/store/cart.store";
import { useHydrated } from "@/shared/lib/use-hydrated";

interface Props {
  product: Product;
}

export function ProductDetailClient({ product }: Props) {
  const hydrated = useHydrated();
  const addItem = useCartStore((s) => s.addItem);
  const inc = useCartStore((s) => s.inc);
  const dec = useCartStore((s) => s.dec);
  const cartItem = useCartStore((s) =>
    s.items.find((i) => i.productId === product.id),
  );

  const outOfStock = product.quantity <= 0;
  const qtyInCart = cartItem?.qty ?? 0;
  const discountPercentage = Number(product.discount_percentage ?? 0);
  const hasDiscount = discountPercentage > 0;
  const finalPrice = hasDiscount
    ? formatDiscount(product.price, discountPercentage)
    : product.price;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      {/* Back link */}
      <Button variant="ghost" size="sm" className="mb-4 gap-1.5" asChild>
        <Link href="/produtos">
          <ArrowLeft className="size-4" />
          Voltar aos produtos
        </Link>
      </Button>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
          <Image
            src={product.image}
            alt={product.title}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
            className="object-cover"
          />
          {outOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60">
              <Badge variant="secondary" className="text-sm">
                Sem estoque
              </Badge>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs text-muted-foreground">{product.idControl}</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              {product.title}
            </h1>
            {product.subtitle && (
              <p className="mt-1 text-base text-muted-foreground">
                {product.subtitle}
              </p>
            )}
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-2">
            {product.is_price_visible ? (
              <>
                <span className="text-2xl font-bold">
                  {formatCurrency(finalPrice)}
                </span>
                {hasDiscount && (
                  <>
                    <span className="text-base text-muted-foreground line-through">
                      {formatCurrency(product.price)}
                    </span>
                    <Badge variant="destructive" className="text-xs">
                      -{discountPercentage}%
                    </Badge>
                  </>
                )}
              </>
            ) : (
              <span className="text-base italic text-muted-foreground">
                Preço sob consulta
              </span>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          )}

          <Separator />

          {/* Add to cart */}
          <div>
            {hydrated && qtyInCart > 0 ? (
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => dec(product.id)}
                  aria-label="Diminuir quantidade"
                >
                  <Minus className="size-4" />
                </Button>
                <span className="min-w-[2rem] text-center text-lg font-semibold">
                  {qtyInCart}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => inc(product.id)}
                  disabled={qtyInCart >= product.quantity}
                  aria-label="Aumentar quantidade"
                >
                  <Plus className="size-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  no carrinho
                </span>
              </div>
            ) : (
              <Button
                size="lg"
                className="w-full gap-2 sm:w-auto"
                disabled={outOfStock}
                onClick={() => addItem(product)}
                aria-label={
                  outOfStock
                    ? "Produto sem estoque"
                    : `Adicionar ${product.title} ao carrinho`
                }
              >
                <ShoppingCart className="size-4" />
                {outOfStock ? "Sem estoque" : "Adicionar ao carrinho"}
              </Button>
            )}

            {!outOfStock && (
              <p className="mt-2 text-xs text-muted-foreground">
                {product.quantity} unidade{product.quantity !== 1 ? "s" : ""}{" "}
                disponíve{product.quantity !== 1 ? "is" : "l"}
              </p>
            )}
          </div>

          <Separator />

          {/* Tags */}
          {product.tags.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold">Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {product.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Technical specs */}
          {Object.keys(product.technical_specs).length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold">
                Especificações técnicas
              </h3>
              <div className="space-y-1">
                {Object.entries(product.technical_specs).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="capitalize text-muted-foreground">
                      {key}
                    </span>
                    <span className="font-medium">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Brand */}
          {product.brand && (
            <p className="text-xs text-muted-foreground">
              Marca: <span className="font-medium">{product.brand}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
