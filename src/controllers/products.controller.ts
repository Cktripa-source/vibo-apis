import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/env.js";

const productDto = z.object({
  title: z.string().min(2),
  description: z.string().min(10),
  priceCents: z.number().int().positive(),
  currency: z.string().default("RWF"),
  stock: z.number().int().nonnegative(),
  category: z.string(),
  imageUrl: z.string().url().optional(),
  digitalUrl: z.string().url().optional(),
  isAffiliatePromotable: z.boolean().default(false),
  commissionPercent: z.number().min(0).max(100).optional()
});

// Create product (vendor)
export const createProduct = async (req: Request, res: Response) => {
  try {
    const vendorId = (req as any).user.sub as string;

    // Ensure commissionPercent only sent if promotable
    const payload = {
      ...req.body,
      commissionPercent: req.body.isAffiliatePromotable
        ? req.body.commissionPercent
        : undefined,
    };

    const data = productDto.parse(payload);

    const product = await prisma.product.create({
      data: { ...data, vendorId, isApproved: false }
    });

    res.status(201).json(product);
  } catch (err: any) {
    res.status(400).json({ message: err.errors || err.message });
  }
};

// List products (optionally filter by promotable)
export const listProducts = async (req: Request, res: Response) => {
  try {
    const { q, category, promotable } = req.query as any;
    const products = await prisma.product.findMany({
      where: {
        isApproved: true,
        title: q ? { contains: q, mode: "insensitive" } : undefined,
        category: category || undefined,
        isAffiliatePromotable: promotable ? promotable === "true" : undefined
      },
      orderBy: { createdAt: "desc" }
    });
    res.json(products);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

// Approve product (admin only)
export const approveProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: "Product not found" });

    const product = await prisma.product.update({
      where: { id },
      data: { isApproved: true }
    });
    res.json(product);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};
