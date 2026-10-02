import styles from './QuantityStepper.module.css';

export function QuantityStepper({ value, min = 1, max, disabled = false, label, onChange }: {
  value: number;
  min?: number;
  max: number;
  disabled?: boolean;
  label: string;
  onChange: (quantity: number) => void;
}) {
  return (
    <div className={styles.stepper} role="group" aria-label={label}>
      <button type="button" aria-label={`Decrease ${label}`} disabled={disabled || value <= min} onClick={() => onChange(value - 1)}>−</button>
      <output aria-live="polite" aria-label={`${label}: ${value}`}>{value}</output>
      <button type="button" aria-label={`Increase ${label}`} disabled={disabled || value >= max} onClick={() => onChange(value + 1)}>+</button>
    </div>
  );
}
