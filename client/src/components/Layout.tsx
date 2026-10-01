import { Outlet } from 'react-router-dom';
import { Header } from './Header.js';

export function Layout() {
  return <><Header /><main className="page-shell"><Outlet /></main></>;
}
