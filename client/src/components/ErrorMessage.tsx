import styles from './ErrorMessage.module.css';

export function ErrorMessage({ title, message, onRetry }: {
  title: string;
  message: string;
  onRetry: () => void;
}) {
  return (
    <section className={styles.error} role="alert" aria-live="polite">
      <h1>{title}</h1>
      <p>{message}</p>
      <button type="button" onClick={onRetry}>Try again</button>
    </section>
  );
}
