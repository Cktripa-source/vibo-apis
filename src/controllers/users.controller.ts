import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/env';

const updateUserDto = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  role: z.enum(['ADMIN','VENDOR','AFFILIATE','INFLUENCER','BUYER']).optional(),
  isVerified: z.boolean().optional()
});

// Get all users (admin only)
export const listUsers = async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, phone: true, role: true, isVerified: true, createdAt: true }
  });
  res.json(users);
};

// Get single user by ID (admin or self)
export const getUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, phone: true, role: true, isVerified: true, createdAt: true }
  });
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
};

// Update user (admin or self)
export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = updateUserDto.parse(req.body);
  const user = await prisma.user.update({ where: { id }, data });
  res.json(user);
};

// Delete user (admin only)
export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.user.delete({ where: { id } });
  res.sendStatus(204);
};
