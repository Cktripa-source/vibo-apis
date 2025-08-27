// src/controllers/reviews.controller.ts
import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/env';

const reviewDto = z.object({ 
  productId: z.string(), 
  rating: z.number().int().min(1).max(5), 
  comment: z.string().min(4) 
});

export const createReview = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.sub as string;
    const { productId, rating, comment } = reviewDto.parse(req.body);
    
    // Verify purchase - check if user has a paid order containing this product
    // First get all order item IDs for this product
    const orderItems = await prisma.orderItem.findMany({
      where: { productId },
      select: { id: true }
    });
    
    const orderItemIds = orderItems.map(item => item.id);
    
    // Then check if user has a paid order containing any of these items
    const purchased = await prisma.order.findFirst({
      where: { 
        buyerId: userId, 
        status: 'PAID',
        itemIds: {
          hasSome: orderItemIds
        }
      }
    });
    
    if (!purchased) {
      return res.status(403).json({ message: 'You must buy before reviewing.' });
    }
    
    const review = await prisma.review.create({ 
      data: { productId, userId, rating, comment } 
    });
    
    res.status(201).json(review);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};