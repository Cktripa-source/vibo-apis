// src/routes/payments.routes.ts
import { Router } from 'express';
import { createPaymentIntent } from '../controllers/payments.controller.js';
import { stripeWebhook } from '../webhooks/stripe.webhook.js';

const r = Router();
r.post('/intent', createPaymentIntent);
r.post('/stripe/webhook', stripeWebhook); // raw body parser required in app if using Stripe
export default r;