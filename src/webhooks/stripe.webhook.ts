// src/webhooks/stripe.webhook.ts
import { Request, Response } from 'express';

export const stripeWebhook = async (req: Request, res: Response) => {
  // Verify signature, parse event, on payment_succeeded → mark order paid
  res.sendStatus(200);
};