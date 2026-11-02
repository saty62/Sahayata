import fs from 'fs';
import mongoose from 'mongoose';

// Set temporary directory to D: drive where 160GB+ space is available
if (fs.existsSync('D:\\')) {
  const tempDir = 'D:\\temp';
  fs.mkdirSync(tempDir, { recursive: true });
  process.env.TEMP = tempDir;
  process.env.TMP = tempDir;
}

import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { seedDatabase } from '../src/seed';

jest.setTimeout(60000);

let replSet: MongoMemoryReplSet | null = null;

export async function setupTestDb() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  replSet = await MongoMemoryReplSet.create({
    replSet: {
      count: 1,
      storageEngine: 'wiredTiger',
    },
  });

  await replSet.waitUntilRunning();
  const uri = replSet.getUri();
  await mongoose.connect(uri);
  await seedDatabase();
}

export async function teardownTestDb() {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (replSet) {
      await replSet.stop({ doCleanup: true, force: true });
      replSet = null;
    }
  } catch (err) {
    // cleanup
  }
}
