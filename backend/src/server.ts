import fs from 'fs';

import os from 'os';
import path from 'path';

// Set temporary directory to D: drive if available to avoid low disk space issues
const tempDir = fs.existsSync('D:\\') ? 'D:\\temp' : os.tmpdir();
if (fs.existsSync('D:\\')) {
  fs.mkdirSync(tempDir, { recursive: true });
  process.env.TEMP = tempDir;
  process.env.TMP = tempDir;
}

import mongoose from 'mongoose';
import app from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { initPdfQueue } from './queues/pdfQueue';
import { startBullMqWorker } from './workers/pdfWorker';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

let mongoReplSet: MongoMemoryReplSet | null = null;

async function startDatabase() {
  try {
    logger.info(`Attempting to connect to MongoDB at: ${config.mongo.uri}`);
    await mongoose.connect(config.mongo.uri, {
      serverSelectionTimeoutMS: 2500,
    });
    logger.info('Connected successfully to MongoDB');
  } catch (err: any) {
    logger.warn(`Could not connect to external MongoDB: ${err.message}`);
    logger.info('Starting local in-memory MongoDB Replica Set (supporting full transactions)...');

    const fallbackDbPath = path.join(tempDir, `mongo-server-${Date.now()}`);
    fs.mkdirSync(fallbackDbPath, { recursive: true });

    mongoReplSet = await MongoMemoryReplSet.create({
      replSet: { count: 1, storageEngine: 'wiredTiger' },
      instanceOpts: [{ dbPath: fallbackDbPath }],
    });
    const uri = mongoReplSet.getUri();
    await mongoose.connect(uri);
    logger.info(`Connected to in-memory MongoDB replica set at: ${uri}`);
  }
}

async function startServer() {
  try {
    await startDatabase();

    // Initialize BullMQ queue and worker
    initPdfQueue();
    startBullMqWorker();

    const server = app.listen(config.port, () => {
      logger.info(`========================================================`);
      logger.info(`Sahayata Backend API running on port ${config.port}`);
      logger.info(`Environment: ${config.env}`);
      logger.info(`Trust: ${config.trust.name}`);
      logger.info(`API Base URL: http://localhost:${config.port}/api`);
      logger.info(`Health check: http://localhost:${config.port}/api/health`);
      logger.info(`========================================================`);
    });

    const shutdown = async () => {
      logger.info('Gracefully shutting down Sahayata backend...');
      server.close();
      await mongoose.disconnect();
      if (mongoReplSet) {
        await mongoReplSet.stop();
      }
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    logger.error('Fatal error starting server:', error);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
