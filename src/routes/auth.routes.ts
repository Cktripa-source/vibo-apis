// src/routes/auth.routes.ts
import { Router } from 'express';
import { login, register, logout } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth';
const r = Router();
r.post('/register', register);
r.post('/login', login);
r.post('/logout', requireAuth, logout);
export default r;
