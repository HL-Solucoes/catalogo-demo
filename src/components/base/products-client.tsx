"use client";

import { useCallback, useState, useRef, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CATEGORIES,
  SORT_OPTIONS,
  type CategoryId,
  type SortOption,
} from "@/shared/constants/categories";
import type { Product } from "@/shared/types/product";
import { validateFilters, buildQueryString } from "@/shared/lib/query";
import { ProductGrid } from "@/components/base/product-grid";

interface ProductsClientProps {
  allProducts: Product[];
}

export function ProductsClient({ allProducts }: ProductsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // Read initial values from URL
  const initialFilters = validateFilters({
    category: searchParams.get("category") ?? undefined,
    q: searchParams.get("q") ?? undefined,
    sort: searchParams.get("sort") ?? undefined,
  });

  const [category, setCategory] = useState<CategoryId>(initialFilters.category);
  const [search, setSearch] = useState(initialFilters.q);
  const [sort, setSort] = useState<SortOption>(initialFilters.sort);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Update URL when filters change
  const updateURL = useCallback(
    (newCat: CategoryId, newQ: string, newSort: SortOption) => {
      const qs = buildQueryString({ category: newCat, q: newQ, sort: newSort });
      startTransition(() => {
        router.push(`/produtos${qs}`, { scroll: false });
      });
    },
    [router],
  );

  const handleCategoryChange = useCallback(
    (cat: CategoryId) => {
      setCategory(cat);
      updateURL(cat, search, sort);
    },
    [search, sort, updateURL],
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      const limited = value.slice(0, 60);
      setSearch(limited);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        updateURL(category, limited, sort);
      }, 400);
    },
    [category, sort, updateURL],
  );

  const handleSortChange = useCallback(
    (s: SortOption) => {
      setSort(s);
      updateURL(category, search, s);
    },
    [category, search, updateURL],
  );

  const clearFilters = useCallback(() => {
    setCategory("all");
    setSearch("");
    setSort("relevance");
    startTransition(() => {
      router.push("/produtos", { scroll: false });
    });
  }, [router]);

  // Clean up debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Filter products
  const filtered = allProducts.filter((p) => {
    // Category filter
    if (category !== "all" && p.category_id !== category) return false;

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      const matchesSearch =
        p.title.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)) ||
        p.idControl.toLowerCase().includes(q) ||
        (p.subtitle && p.subtitle.toLowerCase().includes(q));
      if (!matchesSearch) return false;
    }

    return true;
  });

  // Sort products
  const sorted = [...filtered].sort((a, b) => {
    if (sort === "price_asc") return a.price - b.price;
    if (sort === "price_desc") return b.price - a.price;
    return 0; // relevance = keep original order
  });

  const hasActiveFilters =
    category !== "all" || search !== "" || sort !== "relevance";
  const currentSortLabel =
    SORT_OPTIONS.find((s) => s.value === sort)?.label ?? "Relevância";

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="animate-fade-in relative">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar por nome, tag, código..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9 pr-9"
          maxLength={60}
          aria-label="Buscar produtos"
        />
        {search && (
          <button
            onClick={() => handleSearchChange("")}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Limpar busca"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Category pills + Sort */}
      <div className="animate-fade-in delay-100 flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5 flex-1">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat.id}
              variant={category === cat.id ? "default" : "outline"}
              size="sm"
              onClick={() => handleCategoryChange(cat.id)}
              className="rounded-full text-xs transition-all duration-200"
            >
              {cat.label}
            </Button>
          ))}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
              <SlidersHorizontal className="size-3.5" />
              <span className="hidden sm:inline">{currentSortLabel}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {SORT_OPTIONS.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                onClick={() => handleSortChange(opt.value)}
                className={sort === opt.value ? "font-semibold" : ""}
              >
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Active filters indicator */}
      {hasActiveFilters && (
        <div className="animate-fade-in flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {sorted.length} produto{sorted.length !== 1 ? "s" : ""} encontrado
            {sorted.length !== 1 ? "s" : ""}
          </span>
          <Button
            variant="ghost"
            size="xs"
            onClick={clearFilters}
            className="text-xs"
          >
            Limpar filtros
          </Button>
        </div>
      )}

      {/* Product grid */}
      <ProductGrid products={sorted} />
    </div>
  );
}
