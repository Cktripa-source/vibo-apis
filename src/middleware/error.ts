// error.ts
// src/middleware/error.ts
import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) {
    return res.status(400).json({ message: 'Validation error', errors: err.flatten() });
  }
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
};