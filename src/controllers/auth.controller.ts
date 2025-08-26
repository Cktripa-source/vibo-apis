// src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { prisma } from '../config/env.js';
import { z } from 'zod';

// ✅ Zod DTOs
const registerDto = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['user', 'vendor', 'admin']).default('user'),
});

const loginDto = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// ✅ Utility to read env safely
function getEnvVar(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing environment variable: ${key}`);
  return val;
}

const JWT_ACCESS_SECRET = getEnvVar('JWT_ACCESS_SECRET');
const JWT_REFRESH_SECRET = getEnvVar('JWT_REFRESH_SECRET');
const ACCESS_TOKEN_TTL: SignOptions['expiresIn'] =
  (process.env.ACCESS_TOKEN_TTL || '15m') as SignOptions['expiresIn'];
const REFRESH_TOKEN_TTL: SignOptions['expiresIn'] =
  (process.env.REFRESH_TOKEN_TTL || '7d') as SignOptions['expiresIn'];

// ✅ Register
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = registerDto.parse(req.body);

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, passwordHash: hash, role },
    });

    res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

// ✅ Login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = loginDto.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const access = jwt.sign(
      { sub: user.id, role: user.role, name: user.name },
      JWT_ACCESS_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL }
    );

    const refresh = jwt.sign(
      { sub: user.id },
      JWT_REFRESH_SECRET,
      { expiresIn: REFRESH_TOKEN_TTL }
    );

    res.json({ access, refresh });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

// ✅ Logout
export const logout = async (req: Request, res: Response) => {
  res.json({ message: 'Logged out' });
};
