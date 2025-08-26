import { Request, Response } from 'express';
import { prisma } from '../config/env';
import { z } from 'zod';

const orderDto = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().int().positive(),
    })
  ),
  affiliateCode: z.string().optional(),
});

export const createOrder = async (req: Request, res: Response) => {
  try {
    const buyerId = (req as any).user.sub as string;
    const { items, affiliateCode } = orderDto.parse(req.body);

    let affiliateId: string | null = null;

    if (affiliateCode) {
      const link = await prisma.affiliateLink.findUnique({
        where: { code: affiliateCode },
      });
      if (link) affiliateId = link.affiliateId;
    }

    let totalCents = 0;
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });
      if (!product) throw new Error(`Product ${item.productId} not found`);
      totalCents += product.priceCents * item.quantity;
    }

    const order = await prisma.order.create({
      data: {
        buyerId,
        status: 'PENDING',
        totalCents,
        currency: 'RWF',
        affiliateId: affiliateId || undefined,
        itemIds: [],
      },
    });

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });
      if (!product) continue;

      const orderItem = await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: product.id,
          quantity: item.quantity,
          priceCents: product.priceCents,
        },
      });

      await prisma.order.update({
        where: { id: order.id },
        data: { itemIds: { push: orderItem.id } },
      });
    }

    res.status(201).json(order);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const markPaid = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'PAID' },
    });

    // Optional: record a payment (if you have a payment table)
    // await prisma.payment.create({
    //   data: {
    //     orderId: order.id,
    //     amountCents: order.totalCents,
    //     currency: order.currency,
    //     method: 'MANUAL', // or from webhook
    //   },
    // });

    res.status(200).json(order);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};
