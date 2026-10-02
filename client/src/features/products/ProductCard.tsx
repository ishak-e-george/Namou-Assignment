import { Link } from 'react-router-dom';
import type { Product } from '../../api/products.api.js';
import { formatPrice } from '../../lib/formatPrice.js';
import { WishlistButton } from '../wishlist/WishlistButton.js';
import styles from './ProductCard.module.css';

const swatchColors: Record<string, string> = {
  Natural: '#bba17b', Olive: '#778773', Ink: '#434846', Oat: '#d4c1a6', Rust: '#b96d4e',
  Charcoal: '#424744', Cream: '#ede6d7', Blue: '#70899c', 'Satin Nickel': '#b7b8b4',
  'Matte Black': '#333635', Ivory: '#eee9dd', Stone: '#b9b9b3', Sand: '#d8c4a2',
  Forest: '#61745f', Navy: '#475c72', White: '#eeeee9', Slate: '#858a89',
};

export function ProductCard({ product }: { product: Product }) {
  const visibleVariants = product.variantType
    ? product.variants.slice(0, 3)
    : [];
  const additionalCount = product.variantType
    ? Math.max(0, product.variants.length - visibleVariants.length)
    : 0;

  return (
    <article className={styles.card}>
      <div className={styles.imageArea}>
        <Link className={styles.productLink} to={`/products/${product.id}`} aria-label={`View ${product.title}`}>
        <div className={styles.imageWrap}>
          <img className={styles.image} src={product.imageUrl} alt={product.title} loading="lazy" />
        </div>
        </Link>
        <WishlistButton className={styles.wishlist} productId={product.id} productTitle={product.title} />
      </div>
      <div className={styles.content}>
        <Link className={styles.headingLink} to={`/products/${product.id}`}>
          <div className={styles.heading}>
            <h2>{product.title}</h2>
          </div>
        </Link>
        <Link className={styles.priceLink} to={`/products/${product.id}`}>
          <p className={styles.price}>{formatPrice(product.priceCents)}</p>
        </Link>
          {visibleVariants.length > 0 && (
            <div className={styles.variants} aria-label={`${product.variantType} options`}>
            {visibleVariants.map((variant) => product.variantType === 'Color'
              ? <span className={styles.swatch} role="img" aria-label={variant.label} title={variant.label} style={{ backgroundColor: swatchColors[variant.label] ?? '#b9b9b3' }} key={variant.id} />
              : <span className={styles.chip} key={variant.id}>{variant.label}</span>)}
            {additionalCount > 0 && <span className={styles.more}>+{additionalCount}</span>}
          </div>
        )}
      </div>
    </article>
  );
}
