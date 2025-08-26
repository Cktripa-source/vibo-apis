// users.routes.ts
import { Router } from 'express';
import { listUsers, getUser, updateUser, deleteUser } from '../controllers/users.controller';
import { requireAuth } from '../middleware/auth';
import { allow } from '../middleware/rbac';

const r = Router();

// Admin can list all users
r.get('/', requireAuth, allow('ADMIN'), listUsers);

// Get single user (admin or self)
r.get('/:id', requireAuth, getUser);

// Update user (admin or self)
r.patch('/:id', requireAuth, updateUser);

// Delete user (admin only)
r.delete('/:id', requireAuth, allow('ADMIN'), deleteUser);

export default r;
