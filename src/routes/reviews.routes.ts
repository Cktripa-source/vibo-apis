// src/routes/reviews.routes.ts
import { Router } from 'express';
import { createReview } from '../controllers/reviews.controller.js';
import { requireAuth } from '../middleware/auth.js';

const r = Router();
r.post('/', requireAuth, createReview);
export default r;