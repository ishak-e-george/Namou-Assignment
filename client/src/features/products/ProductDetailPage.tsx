import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { HttpError } from '../../api/http.js';
import { ErrorMessage } from '../../components/ErrorMessage.js';
import { Spinner } from '../../components/Spinner.js';
import { formatPrice } from '../../lib/formatPrice.js';
import { VariantSelector } from './VariantSelector.js';
import { useProduct } from './useProducts.js';
import styles from './ProductDetailPage.module.css';

export function ProductDetailPage() {
  const { id = '' } = useParams();
  const productQuery = useProduct(id);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);

  if (productQuery.isLoading) return <Spinner label="Loading product" />;
  if (productQuery.isError) {
    const isMissing = productQuery.error instanceof HttpError
      && productQuery.error.status === 404
      && productQuery.error.code === 'PRODUCT_NOT_FOUND';
    const isInvalidId = productQuery.error instanceof HttpError
      && productQuery.error.status === 400
      && productQuery.error.code === 'VALIDATION_ERROR';
    if (isMissing || isInvalidId) {
      return (
        <section className={styles.notFound} aria-labelledby="not-found-title">
          <p className="eyebrow">PRODUCT NOT AVAILABLE</p>
          <h1 id="not-found-title">{isMissing ? 'We could not find that product' : 'This product address is invalid'}</h1>
          <p>{isMissing ? 'It may have been removed or the link may be out of date.' : 'Check the link, or browse the catalog to find what you need.'}</p>
          <Link to="/">Back to the catalog</Link>
        </section>
      );
    }
    return <ErrorMessage title="Product could not load" message="Check your connection and try again." onRetry={() => void productQuery.refetch()} />;
  }

  if (!productQuery.data) return <Spinner label="Loading product" />;
  const product = productQuery.data.product;
  const selectedVariant = product.variants.find((variant) => variant.id === selectedVariantId)
    ?? product.variants.find((variant) => variant.stock > 0)
    ?? product.variants[0];
  const stockMessage = selectedVariant?.stock
    ? `${selectedVariant.stock} left in stock`
    : 'Out of stock';

  return (
    <article className={styles.product}>
      <div className={styles.imageWrap}>
        <img src={product.imageUrl} alt={product.title} />
      </div>
      <div className={styles.details}>
        <Link className={styles.back} to="/">← Back to all products</Link>
        <p className="eyebrow">NAMOU SHOP</p>
        <h1>{product.title}</h1>
        <p className={styles.price}>{formatPrice(product.priceCents)}</p>
        <p className={styles.description}>{product.description}</p>
        {product.variantType && selectedVariant && (
          <VariantSelector
            type={product.variantType}
            variants={product.variants}
            selectedId={selectedVariant.id}
            onSelect={setSelectedVariantId}
          />
        )}
        {selectedVariant && (
          <p className={`${styles.stock}${selectedVariant.stock === 0 ? ` ${styles.unavailable}` : ''}`} aria-live="polite">
            {stockMessage}
          </p>
        )}
      </div>
    </article>
  );
}
