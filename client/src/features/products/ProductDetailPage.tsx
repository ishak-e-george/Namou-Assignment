import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { HttpError } from '../../api/http.js';
import { QuantityStepper } from '../../components/QuantityStepper.js';
import { ErrorMessage } from '../../components/ErrorMessage.js';
import { Spinner } from '../../components/Spinner.js';
import { formatPrice } from '../../lib/formatPrice.js';
import { useAddCartItem, useCart } from '../cart/useCart.js';
import { WishlistButton } from '../wishlist/WishlistButton.js';
import { VariantSelector } from './VariantSelector.js';
import { useProduct } from './useProducts.js';
import styles from './ProductDetailPage.module.css';

export function ProductDetailPage() {
  const { id = '' } = useParams();
  const productQuery = useProduct(id);
  const cartQuery = useCart();
  const addMutation = useAddCartItem();
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addSuccess, setAddSuccess] = useState(false);
  const product = productQuery.data?.product;
  const selectedVariant = product?.variants.find((variant) => variant.id === selectedVariantId)
    ?? product?.variants.find((variant) => variant.stock > 0)
    ?? product?.variants[0];
  const alreadyInCart = selectedVariant
    ? cartQuery.data?.cart.items.find((item) => item.variant.id === selectedVariant.id)?.quantity ?? 0
    : 0;
  const addableQuantity = selectedVariant ? Math.max(selectedVariant.stock - alreadyInCart, 0) : 0;

  useEffect(() => {
    setQuantity((current) => Math.min(current, Math.max(addableQuantity, 1)));
  }, [addableQuantity]);

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

  if (!product) return <Spinner label="Loading product" />;
  const stockMessage = selectedVariant?.stock
    ? `${selectedVariant.stock} left in stock`
    : 'Out of stock';
  const addError = addMutation.error instanceof HttpError && addMutation.error.code === 'OUT_OF_STOCK'
    ? addMutation.error.message
    : addMutation.isError
      ? 'This item could not be added. Please try again.'
      : null;

  async function addSelectedVariant() {
    if (!selectedVariant || addableQuantity < 1 || quantity > addableQuantity) return;
    setAddSuccess(false);
    try {
      await addMutation.mutateAsync({ variantId: selectedVariant.id, quantity });
      setAddSuccess(true);
    } catch {
      setAddSuccess(false);
    }
  }

  return (
    <article className={styles.product}>
      <div className={styles.visualColumn}>
        <div className={styles.imageWrap}>
          <img src={product.imageUrl} alt={product.title} />
        </div>
        <ul className={styles.benefits} aria-label="Collection qualities">
          <li><span aria-hidden="true">✧</span><span><strong>Quality Materials</strong><small>Made for everyday use</small></span></li>
          <li><span aria-hidden="true">⌂</span><span><strong>Thoughtful Design</strong><small>Simple, functional details</small></span></li>
          <li><span aria-hidden="true">◇</span><span><strong>Modern Living</strong><small>For contemporary spaces</small></span></li>
        </ul>
      </div>
      <div className={styles.details}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link to="/">Home</Link><span aria-hidden="true">/</span><Link to="/">Home Collection</Link><span aria-hidden="true">/</span><span aria-current="page">{product.title}</span>
        </nav>
        <p className="eyebrow">HOME COLLECTION</p>
        <h1>{product.title}</h1>
        <p className={styles.price}>{formatPrice(product.priceCents)}</p>
        <p className={styles.description}>{product.description}</p>
        {product.variantType && selectedVariant && (
          <VariantSelector
            type={product.variantType}
            variants={product.variants}
            selectedId={selectedVariant.id}
            onSelect={(variantId) => { setSelectedVariantId(variantId); setQuantity(1); setAddSuccess(false); addMutation.reset(); }}
          />
        )}
        {selectedVariant && (
          <p className={`${styles.stock}${selectedVariant.stock === 0 ? ` ${styles.unavailable}` : ''}`} aria-live="polite">
            {stockMessage}
          </p>
        )}
        {selectedVariant && (
          <div className={styles.actionArea}>
            <div className={styles.quantityField}>
              <span className={styles.quantityLabel}>Quantity</span>
              <QuantityStepper
                label={`quantity for ${product.title}`}
                value={quantity}
                max={Math.max(addableQuantity, 1)}
                disabled={selectedVariant.stock === 0 || addableQuantity === 0 || cartQuery.isLoading || addMutation.isPending}
                onChange={(nextQuantity) => { setQuantity(nextQuantity); setAddSuccess(false); addMutation.reset(); }}
              />
            </div>
            <button
              className={styles.addButton}
              type="button"
              disabled={selectedVariant.stock === 0 || addableQuantity === 0 || quantity > addableQuantity || cartQuery.isLoading || addMutation.isPending}
              onClick={() => void addSelectedVariant()}
            >
              {addMutation.isPending ? 'Adding...' : addableQuantity === 0 ? 'Maximum in cart' : 'Add to Cart'}
            </button>
            <WishlistButton className={styles.wishlistAction} productId={product.id} productTitle={product.title} showLabel />
            {addMutation.isPending && <p className={styles.actionStatus} role="status">Adding item to your cart...</p>}
            {addSuccess && <p className={styles.success} role="status">Added to cart.</p>}
            {addError && <p className={styles.actionError} role="alert">{addError}</p>}
            {addableQuantity > 0 && alreadyInCart > 0 && <p className={styles.available}>You can add {addableQuantity} more.</p>}
          </div>
        )}
      </div>
    </article>
  );
}
