// auth.e2e.test.ts
import request from 'supertest';
import { app } from '../src/app.js';

test('register & login', async () => {
  const reg = await request(app).post('/api/auth/register').send({
    email: 'a@b.com', password: 'Password1!', name: 'Alice', role: 'BUYER'
  });
  expect(reg.status).toBe(201);
  const login = await request(app).post('/api/auth/login').send({ email: 'a@b.com', password: 'Password1!' });
  expect(login.status).toBe(200);
  expect(login.body.access).toBeTruthy();
});