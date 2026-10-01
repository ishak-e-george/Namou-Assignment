import type { CookieOptions, RequestHandler } from 'express';
import { env } from '../../config/env.js';
import { requireUser } from '../../shared/types.js';
import { authService } from './auth.service.js';

const sessionDurationMs = 8 * 60 * 60 * 1000;

export const sessionCookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: env.NODE_ENV === 'production',
  path: '/',
  maxAge: sessionDurationMs,
};

export const authController = {
  login: (async (req, res) => {
    const { email, password } = req.body as { email: string; password: string };
    const { user, token } = await authService.login(email, password);
    res.cookie('session', token, sessionCookieOptions).status(200).json({ user });
  }) satisfies RequestHandler,

  logout: ((_req, res) => {
    const { maxAge, ...clearOptions } = sessionCookieOptions;
    void maxAge;
    res.clearCookie('session', clearOptions).status(204).end();
  }) satisfies RequestHandler,

  me: ((req, res) => {
    res.status(200).json({ user: requireUser(req) });
  }) satisfies RequestHandler,
};
