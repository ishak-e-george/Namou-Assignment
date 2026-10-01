import { apiFetch } from './http.js';

export type AuthUser = { id: number; email: string; name: string };

export function login(email: string, password: string): Promise<{ user: AuthUser }> {
  return apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}

export function logout(): Promise<void> {
  return apiFetch('/auth/logout', { method: 'POST' });
}

export function me(): Promise<{ user: AuthUser }> {
  return apiFetch('/auth/me');
}
