import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { authService } from '../modules/auth/auth.service.js';
import { UnauthorizedError } from '../shared/errors.js';

export const authenticate: RequestHandler = (req, _res, next) => {
  const token: unknown = req.cookies?.session;
  if (typeof token !== 'string') return next(new UnauthorizedError());

  let userId: number;
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
    if (typeof payload === 'string' || typeof payload.sub !== 'string') throw new Error('Invalid subject');
    userId = Number(payload.sub);
    if (!Number.isSafeInteger(userId) || userId < 1) throw new Error('Invalid subject');
  } catch {
    return next(new UnauthorizedError());
  }

  const user = authService.getUserById(userId);
  if (!user) return next(new UnauthorizedError());
  req.user = user;
  next();
};
