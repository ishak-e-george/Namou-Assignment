import { Link } from 'react-router-dom';
import { ErrorMessage } from '../../components/ErrorMessage.js';
import { Spinner } from '../../components/Spinner.js';
import { ProductCard } from '../products/ProductCard.js';
import { useWishlist } from './useWishlist.js';
import styles from './WishlistPage.module.css';

export function WishlistPage() {
  const wishlistQuery = useWishlist();

  if (wishlistQuery.isLoading) return <Spinner label="Loading wishlist" />;
  if (wishlistQuery.isError) {
    return <ErrorMessage title="Wishlist could not load" message="Check your connection and try again." onRetry={() => void wishlistQuery.refetch()} />;
  }
  if (!wishlistQuery.data) return <Spinner label="Loading wishlist" />;

  const products = wishlistQuery.data.wishlist.items;
  return (
    <section aria-labelledby="wishlist-title">
      <header className={styles.intro}>
        <p className="eyebrow">HOME COLLECTION</p>
        <h1 id="wishlist-title">Your wishlist</h1>
        <p>Saved pieces for your space.</p>
      </header>
      {products.length === 0 ? (
        <div className={styles.empty}>
          <h2>Your wishlist is empty</h2>
          <p>Save pieces you love and find them here whenever you return.</p>
          <Link to="/">Explore Collection</Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {products.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      )}
    </section>
  );
}
