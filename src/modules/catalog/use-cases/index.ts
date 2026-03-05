import { useQueryCache } from "@/shared/cache/use-query-cache";
import { CatalogQueryKeys } from "../keys/catalog.keys";
import catalogService from "../service/catalog.service";
import type {
  ICatalog,
  ICategory,
  IProduct,
  IPaginatedResponse,
  IListProductsParams,
} from "../types/catalog.types";

export function useGetCatalogUseCase() {
  const cache = useQueryCache<ICatalog>({
    queryKey: [CatalogQueryKeys.GET_CATALOG],
    queryFn: () => catalogService.getCatalog(),
  });

  return {
    catalog: cache.data,
    isLoadingCatalog: cache.isLoading,
    ...cache,
  };
}

export function useListCategoriesUseCase(enabled = true) {
  const cache = useQueryCache<ICategory[]>({
    queryKey: [CatalogQueryKeys.LIST_CATEGORIES],
    queryFn: () => catalogService.getCategories(),
    enabled,
  });

  return {
    categories: cache.data ?? [],
    isLoadingCategories: cache.isLoading,
    ...cache,
  };
}

export function useListProductsUseCase(params?: IListProductsParams) {
  const cache = useQueryCache<IPaginatedResponse<IProduct>>({
    queryKey: [CatalogQueryKeys.LIST_PRODUCTS, params],
    queryFn: () => catalogService.getProducts(params),
    enabled: !!params,
  });

  return {
    products: cache.data?.items ?? [],
    meta: cache.data?.meta,
    isLoadingProducts: cache.isLoading,
    ...cache,
  };
}

export function useGetProductUseCase(productId: string) {
  const cache = useQueryCache<IProduct>({
    queryKey: [CatalogQueryKeys.GET_PRODUCT, productId],
    queryFn: () => catalogService.getProduct(productId),
    enabled: !!productId,
  });

  return {
    product: cache.data,
    isLoadingProduct: cache.isLoading,
    ...cache,
  };
}
