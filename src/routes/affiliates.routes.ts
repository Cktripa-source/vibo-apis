// src/routes/affiliates.routes.ts
import { Router } from 'express';
import { createAffiliateLink, redirectByCode } from '../controllers/affiliates.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { allow } from '../middleware/rbac.js';

const r = Router();
r.post('/links', requireAuth, allow('AFFILIATE'), createAffiliateLink);
r.get('/r/:code', redirectByCode); // mount also at app level for public redirect
export default r;