import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { HttpError } from '../../api/http.js';
import { getOrder, placeOrder } from '../../api/orders.api.js';
import type { Order } from '../../api/orders.api.js';
import type { CartResponse } from '../../api/cart.api.js';
import { cartQueryKey } from '../cart/useCart.js';
import { productQueryKey } from '../products/useProducts.js';

export const orderQueryKey = (id: string) => ['orders', id] as const;

export function usePlaceOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: placeOrder,
    onSuccess: ({ order }) => {
      queryClient.setQueryData<CartResponse>(cartQueryKey, {
        cart: { items: [], totalQuantity: 0, totalCents: 0 },
      });
      queryClient.setQueryData(orderQueryKey(String(order.id)), { order });
      void queryClient.invalidateQueries({ queryKey: productQueryKey });
    },
    onError: (error) => {
      if (error instanceof HttpError && error.status === 409) {
        void queryClient.invalidateQueries({ queryKey: cartQueryKey });
      }
    },
  });
}

export function useOrder(id: string) {
  return useQuery({ queryKey: orderQueryKey(id), queryFn: () => getOrder(id), enabled: Boolean(id) });
}

export type { Order };
