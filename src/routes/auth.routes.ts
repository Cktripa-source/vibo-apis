import { Router } from 'express';
import { login, register, logout, refreshToken } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';

const r = Router();

// Apply rate limiting to auth routes
r.use(authLimiter);

r.post('/register', register);
r.post('/login', login);
r.post('/refresh', refreshToken);
r.post('/logout', requireAuth, logout);

// Test route to verify authentication
r.get('/me', requireAuth, (req, res) => {
  const user = (req as any).user;
  res.json({
    id: user.sub,
    email: user.email,
    name: user.name,
    role: user.role
  });
});

export default r;