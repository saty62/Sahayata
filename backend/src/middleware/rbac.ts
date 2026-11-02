import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { UserRole } from '../models/User';

export const requireRole = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !req.userRole) {
      res.status(401).json({
        success: false,
        message: 'Authentication required before checking permissions.',
      });
      return;
    }

    if (!roles.includes(req.userRole)) {
      res.status(403).json({
        success: false,
        message: `Forbidden: Access requires one of the following roles: ${roles.join(', ')}.`,
      });
      return;
    }

    next();
  };
};

export const requireAdmin = requireRole('ADMIN');
