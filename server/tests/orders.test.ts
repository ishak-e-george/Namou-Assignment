import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { app } from '../src/app.js';
import { db } from '../src/db/database.js';
import { ordersRepository } from '../src/modules/orders/orders.repository.js';
import { createUser, loginAsDemo } from './helpers.js';

function variantId(productId: number, label: string): number {
  const row = db.prepare('SELECT id FROM product_variants WHERE product_id = ? AND label = ?')
    .get(productId, label) as { id: number } | undefined;
  if (!row) throw new Error(`Missing test variant ${productId}/${label}`);
  return row.id;
}

function scalar(sql: string, ...values: number[]): number {
  return (db.prepare(sql).get(...values) as { value: number }).value;
}

describe('orders API', () => {
  afterEach(() => vi.restoreAllMocks());

  it('requires authentication to place an order', async () => {
    expect((await request(app).post('/api/orders')).status).toBe(401);
  });

  it('rejects an empty cart with CART_EMPTY', async () => {
    const response = await (await loginAsDemo()).post('/api/orders');
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('CART_EMPTY');
  });

  it('places a single-item order, snapshots it, decrements stock and clears the cart', async () => {
    const agent = await loginAsDemo();
    const variant = variantId(1, 'Full');
    await agent.post('/api/cart/items').send({ variantId: variant, quantity: 2 });

    const response = await agent.post('/api/orders');
    expect(response.status).toBe(201);
    expect(response.body.order).toMatchObject({
      id: expect.any(Number), status: 'placed', totalCents: 4800,
      items: [{ productTitle: 'Premium Bedding Set', variantId: variant, variantLabel: 'Full', unitPriceCents: 2400, quantity: 2, lineTotalCents: 4800 }],
    });
    expect((db.prepare('SELECT stock FROM product_variants WHERE id = ?').get(variant) as { stock: number }).stock).toBe(6);
    expect((await agent.get('/api/cart')).body.cart).toEqual({ items: [], totalQuantity: 0, totalCents: 0 });
    expect(scalar('SELECT COUNT(*) AS value FROM order_items')).toBe(1);
  });

  it('checks out multiple variants with correct integer-cent totals and stock decrements', async () => {
    const agent = await loginAsDemo();
    const small = variantId(1, 'Full');
    const cream = variantId(5, 'Cream');
    await agent.post('/api/cart/items').send({ variantId: small, quantity: 2 });
    await agent.post('/api/cart/items').send({ variantId: cream, quantity: 3 });

    const response = await agent.post('/api/orders');
    expect(response.status).toBe(201);
    expect(response.body.order.totalCents).toBe(11400);
    expect(response.body.order.items).toHaveLength(2);
    expect((db.prepare('SELECT stock FROM product_variants WHERE id = ?').get(small) as { stock: number }).stock).toBe(6);
    expect((db.prepare('SELECT stock FROM product_variants WHERE id = ?').get(cream) as { stock: number }).stock).toBe(7);
  });

  it('checks out a Standard-only product without exposing a variant choice assumption', async () => {
    const agent = await loginAsDemo();
    const standard = variantId(6, 'Standard');
    await agent.post('/api/cart/items').send({ variantId: standard, quantity: 1 });
    const response = await agent.post('/api/orders');
    expect(response.status).toBe(201);
    expect(response.body.order.items[0]).toMatchObject({ variantLabel: 'Standard', unitPriceCents: 7400 });
    expect((db.prepare('SELECT stock FROM product_variants WHERE id = ?').get(standard) as { stock: number }).stock).toBe(3);
  });

  it('rejects stock that changed after adding to cart and preserves stock, order state and cart', async () => {
    const agent = await loginAsDemo();
    const variant = variantId(1, 'Full');
    await agent.post('/api/cart/items').send({ variantId: variant, quantity: 3 });
    db.prepare('UPDATE product_variants SET stock = 2 WHERE id = ?').run(variant);

    const response = await agent.post('/api/orders');
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('OUT_OF_STOCK');
    expect(response.body.error.details.items).toEqual([{ variantId: variant, requested: 3, available: 2 }]);
    expect((db.prepare('SELECT stock FROM product_variants WHERE id = ?').get(variant) as { stock: number }).stock).toBe(2);
    expect(scalar('SELECT COUNT(*) AS value FROM orders')).toBe(0);
    expect((await agent.get('/api/cart')).body.cart.items[0].quantity).toBe(3);
  });

  it('uses the current database price at checkout instead of a client-provided price', async () => {
    const agent = await loginAsDemo();
    const variant = variantId(1, 'Full');
    await agent.post('/api/cart/items').send({ variantId: variant, quantity: 2 });
    db.prepare('UPDATE products SET price_cents = 2751 WHERE id = 1').run();
    const response = await agent.post('/api/orders').send({ priceCents: 1, totalCents: 1 });

    expect(response.status).toBe(201);
    expect(response.body.order.totalCents).toBe(5502);
    expect(response.body.order.items[0].unitPriceCents).toBe(2751);
  });

  it('rolls back stock, order and cart changes when snapshot insertion fails', async () => {
    const agent = await loginAsDemo();
    const variant = variantId(1, 'Full');
    await agent.post('/api/cart/items').send({ variantId: variant, quantity: 2 });
    const originalStock = (db.prepare('SELECT stock FROM product_variants WHERE id = ?').get(variant) as { stock: number }).stock;
    vi.spyOn(ordersRepository, 'insertOrderItems').mockImplementation(() => { throw new Error('simulated snapshot write failure'); });

    const response = await agent.post('/api/orders');
    expect(response.status).toBe(500);
    expect((db.prepare('SELECT stock FROM product_variants WHERE id = ?').get(variant) as { stock: number }).stock).toBe(originalStock);
    expect(scalar('SELECT COUNT(*) AS value FROM orders')).toBe(0);
    expect(scalar('SELECT COUNT(*) AS value FROM order_items')).toBe(0);
    expect((await agent.get('/api/cart')).body.cart.items[0].quantity).toBe(2);
  });

  it('serializes simultaneous checkouts so only one order can use the cart', async () => {
    const agent = await loginAsDemo();
    const variant = variantId(1, 'Full');
    await agent.post('/api/cart/items').send({ variantId: variant, quantity: 2 });

    const responses = await Promise.all([agent.post('/api/orders'), agent.post('/api/orders')]);
    expect(responses.map((response) => response.status).sort()).toEqual([201, 400]);
    const failed = responses.find((response) => response.status === 400);
    expect(failed?.body.error.code).toBe('CART_EMPTY');
    expect(scalar('SELECT COUNT(*) AS value FROM orders')).toBe(1);
    expect((db.prepare('SELECT stock FROM product_variants WHERE id = ?').get(variant) as { stock: number }).stock).toBe(6);
    expect((await agent.get('/api/cart')).body.cart.items).toHaveLength(0);
  });

  it('requires authentication to read an order', async () => {
    expect((await request(app).get('/api/orders/1')).status).toBe(401);
  });

  it('allows the order owner to retrieve the confirmation data', async () => {
    const agent = await loginAsDemo();
    await agent.post('/api/cart/items').send({ variantId: variantId(1, 'Full'), quantity: 1 });
    const placed = await agent.post('/api/orders');
    const fetched = await agent.get(`/api/orders/${placed.body.order.id}`);
    expect(fetched.status).toBe(200);
    expect(fetched.body.order).toEqual(placed.body.order);
  });

  it('returns the same 404 for a missing order and another user order', async () => {
    const ownerId = await createUser('orders-owner@example.com', 'owner-password');
    const orderId = Number(db.prepare('INSERT INTO orders (user_id, total_cents) VALUES (?, ?)').run(ownerId, 123).lastInsertRowid);
    const agent = await loginAsDemo();
    const other = await agent.get(`/api/orders/${orderId}`);
    const missing = await agent.get('/api/orders/999999');
    expect(other.status).toBe(404);
    expect(other.body).toEqual(missing.body);
  });

  it('rejects malformed order IDs with 400', async () => {
    const response = await (await loginAsDemo()).get('/api/orders/not-a-number');
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 404 for a valid but missing order ID', async () => {
    const response = await (await loginAsDemo()).get('/api/orders/999999');
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('ORDER_NOT_FOUND');
  });

  it('keeps the purchase snapshot after product title and price change', async () => {
    const agent = await loginAsDemo();
    await agent.post('/api/cart/items').send({ variantId: variantId(1, 'Full'), quantity: 2 });
    const placed = await agent.post('/api/orders');
    db.prepare('UPDATE products SET title = ?, price_cents = ? WHERE id = 1').run('Renamed Tee', 9999);
    const fetched = await agent.get(`/api/orders/${placed.body.order.id}`);

    expect(fetched.body.order.items[0]).toMatchObject({ productTitle: 'Premium Bedding Set', unitPriceCents: 2400, lineTotalCents: 4800 });
    expect(fetched.body.order.totalCents).toBe(4800);
  });
});
