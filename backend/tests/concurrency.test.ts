import fs from 'fs';
import { setupTestDb, teardownTestDb } from './setup';
import { Campaign } from '../src/models/Campaign';
import { Donation } from '../src/models/Donation';
import { Receipt } from '../src/models/Receipt';
import { ReceiptCounter } from '../src/models/ReceiptCounter';
import { confirmDonationPaymentAtomic } from '../src/modules/donations/donations.service';
import * as pdfQueueModule from '../src/queues/pdfQueue';
import * as pdfGeneratorModule from '../src/utils/pdfGenerator';
import { processPdfJob } from '../src/workers/pdfWorker';
import { getFinancialYearCounterKey } from '../src/utils/financialYear';

beforeAll(async () => {
  await setupTestDb();
});

afterAll(async () => {
  await teardownTestDb();
});

describe('Strict Engineering Review: High Concurrency, Duplicates, Failures & Worker Crash Resilience', () => {
  const CONCURRENT_COUNT = 100;

  it(`Test 1: 100 Concurrent Successful Donations with 0 duplicates and continuous sequential numbering`, async () => {
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

    console.log(`[CONCURRENCY BENCHMARK] Launching ${CONCURRENT_COUNT} concurrent payment transactions simultaneously...`);

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
    console.log(`[CONCURRENCY BENCHMARK] 100 concurrent transactions committed in ${duration}ms!`);

    // 3. Verification: All 100 payments succeeded
    confirmationResults.forEach((res) => {
      expect(res.donation.paymentStatus).toBe('COMPLETED');
      expect(res.receipt).toBeDefined();
    });

    // 4. Verification: Exactly 100 strictly unique receipt numbers
    const receiptNumbers = confirmationResults.map((r) => r.receipt!.receiptNumber);
    const uniqueReceiptNumbers = new Set(receiptNumbers);
    expect(uniqueReceiptNumbers.size).toBe(CONCURRENT_COUNT);

    // 5. Verification: Exactly 100 strictly unique certificate numbers
    const certificateNumbers = confirmationResults.map((r) => r.receipt!.certificateNumber);
    const uniqueCertificateNumbers = new Set(certificateNumbers);
    expect(uniqueCertificateNumbers.size).toBe(CONCURRENT_COUNT);

    // 6. Verification: Strict continuous arithmetic sequence (0 skipped numbers, 0 gaps)
    const sequenceNumbers = receiptNumbers
      .map((rn) => parseInt(rn.split('/')[2], 10))
      .sort((a, b) => a - b);

    for (let i = 1; i < sequenceNumbers.length; i++) {
      expect(sequenceNumbers[i]).toBe(sequenceNumbers[i - 1] + 1);
    }
    console.log(
      `[CONCURRENCY BENCHMARK] Verified continuous sequence from ${sequenceNumbers[0]} to ${sequenceNumbers[sequenceNumbers.length - 1]} with zero gaps!`
    );

    // 7. Verification: Database state consistency
    const totalReceiptsInDb = await Receipt.countDocuments({
      donationId: { $in: createdDonations.map((d) => d._id) },
    });
    expect(totalReceiptsInDb).toBe(CONCURRENT_COUNT);

    // 8. Verification: Enqueue called for all 100 payments
    expect(enqueueSpy).toHaveBeenCalledTimes(CONCURRENT_COUNT);

    enqueueSpy.mockRestore();
  }, 90000);

  it('Test 2: Duplicate Payment Callbacks - 10 simultaneous callbacks on SAME donation return identical receipt and create 0 extra records', async () => {
    const campaign = await Campaign.findOne({ status: 'ACTIVE' });
    const singleDonation = await Donation.create({
      donorName: 'Duplicate Test Donor',
      donorEmail: 'duplicate-test@example.com',
      donorMobile: '9826999111',
      campaignId: campaign!._id,
      amount: 1500,
      paymentMode: 'UPI',
      paymentStatus: 'PENDING',
      idempotencyKey: `IDEM-DUP-TEST-${Date.now()}`,
      donationType: 'ONE_TIME',
    });

    const fyKey = getFinancialYearCounterKey(new Date());
    const counterBefore = await ReceiptCounter.findById(fyKey);
    const seqBefore = counterBefore?.sequence || 0;

    // Launch 10 simultaneous payment confirmation callbacks for the EXACT same donationId
    const duplicateResults = await Promise.all(
      Array.from({ length: 10 }).map((_, i) =>
        confirmDonationPaymentAtomic(singleDonation._id.toString(), {
          shouldSucceed: true,
          transactionRef: `DUP-CALLBACK-${i}-${Date.now()}`,
        })
      )
    );

    // All 10 must succeed
    duplicateResults.forEach((res) => {
      expect(res.donation.paymentStatus).toBe('COMPLETED');
      expect(res.receipt).toBeDefined();
    });

    // Exactly 1 unique receipt number returned across all 10 callbacks
    const firstReceiptNum = duplicateResults[0].receipt!.receiptNumber;
    duplicateResults.forEach((res) => {
      expect(res.receipt!.receiptNumber).toBe(firstReceiptNum);
    });

    // Exactly 1 Receipt document in DB
    const receiptsInDb = await Receipt.countDocuments({ donationId: singleDonation._id });
    expect(receiptsInDb).toBe(1);

    // Counter increased by EXACTLY 1 (no sequence leakage or wasted numbers)
    const counterAfter = await ReceiptCounter.findById(fyKey);
    expect(counterAfter!.sequence).toBe(seqBefore + 1);
    console.log(`[DUPLICATE CALLBACK TEST] 10 concurrent callbacks allocated exactly 1 sequence number: ${firstReceiptNum}`);
  }, 30000);

  it('Test 3: Transaction Failures & Recovery - Failed transaction creates 0 receipts and counter is not leaked; retry recovers successfully', async () => {
    const campaign = await Campaign.findOne({ status: 'ACTIVE' });
    const failedDonation = await Donation.create({
      donorName: 'Failure Simulation Donor',
      donorEmail: 'failed-user@example.com',
      donorMobile: '9826999222',
      campaignId: campaign!._id,
      amount: 2000,
      paymentMode: 'NET_BANKING',
      paymentStatus: 'PENDING',
      idempotencyKey: `IDEM-FAIL-TEST-${Date.now()}`,
      donationType: 'ONE_TIME',
    });

    const fyKey = getFinancialYearCounterKey(new Date());
    const counterBefore = await ReceiptCounter.findById(fyKey);
    const seqBefore = counterBefore?.sequence || 0;

    // 1. Simulate payment failure
    const failResult = await confirmDonationPaymentAtomic(failedDonation._id.toString(), {
      shouldSucceed: false,
      failureReason: 'Bank gateway timeout during payment processing',
    });

    expect(failResult.donation.paymentStatus).toBe('FAILED');
    expect(failResult.receipt).toBeUndefined();

    // Verify 0 receipts created in DB
    const receiptCountFail = await Receipt.countDocuments({ donationId: failedDonation._id });
    expect(receiptCountFail).toBe(0);

    // Verify counter did not increment on failure
    const counterAfterFail = await ReceiptCounter.findById(fyKey);
    expect(counterAfterFail?.sequence || 0).toBe(seqBefore);

    // 2. Simulate subsequent successful retry directly on the FAILED donation record
    const recoverResult = await confirmDonationPaymentAtomic(failedDonation._id.toString(), {
      shouldSucceed: true,
      paymentMode: 'NET_BANKING',
      transactionRef: `RECOVER-TXN-${Date.now()}`,
    });

    expect(recoverResult.donation.paymentStatus).toBe('COMPLETED');
    expect(recoverResult.receipt).toBeDefined();

    // Verify exactly 1 receipt in DB after recovery
    const receiptCountRecover = await Receipt.countDocuments({ donationId: failedDonation._id });
    expect(receiptCountRecover).toBe(1);

    // Verify counter incremented by exactly 1 on recovery
    const counterAfterRecover = await ReceiptCounter.findById(fyKey);
    expect(counterAfterRecover!.sequence).toBe(seqBefore + 1);
    console.log(`[TRANSACTION FAILURE TEST] Aborted transaction created 0 receipts. Recovery successfully allocated receipt: ${recoverResult.receipt!.receiptNumber}`);
  }, 30000);

  it('Test 4: Worker Crashes & PDF Retries - Simulates worker crash, tracks retryCount, and verifies recovery to COMPLETED', async () => {
    const campaign = await Campaign.findOne({ status: 'ACTIVE' });
    const crashDonation = await Donation.create({
      donorName: 'Worker Crash Donor',
      donorEmail: 'worker-crash@example.com',
      donorMobile: '9826999333',
      donorPan: 'CRASH1234F',
      campaignId: campaign!._id,
      amount: 1200,
      paymentMode: 'UPI',
      paymentStatus: 'PENDING',
      idempotencyKey: `IDEM-CRASH-TEST-${Date.now()}`,
      donationType: 'ONE_TIME',
    });

    // Confirm payment so receipt record exists
    const payResult = await confirmDonationPaymentAtomic(crashDonation._id.toString(), {
      shouldSucceed: true,
      transactionRef: `CRASH-TXN-${Date.now()}`,
    });
    const receiptId = payResult.receipt!._id.toString();

    // 1. Mock worker crash in PDF generation
    const crashSpy = jest
      .spyOn(pdfGeneratorModule, 'generateDonationReceiptPdf')
      .mockImplementation(async () => {
        throw new Error('SIMULATED_WORKER_CRASH: disk quota exceeded / worker process OOM');
      });

    // Attempt 1: Worker crash
    await expect(
      processPdfJob({ receiptId, donationId: crashDonation._id.toString() })
    ).rejects.toThrow('SIMULATED_WORKER_CRASH');

    const receiptAfterAttempt1 = await Receipt.findById(receiptId);
    expect(receiptAfterAttempt1?.retryCount).toBe(1);
    expect(receiptAfterAttempt1?.generationStatus).toBe('PROCESSING'); // Retrying, not permanently failed
    expect(receiptAfterAttempt1?.errorMessage).toContain('SIMULATED_WORKER_CRASH');

    // Attempt 2: Worker crash again
    await expect(
      processPdfJob({ receiptId, donationId: crashDonation._id.toString() })
    ).rejects.toThrow('SIMULATED_WORKER_CRASH');

    const receiptAfterAttempt2 = await Receipt.findById(receiptId);
    expect(receiptAfterAttempt2?.retryCount).toBe(2);
    expect(receiptAfterAttempt2?.generationStatus).toBe('PROCESSING');

    // Attempt 3: Worker crash reaching threshold -> marked FAILED
    await expect(
      processPdfJob({ receiptId, donationId: crashDonation._id.toString() })
    ).rejects.toThrow('SIMULATED_WORKER_CRASH');

    const receiptAfterAttempt3 = await Receipt.findById(receiptId);
    expect(receiptAfterAttempt3?.retryCount).toBe(3);
    expect(receiptAfterAttempt3?.generationStatus).toBe('FAILED');

    // 2. Heal worker (restore original generator) and run successful job
    crashSpy.mockRestore();

    await processPdfJob({ receiptId, donationId: crashDonation._id.toString() });

    const healedReceipt = await Receipt.findById(receiptId);
    expect(healedReceipt?.generationStatus).toBe('COMPLETED');
    expect(healedReceipt?.errorMessage).toBeUndefined();
    expect(healedReceipt?.receiptPdfUrl).toBe(`/api/receipts/${receiptId}/download`);
    expect(healedReceipt?.certificatePdfUrl).toBe(`/api/receipts/${receiptId}/certificate`);

    console.log(
      `[WORKER CRASH & RETRY TEST] Verified 3 crash attempts tracked, status correctly handled, and healed worker completed PDF generation for ${healedReceipt?.receiptNumber}`
    );
  }, 45000);
});
