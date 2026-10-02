import { db } from '../../db/database.js';

export type CheckoutLine = {
  cartItemId: number;
  variantId: number;
  quantity: number;
  productTitle: string;
  variantLabel: string;
  priceCents: number;
  stock: number;
};

export type OrderItem = {
  productTitle: string;
  variantId: number;
  variantLabel: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
};

export type Order = {
  id: number;
  status: string;
  totalCents: number;
  createdAt: string;
  items: OrderItem[];
};

type CheckoutRow = {
  cart_item_id: number; variant_id: number; quantity: number;
  product_title: string; variant_label: string; price_cents: number; stock: number;
};

const getCheckoutRows = db.prepare(`
  SELECT ci.id AS cart_item_id, ci.variant_id, ci.quantity,
         p.title AS product_title, v.label AS variant_label, p.price_cents, v.stock
  FROM cart_items ci
  JOIN product_variants v ON v.id = ci.variant_id
  JOIN products p ON p.id = v.product_id
  WHERE ci.user_id = ?
  ORDER BY ci.id
`);
const decrement = db.prepare('UPDATE product_variants SET stock = stock - ? WHERE id = ? AND stock >= ?');
const insertOrder = db.prepare('INSERT INTO orders (user_id, total_cents, status) VALUES (?, ?, \'placed\')');
const insertItem = db.prepare(`
  INSERT INTO order_items (order_id, variant_id, product_title, variant_label, unit_price_cents, quantity)
  VALUES (?, ?, ?, ?, ?, ?)
`);
const clearCart = db.prepare('DELETE FROM cart_items WHERE user_id = ?');
const getOrderHeader = db.prepare(`
  SELECT id, status, total_cents, created_at FROM orders WHERE user_id = ? AND id = ?
`);
const getOrderItems = db.prepare(`
  SELECT product_title, variant_id, variant_label, unit_price_cents, quantity
  FROM order_items WHERE order_id = ? ORDER BY id
`);

export const ordersRepository = {
  getCheckoutLines(userId: number): CheckoutLine[] {
    return (getCheckoutRows.all(userId) as CheckoutRow[]).map((row) => ({
      cartItemId: row.cart_item_id,
      variantId: row.variant_id,
      quantity: row.quantity,
      productTitle: row.product_title,
      variantLabel: row.variant_label,
      priceCents: row.price_cents,
      stock: row.stock,
    }));
  },
  decrementStock(variantId: number, quantity: number): boolean {
    return decrement.run(quantity, variantId, quantity).changes === 1;
  },
  insertOrder(userId: number, totalCents: number): number {
    return Number(insertOrder.run(userId, totalCents).lastInsertRowid);
  },
  insertOrderItems(orderId: number, lines: CheckoutLine[]): void {
    for (const line of lines) {
      insertItem.run(orderId, line.variantId, line.productTitle, line.variantLabel, line.priceCents, line.quantity);
    }
  },
  clearCart(userId: number): void {
    clearCart.run(userId);
  },
  findOwnedOrder(userId: number, orderId: number): Order | null {
    const header = getOrderHeader.get(userId, orderId) as {
      id: number; status: string; total_cents: number; created_at: string;
    } | undefined;
    if (!header) return null;
    const items = (getOrderItems.all(orderId) as {
      product_title: string; variant_id: number; variant_label: string; unit_price_cents: number; quantity: number;
    }[]).map((item) => ({
      productTitle: item.product_title,
      variantId: item.variant_id,
      variantLabel: item.variant_label,
      unitPriceCents: item.unit_price_cents,
      quantity: item.quantity,
      lineTotalCents: item.unit_price_cents * item.quantity,
    }));
    return { id: header.id, status: header.status, totalCents: header.total_cents, createdAt: header.created_at, items };
  },
};
