import dotenv from 'dotenv';
import path from 'path';

// Load .env from backend root or monorepo root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  mongo: {
    uri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sahayata',
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
    enabled: process.env.REDIS_ENABLED === 'true' || process.env.REDIS_URL !== undefined,
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'sahayata-secure-jwt-secret-key-bhopal-trust-2026',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    cookieName: 'sahayata_token',
  },

  groq: {
    apiKey: process.env.GROQ_API_KEY || '',
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  },

  trust: {
    name: 'Company A Charitable Trust',
    nameHindi: 'कंपनी ए चैरिटेबल ट्रस्ट',
    registrationNumber: 'MP/BPL/TRUST/2018/8942',
    pan: 'AAATC1234F',
    eightyGNumber: 'CIT(E)/BPL/80G/2023-24/A-1089',
    eightyGValidity: 'Perpetual (AY 2024-25 onwards)',
    address: '14, Arera Hills, Near MP Nagar, Bhopal, Madhya Pradesh - 462011',
    helpline: '+91 755 240 8900',
    email: 'sahayata@companya-trust.org',
    website: 'https://sahayata.org.in',
    isDemo: true,
  },

  pdf: {
    storagePath: path.resolve(__dirname, '../../storage/pdfs'),
  },
};
