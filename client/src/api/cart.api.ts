import { apiFetch } from './http.js';

export type CartItem = {
  id: number;
  product: {
    id: number;
    title: string;
    imageUrl: string;
    priceCents: number;
    variantType: 'Size' | 'Color' | null;
    variants: { id: number; label: string; stock: number }[];
  };
  variant: { id: number; label: string; stock: number };
  quantity: number;
  lineTotalCents: number;
};

export type Cart = { items: CartItem[]; totalQuantity: number; totalCents: number };
export type CartResponse = { cart: Cart };

export function getCart(): Promise<CartResponse> {
  return apiFetch('/cart');
}

export function addCartItem(input: { variantId: number; quantity: number }): Promise<CartResponse> {
  return apiFetch('/cart/items', { method: 'POST', body: JSON.stringify(input) });
}

export function updateCartItem(itemId: number, changes: { quantity?: number; variantId?: number }): Promise<CartResponse> {
  return apiFetch(`/cart/items/${itemId}`, { method: 'PATCH', body: JSON.stringify(changes) });
}

export function removeCartItem(itemId: number): Promise<CartResponse> {
  return apiFetch(`/cart/items/${itemId}`, { method: 'DELETE' });
}
