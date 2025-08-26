import { Router } from 'express';
import { createProduct, listProducts, approveProduct } from '../controllers/products.controller';
import { requireAuth } from '../middleware/auth';
import { allow } from '../middleware/rbac';
import { upload } from '../middleware/upload'; // our new multer middleware

const r = Router();

// List all approved products (public)
r.get('/', listProducts);

// Vendor: create product with optional image upload
r.post(
  '/',
  requireAuth,
  allow('VENDOR'),
  upload.single('image'), // handle single image upload
  async (req, res, next) => {
    try {
      // Attach image URL if file uploaded
      if (req.file) {
        req.body.imageUrl = `/uploads/${req.file.filename}`;
      }
      await createProduct(req, res);
    } catch (err) {
      next(err);
    }
  }
);

// Admin: approve product
r.patch('/:id/approve', requireAuth, allow('ADMIN'), approveProduct);

export default r;
