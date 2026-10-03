import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { CheckoutPage } from '../features/checkout/CheckoutPage.js';
import type { CartItem } from '../api/cart.api.js';
import { cartQueryKey } from '../features/cart/useCart.js';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('CheckoutPage', () => {
  it('does not offer Place Order when the cart is empty', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ cart: { items: [], totalQuantity: 0, totalCents: 0 } }),
    }));
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter><CheckoutPage /></MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByRole('heading', { name: 'Your cart is empty' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Place Order' })).not.toBeInTheDocument();
  });

  it('disables Place Order when the current cart quantity exceeds stock', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const item: CartItem = {
      id: 1,
      product: { id: 1, title: 'Premium Bedding Set', imageUrl: '/images/catalog/bedding-detail.webp', priceCents: 2400, variantType: 'Size', variants: [{ id: 1, label: 'Twin', stock: 2 }] },
      variant: { id: 1, label: 'Twin', stock: 2 }, quantity: 5, lineTotalCents: 12000,
    };
    queryClient.setQueryData(cartQueryKey, { cart: { items: [item], totalQuantity: 5, totalCents: 12000 } });

    render(<QueryClientProvider client={queryClient}><MemoryRouter><CheckoutPage /></MemoryRouter></QueryClientProvider>);

    expect(await screen.findByRole('button', { name: 'Place Order' })).toBeDisabled();
    expect(screen.getByText('Update the highlighted items to continue.')).toBeInTheDocument();
  });

  it('shows the general stock conflict and updated per-line availability after a 409', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const item: CartItem = {
      id: 1,
      product: { id: 1, title: 'Premium Bedding Set', imageUrl: '/images/catalog/bedding-detail.webp', priceCents: 2400, variantType: 'Size', variants: [{ id: 1, label: 'Twin', stock: 5 }] },
      variant: { id: 1, label: 'Twin', stock: 5 }, quantity: 5, lineTotalCents: 12000,
    };
    const refreshedItem = { ...item, variant: { ...item.variant, stock: 2 }, product: { ...item.product, variants: [{ id: 1, label: 'Twin', stock: 2 }] } };
    queryClient.setQueryData(cartQueryKey, { cart: { items: [item], totalQuantity: 5, totalCents: 12000 } });
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      if (String(input) === '/api/orders') {
        return { ok: false, status: 409, json: async () => ({ error: { code: 'OUT_OF_STOCK', message: 'Stock changed before checkout', details: { items: [{ variantId: 1, requested: 5, available: 2 }] } } }) } as Response;
      }
      return { ok: true, status: 200, json: async () => ({ cart: { items: [refreshedItem], totalQuantity: 5, totalCents: 12000 } }) } as Response;
    });
    vi.stubGlobal('fetch', fetchMock);

    const user = (await import('@testing-library/user-event')).default.setup();
    render(<QueryClientProvider client={queryClient}><MemoryRouter><CheckoutPage /></MemoryRouter></QueryClientProvider>);
    await user.click(await screen.findByRole('button', { name: 'Place Order' }));

    expect(await screen.findByText('Stock changed before checkout. Please review your cart.')).toBeInTheDocument();
    expect(await screen.findByText('Only 2 left')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Place Order' })).toBeDisabled();
  });
});
