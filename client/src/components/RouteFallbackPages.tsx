import { Link, useRouteError } from 'react-router-dom';
import styles from './RouteFallbackPages.module.css';

export function NotFoundPage() {
  return (
    <main className={styles.page}>
      <p className="eyebrow">HOME COLLECTION</p>
      <h1>Page not found</h1>
      <p>We could not find the page you were looking for.</p>
      <Link to="/">Return to the Home Collection</Link>
    </main>
  );
}

export function RouterErrorPage() {
  useRouteError();
  return (
    <main className={styles.page} role="alert">
      <p className="eyebrow">HOME COLLECTION</p>
      <h1>Something went wrong</h1>
      <p>Please reload the page and try again.</p>
      <button type="button" onClick={() => window.location.reload()}>Reload</button>
    </main>
  );
}
