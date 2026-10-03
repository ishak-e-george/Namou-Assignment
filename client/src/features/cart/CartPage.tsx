import { Link } from 'react-router-dom';
import { ErrorMessage } from '../../components/ErrorMessage.js';
import { Spinner } from '../../components/Spinner.js';
import { formatPrice } from '../../lib/formatPrice.js';
import { CartItemRow } from './CartItemRow.js';
import { useCart } from './useCart.js';
import styles from './CartPage.module.css';

export function CartPage() {
  const cartQuery = useCart();
  if (cartQuery.isLoading) return <Spinner label="Loading your cart" />;
  if (cartQuery.isError) {
    return <ErrorMessage title="Your cart could not load" message="Check your connection and try again." onRetry={() => void cartQuery.refetch()} />;
  }
  if (!cartQuery.data) return <Spinner label="Loading your cart" />;

  const cart = cartQuery.data.cart;
  const hasInvalidStock = cart.items.some((item) => item.variant.stock === 0 || item.quantity > item.variant.stock);
  return (
    <section className={styles.page} aria-labelledby="cart-title">
      <header className={styles.heading}>
        <p className="eyebrow">HOME COLLECTION</p>
        <h1 id="cart-title">Your Cart ({cart.totalQuantity})</h1>
        {cart.items.length > 0 && <p>Thoughtful pieces, ready for your space.</p>}
      </header>
      {cart.items.length === 0 ? (
        <div className={styles.empty}>
          <h2>Your cart is empty</h2>
          <p>Discover pieces for your home.</p>
          <Link to="/">Browse Home Collection</Link>
        </div>
      ) : (
        <div className={styles.layout}>
          <div className={styles.items} aria-label="Cart items">
            {cart.items.map((item) => <CartItemRow item={item} key={item.id} />)}
          </div>
          <aside className={styles.summary} aria-label="Cart summary">
            <h2>Cart summary</h2>
            <div className={styles.summaryRow}><span>Subtotal</span><span>{formatPrice(cart.totalCents)}</span></div>
            <div className={`${styles.summaryRow} ${styles.total}`}><span>Total</span><strong>{formatPrice(cart.totalCents)}</strong></div>
            {hasInvalidStock ? (
              <>
                <button className={styles.checkoutLink} type="button" disabled>Proceed to Checkout</button>
                <p className={styles.stockNotice}>Update the highlighted items to continue.</p>
              </>
            ) : <Link className={styles.checkoutLink} to="/checkout">Proceed to Checkout</Link>}
          </aside>
        </div>
      )}
    </section>
  );
}
