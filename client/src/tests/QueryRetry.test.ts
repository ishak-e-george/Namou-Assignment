import { describe, expect, it } from 'vitest';
import { HttpError } from '../api/http.js';
import { retryQuery } from '../lib/queryRetry.js';

describe('query retry policy', () => {
  it.each([400, 401, 404, 409])('does not retry HTTP %i', (status) => {
    expect(retryQuery(0, new HttpError(status, 'TEST_ERROR', 'Request failed', {}))).toBe(false);
  });

  it('retries a server failure or network error once only', () => {
    expect(retryQuery(0, new HttpError(503, 'INTERNAL_ERROR', 'Unavailable', {}))).toBe(true);
    expect(retryQuery(1, new HttpError(503, 'INTERNAL_ERROR', 'Unavailable', {}))).toBe(false);
    expect(retryQuery(0, new TypeError('Failed to fetch'))).toBe(true);
    expect(retryQuery(1, new TypeError('Failed to fetch'))).toBe(false);
  });
});
