// src/routes/admin.routes.ts
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { allow } from '../middleware/rbac.js';
import { prisma } from '../config/env.js';

const r = Router();
r.use(requireAuth, allow('ADMIN'));

r.get('/dashboard', async (_, res) => {
  const [users, products, orders, sales] = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
    prisma.order.count(),
    prisma.order.aggregate({ _sum: { totalCents: true }, where: { status: 'PAID' } })
  ]);
  res.json({ users, products, orders, totalSalesCents: sales._sum.totalCents || 0 });
});

r.patch('/users/:id/verify', async (req, res) => {
  const { id } = req.params;
  const u = await prisma.user.update({ where: { id }, data: { isVerified: true } });
  res.json(u);
});

r.delete('/products/:id', async (req, res) => {
  const { id } = req.params;
  await prisma.product.delete({ where: { id } });
  res.sendStatus(204);
});

export default r;