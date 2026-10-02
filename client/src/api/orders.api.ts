import { apiFetch } from './http.js';

export type OrderItem = {
  productTitle: string;
  variantId: number;
  variantLabel: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
};

export type Order = {
  id: number;
  status: string;
  totalCents: number;
  createdAt: string;
  items: OrderItem[];
};

export type OrderResponse = { order: Order };

export function placeOrder(): Promise<OrderResponse> {
  return apiFetch('/orders', { method: 'POST', body: '{}' });
}

export function getOrder(id: string): Promise<OrderResponse> {
  return apiFetch(`/orders/${encodeURIComponent(id)}`);
}
