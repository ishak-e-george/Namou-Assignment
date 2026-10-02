import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth.js';
import { Spinner } from '../../components/Spinner.js';
import { ErrorMessage } from '../../components/ErrorMessage.js';

export function ProtectedRoute() {
  const { user, isLoading, sessionRestoreError, retrySessionRestore } = useAuth();
  const location = useLocation();

  if (isLoading) return <Spinner label="Loading your account" />;
  if (sessionRestoreError) {
    return <ErrorMessage title="Your session could not be checked" message="Check your connection and try again." onRetry={() => void retrySessionRestore()} />;
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}
