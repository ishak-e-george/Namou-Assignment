import { Link } from 'react-router-dom';
import type { Product } from '../../api/products.api.js';
import { formatPrice } from '../../lib/formatPrice.js';
import { WishlistButton } from '../wishlist/WishlistButton.js';
import styles from './ProductCard.module.css';

export function ProductCard({ product }: { product: Product }) {
  const visibleVariants = product.variantType
    ? product.variants.slice(0, 3)
    : [];
  const additionalCount = product.variantType
    ? Math.max(0, product.variants.length - visibleVariants.length)
    : 0;

  return (
    <article className={styles.card}>
      <Link className={styles.productLink} to={`/products/${product.id}`}>
        <div className={styles.imageWrap}>
          <img className={styles.image} src={product.imageUrl} alt={product.title} loading="lazy" />
        </div>
      </Link>
      <div className={styles.content}>
        <Link className={styles.headingLink} to={`/products/${product.id}`}>
          <div className={styles.heading}>
            <h2>{product.title}</h2>
          </div>
        </Link>
        <div className={styles.cardBottom}>
          <Link className={styles.priceLink} to={`/products/${product.id}`}>
            <p className={styles.price}>{formatPrice(product.priceCents)}</p>
          </Link>
          <WishlistButton className={styles.wishlist} productId={product.id} productTitle={product.title} />
        </div>
        {visibleVariants.length > 0 && (
          <div className={styles.variants} aria-label={`${product.variantType} options`}>
            {visibleVariants.map((variant) => <span className={styles.chip} key={variant.id}>{variant.label}</span>)}
            {additionalCount > 0 && <span className={styles.more}>+{additionalCount}</span>}
          </div>
        )}
      </div>
    </article>
  );
}
