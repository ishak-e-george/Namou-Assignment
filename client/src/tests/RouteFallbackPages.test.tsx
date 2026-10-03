import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router-dom';
import { NotFoundPage, RouterErrorPage } from '../components/RouteFallbackPages.js';

afterEach(cleanup);

function createTestRouter(path: string) {
  return createMemoryRouter([{
    element: <Outlet />,
    errorElement: <RouterErrorPage />,
    children: [
      { path: '*', element: <NotFoundPage /> },
      { path: 'broken', element: <ThrowRenderError /> },
    ],
  }], { initialEntries: [path] });
}

function ThrowRenderError(): never {
  throw new Error('internal details should not be displayed');
}

describe('route fallback pages', () => {
  it('shows a friendly not-found page for an unknown URL', async () => {
    render(<RouterProvider router={createTestRouter('/does-not-exist')} />);

    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Return to the Home Collection' })).toHaveAttribute('href', '/');
  });

  it('uses the friendly root error page instead of the router developer screen', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(<RouterProvider router={createTestRouter('/broken')} />);

    expect(await screen.findByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument();
    expect(screen.queryByText(/internal details should not be displayed/)).not.toBeInTheDocument();
    consoleError.mockRestore();
  });
});
