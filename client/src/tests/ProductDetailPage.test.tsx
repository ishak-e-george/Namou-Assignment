import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { Product } from '../api/products.api.js';
import { ProductDetailPage } from '../features/products/ProductDetailPage.js';
import { cartQueryKey } from '../features/cart/useCart.js';
import { wishlistQueryKey } from '../features/wishlist/useWishlist.js';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function renderProduct(product: Product & { description: string }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  queryClient.setQueryData(['products', String(product.id)], { product });
  queryClient.setQueryData(cartQueryKey, { cart: { items: [], totalQuantity: 0, totalCents: 0 } });
  queryClient.setQueryData(wishlistQueryKey, { wishlist: { items: [] } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/products/${product.id}`]}>
        <Routes><Route path="/products/:id" element={<ProductDetailPage />} /></Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ProductDetailPage stock states', () => {
  it('disables an unavailable variant and preselects the first available variant', () => {
    renderProduct({
      id: 1, title: 'Test Cushion', description: 'A useful test product.', priceCents: 2000,
      imageUrl: '/images/catalog/cushion.webp', variantType: 'Color',
      variants: [{ id: 1, label: 'Oat', stock: 0 }, { id: 2, label: 'Rust', stock: 3 }],
    });

    expect(screen.getByRole('button', { name: /Oat.*Out of stock/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Rust' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Add to Cart' })).toBeEnabled();
  });

  it('disables Add to Cart and clearly exposes stock state when its only variant is unavailable', () => {
    renderProduct({
      id: 2, title: 'Test Lamp', description: 'A useful test product.', priceCents: 3000,
      imageUrl: '/images/catalog/lantern.webp', variantType: 'Color',
      variants: [{ id: 3, label: 'Stone', stock: 0 }],
    });

    expect(screen.getAllByText('Out of stock')).toHaveLength(2);
    expect(screen.getByRole('button', { name: /Stone.*Out of stock/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Out of stock' })).toBeDisabled();
  });
});
