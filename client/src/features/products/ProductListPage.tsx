import { ErrorMessage } from '../../components/ErrorMessage.js';
import { Spinner } from '../../components/Spinner.js';
import { ProductCard } from './ProductCard.js';
import { useProducts } from './useProducts.js';
import styles from './ProductListPage.module.css';

function ValueIcon({ kind }: { kind: 'home' | 'quality' | 'design' }) {
  const paths = {
    home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-6v-7h-4v7H4a1 1 0 0 1-1-1z"/><path d="M8 8h.01M16 8h.01"/></>,
    quality: <><path d="m12 3 2.2 4.5 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.5 5-.7z"/><path d="m9.5 11.7 1.7 1.7 3.5-3.7"/></>,
    design: <><path d="M4 20h16M6 17V8l6-4 6 4v9M9 17v-5h6v5"/><path d="M12 4v3"/></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">{paths[kind]}</svg>;
}

export function ProductListPage() {
  const productsQuery = useProducts();

  if (productsQuery.isLoading) return <Spinner label="Loading products" />;
  if (productsQuery.isError) {
    return <ErrorMessage title="Products could not load" message="Check your connection and try again." onRetry={() => void productsQuery.refetch()} />;
  }

  if (!productsQuery.data) return <Spinner label="Loading products" />;
  const products = productsQuery.data.products;
  return (
    <section className={styles.page} aria-labelledby="products-title">
      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.heroEyebrow}>NAMOU PROPERTIES</p>
          <h1 id="products-title">Home Collection</h1>
          <p className={styles.heroSubtitle}>Thoughtful essentials for modern living.</p>
          <ul className={styles.values} aria-label="Collection values">
            <li><ValueIcon kind="home" /><span><strong>Modern Living</strong><small>Essentials</small></span></li>
            <li><ValueIcon kind="quality" /><span><strong>Quality</strong><small>Selections</small></span></li>
            <li><ValueIcon kind="design" /><span><strong>Designed</strong><small>for Every Space</small></span></li>
          </ul>
        </div>
        <div className={styles.heroImage}>
          <img src="/images/catalog/living-room-hero.webp" alt="A calm modern living room with a cream sofa, warm wood and greenery" fetchPriority="high" />
        </div>
      </header>
      <div className={styles.collectionHeading}>
        <div><h2>All Products</h2></div>
        <p>{products.length} pieces</p>
      </div>
      {products.length === 0 ? (
        <p className={styles.empty}>No products are available right now.</p>
      ) : (
        <div className={styles.grid}>
          {products.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      )}
    </section>
  );
}
