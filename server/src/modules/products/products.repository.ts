import { db } from '../../db/database.js';

export type ProductVariant = { id: number; label: string; stock: number; imageUrl?: string };
export type Product = {
  id: number;
  title: string;
  description?: string;
  priceCents: number;
  variantType: 'Size' | 'Color' | null;
  imageUrl: string;
  variants: ProductVariant[];
};

type ProductRow = {
  id: number;
  title: string;
  description: string | null;
  price_cents: number;
  variant_type: 'Size' | 'Color' | null;
  image_url: string;
  variant_id: number | null;
  variant_label: string | null;
  stock: number | null;
  variant_image_url: string | null;
};

function mapRows(rows: ProductRow[]): Product[] {
  const products = new Map<number, Product>();
  for (const row of rows) {
    let product = products.get(row.id);
    if (!product) {
      product = {
        id: row.id,
        title: row.title,
        ...(row.description === null ? {} : { description: row.description }),
        priceCents: row.price_cents,
        variantType: row.variant_type,
        imageUrl: row.image_url,
        variants: [],
      };
      products.set(row.id, product);
    }
    if (row.variant_id !== null && row.variant_label !== null && row.stock !== null) {
      product.variants.push({
        id: row.variant_id,
        label: row.variant_label,
        stock: row.stock,
        ...(row.variant_image_url === null ? {} : { imageUrl: row.variant_image_url }),
      });
    }
  }
  return [...products.values()];
}

const listStatement = db.prepare(`
  SELECT p.id, p.title, NULL AS description, p.price_cents, p.variant_type, p.image_url,
         v.id AS variant_id, v.label AS variant_label, v.stock, v.image_url AS variant_image_url
  FROM products p
  LEFT JOIN product_variants v ON v.product_id = p.id
  ORDER BY p.id, v.id
`);

const detailStatement = db.prepare(`
  SELECT p.id, p.title, p.description, p.price_cents, p.variant_type, p.image_url,
         v.id AS variant_id, v.label AS variant_label, v.stock, v.image_url AS variant_image_url
  FROM products p
  LEFT JOIN product_variants v ON v.product_id = p.id
  WHERE p.id = ?
  ORDER BY p.id, v.id
`);

export const productsRepository = {
  list(): Product[] {
    return mapRows(listStatement.all() as ProductRow[]);
  },
  findById(id: number): Product | null {
    return mapRows(detailStatement.all(id) as ProductRow[])[0] ?? null;
  },
};
