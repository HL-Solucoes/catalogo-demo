"use client";

import { useCallback, useState, useRef, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, SlidersHorizontal, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CATEGORIES as MOCK_CATEGORIES,
  SORT_OPTIONS,
  type CategoryId,
  type SortOption,
} from "@/shared/constants/categories";
import type { Product } from "@/shared/types/product";
import { validateFilters, buildQueryString } from "@/shared/lib/query";
import { ProductGrid } from "@/components/base/product-grid";
import { appConfig } from "@/shared/config/app.config";
import {
  useListProductsUseCase,
  useListCategoriesUseCase,
} from "@/modules/catalog/use-cases";

interface ProductsClientProps {
  allProducts?: Product[];
}

export function ProductsClient({ allProducts = [] }: ProductsClientProps) {
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

  // API hooks (only active when useMock=false)
  const { products: apiProducts, isLoadingProducts } = useListProductsUseCase(
    !appConfig.useMock
      ? {
          search: search || undefined,
          categoryId: category !== "all" ? category : undefined,
          page: 1,
          limit: 100,
        }
      : undefined,
  );

  const { categories: apiCategories, isLoadingCategories } =
    useListCategoriesUseCase(!appConfig.useMock);

  // Build categories list
  const categories = appConfig.useMock
    ? MOCK_CATEGORIES
    : [
        { id: "all" as const, label: "Todos" },
        ...apiCategories.map((c) => ({
          id: c.id as CategoryId,
          label: c.name,
        })),
      ];

  // Resolve products source
  const resolvedProducts: Product[] = appConfig.useMock
    ? allProducts
    : apiProducts.map((p) => ({
        id: p.id,
        idControl: p.idControl,
        company_id: "",
        catalog_id: "",
        category_id: p.categoryId ?? undefined,
        name: p.name,
        title: p.title,
        subtitle: p.subtitle ?? undefined,
        description: p.description ?? undefined,
        quantity: p.quantity,
        alert_stock: p.alertStock,
        status: p.status as Product["status"],
        price: p.price ? parseFloat(p.price) : 0,
        is_price_visible: p.isPriceVisible,
        discount_percentage: p.discountPercentage
          ? parseFloat(p.discountPercentage)
          : undefined,
        brand: p.brand ?? undefined,
        tags: p.tags ? p.tags.split(",").map((t) => t.trim()) : [],
        technical_specs: {},
        image: p.images?.[0]?.url ?? "/products/bone-01.svg",
        created_at: p.createdAt,
        updated_at: p.createdAt,
      }));

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

  // Filter products (only for mock — API handles filtering server-side)
  const filtered = appConfig.useMock
    ? resolvedProducts.filter((p) => {
        if (category !== "all" && p.category_id !== category) return false;
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
      })
    : resolvedProducts;

  // Sort products (client-side for both modes)
  const sorted = [...filtered].sort((a, b) => {
    if (sort === "price_asc") return a.price - b.price;
    if (sort === "price_desc") return b.price - a.price;
    return 0;
  });

  const hasActiveFilters =
    category !== "all" || search !== "" || sort !== "relevance";
  const currentSortLabel =
    SORT_OPTIONS.find((s) => s.value === sort)?.label ?? "Relevância";

  const isLoading =
    !appConfig.useMock && (isLoadingProducts || isLoadingCategories);

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
          {categories.map((cat) => (
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

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          <span className="text-sm">Carregando produtos...</span>
        </div>
      )}

      {/* Active filters indicator */}
      {!isLoading && hasActiveFilters && (
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
      {!isLoading && <ProductGrid products={sorted} />}
    </div>
  );
}
