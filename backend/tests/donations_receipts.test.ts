import request from 'supertest';
import app from '../src/app';
import { setupTestDb, teardownTestDb } from './setup';
import { Campaign } from '../src/models/Campaign';
import { Donation } from '../src/models/Donation';
import { Receipt } from '../src/models/Receipt';

beforeAll(async () => {
  await setupTestDb();
});

afterAll(async () => {
  await teardownTestDb();
});

describe('Donations, Payments & Receipts Tests', () => {
  let campaignId: string;

  beforeAll(async () => {
    const campaign = await Campaign.findOne({ status: 'ACTIVE' });
    campaignId = campaign!._id.toString();
  });

  it('should create a donation intent and block foreign card transactions', async () => {
    const donationRes = await request(app).post('/api/donations').send({
      campaignId,
      amount: 1500,
      donorName: 'Meenakshi Iyer',
      donorEmail: 'meenakshi@example.com',
      donorMobile: '9826233445',
      donorPan: 'ABCDE9999Z',
      donationType: 'ONE_TIME',
    });

    expect(donationRes.status).toBe(201);
    expect(donationRes.body.success).toBe(true);
    const donationId = donationRes.body.data.donation._id;

    // Test foreign card rejection
    const foreignCardRes = await request(app)
      .post(`/api/donations/${donationId}/mock-payment`)
      .send({
        shouldSucceed: true,
        isForeignCard: true,
      });

    expect(foreignCardRes.status).toBe(400);
    expect(foreignCardRes.body.isBlocked).toBe(true);
  });

  it('should process successful mock payment and allocate atomic receipt number', async () => {
    const donationRes = await request(app).post('/api/donations').send({
      campaignId,
      amount: 2500,
      donorName: 'Kavita Chawla',
      donorEmail: 'kavita@example.com',
      donorMobile: '9826344556',
      donorPan: 'KVTCH4455J',
      donationType: 'ONE_TIME',
    });
    const donationId = donationRes.body.data.donation._id;

    const paymentRes = await request(app)
      .post(`/api/donations/${donationId}/mock-payment`)
      .send({
        shouldSucceed: true,
        paymentMode: 'UPI',
        transactionRef: 'UPI-TEST-12345',
      });

    expect(paymentRes.status).toBe(200);
    expect(paymentRes.body.success).toBe(true);
    expect(paymentRes.body.data.receipt).toBeDefined();
    expect(paymentRes.body.data.receipt.receiptNumber).toMatch(/^AC\/[0-9]{4}-[0-9]{2}\/[0-9]{6}$/);
    expect(paymentRes.body.data.receipt.certificateNumber).toMatch(/^80G\/[0-9]{4}-[0-9]{2}\/[0-9]{6}$/);

    // Verify donation status in DB
    const dbDonation = await Donation.findById(donationId);
    expect(dbDonation?.paymentStatus).toBe('COMPLETED');
  });

  it('should be idempotent: duplicate payment confirmation returns same receipt without duplicate allocation', async () => {
    const donationRes = await request(app).post('/api/donations').send({
      campaignId,
      amount: 1000,
      donorName: 'Deepak Joshi',
      donorEmail: 'deepak@example.com',
      donorMobile: '9826555666',
      donationType: 'ONE_TIME',
    });
    const donationId = donationRes.body.data.donation._id;

    // First call
    const paymentRes1 = await request(app)
      .post(`/api/donations/${donationId}/mock-payment`)
      .send({ shouldSucceed: true, transactionRef: 'TXN-IDEM-001' });

    const receiptNo1 = paymentRes1.body.data.receipt.receiptNumber;

    // Second duplicate call
    const paymentRes2 = await request(app)
      .post(`/api/donations/${donationId}/mock-payment`)
      .send({ shouldSucceed: true, transactionRef: 'TXN-IDEM-001' });

    expect(paymentRes2.status).toBe(200);
    expect(paymentRes2.body.duplicate).toBe(true);
    expect(paymentRes2.body.data.receipt.receiptNumber).toBe(receiptNo1);

    // Check count in DB
    const receiptsCount = await Receipt.countDocuments({ donationId });
    expect(receiptsCount).toBe(1);
  });

  it('should safely handle 5 simultaneous duplicate payment callbacks for the SAME donation with 0 sequence gaps', async () => {
    const donationRes = await request(app).post('/api/donations').send({
      campaignId,
      amount: 500,
      donorName: 'Concurrent Callback User',
      donorEmail: 'concurrent@example.com',
      donorMobile: '9826111222',
      donationType: 'ONE_TIME',
    });
    const donationId = donationRes.body.data.donation._id;

    // Launch 5 simultaneous payment confirmation callbacks for the same donationId
    const responses = await Promise.all([
      request(app).post(`/api/donations/${donationId}/mock-payment`).send({ shouldSucceed: true, transactionRef: 'TXN-PARALLEL-1' }),
      request(app).post(`/api/donations/${donationId}/mock-payment`).send({ shouldSucceed: true, transactionRef: 'TXN-PARALLEL-2' }),
      request(app).post(`/api/donations/${donationId}/mock-payment`).send({ shouldSucceed: true, transactionRef: 'TXN-PARALLEL-3' }),
      request(app).post(`/api/donations/${donationId}/mock-payment`).send({ shouldSucceed: true, transactionRef: 'TXN-PARALLEL-4' }),
      request(app).post(`/api/donations/${donationId}/mock-payment`).send({ shouldSucceed: true, transactionRef: 'TXN-PARALLEL-5' }),
    ]);

    // All should succeed (200)
    for (const res of responses) {
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    }

    // All 5 must have returned the exact same receipt number
    const firstReceiptNo = responses[0].body.data.receipt.receiptNumber;
    for (const res of responses) {
      expect(res.body.data.receipt.receiptNumber).toBe(firstReceiptNo);
    }

    // Exactly 1 Receipt document in database for this donation
    const receiptCount = await Receipt.countDocuments({ donationId });
    expect(receiptCount).toBe(1);
  });

  it('should strictly enforce data ownership & BOLA authorization checks on donations and receipts', async () => {
    // 1. Login donor 1
    const donor1Login = await request(app).post('/api/auth/login').send({
      email: 'donor@sahayata.org.in',
      password: 'Donor@1234',
    });
    const donor1Token = donor1Login.body.data.token;

    // 2. Register donor 2
    const donor2Reg = await request(app).post('/api/auth/register').send({
      name: 'Other Donor',
      email: 'otherdonor@sahayata.org.in',
      password: 'Donor@1234',
      mobile: '9826999888',
    });
    const donor2Token = donor2Reg.body.data.token;

    // 3. Login admin
    const adminLogin = await request(app).post('/api/auth/login').send({
      email: 'admin@sahayata.org.in',
      password: 'Admin@1234',
    });
    const adminToken = adminLogin.body.data.token;

    // 4. Donor 1 creates donation
    const donationRes = await request(app)
      .post('/api/donations')
      .set('Authorization', `Bearer ${donor1Token}`)
      .send({
        campaignId,
        amount: 3000,
        donorName: 'Ananya Sharma',
        donorEmail: 'donor@sahayata.org.in',
        donorMobile: '9826123456',
        donorPan: 'ABCDE1234F',
        donationType: 'ONE_TIME',
      });
    const donationId = donationRes.body.data.donation._id;

    // Confirm payment so receipt is created
    const payRes = await request(app)
      .post(`/api/donations/${donationId}/mock-payment`)
      .set('Authorization', `Bearer ${donor1Token}`)
      .send({ shouldSucceed: true, transactionRef: 'TXN-OWNERSHIP-1' });
    const receiptId = payRes.body.data.receipt._id;

    // Unauthenticated guest requests registered donation -> 401
    const guestDonationRes = await request(app).get(`/api/donations/${donationId}`);
    expect(guestDonationRes.status).toBe(401);

    // Donor 2 requests Donor 1's donation -> 403
    const donor2DonationRes = await request(app)
      .get(`/api/donations/${donationId}`)
      .set('Authorization', `Bearer ${donor2Token}`);
    expect(donor2DonationRes.status).toBe(403);

    // Donor 1 requests own donation -> 200
    const donor1DonationRes = await request(app)
      .get(`/api/donations/${donationId}`)
      .set('Authorization', `Bearer ${donor1Token}`);
    expect(donor1DonationRes.status).toBe(200);

    // Admin requests donation -> 200
    const adminDonationRes = await request(app)
      .get(`/api/donations/${donationId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminDonationRes.status).toBe(200);

    // Unauthenticated guest requests registered receipt -> 401
    const guestReceiptRes = await request(app).get(`/api/receipts/${receiptId}`);
    expect(guestReceiptRes.status).toBe(401);

    // Donor 2 requests Donor 1's receipt -> 403
    const donor2ReceiptRes = await request(app)
      .get(`/api/receipts/${receiptId}`)
      .set('Authorization', `Bearer ${donor2Token}`);
    expect(donor2ReceiptRes.status).toBe(403);

    // Donor 1 requests own receipt -> 200
    const donor1ReceiptRes = await request(app)
      .get(`/api/receipts/${receiptId}`)
      .set('Authorization', `Bearer ${donor1Token}`);
    expect(donor1ReceiptRes.status).toBe(200);

    // Donor 2 tries to trigger retry on Donor 1's receipt -> 403
    const donor2RetryRes = await request(app)
      .post(`/api/receipts/${receiptId}/retry`)
      .set('Authorization', `Bearer ${donor2Token}`);
    expect(donor2RetryRes.status).toBe(403);
  });
});
