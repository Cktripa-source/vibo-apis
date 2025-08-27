// src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/env';

// ---------------- Register ----------------
const registerDto = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  role: z.enum(['ADMIN', 'VENDOR', 'AFFILIATE', 'INFLUENCER', 'BUYER'])
});

export const register = async (req: Request, res: Response) => {
  try {
    const data = registerDto.parse(req.body);

    // check if email exists
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) return res.status(409).json({ message: 'Email already used' });

    // hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        role: data.role,
        passwordHash,
        isVerified: false
      },
    });

    res.status(201).json({ id: user.id, email: user.email, role: user.role });

  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

// ---------------- Login ----------------
const loginDto = z.object({ email: z.string().email(), password: z.string() });

export const login = async (req: Request, res: Response) => {
  const { email, password } = loginDto.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

  if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT secrets are not defined in environment variables');
  }

  const accessPayload = { sub: user.id, role: user.role, name: user.name };
  const refreshPayload = { sub: user.id };

  // Fix: Use string literals directly instead of environment variables with fallbacks
  const accessTTL = process.env.ACCESS_TOKEN_TTL || '15m';
  const refreshTTL = process.env.REFRESH_TOKEN_TTL || '7d';

  const access = jwt.sign(accessPayload, process.env.JWT_ACCESS_SECRET, { expiresIn: accessTTL });
  const refresh = jwt.sign(refreshPayload, process.env.JWT_REFRESH_SECRET, { expiresIn: refreshTTL });

  res.json({ access, refresh });
};

// ---------------- Logout ----------------
export const logout = async (_req: Request, res: Response) => {
  res.status(200).json({
    message: 'Logged out successfully. Please remove tokens from client storage.',
    success: true
  });
};