import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Cart, CartItem } from '../api/cart.api.js';
import { CartItemRow } from '../features/cart/CartItemRow.js';
import { cartQueryKey } from '../features/cart/useCart.js';

const item: CartItem = {
  id: 1,
  product: {
    id: 1,
    title: 'Everyday Cotton Tee',
    imageUrl: '/images/tee.svg',
    priceCents: 2400,
    variantType: 'Size',
    variants: [
      { id: 1, label: 'S', stock: 8 },
      { id: 2, label: 'M', stock: 12 },
    ],
  },
  variant: { id: 1, label: 'S', stock: 8 },
  quantity: 1,
  lineTotalCents: 2400,
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('CartItemRow', () => {
  it('gives the remove action a product-specific accessible name', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={queryClient}>
        <CartItemRow item={item} />
      </QueryClientProvider>,
    );

    expect(screen.getByRole('button', { name: 'Remove Everyday Cotton Tee from cart' })).toBeInTheDocument();
  });

  it('disables the row controls while a quantity update is pending', async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    let resolveRequest: ((response: Response) => void) | undefined;
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>((resolve) => { resolveRequest = resolve; })));

    render(
      <QueryClientProvider client={queryClient}>
        <CartItemRow item={item} />
      </QueryClientProvider>,
    );

    const increase = screen.getByRole('button', { name: 'Increase quantity for Everyday Cotton Tee' });
    await user.click(increase);

    expect(increase).toBeDisabled();
    expect(screen.getByRole('button', { name: 'M' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Remove Everyday Cotton Tee from cart' })).toBeDisabled();
    expect(screen.getByText('Saving changes...')).toHaveAttribute('role', 'status');

    const cart: Cart = { items: [item], totalQuantity: 2, totalCents: 4800 };
    await act(async () => {
      resolveRequest?.({ ok: true, status: 200, json: async () => ({ cart }) } as Response);
    });
    await waitFor(() => expect(increase).toBeEnabled());
  });

  it('reduces a stale quantity directly to the current positive stock', async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const staleItem = { ...item, quantity: 5, variant: { ...item.variant, stock: 2 } };
    queryClient.setQueryData(cartQueryKey, { cart: { items: [staleItem], totalQuantity: 5, totalCents: 12000 } });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ cart: { items: [{ ...staleItem, quantity: 2, lineTotalCents: 4800 }], totalQuantity: 2, totalCents: 4800 } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<QueryClientProvider client={queryClient}><CartItemRow item={staleItem} /></QueryClientProvider>);
    await user.click(screen.getByRole('button', { name: 'Decrease quantity for Everyday Cotton Tee' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string)).toEqual({ quantity: 2 });
    expect(screen.getByText('Only 2 left in stock. Reduce the quantity to continue.')).toBeInTheDocument();
  });

  it('does not send quantity zero for a zero-stock line', async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const unavailableItem = { ...item, quantity: 1, variant: { ...item.variant, stock: 0 } };
    queryClient.setQueryData(cartQueryKey, { cart: { items: [unavailableItem], totalQuantity: 1, totalCents: 2400 } });
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    render(<QueryClientProvider client={queryClient}><CartItemRow item={unavailableItem} /></QueryClientProvider>);

    expect(screen.getByText(/Out of stock/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Decrease quantity for Everyday Cotton Tee' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Increase quantity for Everyday Cotton Tee' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Remove Everyday Cotton Tee from cart' })).toBeEnabled();
    expect(fetchMock).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Remove Everyday Cotton Tee from cart' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/cart/items/1');
  });
});
