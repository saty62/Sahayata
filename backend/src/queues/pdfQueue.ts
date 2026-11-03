import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { config } from '../config';
import { logger } from '../utils/logger';
import { processPdfJob } from '../workers/pdfWorker';

import mongoose from 'mongoose';

export interface PdfJobData {
  receiptId: string;
  donationId: string;
  attempts?: number;
}

let redisConnection: IORedis | null = null;
let pdfBullQueue: Queue<PdfJobData> | null = null;

// Fallback in-memory task queue when Redis is offline
const memoryQueue: PdfJobData[] = [];
let isProcessingMemoryQueue = false;

export function drainMemoryQueue(): void {
  memoryQueue.length = 0;
  isProcessingMemoryQueue = false;
}

async function processMemoryQueue() {
  if (isProcessingMemoryQueue || memoryQueue.length === 0) return;
  if (mongoose.connection.readyState !== 1) return; // Don't process if DB not connected

  isProcessingMemoryQueue = true;

  while (memoryQueue.length > 0) {
    if (mongoose.connection.readyState !== 1) break;

    // Process up to 5 jobs concurrently in memory
    const batch = memoryQueue.splice(0, 5);
    await Promise.all(
      batch.map(async (jobData) => {
        try {
          logger.info(`[MemoryQueue] Processing PDF job for receipt: ${jobData.receiptId}`);
          await processPdfJob(jobData);
        } catch (err) {
          logger.error(`[MemoryQueue] PDF generation failed for ${jobData.receiptId}:`, err);
          const currentAttempts = jobData.attempts || 1;
          if (currentAttempts < 3 && mongoose.connection.readyState === 1) {
            logger.warn(`[MemoryQueue] Re-queuing receipt ${jobData.receiptId} with backoff (attempt ${currentAttempts + 1}/3)...`);
            setTimeout(() => {
              if (mongoose.connection.readyState === 1) {
                memoryQueue.push({ ...jobData, attempts: currentAttempts + 1 });
                setImmediate(processMemoryQueue);
              }
            }, currentAttempts * 1000);
          }
        }
      })
    );
  }

  isProcessingMemoryQueue = false;
}

export function initPdfQueue(): { queue: Queue<PdfJobData> | null; isRedis: boolean } {
  if (config.redis.enabled && !pdfBullQueue) {
    try {
      redisConnection = new IORedis(config.redis.url, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        retryStrategy: (times) => {
          if (times > 3) {
            logger.warn('Redis connection retry limit reached. Falling back to local worker queue.');
            return null;
          }
          return Math.min(times * 200, 1000);
        },
      });

      redisConnection.on('error', (err) => {
        logger.warn('Redis error (using resilient fallback worker):', err.message);
      });

      pdfBullQueue = new Queue<PdfJobData>('pdf-generation', {
        connection: redisConnection,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      });

      logger.info('BullMQ PDF queue initialized with Redis');
      return { queue: pdfBullQueue, isRedis: true };
    } catch (err: any) {
      logger.warn('Failed to initialize Redis BullMQ queue, using local queue:', err.message);
      pdfBullQueue = null;
    }
  }

  return { queue: null, isRedis: false };
}

/**
 * Enqueue a PDF generation job
 */
export async function enqueuePdfGeneration(data: PdfJobData): Promise<void> {
  if (pdfBullQueue) {
    try {
      await pdfBullQueue.add('generate-receipt-pdf', data, {
        jobId: `pdf-${data.receiptId}`,
      });
      logger.info(`PDF job enqueued to BullMQ for receipt: ${data.receiptId}`);
      return;
    } catch (err) {
      logger.warn('Could not enqueue to BullMQ, falling back to memory queue:', err);
    }
  }

  // Fallback: enqueue into memory queue and trigger execution asynchronously
  memoryQueue.push(data);
  setImmediate(processMemoryQueue);
}
