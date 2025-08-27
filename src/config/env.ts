import { PrismaClient } from '@prisma/client';

// Environment configuration with defaults
export const env = {
  PORT: Number(process.env.PORT || 4000),
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'your-super-secret-access-key-change-in-production',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
};

// Validate required environment variables
if (!env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create Prisma client instance
export const prisma = new PrismaClient({
  log: env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// Handle graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});