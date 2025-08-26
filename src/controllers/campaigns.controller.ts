// src/controllers/campaigns.controller.ts
import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/env.js';

const createCampaignDto = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  budgetCents: z.number().int().positive(),
  target: z.string().optional(),
});

export const createCampaign = async (req: Request, res: Response) => {
  const vendorId = (req as any).user.sub as string;
  const data = createCampaignDto.parse(req.body);
  const campaign = await prisma.campaign.create({ data: { ...data, vendorId } });
  res.status(201).json(campaign);
};

export const applyCampaign = async (req: Request, res: Response) => {
  const influencerUserId = (req as any).user.sub as string;
  const { id } = req.params; // campaign id
  // Ensure influencer profile exists
  const profile = await prisma.influencer.upsert({ where: { userId: influencerUserId }, update: {}, create: { userId: influencerUserId } });
  const camp = await prisma.campaign.update({ where: { id }, data: { influencerId: profile.id, status: 'ASSIGNED' } });
  res.json(camp);
};

export const trackEngagement = async (req: Request, res: Response) => {
  const { id } = req.params; // campaign id
  const { metric, value } = { metric: req.body.metric as string, value: Number(req.body.value) };
  const e = await prisma.engagement.create({ data: { campaignId: id, metric, value } });
  res.status(201).json(e);
};