import { Router } from 'express';
import { createProduct, listProducts, approveProduct } from '../controllers/products.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { allow } from '../middleware/rbac.js';
import { upload } from '../middleware/upload.js';

const r = Router();

r.get('/', listProducts);
r.post('/', requireAuth, allow('VENDOR'), upload.single('image'), createProduct);
r.patch('/:id/approve', requireAuth, allow('ADMIN'), approveProduct);

export default r;
