import { db } from '../../db/database.js';

export type CartVariant = { id: number; label: string; stock: number };
export type CartProduct = {
  id: number;
  title: string;
  imageUrl: string;
  priceCents: number;
  variantType: 'Size' | 'Color' | null;
  variants: CartVariant[];
};
export type CartItem = {
  id: number;
  product: CartProduct;
  variant: CartVariant;
  quantity: number;
  lineTotalCents: number;
};
export type Cart = { items: CartItem[]; totalQuantity: number; totalCents: number };

type CartRow = {
  cart_item_id: number;
  quantity: number;
  product_id: number;
  title: string;
  image_url: string;
  price_cents: number;
  variant_type: 'Size' | 'Color' | null;
  variant_id: number;
  variant_label: string;
  stock: number;
  option_id: number;
  option_label: string;
  option_stock: number;
};

type LineRow = CartRow & { product_id: number };

function mapRows(rows: CartRow[]): Cart {
  const itemsById = new Map<number, CartItem>();
  for (const row of rows) {
    let item = itemsById.get(row.cart_item_id);
    if (!item) {
      item = {
        id: row.cart_item_id,
        product: {
          id: row.product_id,
          title: row.title,
          imageUrl: row.image_url,
          priceCents: row.price_cents,
          variantType: row.variant_type,
          variants: [],
        },
        variant: { id: row.variant_id, label: row.variant_label, stock: row.stock },
        quantity: row.quantity,
        lineTotalCents: row.price_cents * row.quantity,
      };
      itemsById.set(row.cart_item_id, item);
    }
    item.product.variants.push({ id: row.option_id, label: row.option_label, stock: row.option_stock });
  }
  const items = [...itemsById.values()];
  return {
    items,
    totalQuantity: items.reduce((total, item) => total + item.quantity, 0),
    totalCents: items.reduce((total, item) => total + item.lineTotalCents, 0),
  };
}

const cartJoin = `
  SELECT ci.id AS cart_item_id, ci.quantity, p.id AS product_id, p.title,
         p.image_url, p.price_cents, p.variant_type,
         v.id AS variant_id, v.label AS variant_label, v.stock,
         option.id AS option_id, option.label AS option_label, option.stock AS option_stock
  FROM cart_items ci
  JOIN product_variants v ON v.id = ci.variant_id
  JOIN products p ON p.id = v.product_id
  JOIN product_variants option ON option.product_id = p.id
`;

const getCartItems = db.prepare(`${cartJoin} WHERE ci.user_id = ? ORDER BY ci.id, option.id`);
const getLine = db.prepare(`${cartJoin} WHERE ci.user_id = ? AND ci.id = ?`);
const getLineByVariant = db.prepare(`${cartJoin} WHERE ci.user_id = ? AND ci.variant_id = ?`);
const getVariant = db.prepare('SELECT id, product_id, stock FROM product_variants WHERE id = ?');
const addLine = db.prepare('INSERT INTO cart_items (user_id, variant_id, quantity) VALUES (?, ?, ?)');
const setQuantity = db.prepare('UPDATE cart_items SET quantity = ?, updated_at = strftime(\'%Y-%m-%dT%H:%M:%fZ\', \'now\') WHERE user_id = ? AND id = ?');
const setVariant = db.prepare('UPDATE cart_items SET variant_id = ?, quantity = ?, updated_at = strftime(\'%Y-%m-%dT%H:%M:%fZ\', \'now\') WHERE user_id = ? AND id = ?');
const removeLine = db.prepare('DELETE FROM cart_items WHERE user_id = ? AND id = ?');

export const cartRepository = {
  getCart(userId: number): Cart {
    return mapRows(getCartItems.all(userId) as CartRow[]);
  },
  findLine(userId: number, itemId: number): LineRow | null {
    return (getLine.get(userId, itemId) as LineRow | undefined) ?? null;
  },
  findLineByVariant(userId: number, variantId: number): LineRow | null {
    return (getLineByVariant.get(userId, variantId) as LineRow | undefined) ?? null;
  },
  findVariant(variantId: number): { id: number; product_id: number; stock: number } | null {
    return (getVariant.get(variantId) as { id: number; product_id: number; stock: number } | undefined) ?? null;
  },
  insertLine(userId: number, variantId: number, quantity: number): void {
    addLine.run(userId, variantId, quantity);
  },
  updateQuantity(userId: number, itemId: number, quantity: number): void {
    setQuantity.run(quantity, userId, itemId);
  },
  updateVariant(userId: number, itemId: number, variantId: number, quantity: number): void {
    setVariant.run(variantId, quantity, userId, itemId);
  },
  deleteLine(userId: number, itemId: number): void {
    removeLine.run(userId, itemId);
  },
};
