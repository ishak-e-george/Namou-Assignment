import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { HttpError } from '../../api/http.js';
import { addCartItem, getCart, removeCartItem, updateCartItem } from '../../api/cart.api.js';

export const cartQueryKey = ['cart'] as const;

export function useCart() {
  return useQuery({ queryKey: cartQueryKey, queryFn: getCart, staleTime: 15_000 });
}

export function useAddCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addCartItem,
    onSuccess: (response) => queryClient.setQueryData(cartQueryKey, response),
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, changes }: { itemId: number; changes: { quantity?: number; variantId?: number } }) => updateCartItem(itemId, changes),
    onSuccess: (response) => queryClient.setQueryData(cartQueryKey, response),
    onError: (error) => {
      if (error instanceof HttpError && error.status === 409) {
        void queryClient.invalidateQueries({ queryKey: cartQueryKey });
      }
    },
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeCartItem,
    onSuccess: (response) => queryClient.setQueryData(cartQueryKey, response),
  });
}
