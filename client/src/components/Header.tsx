import { Link, NavLink } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../features/auth/useAuth.js';

export function Header() {
  const { logout } = useAuth();
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    setPending(true);
    try {
      await logout();
    } finally {
      setPending(false);
    }
  }

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" to="/" aria-label="Namou Shop home">namou<span>.</span></Link>
        <nav aria-label="Main navigation" className="main-nav">
          <NavLink to="/">Shop</NavLink>
          <NavLink to="/wishlist">Wishlist <span className="nav-count">0</span></NavLink>
          <NavLink to="/cart">Cart <span className="nav-count">0</span></NavLink>
          <button className="header-logout" type="button" onClick={handleLogout} disabled={pending}>
            {pending ? 'Signing out...' : 'Logout'}
          </button>
        </nav>
      </div>
    </header>
  );
}
