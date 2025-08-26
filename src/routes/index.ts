// src/routes/index.ts
import { Router } from 'express';
import auth from './auth.routes.js';
import users from './users.routes.js';
import products from './products.routes.js';
import affiliates from './affiliates.routes.js';
import campaigns from './campaigns.routes.js';
import orders from './orders.routes.js';
import reviews from './reviews.routes.js';
import payments from './payments.routes.js';

const r = Router();
r.use('/auth', auth);
r.use('/users', users);
r.use('/products', products);
r.use('/affiliates', affiliates);
r.use('/campaigns', campaigns);
r.use('/orders', orders);
r.use('/reviews', reviews);
r.use('/payments', payments);

export default r;
