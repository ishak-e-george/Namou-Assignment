import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
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
  it('treats a 401 during session restoration as unauthenticated and redirects to login', async () => {
    mockMe(401, { error: { code: 'UNAUTHORIZED', message: 'Authentication required', details: {} } });
    renderCartRoute();

    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
  });

  it('shows a retryable session error for a server failure without redirecting to login', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({ error: { code: 'INTERNAL_ERROR', message: 'Unavailable', details: {} } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ user: { id: 1, email: 'demo@example.com', name: 'Demo User' } }),
      });
    vi.stubGlobal('fetch', fetchMock);
    renderCartRoute();

    expect(await screen.findByRole('heading', { name: 'Your session could not be checked' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Welcome back' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Protected cart content' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));

    expect(await screen.findByRole('heading', { name: 'Protected cart content' })).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });

  it('renders protected content for an authenticated user', async () => {
    mockMe(200, { user: { id: 1, email: 'demo@example.com', name: 'Demo User' } });
    renderCartRoute();

    expect(await screen.findByRole('heading', { name: 'Protected cart content' })).toBeInTheDocument();
  });
});
