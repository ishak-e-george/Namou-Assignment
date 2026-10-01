import request from 'supertest';
import jwt from 'jsonwebtoken';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { env } from '../src/config/env.js';
import { loginRateLimit } from '../src/middleware/rateLimit.js';
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
    expect(cookieText).toMatch(/path=\//i);
    expect(cookieText).toMatch(/max-age=28800/i);
    expect(cookieText).not.toMatch(/;\s*secure(?:;|$)/i);
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
    const tamperedCookie = await request(app).get('/api/auth/me').set('Cookie', `session=${jwt.sign({ sub: '1' }, 'wrong-secret', { algorithm: 'HS256' })}`);
    const expiredCookie = await request(app).get('/api/auth/me').set('Cookie', `session=${jwt.sign({ sub: '1' }, env.JWT_SECRET, { algorithm: 'HS256', expiresIn: -1 })}`);
    const missingUserCookie = await request(app).get('/api/auth/me').set('Cookie', `session=${jwt.sign({ sub: '999999' }, env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '8h' })}`);

    expect(anonymousMe.status).toBe(401);
    expect(anonymousMe.body.error.code).toBe('UNAUTHORIZED');
    expect(anonymousCart.status).toBe(401);
    expect(anonymousCart.body.error.code).toBe('UNAUTHORIZED');
    expect(invalidCookie.status).toBe(401);
    for (const response of [anonymousMe, anonymousCart, invalidCookie, tamperedCookie, expiredCookie, missingUserCookie]) {
      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: { code: 'UNAUTHORIZED', message: 'Authentication required', details: {} } });
    }
  });

  it('returns the signed-in user and clears the session on logout', async () => {
    const agent = await loginAsDemo();
    const me = await agent.get('/api/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.user).toEqual({ id: 1, email: 'demo@example.com', name: 'Demo User' });

    const logout = await agent.post('/api/auth/logout');
    expect(logout.status).toBe(204);
    const clearedCookies = logout.headers['set-cookie'];
    const clearedCookieText = Array.isArray(clearedCookies) ? clearedCookies.join(';') : clearedCookies ?? '';
    expect(clearedCookieText).toMatch(/session=;/i);
    expect(clearedCookieText).toMatch(/expires=thu, 01 jan 1970/i);
    expect(clearedCookieText).toMatch(/httponly/i);
    expect(clearedCookieText).toMatch(/samesite=lax/i);
    expect(clearedCookieText).toMatch(/path=\//i);
    const afterLogout = await agent.get('/api/auth/me');
    expect(afterLogout.status).toBe(401);
  });

  it('rate limits repeated failed login attempts with the standard error shape', async () => {
    loginRateLimit.resetKey('127.0.0.1');
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const response = await request(app).post('/api/auth/login').send({ email: 'demo@example.com', password: 'incorrect' });
      expect(response.status).toBe(401);
    }

    const limited = await request(app).post('/api/auth/login').send({ email: 'demo@example.com', password: 'incorrect' });
    expect(limited.status).toBe(429);
    expect(limited.body).toEqual({
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many login attempts. Try again in a few minutes.',
        details: {},
      },
    });
  });
});
