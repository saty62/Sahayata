import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../../models/User';
import { config } from '../../config';
import { AuthRequest } from '../../middleware/auth';

const generateTokenAndSetCookie = (res: Response, user: IUser): string => {
  const token = jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    config.jwt.secret,
    { expiresIn: '7d' }
  );

  res.cookie(config.jwt.cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return token;
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, mobile, pan, address } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      mobile,
      pan: pan ? pan.toUpperCase() : undefined,
      address,
      role: 'DONOR', // New signups are always DONOR
    });

    const token = generateTokenAndSetCookie(res, user);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      data: {
        user,
        token,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating user account',
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email address or password.',
      });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Invalid email address or password.',
      });
      return;
    }

    const token = generateTokenAndSetCookie(res, user);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      data: {
        user,
        token,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error logging in',
    });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  res.clearCookie(config.jwt.cookieName, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        user: req.user,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching user profile',
    });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { name, mobile, pan, address } = req.body;
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (name) user.name = name;
    if (mobile !== undefined) user.mobile = mobile;
    if (pan !== undefined) user.pan = pan ? pan.toUpperCase() : undefined;
    if (address) {
      user.address = {
        ...user.address,
        ...address,
      };
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error updating profile' });
  }
};
