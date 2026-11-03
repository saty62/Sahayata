import { Request, Response, NextFunction } from 'express';

// In-Memory Rate Limiting Tracker
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const ipRequestMap = new Map<string, RateLimitRecord>();

/**
 * Clean up expired rate limiting buckets every 5 minutes to prevent memory leak
 */
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipRequestMap.entries()) {
    if (now > record.resetTime) {
      ipRequestMap.delete(ip);
    }
  }
}, 5 * 60 * 1000).unref();

/**
 * Configurable In-Memory Rate Limiter Middleware
 * Automatically disabled in NODE_ENV === 'test'
 */
export const rateLimiter = (options: {
  windowMs?: number;
  maxRequests?: number;
  message?: string;
} = {}) => {
  const windowMs = options.windowMs || 60 * 1000; // 1 minute window
  const maxRequests = options.maxRequests || 150; // default 150 req/min
  const message = options.message || 'Too many requests. Please slow down and try again after a minute.';

  return (req: Request, res: Response, next: NextFunction): void => {
    if (process.env.NODE_ENV === 'test') {
      return next();
    }

    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const now = Date.now();

    const record = ipRequestMap.get(clientIp);

    if (!record || now > record.resetTime) {
      ipRequestMap.set(clientIp, {
        count: 1,
        resetTime: now + windowMs,
      });
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', maxRequests - 1);
      return next();
    }

    record.count += 1;
    const remaining = Math.max(0, maxRequests - record.count);
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);

    if (record.count > maxRequests) {
      const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSec);
      res.status(429).json({
        success: false,
        message,
        retryAfter: retryAfterSec,
      });
      return;
    }

    next();
  };
};

/**
 * Strict Auth Rate Limiter (Brute-force protection for login/register: max 20 req/min)
 */
export const authRateLimiter = rateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 20,
  message: 'Too many authentication attempts. Please wait 1 minute before retrying.',
});

/**
 * NoSQL Injection Sanitizer
 * Strips MongoDB query operator keys ($gt, $ne, $where, etc.) from req.body and req.query
 */
function sanitizeObject(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    // Prohibit keys starting with $ or containing a period
    if (key.startsWith('$') || key.includes('.')) {
      continue;
    }
    clean[key] = sanitizeObject(value);
  }
  return clean;
}

export const noSqlSanitizer = (req: Request, res: Response, next: NextFunction): void => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }
  next();
};
