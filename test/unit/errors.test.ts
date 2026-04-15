import { describe, it, expect } from 'vitest';
import { AppError } from '../../src/http/errors.js';

describe('AppError', () => {
  it('carries status, code, and message', () => {
    const err = new AppError({ status: 422, code: 'INVALID', message: 'bad', details: [1] });
    expect(err).toBeInstanceOf(Error);
    expect(err.status).toBe(422);
    expect(err.code).toBe('INVALID');
    expect(err.message).toBe('bad');
    expect(err.details).toEqual([1]);
  });
});
