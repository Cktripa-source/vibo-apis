import { Router } from 'express';
import { createProduct, listProducts, approveProduct } from '../controllers/products.controller';
import { requireAuth } from '../middleware/auth';
import { allow } from '../middleware/rbac';
import { upload } from '../middleware/upload';

const r = Router();

r.get('/', listProducts);
r.post('/', requireAuth, allow('VENDOR'), upload.single('image'), createProduct);
r.patch('/:id/approve', requireAuth, allow('ADMIN'), approveProduct);

export default r;
