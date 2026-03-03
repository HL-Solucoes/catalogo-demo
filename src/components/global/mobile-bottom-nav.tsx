"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingBag, ShoppingCart } from "lucide-react";
import { useCartStore, selectCartCount } from "@/shared/store/cart.store";
import { useHydrated } from "@/shared/lib/use-hydrated";

const navItems = [
  { href: "/", label: "Início", icon: Home },
  { href: "/produtos", label: "Produtos", icon: ShoppingBag },
  { href: "/carrinho", label: "Carrinho", icon: ShoppingCart },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const cartCount = useCartStore(selectCartCount);

  return (
    <nav className="fixed right-0 bottom-0 left-0 z-50 border-t bg-background/95 backdrop-blur-md md:hidden">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[11px] font-medium transition-colors ${
                isActive ? "text-foreground" : "text-muted-foreground"
              }`}
              aria-label={item.label}
            >
              <span className="relative">
                <Icon className="size-5" />
                {item.href === "/carrinho" && hydrated && cartCount > 0 && (
                  <span className="animate-pulse-subtle absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-white">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
