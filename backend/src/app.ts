import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './modules/auth/auth.routes';
import schemesRoutes from './modules/schemes/schemes.routes';
import eligibilityRoutes from './modules/eligibility/eligibility.routes';
import campaignsRoutes from './modules/campaigns/campaigns.routes';
import donationsRoutes from './modules/donations/donations.routes';
import receiptsRoutes from './modules/receipts/receipts.routes';
import adminRoutes from './modules/admin/admin.routes';

const app: Application = express();

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS configuration supporting cookies from frontend
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow localhost and specified frontendUrl
      if (!origin || origin.startsWith('http://localhost') || origin === config.frontendUrl) {
        callback(null, true);
      } else {
        callback(null, true); // Dev flexible
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Idempotency-Key'],
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Sahayata Welfare & Donation Backend',
    version: '1.0.0',
    trust: config.trust.name,
  });
});

// Mount modules
app.use('/api/auth', authRoutes);
app.use('/api/schemes', schemesRoutes);
app.use('/api/eligibility', eligibilityRoutes);
app.use('/api/campaigns', campaignsRoutes);
app.use('/api/donations', donationsRoutes);
app.use('/api/receipts', receiptsRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler for unknown routes
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global error handler
app.use(errorHandler);

export default app;
