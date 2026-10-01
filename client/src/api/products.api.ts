import { apiFetch } from './http.js';

export type ProductVariant = {
  id: number;
  label: string;
  stock: number;
};

export type Product = {
  id: number;
  title: string;
  description?: string;
  priceCents: number;
  imageUrl: string;
  variantType: 'Size' | 'Color' | null;
  variants: ProductVariant[];
};

export function getProducts(): Promise<{ products: Product[] }> {
  return apiFetch('/products');
}

export function getProduct(id: string): Promise<{ product: Product & { description: string } }> {
  return apiFetch(`/products/${encodeURIComponent(id)}`);
}
