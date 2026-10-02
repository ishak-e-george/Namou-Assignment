import { Link, useParams } from 'react-router-dom';
import { HttpError } from '../../api/http.js';
import { ErrorMessage } from '../../components/ErrorMessage.js';
import { Spinner } from '../../components/Spinner.js';
import { formatPrice } from '../../lib/formatPrice.js';
import { useOrder } from './useCheckout.js';
import styles from './OrderConfirmationPage.module.css';

export function OrderConfirmationPage() {
  const { id = '' } = useParams();
  const orderQuery = useOrder(id);
  if (orderQuery.isLoading) return <Spinner label="Loading order confirmation" />;
  if (orderQuery.isError) {
    const notFound = orderQuery.error instanceof HttpError
      && (orderQuery.error.code === 'ORDER_NOT_FOUND' || orderQuery.error.code === 'VALIDATION_ERROR');
    if (notFound) {
      return <section className={styles.notFound}><p className="eyebrow">ORDER NOT AVAILABLE</p><h1>We could not find that order</h1><p>Check the order link, or browse the catalog to start again.</p><Link to="/">Back to the catalog</Link></section>;
    }
    return <ErrorMessage title="Order confirmation could not load" message="Check your connection and try again." onRetry={() => void orderQuery.refetch()} />;
  }
  if (!orderQuery.data) return <Spinner label="Loading order confirmation" />;

  const { order } = orderQuery.data;
  const date = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(order.createdAt));
  return (
    <section className={styles.page} aria-labelledby="confirmation-title">
      <header className={styles.success}>
        <span className={styles.check} aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="m5 12.5 4.5 4.5L19 7" /></svg></span>
        <p className="eyebrow">ORDER PLACED</p>
        <h1 id="confirmation-title">Order Placed Successfully!</h1>
        <p>Your order has been confirmed. No payment was collected for this demo.</p>
      </header>
      <div className={styles.meta}>
        <div><span>Order number</span><strong>#{order.id}</strong></div>
        <div><span>Status</span><strong>{order.status}</strong></div>
        <div><span>Placed</span><strong>{date}</strong></div>
      </div>
      <div className={styles.layout}>
        <div className={styles.items}>
          <h2>Order items</h2>
          {order.items.map((item, index) => (
            <article className={styles.item} key={`${item.variantId}-${index}`}>
              <div className={styles.itemInfo}>
                <h3>{item.productTitle}</h3>
                {item.variantLabel !== 'Standard' && <p>Variant: {item.variantLabel}</p>}
                <p>{item.quantity} × {formatPrice(item.unitPriceCents)}</p>
              </div>
              <strong>{formatPrice(item.lineTotalCents)}</strong>
            </article>
          ))}
        </div>
        <aside className={styles.summary} aria-label="Order total">
          <h2>Order total</h2>
          <div><span>Total</span><strong>{formatPrice(order.totalCents)}</strong></div>
          <Link to="/">Continue shopping</Link>
        </aside>
      </div>
    </section>
  );
}
