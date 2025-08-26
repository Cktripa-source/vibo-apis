// src/routes/orders.routes.ts
import { Router } from 'express';
import { createOrder, markPaid } from '../controllers/orders.controller.js';
import { requireAuth } from '../middleware/auth.js';

const r = Router();
r.post('/', requireAuth, createOrder);
r.post('/:orderId/paid', markPaid); // normally via webhook
export default r;