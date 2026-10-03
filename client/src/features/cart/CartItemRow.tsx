import { useEffect, useRef, useState } from 'react';
import { HttpError } from '../../api/http.js';
import type { CartItem } from '../../api/cart.api.js';
import { QuantityStepper } from '../../components/QuantityStepper.js';
import { formatPrice } from '../../lib/formatPrice.js';
import { VariantSelector } from '../products/VariantSelector.js';
import { useRemoveCartItem, useUpdateCartItem } from './useCart.js';
import { useCart } from './useCart.js';
import styles from './CartItemRow.module.css';

function mutationError(error: unknown, fallback: string): string {
  return error instanceof HttpError && error.code === 'OUT_OF_STOCK'
    ? error.message
    : fallback;
}

export function CartItemRow({ item }: { item: CartItem }) {
  const cartQuery = useCart();
  const updateMutation = useUpdateCartItem();
  const removeMutation = useRemoveCartItem();
  const [removeError, setRemoveError] = useState<string | null>(null);
  const previousCartUpdate = useRef(cartQuery.dataUpdatedAt);
  const busy = updateMutation.isPending || removeMutation.isPending;
  const invalidStock = item.variant.stock === 0 || item.quantity > item.variant.stock;

  useEffect(() => {
    if (previousCartUpdate.current !== cartQuery.dataUpdatedAt) {
      previousCartUpdate.current = cartQuery.dataUpdatedAt;
      if (updateMutation.error instanceof HttpError && updateMutation.error.code === 'OUT_OF_STOCK') {
        updateMutation.reset();
      }
    }
  }, [cartQuery.dataUpdatedAt, updateMutation]);

  async function removeItem() {
    setRemoveError(null);
    try {
      await removeMutation.mutateAsync(item.id);
    } catch {
      setRemoveError('This item could not be removed. Please try again.');
    }
  }

  return (
    <article className={`${styles.item}${invalidStock ? ` ${styles.invalidStock}` : ''}`}>
      <img className={styles.image} src={item.product.imageUrl} alt={item.product.title} />
      <div className={styles.info}>
        <h2>{item.product.title}</h2>
        {item.product.variantType && <p className={styles.variant}>{item.product.variantType}: {item.variant.label}</p>}
        <p className={styles.unitPrice}>{formatPrice(item.product.priceCents)} each</p>
        {item.quantity > item.variant.stock && item.variant.stock > 0 && (
          <p className={styles.stockError}>Only {item.variant.stock} left in stock. Reduce the quantity to continue.</p>
        )}
        {item.variant.stock === 0 && <p className={styles.stockError}>Out of stock. Remove this item or switch to an available variant.</p>}
      </div>
      <div className={styles.controls}>
        {item.product.variantType && (
          <VariantSelector
            type={item.product.variantType}
            variants={item.product.variants}
            selectedId={item.variant.id}
            disabled={busy}
            onSelect={(variantId) => updateMutation.mutate({ itemId: item.id, changes: { variantId } })}
          />
        )}
        <div className={styles.adjustments}>
          <div>
            <span className={styles.controlLabel}>Quantity</span>
            <QuantityStepper
              label={`quantity for ${item.product.title}`}
              value={item.quantity}
              max={item.variant.stock}
              disabled={busy || item.variant.stock === 0}
              onChange={(quantity) => updateMutation.mutate({ itemId: item.id, changes: { quantity: item.quantity > item.variant.stock && item.variant.stock > 0 ? item.variant.stock : quantity } })}
            />
          </div>
          <div className={styles.subtotal}>
            <span className={styles.controlLabel}>Subtotal</span>
            <strong>{formatPrice(item.lineTotalCents)}</strong>
          </div>
          <button className={styles.remove} type="button" aria-label={`Remove ${item.product.title} from cart`} onClick={() => void removeItem()} disabled={busy}>
            {removeMutation.isPending ? 'Removing...' : 'Remove'}
          </button>
        </div>
        {updateMutation.isPending && <p className={styles.pending} role="status">Saving changes...</p>}
        {updateMutation.isError && <p className={styles.stockError} role="alert">{mutationError(updateMutation.error, 'This change could not be saved. Please try again.')}</p>}
        {removeError && <p className={styles.stockError} role="alert">{removeError}</p>}
      </div>
    </article>
  );
}
