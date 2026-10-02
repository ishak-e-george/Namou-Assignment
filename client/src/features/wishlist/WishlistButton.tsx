import { useWishlist, useToggleWishlist } from './useWishlist.js';
import styles from './WishlistButton.module.css';

export function WishlistButton({ productId, productTitle, className, showLabel = false }: {
  productId: number;
  productTitle: string;
  className?: string;
  showLabel?: boolean;
}) {
  const wishlistQuery = useWishlist();
  const mutation = useToggleWishlist();
  const isWishlisted = wishlistQuery.data?.wishlist.items.some((product) => product.id === productId) ?? false;
  const label = `${isWishlisted ? 'Remove' : 'Add'} ${productTitle} ${isWishlisted ? 'from' : 'to'} wishlist`;
  const error = mutation.isError ? 'Wishlist could not be updated. Try again.' : null;

  return (
    <div className={`${styles.wrapper}${className ? ` ${className}` : ''}`}>
      <button
        className={`${styles.button}${isWishlisted ? ` ${styles.selected}` : ''}`}
        type="button"
        aria-label={label}
        aria-pressed={isWishlisted}
        disabled={wishlistQuery.isLoading || wishlistQuery.isError || mutation.isPending}
        title={wishlistQuery.isError ? 'Wishlist unavailable' : label}
        onClick={() => mutation.mutate({ productId, isWishlisted })}
      >
        <svg className={styles.heart} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M20.8 8.7c0 5.2-8.8 10.3-8.8 10.3S3.2 13.9 3.2 8.7A4.7 4.7 0 0 1 12 6.1a4.7 4.7 0 0 1 8.8 2.6Z" />
        </svg>
        {showLabel && <span>{isWishlisted ? 'Saved to Wishlist' : 'Add to Wishlist'}</span>}
        <span className={styles.srOnly}>{mutation.isPending ? 'Updating wishlist' : label}</span>
      </button>
      {error && <span className={styles.error} role="alert">{error}</span>}
    </div>
  );
}
