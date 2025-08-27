import { Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma, env } from '../config/env.js';

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
    const passwordHash = await bcrypt.hash(data.password, 12);

    // create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        role: data.role,
        passwordHash,
        isVerified: false,
        productIds: [],
        orderIds: [],
        reviewIds: [],
        transactionIds: [],
        vendorCampaignIds: []
      },
    });

    res.status(201).json({ 
      id: user.id, 
      email: user.email, 
      name: user.name,
      role: user.role 
    });

  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(400).json({ message: err.message || 'Registration failed' });
  }
};

// ---------------- Login ----------------
const loginDto = z.object({ 
  email: z.string().email(), 
  password: z.string() 
});

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = loginDto.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const accessPayload = { 
      sub: user.id, 
      role: user.role, 
      name: user.name,
      email: user.email 
    };
    const refreshPayload = { sub: user.id };

    // Use environment variables with fallbacks
    const accessTTL = process.env.ACCESS_TOKEN_TTL || '15m';
    const refreshTTL = process.env.REFRESH_TOKEN_TTL || '7d';

    const access = jwt.sign(accessPayload, env.JWT_ACCESS_SECRET, { expiresIn: accessTTL });
    const refresh = jwt.sign(refreshPayload, env.JWT_REFRESH_SECRET, { expiresIn: refreshTTL });

    res.json({ 
      access, 
      refresh,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(400).json({ message: err.message || 'Login failed' });
  }
};

// ---------------- Refresh Token ----------------
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refresh } = req.body;
    if (!refresh) return res.status(400).json({ message: 'Refresh token required' });

    const payload = jwt.verify(refresh, env.JWT_REFRESH_SECRET) as { sub: string };
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    
    if (!user) return res.status(401).json({ message: 'Invalid refresh token' });

    const accessPayload = { 
      sub: user.id, 
      role: user.role, 
      name: user.name,
      email: user.email 
    };

    const accessTTL = process.env.ACCESS_TOKEN_TTL || '15m';
    const access = jwt.sign(accessPayload, env.JWT_ACCESS_SECRET, { expiresIn: accessTTL });

    res.json({ access });
  } catch (err: any) {
    console.error('Token refresh error:', err);
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

// ---------------- Logout ----------------
export const logout = async (_req: Request, res: Response) => {
  res.status(200).json({
    message: 'Logged out successfully. Please remove tokens from client storage.',
    success: true
  });
};