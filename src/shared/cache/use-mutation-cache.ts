import { useMutation, type UseMutationOptions } from "@tanstack/react-query";
import { type AxiosError } from "axios";

import { type UseMutationCacheType } from "@/shared/types/cache.types";

export function useMutationCache<T, K>({
  ...rest
}: UseMutationOptions<T, AxiosError, K, unknown>): UseMutationCacheType<T, K> {
  const cache = useMutation<T, AxiosError, K, unknown>({ ...rest });

  return {
    ...cache,
    isLoading: cache.isPending,
  };
}
