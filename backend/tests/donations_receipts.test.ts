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
});
