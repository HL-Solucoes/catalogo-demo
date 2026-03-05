import {
  type UseInfiniteQueryResult,
  type UseMutationResult,
  type UseQueryResult,
  type InfiniteData,
} from "@tanstack/react-query";
import { type AxiosError } from "axios";

export type UseQueryCacheType<T> = UseQueryResult<T, AxiosError> & {
  isInitialLoading: boolean;
};

export type UseMutationCacheType<T, K> = UseMutationResult<
  T,
  AxiosError,
  K,
  unknown
> & {
  isLoading: boolean;
};

export type UseInfiniteQueryCacheType<T> = UseInfiniteQueryResult<
  InfiniteData<T>,
  AxiosError
>;
