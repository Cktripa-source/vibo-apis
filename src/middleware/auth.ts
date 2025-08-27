import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface JwtPayload { 
  sub: string; 
  role: string; 
  name: string;
  email: string;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid authorization header' });
  }

  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
    (req as any).user = payload;
    next();
  } catch (err: any) {
    console.error('Token verification error:', err.message);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// Role-based access control
export const allow = (...roles: string[]) => (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  
  if (!user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (!roles.includes(user.role)) {
    return res.status(403).json({ 
      message: 'Insufficient permissions',
      required: roles,
      current: user.role
    });
  }
  
  next();
};

// Check if user owns the resource (for self-modification endpoints)
export const allowSelfOrRole = (...roles: string[]) => (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  const resourceUserId = req.params.id || req.params.userId;
  
  if (!user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // Allow if user has required role or is accessing their own resource
  if (roles.includes(user.role) || user.sub === resourceUserId) {
    return next();
  }

  res.status(403).json({ 
    message: 'Insufficient permissions',
    error: 'Can only access your own resources or need elevated role'
  });
};