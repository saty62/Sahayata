import { setupTestDb, teardownTestDb } from './setup';
import { Campaign } from '../src/models/Campaign';
import { Donation } from '../src/models/Donation';
import { Receipt } from '../src/models/Receipt';
import { confirmDonationPaymentAtomic } from '../src/modules/donations/donations.service';
import * as pdfQueueModule from '../src/queues/pdfQueue';

beforeAll(async () => {
  await setupTestDb();
});

afterAll(async () => {
  await teardownTestDb();
});

describe('Critical Concurrency Test: 100 Concurrent Successful Donations', () => {
  const CONCURRENT_COUNT = 100;

  it(`should safely process ${CONCURRENT_COUNT} concurrent payment confirmations with 0 duplicates and exactly ${CONCURRENT_COUNT} unique receipts`, async () => {
    // Mock the async PDF enqueue call so 100 disk file writes don't timeout the transactional test
    const enqueueSpy = jest
      .spyOn(pdfQueueModule, 'enqueuePdfGeneration')
      .mockImplementation(async () => {});

    const campaign = await Campaign.findOne({ status: 'ACTIVE' });
    expect(campaign).toBeDefined();

    // 1. Prepare 100 pending donation records
    const donationPromises = [];
    for (let i = 1; i <= CONCURRENT_COUNT; i++) {
      donationPromises.push(
        Donation.create({
          donorName: `Concurrent Donor ${i}`,
          donorEmail: `donor${i}@concurrency-test.in`,
          donorMobile: `9826${String(i).padStart(6, '0')}`,
          donorPan: `CCPAN${String(i).padStart(4, '0')}Z`,
          campaignId: campaign!._id,
          amount: 500 + i * 10,
          paymentMode: 'UPI',
          paymentStatus: 'PENDING',
          idempotencyKey: `IDEM-CONCURRENCY-${Date.now()}-${i}`,
          donationType: 'ONE_TIME',
          isSimulated: true,
        })
      );
    }

    const createdDonations = await Promise.all(donationPromises);
    expect(createdDonations.length).toBe(CONCURRENT_COUNT);

    console.log(`[CONCURRENCY TEST] Created ${CONCURRENT_COUNT} pending donations. Launching concurrent transactions...`);

    // 2. Fire 100 concurrent payment confirmations simultaneously
    const startTime = Date.now();
    const confirmationResults = await Promise.all(
      createdDonations.map((d, index) =>
        confirmDonationPaymentAtomic(d._id.toString(), {
          shouldSucceed: true,
          paymentMode: 'UPI',
          transactionRef: `CONC-TXN-${index + 1}-${Date.now()}`,
        })
      )
    );
    const duration = Date.now() - startTime;
    console.log(`[CONCURRENCY TEST] Successfully committed ${CONCURRENT_COUNT} concurrent transactions in ${duration}ms!`);

    // 3. Verification: All payments succeeded
    confirmationResults.forEach((res) => {
      expect(res.donation.paymentStatus).toBe('COMPLETED');
      expect(res.receipt).toBeDefined();
    });

    // 4. Verification: Exactly 100 unique receipt numbers
    const receiptNumbers = confirmationResults.map((r) => r.receipt!.receiptNumber);
    const uniqueReceiptNumbers = new Set(receiptNumbers);
    expect(uniqueReceiptNumbers.size).toBe(CONCURRENT_COUNT);

    // 5. Verification: Exactly 100 unique certificate numbers
    const certificateNumbers = confirmationResults.map((r) => r.receipt!.certificateNumber);
    const uniqueCertificateNumbers = new Set(certificateNumbers);
    expect(uniqueCertificateNumbers.size).toBe(CONCURRENT_COUNT);

    // 6. Verification: Database state consistency
    const totalReceiptsInDb = await Receipt.countDocuments({
      donationId: { $in: createdDonations.map((d) => d._id) },
    });
    expect(totalReceiptsInDb).toBe(CONCURRENT_COUNT);

    // 7. Verification: Enqueue called for all 100 payments
    expect(enqueueSpy).toHaveBeenCalledTimes(CONCURRENT_COUNT);

    // 8. Verify Idempotency under concurrency: Re-trigger payment for first 10 donations
    const retryResults = await Promise.all(
      createdDonations.slice(0, 10).map((d) =>
        confirmDonationPaymentAtomic(d._id.toString(), {
          shouldSucceed: true,
          paymentMode: 'UPI',
          transactionRef: 'DUPLICATE-RETRY-TXN',
        })
      )
    );

    retryResults.forEach((retryRes) => {
      expect(retryRes.duplicate).toBe(true);
      expect(uniqueReceiptNumbers.has(retryRes.receipt!.receiptNumber)).toBe(true);
    });

    const receiptsAfterRetry = await Receipt.countDocuments({
      donationId: { $in: createdDonations.map((d) => d._id) },
    });
    expect(receiptsAfterRetry).toBe(CONCURRENT_COUNT);

    enqueueSpy.mockRestore();
  }, 60000);
});
