// src/routes/affiliates.routes.ts
import { Router } from 'express';
import { createAffiliateLink, redirectByCode } from '../controllers/affiliates.controller';
import { requireAuth } from '../middleware/auth';
import { allow } from '../middleware/rbac';

const r = Router();
r.post('/links', requireAuth, allow('AFFILIATE'), createAffiliateLink);
r.get('/r/:code', redirectByCode); // mount also at app level for public redirect
export default r;