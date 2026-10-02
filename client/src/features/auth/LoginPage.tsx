import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { HttpError } from '../../api/http.js';
import { Spinner } from '../../components/Spinner.js';
import { ErrorMessage } from '../../components/ErrorMessage.js';
import { useAuth } from './useAuth.js';
import styles from './LoginPage.module.css';

function returnPath(state: unknown): string {
  if (!state || typeof state !== 'object' || !('from' in state)) return '/';
  const from = state.from;
  if (!from || typeof from !== 'object' || !('pathname' in from)) return '/';
  const pathname = from.pathname;
  return typeof pathname === 'string' && pathname.startsWith('/') && !pathname.startsWith('//')
    ? pathname
    : '/';
}

function errorMessage(error: unknown): string {
  if (!(error instanceof HttpError)) return 'Something went wrong. Please try again.';
  switch (error.code) {
    case 'INVALID_CREDENTIALS': return 'Email or password is incorrect.';
    case 'RATE_LIMITED': return 'Too many attempts. Try again in a few minutes.';
    case 'VALIDATION_ERROR': return 'Enter a valid email and password.';
    default: return 'Something went wrong. Please try again.';
  }
}

export function LoginPage() {
  const { user, isLoading, sessionRestoreError, retrySessionRestore, login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const destination = returnPath(location.state);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>(null);

  if (isLoading) return <Spinner label="Loading your account" />;
  if (sessionRestoreError) {
    return <ErrorMessage title="Your session could not be checked" message="Check your connection and try again." onRetry={() => void retrySessionRestore()} />;
  }
  if (user) return <Navigate to={destination} replace />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await login(email, password);
      navigate(destination, { replace: true });
    } catch (submitError) {
      setError(submitError);
    } finally {
      setPending(false);
    }
  }

  return (
    <main className={styles.page}>
      <aside className={styles.visual} aria-label="Namou Home Collection">
        <img src="/images/catalog/living-room-hero.webp" alt="" />
        <div className={styles.visualCopy}>
          <p className={styles.brand}>namou<span>.</span></p>
          <p className={styles.visualEyebrow}>NAMOU PROPERTIES</p>
          <h2>Home Collection</h2>
          <p>Thoughtful essentials for modern living.</p>
        </div>
      </aside>
      <section className={styles.card} aria-labelledby="login-title">
        <p className={styles.eyebrow}>HOME COLLECTION</p>
        <h1 id="login-title">Welcome back</h1>
        <p className={styles.intro}>Sign in to continue to the collection.</p>
        <form onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          <button className={styles.submit} type="submit" disabled={pending}>
            {pending ? 'Signing in...' : 'Sign in'}
          </button>
          {error !== null && <p className={styles.error} role="alert">{errorMessage(error)}</p>}
        </form>
        <p className={styles.demo}>Demo login: <strong>demo@example.com</strong> / <strong>namou-demo-2026</strong></p>
      </section>
    </main>
  );
}
