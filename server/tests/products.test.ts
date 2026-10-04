import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { loginAsDemo } from './helpers.js';

describe('products API', () => {
  it('requires authentication for product list and detail routes', async () => {
    const list = await request(app).get('/api/products');
    const detail = await request(app).get('/api/products/1');

    expect(list.status).toBe(401);
    expect(detail.status).toBe(401);
  });

  it('lists all 15 products with listing fields, variants and ascending ID order', async () => {
    const agent = await loginAsDemo();
    const response = await agent.get('/api/products');

    expect(response.status).toBe(200);
    expect(response.body.products).toHaveLength(15);
    expect(response.body.products.map((product: { id: number }) => product.id))
      .toEqual(Array.from({ length: 15 }, (_, index) => index + 1));
    for (const product of response.body.products) {
      expect(product).toEqual(expect.objectContaining({
        id: expect.any(Number),
        title: expect.any(String),
        priceCents: expect.any(Number),
        imageUrl: expect.stringMatching(/^\/images\/catalog\/.+\.webp$/),
        variants: expect.any(Array),
      }));
      expect(product.variants.length).toBeGreaterThan(0);
      for (const variant of product.variants) {
        expect(variant).toEqual(expect.objectContaining({
          id: expect.any(Number),
          label: expect.any(String),
          stock: expect.any(Number),
        }));
      }
    }
    expect(response.body.products.filter((product: { variantType: string | null }) => product.variantType !== null))
      .toHaveLength(10);
    expect(response.body.products.filter((product: { variants: unknown[] }) => product.variants.length > 1))
      .toHaveLength(10);
  });

  it('returns product details with description, variant type and stock', async () => {
    const agent = await loginAsDemo();
    const response = await agent.get('/api/products/1');

    expect(response.status).toBe(200);
    expect(response.body.product).toEqual({
      id: 1,
      title: 'Premium Bedding Set',
      description: expect.any(String),
      priceCents: 2400,
      variantType: 'Size',
      imageUrl: '/images/catalog/bedding-detail.webp',
      variants: [
        { id: expect.any(Number), label: 'Twin', stock: 3 },
        { id: expect.any(Number), label: 'Full', stock: 8 },
        { id: expect.any(Number), label: 'Queen', stock: 12 },
        { id: expect.any(Number), label: 'King', stock: 6 },
      ],
    });
  });

  it('returns all 19 seeded local images for color variants', async () => {
    const agent = await loginAsDemo();
    const expected = [
      [3, ['basket-natural', 'basket-olive', 'basket-ink']],
      [4, ['cushion-oat', 'cushion-rust', 'cushion-charcoal']],
      [5, ['cups-cream', 'cups-blue']],
      [7, ['lock-satin', 'lock-black']],
      [8, ['towels-ivory', 'towels-stone']],
      [10, ['runner-sand', 'runner-forest']],
      [12, ['lantern-stone', 'lantern-navy']],
      [14, ['thermostat-white', 'thermostat-slate', 'thermostat-oat']],
    ] as const;
    let mappedVariants = 0;

    for (const [productId, imageKeys] of expected) {
      const response = await agent.get(`/api/products/${productId}`);
      expect(response.status).toBe(200);
      expect(response.body.product.variants.map((variant: { imageUrl?: string }) => variant.imageUrl))
        .toEqual(imageKeys.map((key) => `/images/catalog/variants/${key}.webp`));
      expect(response.body.product.imageUrl).toBe(`/images/catalog/variants/${imageKeys[0]}.webp`);
      mappedVariants += response.body.product.variants.length;
    }

    expect(mappedVariants).toBe(19);
  });

  it('returns standard-only products without a customer-selectable variant type', async () => {
    const agent = await loginAsDemo();
    const response = await agent.get('/api/products/6');

    expect(response.status).toBe(200);
    expect(response.body.product).toEqual(expect.objectContaining({
      id: 6,
      variantType: null,
      variants: [{ id: expect.any(Number), label: 'Standard', stock: 4 }],
    }));
  });

  it('rejects malformed product IDs with a validation error', async () => {
    const agent = await loginAsDemo();
    const response = await agent.get('/api/products/not-a-number');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns a product not found error for a valid missing ID', async () => {
    const agent = await loginAsDemo();
    const response = await agent.get('/api/products/999999');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: { code: 'PRODUCT_NOT_FOUND', message: 'Product not found', details: {} },
    });
  });
});
