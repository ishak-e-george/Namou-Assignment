import bcrypt from 'bcrypt';
import type Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, withTransaction } from './database.js';

type ProductSeed = {
  title: string;
  description: string;
  priceCents: number;
  variantType: 'Size' | 'Color' | null;
  image: string;
  variants: [string, number][];
};

const products: ProductSeed[] = [
  { title: 'Everyday Cotton Tee', description: 'A soft, midweight cotton tee made for comfortable everyday wear. Finished with a clean crew neck and a relaxed fit.', priceCents: 2400, variantType: 'Size', image: 'tee', variants: [['XS', 3], ['S', 8], ['M', 12], ['L', 6]] },
  { title: 'Linen Button Shirt', description: 'A breathable linen blend shirt with a natural texture, button front, and an easy shape for warm days.', priceCents: 5600, variantType: 'Size', image: 'shirt', variants: [['S', 5], ['M', 1], ['L', 4]] },
  { title: 'Canvas Weekend Tote', description: 'A sturdy everyday carryall in durable cotton canvas, with reinforced handles and room for daily essentials.', priceCents: 3200, variantType: 'Color', image: 'tote', variants: [['Natural', 9], ['Olive', 3], ['Ink', 7]] },
  { title: 'Ribbed Knit Beanie', description: 'A soft rib-knit beanie with a folded cuff and a comfortable stretch fit for cool-weather layering.', priceCents: 2800, variantType: 'Color', image: 'beanie', variants: [['Oat', 6], ['Rust', 2], ['Charcoal', 0]] },
  { title: 'Ceramic Table Mug', description: 'A hand-finished stoneware mug with a smooth glazed interior and a generous handle. Holds 350 ml.', priceCents: 2200, variantType: 'Color', image: 'mug', variants: [['Cream', 10], ['Blue', 4]] },
  { title: 'Woven Throw Blanket', description: 'A lightweight cotton throw with a subtle woven stripe, suited to a sofa, reading chair, or the foot of a bed.', priceCents: 7400, variantType: null, image: 'throw', variants: [['Standard', 4]] },
  { title: 'Leather Card Wallet', description: 'A slim full-grain leather wallet with four card slots and a central pocket. Designed to age beautifully.', priceCents: 4600, variantType: 'Color', image: 'wallet', variants: [['Tan', 5], ['Black', 6]] },
  { title: 'Everyday Crew Socks', description: 'A cushioned cotton-rich crew sock with a smooth toe seam and a supportive ribbed arch.', priceCents: 1200, variantType: 'Size', image: 'socks', variants: [['S/M', 8], ['L/XL', 2]] },
  { title: 'Brass Key Ring', description: 'A simple solid brass key ring with a spring-loaded clasp and a warm brushed finish.', priceCents: 1800, variantType: null, image: 'keyring', variants: [['Standard', 7]] },
  { title: 'Cotton Apron', description: 'A practical cross-back apron in sturdy cotton twill, with two deep front pockets for kitchen tools.', priceCents: 3900, variantType: 'Color', image: 'apron', variants: [['Sand', 3], ['Forest', 5]] },
  { title: 'Scented Soy Candle', description: 'A clean-burning soy wax candle with notes of cedar, bergamot, and soft amber. Approximate burn time: 40 hours.', priceCents: 3400, variantType: null, image: 'candle', variants: [['Standard', 6]] },
  { title: 'Travel Wash Bag', description: 'A water-resistant cotton canvas wash bag with a brass zip and an easy-wipe lining.', priceCents: 4200, variantType: 'Color', image: 'washbag', variants: [['Stone', 4], ['Navy', 1]] },
  { title: 'Oak Serving Board', description: 'A solid oak serving board with a gently rounded edge and food-safe natural oil finish.', priceCents: 5200, variantType: null, image: 'board', variants: [['Standard', 3]] },
  { title: 'Merino Wool Scarf', description: 'A lightweight merino scarf with a soft hand feel and fine fringe. Warm without feeling bulky.', priceCents: 6800, variantType: 'Color', image: 'scarf', variants: [['Moss', 4], ['Clay', 2], ['Navy', 5]] },
  { title: 'Glass Bud Vase', description: 'A compact, clear glass bud vase with a gently tapered neck. Each piece has small variations from hand finishing.', priceCents: 2600, variantType: null, image: 'vase', variants: [['Standard', 5]] },
];

export function seedDemoData(database: Database.Database, passwordHash: string): void {
  withTransaction(() => {
    database.exec(`
      DELETE FROM order_items;
      DELETE FROM orders;
      DELETE FROM cart_items;
      DELETE FROM wishlist_items;
      DELETE FROM product_variants;
      DELETE FROM products;
      DELETE FROM users;
    `);
    const insertUser = database.prepare('INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)');
    const insertProduct = database.prepare(`INSERT INTO products
      (title, description, price_cents, variant_type, image_url) VALUES (?, ?, ?, ?, ?)`);
    const insertVariant = database.prepare('INSERT INTO product_variants (product_id, label, stock) VALUES (?, ?, ?)');

    insertUser.run('demo@example.com', passwordHash, 'Demo User');
    for (const product of products) {
      const productId = Number(insertProduct.run(
        product.title,
        product.description,
        product.priceCents,
        product.variantType,
        `/images/${product.image}.svg`,
      ).lastInsertRowid);
      for (const [label, stock] of product.variants) insertVariant.run(productId, label, stock);
    }
  });
}

async function seed(): Promise<void> {
  const passwordHash = await bcrypt.hash('namou-demo-2026', 12);
  seedDemoData(db, passwordHash);
  console.info(`Seeded ${products.length} products and the demo user (demo@example.com).`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  seed()
    .catch((error: unknown) => {
      console.error('Seed failed:', error);
      process.exitCode = 1;
    })
    .finally(() => db.close());
}
