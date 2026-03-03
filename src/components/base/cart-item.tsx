"use client";

import React, { memo, useState } from "react";
import Image from "next/image";
import { Plus, Minus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/shared/lib/format";
import { useCartStore } from "@/shared/store/cart.store";
import type { CartItem as CartItemType } from "@/shared/types/product";
import { ProductModal } from "./product-modal";
import { getProductByIdControl } from "@/shared/constants/products";

function QtyInput({
  qty,
  stock,
  onCommit,
}: {
  qty: number;
  stock: number;
  onCommit: (val: number) => void;
}) {
  const [value, setValue] = useState(String(qty));

  const handleBlur = () => {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed) || parsed <= 0) {
      onCommit(1);
      setValue("1");
    } else {
      const clamped = Math.min(parsed, stock);
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
      className="h-6 w-10 rounded-md border bg-background text-center text-xs font-medium outline-none focus:ring-2 focus:ring-ring"
      aria-label="Quantidade"
    />
  );
}

interface CartItemProps {
  item: CartItemType;
}

export const CartItem = memo(function CartItem({ item }: CartItemProps) {
  const inc = useCartStore((s) => s.inc);
  const dec = useCartStore((s) => s.dec);
  const setQty = useCartStore((s) => s.setQty);
  const remove = useCartStore((s) => s.remove);
  const [modalOpen, setModalOpen] = useState(false);

  const product = getProductByIdControl(item.idControl);

  return (
    <>
      <div
        className="flex gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50 cursor-pointer"
        onClick={() => setModalOpen(true)}
      >
        {/* Image */}
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
          <Image
            src={item.image}
            alt={item.title}
            fill
            sizes="80px"
            className="object-cover"
          />
        </div>

        {/* Info */}
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <div>
            <h4 className="line-clamp-1 text-sm font-semibold">{item.title}</h4>
            <p className="text-xs text-muted-foreground">
              Ref: {item.idControl}
            </p>
            {item.is_price_visible ? (
              <p className="mt-0.5 text-sm font-medium">
                {formatCurrency(item.price)}
              </p>
            ) : (
              <p className="mt-0.5 text-xs italic text-muted-foreground">
                Preço sob consulta
              </p>
            )}
          </div>

          {/* Stepper + Remove */}
          <div
            className="mt-2 flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="outline"
              size="icon-xs"
              onClick={() => dec(item.productId)}
              aria-label="Diminuir quantidade"
            >
              <Minus className="size-3" />
            </Button>
            <QtyInput
              key={item.qty}
              qty={item.qty}
              stock={item.stock}
              onCommit={(val) => setQty(item.productId, val)}
            />
            <Button
              variant="outline"
              size="icon-xs"
              onClick={() => inc(item.productId)}
              disabled={item.qty >= item.stock}
              aria-label="Aumentar quantidade"
            >
              <Plus className="size-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => remove(item.productId)}
              className="ml-auto text-destructive hover:text-destructive"
              aria-label="Remover item"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {product && (
        <ProductModal
          product={product}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
});
