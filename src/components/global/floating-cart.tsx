"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, ChevronRight } from "lucide-react";
import {
  useCartStore,
  selectCartCount,
  selectCartTotal,
} from "@/shared/store/cart.store";
import { useHydrated } from "@/shared/lib/use-hydrated";
import { formatCurrency } from "@/shared/lib/format";

export function FloatingCart() {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const cartCount = useCartStore(selectCartCount);
  const total = useCartStore(selectCartTotal);

  if (
    !hydrated ||
    cartCount === 0 ||
    pathname === "/carrinho" ||
    pathname === "/checkout"
  ) {
    return null;
  }

  return (
    <div className="fixed bottom-[76px] left-1/2 -translate-x-1/2 z-40 md:hidden animate-in slide-in-from-bottom-5 fade-in duration-300 w-fit whitespace-nowrap">
      <Link
        href="/carrinho"
        className="block rounded-full shadow-lg shadow-black/20 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 active:scale-95 transition-transform"
      >
        <div className="bg-primary text-primary-foreground flex items-center gap-3 px-4 py-2.5 rounded-full ring-1 ring-primary/20">
          <div className="relative">
            <ShoppingBag className="size-4" />
            <span className="absolute -top-1.5 -right-2 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-white shadow-sm shadow-black/20">
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          </div>
          <div className="flex items-center gap-1.5 border-l border-primary-foreground/20 pl-3">
            <span className="font-medium text-[13px]">
              {formatCurrency(total)}
            </span>
            <ChevronRight className="size-3.5 opacity-70" />
          </div>
        </div>
      </Link>
    </div>
  );
}
