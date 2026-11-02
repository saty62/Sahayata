import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { User, IUser, UserRole } from '../models/User';

export interface AuthRequest extends Request {
  user?: IUser;
  userId?: string;
  userRole?: UserRole;
}

interface JwtPayload {
  id: string;
  role: UserRole;
  email: string;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;

    // Check HTTP-only cookie first
    if (req.cookies && req.cookies[config.jwt.cookieName]) {
      token = req.cookies[config.jwt.cookieName];
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in to proceed.',
      });
      return;
    }

    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    const user = await User.findById(decoded.id);

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User associated with this token no longer exists.',
      });
      return;
    }

    req.user = user;
    req.userId = user._id.toString();
    req.userRole = user.role;
    next();
  } catch (error: any) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.',
    });
  }
};

export const optionalAuthenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;

    if (req.cookies && req.cookies[config.jwt.cookieName]) {
      token = req.cookies[config.jwt.cookieName];
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
        const user = await User.findById(decoded.id);
        if (user) {
          req.user = user;
          req.userId = user._id.toString();
          req.userRole = user.role;
        }
      } catch (err) {
        // Token invalid or expired: proceed as guest
      }
    }
    next();
  } catch (error) {
    next();
  }
};
