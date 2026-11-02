import request from 'supertest';
import app from '../src/app';
import { setupTestDb, teardownTestDb } from './setup';

beforeAll(async () => {
  await setupTestDb();
});

afterAll(async () => {
  await teardownTestDb();
});

describe('Authentication & RBAC Tests', () => {
  const testDonor = {
    name: 'Sunita Mehra',
    email: 'sunita.test@example.com',
    password: 'Password@123',
    mobile: '9826099999',
    pan: 'ABCDE5678G',
  };

  it('should register a new donor account', async () => {
    const res = await request(app).post('/api/auth/register').send(testDonor);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testDonor.email);
    expect(res.body.data.user.role).toBe('DONOR');
    expect(res.body.data.token).toBeDefined();
  });

  it('should reject duplicate registration with same email', async () => {
    const res = await request(app).post('/api/auth/register').send(testDonor);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should log in existing donor and return token + cookie', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testDonor.email,
      password: testDonor.password,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('should reject login with incorrect password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testDonor.email,
      password: 'WrongPassword!',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should enforce RBAC: donor cannot access admin dashboard', async () => {
    const loginRes = await request(app).post('/api/auth/login').send({
      email: testDonor.email,
      password: testDonor.password,
    });
    const donorToken = loginRes.body.data.token;

    const adminRes = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${donorToken}`);

    expect(adminRes.status).toBe(403);
    expect(adminRes.body.success).toBe(false);
  });

  it('should allow admin user to access admin dashboard', async () => {
    const adminLoginRes = await request(app).post('/api/auth/login').send({
      email: 'admin@sahayata.org.in',
      password: 'Admin@1234',
    });
    const adminToken = adminLoginRes.body.data.token;

    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.summary).toBeDefined();
  });
});
