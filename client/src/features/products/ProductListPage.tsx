import { ErrorMessage } from '../../components/ErrorMessage.js';
import { Spinner } from '../../components/Spinner.js';
import { ProductCard } from './ProductCard.js';
import { useProducts } from './useProducts.js';
import styles from './ProductListPage.module.css';

export function ProductListPage() {
  const productsQuery = useProducts();

  if (productsQuery.isLoading) return <Spinner label="Loading products" />;
  if (productsQuery.isError) {
    return <ErrorMessage title="Products could not load" message="Check your connection and try again." onRetry={() => void productsQuery.refetch()} />;
  }

  if (!productsQuery.data) return <Spinner label="Loading products" />;
  const products = productsQuery.data.products;
  return (
    <section aria-labelledby="products-title">
      <header className={styles.intro}>
        <p className="eyebrow">NAMOU SHOP</p>
        <h1 id="products-title">Thoughtful things for everyday living</h1>
        <p>Everyday pieces, made to be used and enjoyed.</p>
      </header>
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
