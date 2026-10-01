import { useQuery } from '@tanstack/react-query';
import { getProduct, getProducts } from '../../api/products.api.js';

export function useProducts() {
  return useQuery({ queryKey: ['products'], queryFn: getProducts });
}

export function useProduct(id: string) {
  return useQuery({ queryKey: ['products', id], queryFn: () => getProduct(id) });
}
