import { db } from '../../db/database.js';
import type { Product } from '../products/products.repository.js';

type WishlistRow = {
  product_id: number;
  title: string;
  price_cents: number;
  image_url: string;
  variant_type: 'Size' | 'Color' | null;
  variant_id: number;
  variant_label: string;
  stock: number;
};

export type WishlistProduct = Omit<Product, 'description'>;
export type Wishlist = { items: WishlistProduct[]; totalItems: number };

const listStatement = db.prepare(`
  SELECT p.id AS product_id, p.title, p.price_cents, p.image_url, p.variant_type,
         v.id AS variant_id, v.label AS variant_label, v.stock
  FROM wishlist_items w
  JOIN products p ON p.id = w.product_id
  JOIN product_variants v ON v.product_id = p.id
  WHERE w.user_id = ?
  ORDER BY p.id ASC, v.id ASC
`);
const addStatement = db.prepare('INSERT OR IGNORE INTO wishlist_items (user_id, product_id) VALUES (?, ?)');
const removeStatement = db.prepare('DELETE FROM wishlist_items WHERE user_id = ? AND product_id = ?');

export const wishlistRepository = {
  list(userId: number): Wishlist {
    const rows = listStatement.all(userId) as WishlistRow[];
    const products = new Map<number, WishlistProduct>();
    for (const row of rows) {
      let product = products.get(row.product_id);
      if (!product) {
        product = {
          id: row.product_id,
          title: row.title,
          priceCents: row.price_cents,
          imageUrl: row.image_url,
          variantType: row.variant_type,
          variants: [],
        };
        products.set(product.id, product);
      }
      product.variants.push({ id: row.variant_id, label: row.variant_label, stock: row.stock });
    }
    const items = [...products.values()];
    return { items, totalItems: items.length };
  },

  add(userId: number, productId: number): void {
    addStatement.run(userId, productId);
  },

  remove(userId: number, productId: number): void {
    removeStatement.run(userId, productId);
  },
};
