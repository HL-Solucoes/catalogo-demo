export const CATEGORIES = [
  { id: "all", label: "Todos" },
  { id: "bones", label: "Bonés" },
  { id: "carteiras", label: "Carteiras" },
  { id: "camisas", label: "Camisas" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"] | (string & {});

export const VALID_CATEGORIES = CATEGORIES.map((c) => c.id);

export const SORT_OPTIONS = [
  { value: "relevance", label: "Relevância" },
  { value: "price_asc", label: "Menor preço" },
  { value: "price_desc", label: "Maior preço" },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]["value"];
