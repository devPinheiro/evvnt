import type { NextFunction, Request, Response } from 'express';
import { fail } from './response.js';

export class AppError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(opts: { status: number; code: string; message: string; details?: unknown }) {
    super(opts.message);
    this.status = opts.status;
    this.code = opts.code;
    this.details = opts.details;
  }
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json(fail('NOT_FOUND', `Route not found: ${req.method} ${req.path}`));
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    res.status(err.status).json(fail(err.code, err.message, err.details));
    return;
  }

  console.error(err);
  res.status(500).json(fail('INTERNAL', 'Internal server error'));
}

