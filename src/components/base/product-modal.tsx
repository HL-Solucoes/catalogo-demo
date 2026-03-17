"use client";

import Image from "next/image";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Product } from "@/shared/types/product";
import { formatCurrency, formatDiscount } from "@/shared/lib/format";

interface ProductModalProps {
  product: Product;
  open: boolean;
  onClose: () => void;
}

export function ProductModal({ product, open, onClose }: ProductModalProps) {
  const discountPercentage = Number(product.discount_percentage ?? 0);
  const hasDiscount = discountPercentage > 0;
  const finalPrice = hasDiscount
    ? formatDiscount(product.price, discountPercentage)
    : product.price;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">{product.title}</DialogTitle>
          {product.subtitle && (
            <DialogDescription>{product.subtitle}</DialogDescription>
          )}
        </DialogHeader>

        {/* Image */}
        <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted">
          <Image
            src={product.image}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 90vw, 400px"
            className="object-cover"
          />
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          {product.is_price_visible ? (
            <>
              <span className="text-xl font-bold">
                {formatCurrency(finalPrice)}
              </span>
              {hasDiscount && (
                <span className="text-sm text-muted-foreground line-through">
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

        {/* Description */}
        {product.description && (
          <p className="text-sm text-muted-foreground">{product.description}</p>
        )}

        <Separator />

        {/* Tags */}
        {product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {product.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Code */}
        <p className="text-xs text-muted-foreground">
          Ref: {product.idControl}
        </p>

        {/* Link to detail page */}
        <Button variant="outline" className="w-full gap-2" asChild>
          <Link
            href={`/produto/${encodeURIComponent(product.idControl)}`}
            target="_blank"
          >
            <ExternalLink className="size-4" />
            Abrir produto em outra guia
          </Link>
        </Button>
      </DialogContent>
    </Dialog>
  );
}
