import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import authController from '../controllers/authController.js';
import { authLimiter, emailLimiter } from '../middleware/rateLimiter.js';

const router = Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post(
  '/register',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('locale').optional().isIn(['zh-CN', 'en', 'hi', 'es', 'ar', 'bn', 'pt-BR', 'ru', 'ja', 'fr'])
      .withMessage('Invalid locale'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      await authController.register(req, res);
    } catch (error) {
      console.error('Register route error:', error);
      // Error is handled in controller
    }
  }
);

/**
 * POST /api/auth/verify
 * Verify email with code
 */
router.post(
  '/verify',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('code').isLength({ min: 6, max: 6 }).withMessage('Verification code must be 6 digits'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      await authController.verifyEmail(req, res);
    } catch (error) {
      console.error('Verify route error:', error);
      // Error is handled in controller
    }
  }
);

/**
 * POST /api/auth/resend-code
 * Resend verification code
 */
router.post(
  '/resend-code',
  emailLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('locale').optional().isIn(['zh-CN', 'en', 'hi', 'es', 'ar', 'bn', 'pt-BR', 'ru', 'ja', 'fr']),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      await authController.resendCode(req, res);
    } catch (error) {
      console.error('Resend code route error:', error);
      // Error is handled in controller
    }
  }
);

/**
 * POST /api/auth/login
 * Login user
 */
router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      await authController.login(req, res);
    } catch (error) {
      console.error('Login route error:', error);
      // Error is handled in controller
    }
  }
);

export default router;
