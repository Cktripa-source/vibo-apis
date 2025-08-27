// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface JwtPayload { sub: string; role: string; }

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ message: 'Missing token' });
  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as JwtPayload;
    (req as any).user = payload;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}

// Moved from rbac.ts to avoid conflicts
export const allow = (...roles: string[]) => (req: Request, res: Response, next: NextFunction) => {
  const role = (req as any).user?.role;
  if (!role || !roles.includes(role)) return res.status(403).json({ message: 'Forbidden' });
  next();
};