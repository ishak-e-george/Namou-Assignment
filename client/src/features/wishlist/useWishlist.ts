import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addWishlistItem, getWishlist, removeWishlistItem } from '../../api/wishlist.api.js';

export const wishlistQueryKey = ['wishlist'] as const;

export function useWishlist() {
  return useQuery({ queryKey: wishlistQueryKey, queryFn: getWishlist, staleTime: 15_000 });
}

export function useToggleWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, isWishlisted }: { productId: number; isWishlisted: boolean }) =>
      isWishlisted ? removeWishlistItem(productId) : addWishlistItem(productId),
    onSuccess: (response) => queryClient.setQueryData(wishlistQueryKey, response),
  });
}
