import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import { requestLogger } from './middleware/requestLogger.js';

export const app = express();

app.use(helmet());
app.use(express.json({ limit: '100kb', type: 'application/json' }));
app.use(cookieParser());
app.use(requestLogger);

app.get('/api/health', (_req, res) => res.status(200).json({ status: 'ok' }));

app.use(notFound);
app.use(errorHandler);
