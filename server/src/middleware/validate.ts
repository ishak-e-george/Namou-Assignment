import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { ValidationError } from '../shared/errors.js';

export function validate(schemas: { body?: ZodType; params?: ZodType }): RequestHandler {
  return (req, _res, next) => {
    const details: Record<string, unknown> = {};
    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) details.body = result.error.flatten();
      else req.body = result.data;
    }
    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) details.params = result.error.flatten();
      else req.params = result.data;
    }
    if (Object.keys(details).length) return next(new ValidationError(undefined, details));
    next();
  };
}
