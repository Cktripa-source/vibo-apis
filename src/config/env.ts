// src/config/env.ts
import { PrismaClient } from '@prisma/client';
export const env = {
  PORT: Number(process.env.PORT || 4000)
};
export const prisma = new PrismaClient();