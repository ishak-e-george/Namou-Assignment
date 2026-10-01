import { rateLimit } from 'express-rate-limit';
import { env } from '../config/env.js';

export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.LOGIN_RATE_LIMIT,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many login attempts. Try again in a few minutes.',
        details: {},
      },
    });
  },
});
