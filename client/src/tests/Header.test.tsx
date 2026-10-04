import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Header } from '../components/Header.js';
import { cartQueryKey } from '../features/cart/useCart.js';
import { wishlistQueryKey } from '../features/wishlist/useWishlist.js';

vi.mock('../features/auth/useAuth.js', () => ({ useAuth: () => ({ logout: vi.fn() }) }));

afterEach(cleanup);

describe('Header cart and wishlist counts', () => {
  it.each([0, 1, 3])('shows both counts with the shared accent class at %i', (count) => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(cartQueryKey, { cart: { items: [], totalQuantity: count, totalCents: 0 } });
    client.setQueryData(wishlistQueryKey, { wishlist: { items: [], totalItems: count } });

    render(
      <QueryClientProvider client={client}>
        <MemoryRouter><Header /></MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByRole('link', { name: `Wishlist (${count})` })).toHaveTextContent(`Wishlist (${count})`);
    expect(screen.getByRole('link', { name: `Cart (${count})` })).toHaveTextContent(`Cart (${count})`);
    const wishlist = screen.getByRole('link', { name: `Wishlist (${count})` });
    const cart = screen.getByRole('link', { name: `Cart (${count})` });
    expect(wishlist.querySelector('.nav-count')).not.toBeNull();
    expect(cart.querySelector('.nav-count')).not.toBeNull();
  });
});
