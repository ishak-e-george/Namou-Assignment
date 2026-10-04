import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
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
    expect(screen.getAllByRole('button', { name: 'Add to Cart' })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Add to Cart' })[0]).toBeEnabled();
  });

  it('disables Add to Cart and clearly exposes stock state when its only variant is unavailable', () => {
    renderProduct({
      id: 2, title: 'Test Lamp', description: 'A useful test product.', priceCents: 3000,
      imageUrl: '/images/catalog/lantern.webp', variantType: 'Color',
      variants: [{ id: 3, label: 'Stone', stock: 0 }],
    });

    expect(screen.getAllByText('Out of stock')[0]).toBeVisible();
    expect(screen.getByText('No units available')).toBeVisible();
    expect(screen.getByRole('button', { name: /Stone.*Out of stock/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Out of stock' })).toBeDisabled();
  });

  it('changes to the selected color image and restores it when switching back', () => {
    renderProduct({
      id: 3, title: 'Test Basket', description: 'A woven basket.', priceCents: 3200,
      imageUrl: '/images/catalog/variants/basket-natural.webp', variantType: 'Color',
      variants: [
        { id: 1, label: 'Natural', stock: 9, imageUrl: '/images/catalog/variants/basket-natural.webp' },
        { id: 2, label: 'Olive', stock: 3, imageUrl: '/images/catalog/variants/basket-olive.webp' },
      ],
    });

    const image = screen.getByRole('img', { name: 'Test Basket in Natural' });
    expect(image).toHaveAttribute('src', '/images/catalog/variants/basket-natural.webp');
    fireEvent.click(screen.getByRole('button', { name: 'Olive' }));
    expect(screen.getByRole('img', { name: 'Test Basket in Olive' })).toHaveAttribute('src', '/images/catalog/variants/basket-olive.webp');
    fireEvent.click(screen.getByRole('button', { name: 'Natural' }));
    expect(screen.getByRole('img', { name: 'Test Basket in Natural' })).toHaveAttribute('src', '/images/catalog/variants/basket-natural.webp');
  });

  it('falls back to the product image when the selected variant has no image', () => {
    renderProduct({
      id: 3, title: 'Test Basket', description: 'A woven basket.', priceCents: 3200,
      imageUrl: '/images/catalog/basket.webp', variantType: 'Color',
      variants: [
        { id: 1, label: 'Natural', stock: 9 },
        { id: 2, label: 'Olive', stock: 3, imageUrl: '/images/catalog/variants/basket-olive.webp' },
      ],
    });

    expect(screen.getByRole('img', { name: 'Test Basket in Natural' })).toHaveAttribute('src', '/images/catalog/basket.webp');
    fireEvent.click(screen.getByRole('button', { name: 'Olive' }));
    expect(screen.getByRole('img', { name: 'Test Basket in Olive' })).toHaveAttribute('src', '/images/catalog/variants/basket-olive.webp');
  });

  it('shows normal stock with availability text', () => {
    renderProduct({
      id: 4, title: 'Test Cushion', description: 'A cushion.', priceCents: 2800,
      imageUrl: '/images/catalog/variants/cushion-oat.webp', variantType: 'Color',
      variants: [{ id: 1, label: 'Oat', stock: 6 }],
    });
    const status = screen.getByText('In stock').parentElement;
    expect(status).toHaveTextContent('6 available');
    expect(screen.getAllByRole('button', { name: 'Add to Cart' })[0]).toBeEnabled();
  });

  it('marks stock of two as low with a text label', () => {
    renderProduct({
      id: 4, title: 'Test Cushion', description: 'A cushion.', priceCents: 2800,
      imageUrl: '/images/catalog/variants/cushion-oat.webp', variantType: 'Color',
      variants: [{ id: 1, label: 'Rust', stock: 2 }],
    });
    const status = screen.getByText('Low stock').parentElement;
    expect(status).toHaveTextContent('Only 2 available');
    expect(screen.getAllByRole('button', { name: 'Add to Cart' })[0]).toBeEnabled();
  });
});
