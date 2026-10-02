import { useWishlist, useToggleWishlist } from './useWishlist.js';
import styles from './WishlistButton.module.css';

export function WishlistButton({ productId, productTitle, className }: {
  productId: number;
  productTitle: string;
  className?: string;
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
        <span aria-hidden="true">{isWishlisted ? '♥' : '♡'}</span>
        <span className={styles.srOnly}>{mutation.isPending ? 'Updating wishlist' : label}</span>
      </button>
      {error && <span className={styles.error} role="alert">{error}</span>}
    </div>
  );
}
