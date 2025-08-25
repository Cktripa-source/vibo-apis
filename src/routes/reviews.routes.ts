// src/routes/reviews.routes.ts
import { Router } from 'express';
import { createReview } from '../controllers/reviews.controller';
import { requireAuth } from '../middleware/auth';

const r = Router();
r.post('/', requireAuth, createReview);
export default r;