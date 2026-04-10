import { describe, it, expect } from 'vitest';
import { ok, fail } from '../../src/http/response.js';

describe('http response helpers', () => {
  it('ok wraps data', () => {
    expect(ok({ x: 1 })).toEqual({ ok: true, data: { x: 1 } });
  });

  it('fail builds error envelope', () => {
    expect(fail('CODE', 'msg', { z: 2 })).toEqual({
      ok: false,
      error: { code: 'CODE', message: 'msg', details: { z: 2 } },
    });
  });
});
