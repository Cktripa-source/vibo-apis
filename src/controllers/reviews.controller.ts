// src/controllers/reviews.controller.ts
import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/env';

const reviewDto = z.object({ productId: z.string(), rating: z.number().int().min(1).max(5), comment: z.string().min(4) });
export const createReview = async (req: Request, res: Response) => {
  const userId = (req as any).user.sub as string;
  const { productId, rating, comment } = reviewDto.parse(req.body);
  // verify purchase
  const purchased = await prisma.order.findFirst({
    where: { buyerId: userId, status: 'PAID', items: { some: { productId } } }
  });
  if (!purchased) return res.status(403).json({ message: 'You must buy before reviewing.' });
  const review = await prisma.review.create({ data: { productId, userId, rating, comment } });
  res.status(201).json(review);
};