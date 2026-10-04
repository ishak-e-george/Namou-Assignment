import bcrypt from 'bcrypt';
import type Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from './database.js';

type ProductSeed = {
  title: string;
  description: string;
  priceCents: number;
  variantType: 'Size' | 'Color' | null;
  image: string;
  variants: [string, number, string?][];
};

const products: ProductSeed[] = [
  { title: 'Premium Bedding Set', description: 'A breathable cotton bedding set with a softly textured finish, designed for an inviting and restful bedroom.', priceCents: 2400, variantType: 'Size', image: 'catalog/bedding-detail', variants: [['Twin', 3], ['Full', 8], ['Queen', 12], ['King', 6]] },
  { title: 'Cotton Bathrobe Set', description: 'A relaxed cotton robe with a soft hand feel and an adjustable belt for everyday comfort after bathing.', priceCents: 5600, variantType: 'Size', image: 'catalog/bathrobe', variants: [['S', 5], ['M', 1], ['L', 4]] },
  { title: 'Woven Storage Basket', description: 'A sturdy woven basket for keeping blankets, linens, and everyday essentials neatly close at hand.', priceCents: 3200, variantType: 'Color', image: 'catalog/variants/basket-natural', variants: [['Natural', 9, 'catalog/variants/basket-natural'], ['Olive', 3, 'catalog/variants/basket-olive'], ['Ink', 7, 'catalog/variants/basket-ink']] },
  { title: 'Accent Cushion Cover', description: 'A tactile cushion cover with a subtle woven texture that brings a warm, considered accent to a sofa or bed.', priceCents: 2800, variantType: 'Color', image: 'catalog/variants/cushion-oat', variants: [['Oat', 6, 'catalog/variants/cushion-oat'], ['Rust', 2, 'catalog/variants/cushion-rust'], ['Charcoal', 0, 'catalog/variants/cushion-charcoal']] },
  { title: 'Stoneware Cup Set', description: 'A pair of gently shaped stoneware cups with a smooth glaze, made for slow mornings and relaxed evenings.', priceCents: 2200, variantType: 'Color', image: 'catalog/variants/cups-cream', variants: [['Cream', 10, 'catalog/variants/cups-cream'], ['Blue', 4, 'catalog/variants/cups-blue']] },
  { title: 'Woven Throw Blanket', description: 'A lightweight cotton throw with a subtle woven stripe, suited to a sofa, reading chair, or the foot of a bed.', priceCents: 7400, variantType: null, image: 'catalog/throw', variants: [['Standard', 4]] },
  { title: 'Smart Door Lock', description: 'A streamlined smart lock accessory with a clear keypad and a satin finish for a more considered entryway.', priceCents: 4600, variantType: 'Color', image: 'catalog/variants/lock-satin', variants: [['Satin Nickel', 5, 'catalog/variants/lock-satin'], ['Matte Black', 6, 'catalog/variants/lock-black']] },
  { title: 'Luxury Towel Set', description: 'A soft, absorbent cotton towel set with a substantial feel and a clean, understated edge.', priceCents: 1200, variantType: 'Color', image: 'catalog/variants/towels-ivory', variants: [['Ivory', 8, 'catalog/variants/towels-ivory'], ['Stone', 2, 'catalog/variants/towels-stone']] },
  { title: 'Welcome Mat', description: 'A durable woven entry mat with a simple natural finish to make coming home feel a little warmer.', priceCents: 1800, variantType: null, image: 'catalog/welcome-mat', variants: [['Standard', 7]] },
  { title: 'Linen Table Runner', description: 'A softly textured linen runner that adds an easy layer to everyday meals and relaxed gatherings.', priceCents: 3900, variantType: 'Color', image: 'catalog/variants/runner-sand', variants: [['Sand', 3, 'catalog/variants/runner-sand'], ['Forest', 5, 'catalog/variants/runner-forest']] },
  { title: 'Home Diffuser', description: 'A simple reed diffuser with a calm cedar and citrus scent, designed to bring a gentle note to living spaces.', priceCents: 3400, variantType: null, image: 'catalog/diffuser', variants: [['Standard', 6]] },
  { title: 'Outdoor Lantern', description: 'A portable outdoor lantern with a softly diffused glow for patios, balconies, and quiet evenings outside.', priceCents: 4200, variantType: 'Color', image: 'catalog/variants/lantern-stone', variants: [['Stone', 4, 'catalog/variants/lantern-stone'], ['Navy', 1, 'catalog/variants/lantern-navy']] },
  { title: 'Coffee Table Accessory Set', description: 'A coordinated tabletop set for keeping small living-room essentials together with a warm, natural look.', priceCents: 5200, variantType: null, image: 'catalog/table-accessories', variants: [['Standard', 3]] },
  { title: 'Smart Thermostat', description: 'A clean-lined smart thermostat accessory with a clear display and a quiet palette suited to modern interiors.', priceCents: 6800, variantType: 'Color', image: 'catalog/variants/thermostat-white', variants: [['White', 4, 'catalog/variants/thermostat-white'], ['Slate', 2, 'catalog/variants/thermostat-slate'], ['Oat', 5, 'catalog/variants/thermostat-oat']] },
  { title: 'Glass Bud Vase', description: 'A compact, clear glass bud vase with a gently tapered neck. Each piece has small variations from hand finishing.', priceCents: 2600, variantType: null, image: 'catalog/bud-vase', variants: [['Standard', 5]] },
];

export function seedDemoData(database: Database.Database, passwordHash: string): void {
  database.transaction(() => {
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
    const insertVariant = database.prepare('INSERT INTO product_variants (product_id, label, stock, image_url) VALUES (?, ?, ?, ?)');

    insertUser.run('demo@example.com', passwordHash, 'Demo User');
    for (const product of products) {
      const productId = Number(insertProduct.run(
        product.title,
        product.description,
        product.priceCents,
        product.variantType,
        `/images/${product.image}.webp`,
      ).lastInsertRowid);
      for (const [label, stock, image] of product.variants) {
        insertVariant.run(productId, label, stock, image ? `/images/${image}.webp` : null);
      }
    }
  }).immediate();
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
