import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { loginAsDemo } from './helpers.js';

describe('authentication', () => {
  it('logs in and sets an HTTP-only same-site session cookie', async () => {
    const response = await request(app).post('/api/auth/login').send({
      email: 'demo@example.com',
      password: 'namou-demo-2026',
    });

    expect(response.status).toBe(200);
    expect(response.body.user).toEqual({ id: 1, email: 'demo@example.com', name: 'Demo User' });
    expect(response.body.user).not.toHaveProperty('passwordHash');
    const cookies = response.headers['set-cookie'];
    const cookieText = Array.isArray(cookies) ? cookies.join(';') : cookies ?? '';
    expect(cookieText).toMatch(/session=/i);
    expect(cookieText).toMatch(/httponly/i);
    expect(cookieText).toMatch(/samesite=lax/i);
  });

  it('returns the same credential error for a wrong password and unknown email', async () => {
    const wrongPassword = await request(app).post('/api/auth/login').send({
      email: 'demo@example.com', password: 'incorrect',
    });
    const unknownEmail = await request(app).post('/api/auth/login').send({
      email: 'nobody@example.com', password: 'incorrect',
    });

    expect(wrongPassword.status).toBe(401);
    expect(wrongPassword.body.error.code).toBe('INVALID_CREDENTIALS');
    expect(wrongPassword.body.error.message).toBe('Email or password is incorrect');
    expect(unknownEmail.status).toBe(401);
    expect(unknownEmail.body.error.code).toBe('INVALID_CREDENTIALS');
    expect(unknownEmail.body.error.message).toBe(wrongPassword.body.error.message);
  });

  it.each([
    [{ email: 'demo@example.com' }],
    [{ email: 'not-an-email', password: 'x' }],
  ])('rejects an invalid login body', async (body) => {
    const response = await request(app).post('/api/auth/login').send(body);
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('requires a valid cookie for /me and protected routes', async () => {
    const anonymousMe = await request(app).get('/api/auth/me');
    const anonymousCart = await request(app).get('/api/cart');
    const invalidCookie = await request(app).get('/api/auth/me').set('Cookie', 'session=not-a-token');

    expect(anonymousMe.status).toBe(401);
    expect(anonymousMe.body.error.code).toBe('UNAUTHORIZED');
    expect(anonymousCart.status).toBe(401);
    expect(anonymousCart.body.error.code).toBe('UNAUTHORIZED');
    expect(invalidCookie.status).toBe(401);
    expect(invalidCookie.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns the signed-in user and clears the session on logout', async () => {
    const agent = await loginAsDemo();
    const me = await agent.get('/api/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.user).toEqual({ id: 1, email: 'demo@example.com', name: 'Demo User' });

    const logout = await agent.post('/api/auth/logout');
    expect(logout.status).toBe(204);
    const afterLogout = await agent.get('/api/auth/me');
    expect(afterLogout.status).toBe(401);
  });
});
