"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { useState, useCallback, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { useCartStore, selectCartCount } from "@/shared/store/cart.store";
import { useHydrated } from "@/shared/lib/use-hydrated";
import { Badge } from "@/components/ui/badge";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const hydrated = useHydrated();
  const cartCount = useCartStore(selectCartCount);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback(
    (value: string) => {
      setSearchValue(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (value.trim()) {
          router.push(`/produtos?q=${encodeURIComponent(value.trim())}`);
        }
      }, 400);
    },
    [router],
  );

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (searchValue.trim()) {
        router.push(`/produtos?q=${encodeURIComponent(searchValue.trim())}`);
        setSearchOpen(false);
      }
    },
    [searchValue, router],
  );

  useEffect(() => {
    if (searchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [searchOpen]);

  const navLinks = [
    { href: "/", label: "Início" },
    { href: "/produtos", label: "Produtos" },
    { href: "/carrinho", label: "Carrinho" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/"
          className="text-lg font-bold tracking-tight whitespace-nowrap"
        >
          NO LIMITE DO LAÇO
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent ${
                pathname === link.href
                  ? "text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {link.label}
              {link.href === "/carrinho" && hydrated && cartCount > 0 && (
                <Badge
                  variant="destructive"
                  className="ml-1.5 h-5 min-w-5 justify-center px-1.5 text-[10px]"
                >
                  {cartCount}
                </Badge>
              )}
            </Link>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-1 md:flex">
          {/* Search — smooth expand/collapse */}
          <div className="flex items-center">
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                searchOpen
                  ? "mr-1 max-w-[220px] opacity-100"
                  : "max-w-0 opacity-0"
              }`}
            >
              <form
                onSubmit={handleSearchSubmit}
                className="flex items-center gap-1"
              >
                <Input
                  ref={inputRef}
                  type="search"
                  placeholder="Buscar produtos..."
                  value={searchValue}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="h-8 w-48"
                  maxLength={60}
                  aria-label="Buscar produtos"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setSearchOpen(false)}
                  aria-label="Fechar busca"
                >
                  <X className="size-4" />
                </Button>
              </form>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(!searchOpen)}
              aria-label={searchOpen ? "Fechar busca" : "Abrir busca"}
              className="transition-transform duration-200 hover:scale-105"
            >
              <Search className="size-5" />
            </Button>
          </div>

          <ThemeToggle />
        </div>

        {/* Mobile actions */}
        <div className="flex items-center gap-1 md:hidden">
          <div className="flex items-center">
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                searchOpen
                  ? "mr-1 max-w-[180px] opacity-100"
                  : "max-w-0 opacity-0"
              }`}
            >
              <form
                onSubmit={handleSearchSubmit}
                className="flex items-center gap-1"
              >
                <Input
                  ref={inputRef}
                  type="search"
                  placeholder="Buscar..."
                  value={searchValue}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="h-8 w-36"
                  maxLength={60}
                  aria-label="Buscar produtos"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setSearchOpen(false)}
                  aria-label="Fechar busca"
                >
                  <X className="size-4" />
                </Button>
              </form>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(!searchOpen)}
              aria-label={searchOpen ? "Fechar busca" : "Abrir busca"}
            >
              <Search className="size-5" />
            </Button>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
