import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { db } from '../src/db/database.js';
import { createUser, loginAsDemo } from './helpers.js';

function variantId(productId: number, label: string): number {
  const row = db.prepare('SELECT id FROM product_variants WHERE product_id = ? AND label = ?')
    .get(productId, label) as { id: number } | undefined;
  if (!row) throw new Error(`Missing test variant ${productId}/${label}`);
  return row.id;
}

describe('cart API', () => {
  it('requires authentication for cart routes', async () => {
    const response = await request(app).get('/api/cart');
    expect(response.status).toBe(401);
  });

  it('returns an empty authenticated cart with zero totals', async () => {
    const response = await (await loginAsDemo()).get('/api/cart');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ cart: { items: [], totalQuantity: 0, totalCents: 0 } });
  });

  it('adds one variant and returns server-priced product, variant and cart totals', async () => {
    const agent = await loginAsDemo();
    const selectedVariant = variantId(1, 'Full');
    const response = await agent.post('/api/cart/items').send({ variantId: selectedVariant, quantity: 2 });

    expect(response.status).toBe(200);
    expect(response.body.cart).toEqual({
      items: [{
        id: expect.any(Number),
        product: {
          id: 1,
          title: 'Premium Bedding Set',
          imageUrl: '/images/catalog/bedding-detail.webp',
          priceCents: 2400,
          variantType: 'Size',
          variants: [
            { id: expect.any(Number), label: 'Twin', stock: 3 },
            { id: expect.any(Number), label: 'Full', stock: 8 },
            { id: expect.any(Number), label: 'Queen', stock: 12 },
            { id: expect.any(Number), label: 'King', stock: 6 },
          ],
        },
        variant: { id: selectedVariant, label: 'Full', stock: 8 },
        quantity: 2,
        lineTotalCents: 4800,
      }],
      totalQuantity: 2,
      totalCents: 4800,
    });
    expect((db.prepare('SELECT stock FROM product_variants WHERE id = ?').get(selectedVariant) as { stock: number }).stock).toBe(8);
  });

  it('adds the same variant again by increasing its existing line', async () => {
    const agent = await loginAsDemo();
    const selectedVariant = variantId(1, 'Full');
    await agent.post('/api/cart/items').send({ variantId: selectedVariant, quantity: 1 });
    const response = await agent.post('/api/cart/items').send({ variantId: selectedVariant, quantity: 2 });

    expect(response.status).toBe(200);
    expect(response.body.cart.items).toHaveLength(1);
    expect(response.body.cart.items[0].quantity).toBe(3);
    expect(response.body.cart.totalQuantity).toBe(3);
  });

  it('rejects an add beyond available stock without changing the cart', async () => {
    const agent = await loginAsDemo();
    const selectedVariant = variantId(1, 'Twin');
    await agent.post('/api/cart/items').send({ variantId: selectedVariant, quantity: 2 });
    const response = await agent.post('/api/cart/items').send({ variantId: selectedVariant, quantity: 2 });
    const cart = await agent.get('/api/cart');

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('OUT_OF_STOCK');
    expect(response.body.error.details).toEqual({ variantId: selectedVariant, requested: 2, available: 1 });
    expect(cart.body.cart.items).toHaveLength(1);
    expect(cart.body.cart.items[0].quantity).toBe(2);
  });

  it('rejects a zero-stock variant', async () => {
    const agent = await loginAsDemo();
    const unavailableVariant = variantId(4, 'Charcoal');
    const response = await agent.post('/api/cart/items').send({ variantId: unavailableVariant, quantity: 1 });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('OUT_OF_STOCK');
    expect((await agent.get('/api/cart')).body.cart.items).toHaveLength(0);
  });

  it('rejects an unknown variant', async () => {
    const response = await (await loginAsDemo()).post('/api/cart/items').send({ variantId: 999999, quantity: 1 });
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('VARIANT_NOT_FOUND');
  });

  it('updates quantity and recalculates line and cart totals', async () => {
    const agent = await loginAsDemo();
    const selectedVariant = variantId(1, 'Twin');
    const added = await agent.post('/api/cart/items').send({ variantId: selectedVariant, quantity: 1 });
    const response = await agent.patch(`/api/cart/items/${added.body.cart.items[0].id}`).send({ quantity: 3 });

    expect(response.status).toBe(200);
    expect(response.body.cart.items[0].quantity).toBe(3);
    expect(response.body.cart.items[0].lineTotalCents).toBe(7200);
    expect(response.body.cart.totalQuantity).toBe(3);
    expect(response.body.cart.totalCents).toBe(7200);
  });

  it('rejects a quantity above stock and preserves the previous quantity', async () => {
    const agent = await loginAsDemo();
    const selectedVariant = variantId(1, 'Twin');
    const added = await agent.post('/api/cart/items').send({ variantId: selectedVariant, quantity: 2 });
    const response = await agent.patch(`/api/cart/items/${added.body.cart.items[0].id}`).send({ quantity: 4 });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('OUT_OF_STOCK');
    const cart = await agent.get('/api/cart');
    expect(cart.body.cart.items[0].quantity).toBe(2);
  });

  it.each([0, -1, 1.5])('rejects invalid patch quantity %s', async (quantity) => {
    const agent = await loginAsDemo();
    const added = await agent.post('/api/cart/items').send({ variantId: variantId(1, 'Full'), quantity: 1 });
    const response = await agent.patch(`/api/cart/items/${added.body.cart.items[0].id}`).send({ quantity });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect((await agent.get('/api/cart')).body.cart.items[0].quantity).toBe(1);
  });

  it('changes to another variant of the same product', async () => {
    const agent = await loginAsDemo();
    const xs = variantId(1, 'Twin');
    const medium = variantId(1, 'Queen');
    const added = await agent.post('/api/cart/items').send({ variantId: xs, quantity: 2 });
    const response = await agent.patch(`/api/cart/items/${added.body.cart.items[0].id}`).send({ variantId: medium });

    expect(response.status).toBe(200);
    expect(response.body.cart.items).toHaveLength(1);
    expect(response.body.cart.items[0].variant).toEqual({ id: medium, label: 'Queen', stock: 12 });
    expect(response.body.cart.items[0].quantity).toBe(2);
  });

  it('rejects switching to a zero-stock variant without changing the source line', async () => {
    const agent = await loginAsDemo();
    const oat = variantId(4, 'Oat');
    const charcoal = variantId(4, 'Charcoal');
    const added = await agent.post('/api/cart/items').send({ variantId: oat, quantity: 1 });
    const response = await agent.patch(`/api/cart/items/${added.body.cart.items[0].id}`).send({ variantId: charcoal });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('OUT_OF_STOCK');
    const cart = await agent.get('/api/cart');
    expect(cart.body.cart.items).toHaveLength(1);
    expect(cart.body.cart.items[0].variant.id).toBe(oat);
  });

  it('rejects a variant from a different product without changing the cart', async () => {
    const agent = await loginAsDemo();
    const xs = variantId(1, 'Twin');
    const otherProductVariant = variantId(2, 'S');
    const added = await agent.post('/api/cart/items').send({ variantId: xs, quantity: 2 });
    const response = await agent.patch(`/api/cart/items/${added.body.cart.items[0].id}`).send({ variantId: otherProductVariant });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    const cart = await agent.get('/api/cart');
    expect(cart.body.cart.items).toHaveLength(1);
    expect(cart.body.cart.items[0].variant.id).toBe(xs);
    expect(cart.body.cart.items[0].quantity).toBe(2);
  });

  it('merges into an existing same-product variant line', async () => {
    const agent = await loginAsDemo();
    const small = variantId(1, 'Full');
    const medium = variantId(1, 'Queen');
    await agent.post('/api/cart/items').send({ variantId: small, quantity: 2 });
    const source = await agent.post('/api/cart/items').send({ variantId: medium, quantity: 1 });
    const response = await agent.patch(`/api/cart/items/${source.body.cart.items.find((item: { variant: { id: number } }) => item.variant.id === medium).id}`).send({ variantId: small });

    expect(response.status).toBe(200);
    expect(response.body.cart.items).toHaveLength(1);
    expect(response.body.cart.items[0].variant.id).toBe(small);
    expect(response.body.cart.items[0].quantity).toBe(3);
  });

  it('rolls back both lines when a variant merge would exceed stock', async () => {
    const agent = await loginAsDemo();
    const small = variantId(1, 'Full');
    const medium = variantId(1, 'Queen');
    await agent.post('/api/cart/items').send({ variantId: small, quantity: 7 });
    await agent.post('/api/cart/items').send({ variantId: medium, quantity: 2 });
    const before = (await agent.get('/api/cart')).body.cart;
    const source = before.items.find((item: { variant: { id: number } }) => item.variant.id === medium);
    const response = await agent.patch(`/api/cart/items/${source.id}`).send({ variantId: small });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('OUT_OF_STOCK');
    expect((await agent.get('/api/cart')).body.cart).toEqual(before);
  });

  it('removes a cart item', async () => {
    const agent = await loginAsDemo();
    const added = await agent.post('/api/cart/items').send({ variantId: variantId(1, 'Full'), quantity: 1 });
    const response = await agent.delete(`/api/cart/items/${added.body.cart.items[0].id}`);

    expect(response.status).toBe(200);
    expect(response.body.cart).toEqual({ items: [], totalQuantity: 0, totalCents: 0 });
  });

  it('does not allow one user to update another user cart item', async () => {
    const otherUserId = await createUser('cart-owner@example.com', 'owner-password');
    const selectedVariant = variantId(1, 'Full');
    const itemId = Number(db.prepare('INSERT INTO cart_items (user_id, variant_id, quantity) VALUES (?, ?, ?)')
      .run(otherUserId, selectedVariant, 1).lastInsertRowid);
    const response = await (await loginAsDemo()).patch(`/api/cart/items/${itemId}`).send({ quantity: 2 });

    expect(response.status).toBe(404);
    expect(response.body.error.message).toBe('Cart item not found');
    expect((db.prepare('SELECT quantity FROM cart_items WHERE id = ?').get(itemId) as { quantity: number }).quantity).toBe(1);
  });

  it('does not allow one user to delete another user cart item', async () => {
    const otherUserId = await createUser('cart-owner@example.com', 'owner-password');
    const selectedVariant = variantId(1, 'Full');
    const itemId = Number(db.prepare('INSERT INTO cart_items (user_id, variant_id, quantity) VALUES (?, ?, ?)')
      .run(otherUserId, selectedVariant, 1).lastInsertRowid);
    const response = await (await loginAsDemo()).delete(`/api/cart/items/${itemId}`);

    expect(response.status).toBe(404);
    expect(response.body.error.message).toBe('Cart item not found');
    expect(db.prepare('SELECT 1 FROM cart_items WHERE id = ?').get(itemId)).toBeDefined();
  });

  it('returns the same not-found response for missing and non-owned items', async () => {
    const response = await (await loginAsDemo()).delete('/api/cart/items/999999');
    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: { code: 'NOT_FOUND', message: 'Cart item not found', details: {} },
    });
  });

  it('rejects malformed cart item IDs', async () => {
    const response = await (await loginAsDemo()).delete('/api/cart/items/not-an-id');
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it.each([0, -1, 1.5])('rejects invalid add quantity %s', async (quantity) => {
    const response = await (await loginAsDemo()).post('/api/cart/items').send({ variantId: variantId(1, 'Full'), quantity });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects patch bodies without a quantity or variant', async () => {
    const added = await (await loginAsDemo()).post('/api/cart/items').send({ variantId: variantId(1, 'Full'), quantity: 1 });
    const response = await (await loginAsDemo()).patch(`/api/cart/items/${added.body.cart.items[0].id}`).send({});
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});
