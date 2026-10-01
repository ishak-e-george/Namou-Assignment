import { Link, NavLink } from 'react-router-dom';

export function Header() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" to="/" aria-label="Namou Shop home">namou<span>.</span></Link>
        <nav aria-label="Main navigation" className="main-nav">
          <NavLink to="/">Shop</NavLink>
          <NavLink to="/wishlist">Wishlist <span className="nav-count">0</span></NavLink>
          <NavLink to="/cart">Cart <span className="nav-count">0</span></NavLink>
        </nav>
      </div>
    </header>
  );
}
