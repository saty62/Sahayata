import { Router } from 'express';
import { register, login, logout, getMe, updateProfile } from './auth.controller';
import { validateRequest } from '../../middleware/validate';
import { registerSchema, loginSchema, updateProfileSchema } from './auth.validation';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.post('/register', validateRequest({ body: registerSchema }), register);
router.post('/login', validateRequest({ body: loginSchema }), login);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, validateRequest({ body: updateProfileSchema }), updateProfile);

export default router;
