import type { ProductVariant } from '../../api/products.api.js';
import styles from './VariantSelector.module.css';

export function VariantSelector({ type, variants, selectedId, disabled = false, onSelect }: {
  type: 'Size' | 'Color';
  variants: ProductVariant[];
  selectedId: number;
  disabled?: boolean;
  onSelect: (variantId: number) => void;
}) {
  return (
    <fieldset className={styles.fieldset}>
      <legend>{type}</legend>
      <div className={styles.options}>
        {variants.map((variant) => {
          const unavailable = variant.stock === 0;
          const selected = variant.id === selectedId;
          return (
            <button
              className={`${styles.option}${selected ? ` ${styles.selected}` : ''}`}
              type="button"
              key={variant.id}
              aria-pressed={selected}
              disabled={unavailable || disabled}
              onClick={() => onSelect(variant.id)}
            >
              {variant.label}{unavailable ? ' · Out of stock' : ''}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
