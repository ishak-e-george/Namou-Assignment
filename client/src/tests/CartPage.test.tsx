import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import type { CartItem } from '../api/cart.api.js';
import { CartPage } from '../features/cart/CartPage.js';
import { cartQueryKey } from '../features/cart/useCart.js';

afterEach(cleanup);

describe('CartPage stock guard', () => {
  it('disables checkout when a cart quantity exceeds current stock', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const item: CartItem = {
      id: 1,
      product: { id: 1, title: 'Premium Bedding Set', imageUrl: '/images/catalog/bedding-detail.webp', priceCents: 2400, variantType: 'Size', variants: [{ id: 1, label: 'Twin', stock: 2 }] },
      variant: { id: 1, label: 'Twin', stock: 2 }, quantity: 5, lineTotalCents: 12000,
    };
    queryClient.setQueryData(cartQueryKey, { cart: { items: [item], totalQuantity: 5, totalCents: 12000 } });

    render(<QueryClientProvider client={queryClient}><MemoryRouter><CartPage /></MemoryRouter></QueryClientProvider>);

    expect(await screen.findByText('Only 2 left in stock. Reduce the quantity to continue.')).toBeInTheDocument();
    expect(screen.getByText('Update the highlighted items to continue.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Proceed to Checkout' })).toBeDisabled();
    expect(screen.queryByRole('link', { name: 'Proceed to Checkout' })).not.toBeInTheDocument();
  });

  it('clears an old line conflict after cart refresh and a successful stock correction', async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const item: CartItem = {
      id: 1,
      product: { id: 1, title: 'Premium Bedding Set', imageUrl: '/images/catalog/bedding-detail.webp', priceCents: 2400, variantType: 'Size', variants: [{ id: 1, label: 'Twin', stock: 2 }] },
      variant: { id: 1, label: 'Twin', stock: 2 }, quantity: 3, lineTotalCents: 7200,
    };
    const refreshed = { ...item, variant: { ...item.variant, stock: 1 }, product: { ...item.product, variants: [{ id: 1, label: 'Twin', stock: 1 }] } };
    const corrected = { ...refreshed, quantity: 1, lineTotalCents: 2400 };
    queryClient.setQueryData(cartQueryKey, { cart: { items: [item], totalQuantity: 3, totalCents: 7200 } });
    let patchCount = 0;
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      void init;
      if (String(input) === '/api/cart') {
        return { ok: true, status: 200, json: async () => ({ cart: { items: [refreshed], totalQuantity: 3, totalCents: 7200 } }) } as Response;
      }
      patchCount += 1;
      if (patchCount === 1) {
        return { ok: false, status: 409, json: async () => ({ error: { code: 'OUT_OF_STOCK', message: 'Only 1 left in stock', details: { variantId: 1, requested: 2, available: 1 } } }) } as Response;
      }
      return { ok: true, status: 200, json: async () => ({ cart: { items: [corrected], totalQuantity: 1, totalCents: 2400 } }) } as Response;
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<QueryClientProvider client={queryClient}><MemoryRouter><CartPage /></MemoryRouter></QueryClientProvider>);
    const decrease = await screen.findByRole('button', { name: 'Decrease quantity for Premium Bedding Set' });
    await user.click(decrease);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('Only 1 left in stock. Reduce the quantity to continue.')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Decrease quantity for Premium Bedding Set' }));

    expect(await screen.findByLabelText('quantity for Premium Bedding Set: 1')).toBeInTheDocument();
    expect(screen.queryByText('Only 1 left in stock. Reduce the quantity to continue.')).not.toBeInTheDocument();
    const patchCalls = fetchMock.mock.calls.filter(([input]) => String(input) === '/api/cart/items/1');
    expect(patchCalls).toHaveLength(2);
    expect(JSON.parse(initBody(patchCalls[0]?.[1]))).toEqual({ quantity: 2 });
    expect(JSON.parse(initBody(patchCalls[1]?.[1]))).toEqual({ quantity: 1 });
  });
});

function initBody(init: RequestInit | undefined): string {
  return String(init?.body ?? '');
}
