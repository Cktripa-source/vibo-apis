// src/controllers/affiliates.controller.ts
import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/env';
import { nanoid } from 'nanoid';

export const createAffiliateLink = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.sub as string; // must be AFFILIATE
    const dto = z.object({ productId: z.string() }).parse(req.body);

    const product = await prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product || !product.isApproved || !product.isAffiliatePromotable) {
      return res.status(404).json({ message: 'Product not promotable' });
    }

    const affiliate = await prisma.affiliate.upsert({
      where: { userId },
      update: {},
      create: { userId }
    });

    const code = nanoid(10);
    const link = await prisma.affiliateLink.create({
      data: { code, productId: dto.productId, affiliateId: affiliate.id }
    });

    res.status(201).json({ code, url: `${process.env.CLIENT_URL}/r/${code}` });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const redirectByCode = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const link = await prisma.affiliateLink.findUnique({
      where: { code },
      include: { product: true }
    });

    if (!link) return res.status(404).send('Not found');

    await prisma.click.create({
      data: {
        affiliateLinkId: link.id,
        ip: req.ip,
        userAgent: req.get('user-agent') || undefined,
        referer: req.get('referer') || undefined,
        affiliateId: link.affiliateId
      }
    });

    const url = `${process.env.CLIENT_URL}/product/${link.productId}?utm_source=affiliate&utm_medium=link&utm_campaign=${link.code}`;
    res.redirect(302, url);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};
