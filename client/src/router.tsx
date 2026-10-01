import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './components/Layout.js';
import { LoginPage } from './features/auth/LoginPage.js';
import { ProtectedRoute } from './features/auth/ProtectedRoute.js';

function Placeholder({ title }: { title: string }) {
  return <section className="placeholder"><p className="eyebrow">NAMOU SHOP</p><h1>{title}</h1><p>This page will be available in the next implementation phase.</p></section>;
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <Layout />,
        children: [
          { index: true, element: <Placeholder title="Thoughtful things for everyday living" /> },
          { path: 'products/:id', element: <Placeholder title="Product details" /> },
          { path: 'cart', element: <Placeholder title="Your cart" /> },
          { path: 'wishlist', element: <Placeholder title="Your wishlist" /> },
          { path: 'checkout', element: <Placeholder title="Checkout" /> },
          { path: 'orders/:id', element: <Placeholder title="Order confirmed" /> },
        ],
      },
    ],
  },
]);
