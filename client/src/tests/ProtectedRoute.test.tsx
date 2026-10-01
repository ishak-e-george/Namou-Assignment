import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../features/auth/AuthProvider.js';
import { LoginPage } from '../features/auth/LoginPage.js';
import { ProtectedRoute } from '../features/auth/ProtectedRoute.js';

function renderCartRoute() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/cart']}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/cart" element={<h1>Protected cart content</h1>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

function mockMe(status: number, payload: unknown) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  }));
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('ProtectedRoute', () => {
  it('redirects an unauthenticated user to the login page', async () => {
    mockMe(401, { error: { code: 'UNAUTHORIZED', message: 'Authentication required', details: {} } });
    renderCartRoute();

    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
  });

  it('renders protected content for an authenticated user', async () => {
    mockMe(200, { user: { id: 1, email: 'demo@example.com', name: 'Demo User' } });
    renderCartRoute();

    expect(await screen.findByRole('heading', { name: 'Protected cart content' })).toBeInTheDocument();
  });
});
