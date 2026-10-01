import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { HttpError } from './api/http.js';
import { AuthProvider } from './features/auth/AuthProvider.js';
import { router } from './router.js';

const authMeKey = ['auth', 'me'] as const;
let queryClient: QueryClient;

function clearSessionOnUnauthorized(error: unknown) {
  if (!(error instanceof HttpError) || error.status !== 401) return;
  queryClient.clear();
  queryClient.setQueryData(authMeKey, { user: null });
}

queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (query.queryKey[0] === 'auth') return;
      clearSessionOnUnauthorized(error);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      const key = mutation.options.mutationKey;
      if (key?.[0] === 'auth' && key[1] === 'login') return;
      clearSessionOnUnauthorized(error);
    },
  }),
  defaultOptions: { queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false } },
});

export function App() {
  return <QueryClientProvider client={queryClient}>
    <AuthProvider><RouterProvider router={router} /></AuthProvider>
  </QueryClientProvider>;
}
