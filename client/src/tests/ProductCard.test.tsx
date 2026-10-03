import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import type { Product } from '../api/products.api.js';
import { ProductCard } from '../features/products/ProductCard.js';
import { wishlistQueryKey } from '../features/wishlist/useWishlist.js';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('ProductCard navigation', () => {
  it('uses one product link and a separate wishlist button', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClient.setQueryData(wishlistQueryKey, { wishlist: { items: [] } });
    const product: Product = {
      id: 4, title: 'Accent Cushion Cover', priceCents: 2800,
      imageUrl: '/images/catalog/cushion.webp', variantType: 'Color',
      variants: [{ id: 1, label: 'Oat', stock: 6 }],
    };

    render(<QueryClientProvider client={queryClient}><MemoryRouter><ProductCard product={product} /></MemoryRouter></QueryClientProvider>);

    const productLink = screen.getByRole('link', { name: 'View Accent Cushion Cover' });
    expect(productLink).toHaveAttribute('href', '/products/4');
    expect(productLink).toContainElement(screen.getByRole('heading', { name: 'Accent Cushion Cover' }));
    expect(productLink).toContainElement(screen.getByText('$28.00'));
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Add Accent Cushion Cover to wishlist' })).toHaveAttribute('aria-pressed', 'false');
  });
});
