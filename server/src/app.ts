import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorHandler.js';
import { authenticate } from './middleware/authenticate.js';
import { notFound } from './middleware/notFound.js';
import { requestLogger } from './middleware/requestLogger.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { productsRouter } from './modules/products/products.routes.js';
import { cartRouter } from './modules/cart/cart.routes.js';
import { wishlistRouter } from './modules/wishlist/wishlist.routes.js';

export const app = express();

app.use(helmet());
app.use(express.json({ limit: '100kb', type: 'application/json' }));
app.use(cookieParser());
app.use(requestLogger);

app.get('/api/health', (_req, res) => res.status(200).json({ status: 'ok' }));
app.use('/api/auth', authRouter);
app.use('/api', authenticate);
app.use('/api/products', productsRouter);
app.use('/api/cart', cartRouter);
app.use('/api/wishlist', wishlistRouter);

app.use(notFound);
app.use(errorHandler);
