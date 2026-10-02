import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HttpError } from '../../api/http.js';
import { ErrorMessage } from '../../components/ErrorMessage.js';
import { Spinner } from '../../components/Spinner.js';
import { formatPrice } from '../../lib/formatPrice.js';
import { useCart } from '../cart/useCart.js';
import { usePlaceOrder } from './useCheckout.js';
import styles from './CheckoutPage.module.css';

export function CheckoutPage() {
  const cartQuery = useCart();
  const placeMutation = usePlaceOrder();
  const navigate = useNavigate();
  const [unexpectedError, setUnexpectedError] = useState(false);

  if (cartQuery.isLoading) return <Spinner label="Loading checkout review" />;
  if (cartQuery.isError) {
    return <ErrorMessage title="Checkout could not load" message="Check your connection and try again." onRetry={() => void cartQuery.refetch()} />;
  }
  if (!cartQuery.data) return <Spinner label="Loading checkout review" />;

  const cart = cartQuery.data.cart;
  const stockChanged = placeMutation.error instanceof HttpError && placeMutation.error.code === 'OUT_OF_STOCK';

  async function submitOrder() {
    if (placeMutation.isPending || cart.items.length === 0) return;
    setUnexpectedError(false);
    try {
      const response = await placeMutation.mutateAsync();
      navigate(`/orders/${response.order.id}`);
    } catch (error) {
      if (!(error instanceof HttpError && error.code === 'OUT_OF_STOCK')) {
        setUnexpectedError(true);
      }
    }
  }

  return (
    <section className={styles.page} aria-labelledby="checkout-title">
      <header className={styles.heading}>
        <p className="eyebrow">HOME COLLECTION</p>
        <h1 id="checkout-title">Checkout</h1>
        <p>Confirm the items and total before placing your order.</p>
      </header>
      {cart.items.length === 0 ? (
        <div className={styles.empty}>
          <h2>Your cart is empty</h2>
          <p>Add a piece from the collection before checking out.</p>
          <Link to="/cart">Return to cart</Link>
        </div>
      ) : (
        <div className={styles.layout}>
          <div className={styles.items} aria-label="Items for this order">
            <h2>Items ({cart.totalQuantity})</h2>
            {cart.items.map((item) => (
              <article className={styles.item} key={item.id}>
                <img src={item.product.imageUrl} alt={item.product.title} />
                <div className={styles.itemInfo}>
                  <h3>{item.product.title}</h3>
                  {item.product.variantType && <p>{item.product.variantType}: {item.variant.label}</p>}
                  <p>{item.quantity} × {formatPrice(item.product.priceCents)}</p>
                </div>
                <strong className={styles.lineTotal}>{formatPrice(item.lineTotalCents)}</strong>
              </article>
            ))}
          </div>
          <aside className={styles.summary} aria-label="Order total">
            <h2>Order summary</h2>
            <div><span>Subtotal</span><span>{formatPrice(cart.totalCents)}</span></div>
            <div className={styles.total}><span>Total</span><strong>{formatPrice(cart.totalCents)}</strong></div>
            {stockChanged && <p className={styles.stockError} role="alert">Stock changed before checkout. Please review your cart.</p>}
            {unexpectedError && <p className={styles.stockError} role="alert">We could not place your order. Please try again.</p>}
            <button type="button" className={styles.placeButton} onClick={() => void submitOrder()} disabled={placeMutation.isPending}>
              {placeMutation.isPending ? 'Placing order…' : 'Place Order'}
            </button>
            {placeMutation.isPending && <p className={styles.pending} role="status">Submitting your order securely…</p>}
            <p className={styles.demoNote}>No payment will be processed for this demo.</p>
            <Link className={styles.backToCart} to="/cart">Return to cart</Link>
          </aside>
        </div>
      )}
    </section>
  );
}
