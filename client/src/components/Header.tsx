import { Link, NavLink } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../features/auth/useAuth.js';
import { useCart } from '../features/cart/useCart.js';
import { useWishlist } from '../features/wishlist/useWishlist.js';

export function Header() {
  const { logout } = useAuth();
  const cartQuery = useCart();
  const wishlistQuery = useWishlist();
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    setPending(true);
    try {
      await logout();
    } finally {
      setPending(false);
      window.location.replace('/login?loggedOut=1');
    }
  }

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" to="/" aria-label="Namou Home Collection">namou<span>.</span></Link>
        <nav aria-label="Main navigation" className="main-nav">
          <NavLink className="nav-home" to="/" aria-label="Home Collection">
            <svg className="header-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-7 9 7v10h-6v-7H9v7H3z" /></svg>
            <span className="nav-desktop">Home Collection</span>
          </NavLink>
          <NavLink className="nav-wishlist" to="/wishlist" aria-label={`Wishlist (${wishlistQuery.data?.wishlist.totalItems ?? 0})`}>
            <svg className="header-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 8.7c0 5.2-8.8 10.3-8.8 10.3S3.2 13.9 3.2 8.7A4.7 4.7 0 0 1 12 6.1a4.7 4.7 0 0 1 8.8 2.6Z" /></svg>
            <span className="nav-desktop">Wishlist <span className="nav-count">{wishlistQuery.data?.wishlist.totalItems ?? 0}</span></span>
            <span className="nav-mobile nav-count">{wishlistQuery.data?.wishlist.totalItems ?? 0}</span>
          </NavLink>
          <NavLink className="nav-cart" to="/cart" aria-label={`Cart (${cartQuery.data?.cart.totalQuantity ?? 0})`}>
            <svg className="header-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 1.9-1.4L21 8H6" /><circle cx="10" cy="20" r="1" /><circle cx="18" cy="20" r="1" /></svg>
            <span className="nav-desktop">Cart ({cartQuery.data?.cart.totalQuantity ?? 0})</span>
            <span className="nav-mobile nav-count">{cartQuery.data?.cart.totalQuantity ?? 0}</span>
          </NavLink>
          <button className="header-logout" type="button" onClick={handleLogout} disabled={pending}>
            {pending ? 'Signing out...' : 'Logout'}
          </button>
        </nav>
      </div>
    </header>
  );
}
