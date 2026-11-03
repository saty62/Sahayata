import fs from 'fs';
import os from 'os';
import path from 'path';
import mongoose from 'mongoose';

// Ensure all temporary storage is routed to D:\temp where 160GB+ space is available
const tempDir = fs.existsSync('D:\\') ? 'D:\\temp' : os.tmpdir();
if (fs.existsSync('D:\\')) {
  fs.mkdirSync(tempDir, { recursive: true });
  process.env.TEMP = tempDir;
  process.env.TMP = tempDir;
  os.tmpdir = () => tempDir;
}

import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { seedDatabase } from '../src/seed';

jest.setTimeout(90000);

let replSet: MongoMemoryReplSet | null = null;
let currentDbPath: string | null = null;

export async function setupTestDb() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  currentDbPath = path.join(tempDir, `mongo-test-${Date.now()}-${Math.floor(Math.random() * 10000)}`);
  fs.mkdirSync(currentDbPath, { recursive: true });

  replSet = await MongoMemoryReplSet.create({
    replSet: {
      count: 1,
      storageEngine: 'wiredTiger',
    },
    instanceOpts: [
      {
        dbPath: currentDbPath,
      },
    ],
  });

  await replSet.waitUntilRunning();
  const uri = replSet.getUri();
  await mongoose.connect(uri);
  await seedDatabase();
}

import { drainMemoryQueue } from '../src/queues/pdfQueue';

export async function teardownTestDb() {
  try {
    drainMemoryQueue();
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (replSet) {
      await replSet.stop({ doCleanup: true, force: true });
      replSet = null;
    }
    if (currentDbPath && fs.existsSync(currentDbPath)) {
      fs.rmSync(currentDbPath, { recursive: true, force: true });
      currentDbPath = null;
    }
  } catch (err) {
    // ignore teardown errors
  }
}
