import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import { ScrollToTop } from '../components/ScrollToTop.js';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('ScrollToTop', () => {
  it('scrolls both axes to zero when the pathname changes', async () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    render(
      <MemoryRouter initialEntries={['/catalog']}>
        <Routes>
          <Route element={<ScrollToTop />}>
            <Route path="/catalog" element={<Link to="/products/1">Open product</Link>} />
            <Route path="/products/:id" element={<h1>Product detail</h1>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(scrollTo).toHaveBeenLastCalledWith({ top: 0, left: 0, behavior: 'instant' });
    await userEvent.click(screen.getByRole('link', { name: 'Open product' }));
    expect(await screen.findByRole('heading', { name: 'Product detail' })).toBeInTheDocument();
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 0, left: 0, behavior: 'instant' });
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'instant' });
  });
});
