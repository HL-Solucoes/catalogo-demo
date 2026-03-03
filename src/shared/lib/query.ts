import {
  VALID_CATEGORIES,
  type CategoryId,
  type SortOption,
} from "../constants/categories";

const MAX_SEARCH_LENGTH = 60;

export interface ValidatedFilters {
  category: CategoryId;
  q: string;
  sort: SortOption;
}

export function validateFilters(params: {
  category?: string;
  q?: string;
  sort?: string;
}): ValidatedFilters {
  const category = VALID_CATEGORIES.includes(params.category as CategoryId)
    ? (params.category as CategoryId)
    : "all";

  const q =
    typeof params.q === "string"
      ? params.q.slice(0, MAX_SEARCH_LENGTH).trim()
      : "";

  const validSorts: SortOption[] = ["relevance", "price_asc", "price_desc"];
  const sort = validSorts.includes(params.sort as SortOption)
    ? (params.sort as SortOption)
    : "relevance";

  return { category, q, sort };
}

export function buildQueryString(filters: Partial<ValidatedFilters>): string {
  const params = new URLSearchParams();
  if (filters.category && filters.category !== "all") {
    params.set("category", filters.category);
  }
  if (filters.q) {
    params.set("q", filters.q);
  }
  if (filters.sort && filters.sort !== "relevance") {
    params.set("sort", filters.sort);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}
