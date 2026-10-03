import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Header } from '../components/Header.js';
import { AuthProvider } from '../features/auth/AuthProvider.js';
import { LoginPage } from '../features/auth/LoginPage.js';
import { ProtectedRoute } from '../features/auth/ProtectedRoute.js';

const demoUser = { id: 1, email: 'demo@example.com', name: 'Demo User' };

function response(status: number, payload?: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  };
}

function setup(initialEntry: string | { pathname: string; state?: unknown } = '/login') {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const path = String(input);
    if (path === '/api/auth/me') return response(401, { error: { code: 'UNAUTHORIZED', message: 'Authentication required', details: {} } });
    if (path === '/api/auth/login') return response(200, { user: demoUser });
    if (path === '/api/auth/logout') return response(204);
    if (path === '/api/cart') return response(200, { cart: { items: [], totalQuantity: 0, totalCents: 0 } });
    if (path === '/api/wishlist') return response(200, { wishlist: { items: [], totalItems: 0 } });
    throw new Error(`Unexpected request: ${init?.method ?? 'GET'} ${path}`);
  });
  vi.stubGlobal('fetch', fetchMock);

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<><Header /><h1>Home route</h1></>} />
              <Route path="/cart" element={<><Header /><h1>Cart route</h1></>} />
              <Route path="/wishlist" element={<><Header /><h1>Wishlist route</h1></>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
  return { fetchMock };
}

async function login() {
  const user = userEvent.setup();
  await user.type(await screen.findByLabelText('Email'), 'demo@example.com');
  await user.type(screen.getByLabelText('Password'), 'namou-demo-2026');
  await user.click(screen.getByRole('button', { name: 'Sign in' }));
  return user;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('login destination', () => {
  it('sends a direct login to home', async () => {
    setup('/login');
    await login();
    expect(await screen.findByRole('heading', { name: 'Home route' })).toBeInTheDocument();
  });

  it('returns to cart after a protected cart redirect', async () => {
    setup('/cart');
    await login();
    expect(await screen.findByRole('heading', { name: 'Cart route' })).toBeInTheDocument();
  });

  it('returns to wishlist after a protected wishlist redirect', async () => {
    setup('/wishlist');
    await login();
    expect(await screen.findByRole('heading', { name: 'Wishlist route' })).toBeInTheDocument();
  });

  it('ignores stale unmarked redirect state and external return paths', async () => {
    setup({ pathname: '/login', state: { from: { pathname: '/wishlist' } } });
    await login();
    expect(await screen.findByRole('heading', { name: 'Home route' })).toBeInTheDocument();

    cleanup();
    vi.unstubAllGlobals();
    setup({ pathname: '/login', state: { fromProtectedRoute: true, from: { pathname: '//example.com/away' } } });
    await login();
    expect(await screen.findByRole('heading', { name: 'Home route' })).toBeInTheDocument();
  });
});
