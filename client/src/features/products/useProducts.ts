import { useQuery } from '@tanstack/react-query';
import { getProduct, getProducts } from '../../api/products.api.js';

export const productQueryKey = ['products'] as const;

export function useProducts() {
  return useQuery({ queryKey: productQueryKey, queryFn: getProducts });
}

export function useProduct(id: string) {
  return useQuery({ queryKey: [...productQueryKey, id], queryFn: () => getProduct(id) });
}
