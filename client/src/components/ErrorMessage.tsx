import styles from './ErrorMessage.module.css';

export function ErrorMessage({ title, message, onRetry }: {
  title: string;
  message: string;
  onRetry: () => void;
}) {
  return (
    <section className={styles.error} role="alert" aria-live="polite">
      <span className={styles.icon} aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M12 3.5 21 20H3l9-16.5Z"/><path d="M12 9v4m0 3.2v.1"/></svg></span>
      <div className={styles.copy}>
        <h1>{title}</h1>
      <p>{message}</p>
      <button type="button" onClick={onRetry}>Try Again</button>
      </div>
    </section>
  );
}
