// src/routes/index.ts
import { Router } from 'express';
import auth from './auth.routes';
import users from './users.routes';
import products from './products.routes';
import affiliates from './affiliates.routes';
import campaigns from './campaigns.routes';
import orders from './orders.routes';
import reviews from './reviews.routes';
import payments from './payments.routes';

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