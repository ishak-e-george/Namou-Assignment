import type { Request } from 'express';
import { UnauthorizedError } from './errors.js';

export type User = { id: number; email: string; name: string };

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export function requireUser(req: Request): User {
  if (!req.user) throw new UnauthorizedError();
  return req.user;
}
