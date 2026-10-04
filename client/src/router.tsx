import { createBrowserRouter } from 'react-router-dom';
import { NotFoundPage, RouterErrorPage } from './components/RouteFallbackPages.js';
import { ScrollToTop } from './components/ScrollToTop.js';
import { Layout } from './components/Layout.js';
import { LoginPage } from './features/auth/LoginPage.js';
import { ProtectedRoute } from './features/auth/ProtectedRoute.js';
import { ProductDetailPage } from './features/products/ProductDetailPage.js';
import { ProductListPage } from './features/products/ProductListPage.js';
import { CartPage } from './features/cart/CartPage.js';
import { WishlistPage } from './features/wishlist/WishlistPage.js';
import { CheckoutPage } from './features/checkout/CheckoutPage.js';
import { OrderConfirmationPage } from './features/checkout/OrderConfirmationPage.js';
export const router = createBrowserRouter([
  {
    element: <ScrollToTop />,
    errorElement: <RouterErrorPage />,
    children: [
      { path: '/login', element: <LoginPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: '/',
            element: <Layout />,
            children: [
              { index: true, element: <ProductListPage /> },
              { path: 'products/:id', element: <ProductDetailPage /> },
              { path: 'cart', element: <CartPage /> },
              { path: 'wishlist', element: <WishlistPage /> },
              { path: 'checkout', element: <CheckoutPage /> },
              { path: 'orders/:id', element: <OrderConfirmationPage /> },
            ],
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
