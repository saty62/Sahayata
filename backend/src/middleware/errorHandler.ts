import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error(`Unhandled error at ${req.method} ${req.originalUrl}:`, err);

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'An internal server error occurred. Please try again.';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
