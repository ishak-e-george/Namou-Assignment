import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { loginRateLimit } from '../../middleware/rateLimit.js';
import { validate } from '../../middleware/validate.js';
import { authController } from './auth.controller.js';
import { loginSchema } from './auth.schema.js';

export const authRouter = Router();

authRouter.post('/login', loginRateLimit, validate({ body: loginSchema }), authController.login);
authRouter.post('/logout', authController.logout);
authRouter.get('/me', authenticate, authController.me);
