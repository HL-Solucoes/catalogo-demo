import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { type AxiosError } from "axios";

import type { UseQueryCacheType } from "@/shared/types/cache.types";

export function useQueryCache<T>({
  ...rest
}: UseQueryOptions<T, AxiosError>): UseQueryCacheType<T> {
  const cache = useQuery({ ...rest });

  return {
    ...cache,
    isLoading: cache.isPending,
    isInitialLoading: cache.isLoading,
  } as UseQueryCacheType<T>;
}
