import type { Product } from './products.api.js';
import { apiFetch } from './http.js';

export type Wishlist = { items: Product[]; totalItems: number };
export type WishlistResponse = { wishlist: Wishlist };

export function getWishlist(): Promise<WishlistResponse> {
  return apiFetch('/wishlist');
}

export function addWishlistItem(productId: number): Promise<WishlistResponse> {
  return apiFetch('/wishlist', { method: 'POST', body: JSON.stringify({ productId }) });
}

export function removeWishlistItem(productId: number): Promise<WishlistResponse> {
  return apiFetch(`/wishlist/${encodeURIComponent(productId)}`, { method: 'DELETE' });
}
