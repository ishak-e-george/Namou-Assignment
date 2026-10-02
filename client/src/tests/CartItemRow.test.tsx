import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Cart, CartItem } from '../api/cart.api.js';
import { CartItemRow } from '../features/cart/CartItemRow.js';

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
    expect(screen.getByRole('button', { name: 'Remove' })).toBeDisabled();
    expect(screen.getByText('Saving changes...')).toHaveAttribute('role', 'status');

    const cart: Cart = { items: [item], totalQuantity: 2, totalCents: 4800 };
    await act(async () => {
      resolveRequest?.({ ok: true, status: 200, json: async () => ({ cart }) } as Response);
    });
    await waitFor(() => expect(increase).toBeEnabled());
  });
});
