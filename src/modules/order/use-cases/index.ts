import { useMutationCache } from "@/shared/cache/use-mutation-cache";
import orderService from "../service/order.service";
import type { ICheckoutPayload, ICheckoutResponse } from "../types/order.types";

export function useCheckoutUseCase() {
  const mutation = useMutationCache<ICheckoutResponse, ICheckoutPayload>({
    mutationFn: (payload) => orderService.checkout(payload),
  });

  return {
    checkout: mutation.mutateAsync,
    isCheckingOut: mutation.isLoading,
    checkoutData: mutation.data,
    checkoutError: mutation.error,
    ...mutation,
  };
}
