import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { db } from '../src/db/database.js';
import { app } from '../src/app.js';
import { createUser, loginAsDemo } from './helpers.js';

describe('wishlist API', () => {
  it('requires authentication to read a wishlist', async () => {
    const response = await request(app).get('/api/wishlist');
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns an empty wishlist for an authenticated user', async () => {
    const response = await (await loginAsDemo()).get('/api/wishlist');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ wishlist: { items: [], totalItems: 0 } });
  });

  it('adds a product and returns its product and variant data', async () => {
    const agent = await loginAsDemo();
    const response = await agent.post('/api/wishlist').send({ productId: 1 });
    expect(response.status).toBe(200);
    expect(response.body.wishlist.totalItems).toBe(1);
    expect(response.body.wishlist.items[0]).toMatchObject({
      id: 1,
      title: 'Everyday Cotton Tee',
      priceCents: 2400,
      imageUrl: '/images/tee.svg',
      variantType: 'Size',
      variants: expect.arrayContaining([expect.objectContaining({ label: 'XS', stock: 3 })]),
    });
  });

  it('adds the same product idempotently without creating a duplicate', async () => {
    const agent = await loginAsDemo();
    expect((await agent.post('/api/wishlist').send({ productId: 1 })).status).toBe(200);
    const second = await agent.post('/api/wishlist').send({ productId: 1 });
    expect(second.status).toBe(200);
    expect(second.body.wishlist.totalItems).toBe(1);
    expect(db.prepare('SELECT COUNT(*) AS count FROM wishlist_items').get()).toEqual({ count: 1 });
  });

  it('rejects an unknown product and leaves the wishlist unchanged', async () => {
    const agent = await loginAsDemo();
    const response = await agent.post('/api/wishlist').send({ productId: 999999 });
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('PRODUCT_NOT_FOUND');
    expect((await agent.get('/api/wishlist')).body.wishlist.totalItems).toBe(0);
  });

  it('returns multiple products in ascending product ID order', async () => {
    const agent = await loginAsDemo();
    await agent.post('/api/wishlist').send({ productId: 3 });
    const response = await agent.post('/api/wishlist').send({ productId: 1 });
    expect(response.body.wishlist.totalItems).toBe(2);
    expect(response.body.wishlist.items.map((product: { id: number }) => product.id)).toEqual([1, 3]);
  });

  it('keeps a Standard-only product non-selectable in its API representation', async () => {
    const agent = await loginAsDemo();
    await agent.post('/api/wishlist').send({ productId: 9 });
    const response = await agent.get('/api/wishlist');
    const keyRing = response.body.wishlist.items[0];
    expect(keyRing).toMatchObject({
      id: 9,
      variantType: null,
      variants: [expect.objectContaining({ label: 'Standard' })],
    });
  });

  it('removes a product and treats repeated removal as idempotent', async () => {
    const agent = await loginAsDemo();
    await agent.post('/api/wishlist').send({ productId: 1 });
    const removed = await agent.delete('/api/wishlist/1');
    expect(removed.status).toBe(200);
    expect(removed.body.wishlist).toEqual({ items: [], totalItems: 0 });
    expect((await agent.delete('/api/wishlist/1')).status).toBe(200);
  });

  it('does not expose another user\'s wishlist', async () => {
    const otherUserId = await createUser('wishlist-owner@example.com', 'owner-password');
    db.prepare('INSERT INTO wishlist_items (user_id, product_id) VALUES (?, ?)').run(otherUserId, 2);
    const response = await (await loginAsDemo()).get('/api/wishlist');
    expect(response.body.wishlist).toEqual({ items: [], totalItems: 0 });
  });

  it('does not allow removing another user\'s wishlist product', async () => {
    const otherUserId = await createUser('wishlist-owner@example.com', 'owner-password');
    db.prepare('INSERT INTO wishlist_items (user_id, product_id) VALUES (?, ?)').run(otherUserId, 2);
    const response = await (await loginAsDemo()).delete('/api/wishlist/2');
    expect(response.status).toBe(200);
    expect(response.body.wishlist.totalItems).toBe(0);
    expect(db.prepare('SELECT COUNT(*) AS count FROM wishlist_items WHERE user_id = ? AND product_id = ?').get(otherUserId, 2)).toEqual({ count: 1 });
  });

  it('validates malformed product IDs in the body and route', async () => {
    const agent = await loginAsDemo();
    const bodyResponse = await agent.post('/api/wishlist').send({ productId: 0 });
    const routeResponse = await agent.delete('/api/wishlist/not-a-number');
    expect(bodyResponse.status).toBe(400);
    expect(bodyResponse.body.error.code).toBe('VALIDATION_ERROR');
    expect(routeResponse.status).toBe(400);
    expect(routeResponse.body.error.code).toBe('VALIDATION_ERROR');
  });
});
