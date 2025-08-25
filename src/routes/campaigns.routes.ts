// src/routes/campaigns.routes.ts
import { Router } from 'express';
import { applyCampaign, createCampaign, trackEngagement } from '../controllers/campaigns.controller';
import { requireAuth } from '../middleware/auth';
import { allow } from '../middleware/rbac';

const r = Router();
r.post('/', requireAuth, allow('VENDOR'), createCampaign);
r.post('/:id/apply', requireAuth, allow('INFLUENCER'), applyCampaign);
r.post('/:id/engagements', requireAuth, allow('INFLUENCER','ADMIN','VENDOR'), trackEngagement);
export default r;