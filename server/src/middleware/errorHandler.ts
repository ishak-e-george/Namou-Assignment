import type { ErrorRequestHandler } from 'express';
import { AppError, ValidationError } from '../shared/errors.js';

function getErrorType(error: unknown): unknown {
  return typeof error === 'object' && error !== null && 'type' in error ? error.type : undefined;
}

export const errorHandler: ErrorRequestHandler = (error: unknown, req, res, _next) => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({ error: { code: error.code, message: error.message, details: error.details } });
    return;
  }

  const errorType = getErrorType(error);
  if (errorType === 'entity.parse.failed') {
    const validationError = new ValidationError('Request body is not valid JSON');
    res.status(validationError.statusCode).json({
      error: { code: validationError.code, message: validationError.message, details: validationError.details },
    });
    return;
  }
  if (errorType === 'entity.too.large') {
    res.status(413).json({
      error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large', details: {} },
    });
    return;
  }

  req.log.error({ err: error });
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred', details: {} } });
};
