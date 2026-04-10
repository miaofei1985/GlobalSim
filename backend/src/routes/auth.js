import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import {
  registerUser,
  resendVerificationCode,
  sendRegistrationCode,
  verifyEmail,
} from '../services/authService.js';
import {
  createCaptchaChallenge,
  verifyCaptchaChallenge,
} from '../services/captchaService.js';
import { generateToken, comparePassword } from '../utils/crypto.js';
import pool from '../config/database.js';
import { authLimiter, captchaLimiter, emailLimiter } from '../middleware/rateLimiter.js';

const router = Router();

const supportedLocales = ['zh-CN', 'en', 'hi', 'es', 'ar', 'bn', 'pt-BR', 'ru', 'ja', 'fr'];

const handleValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return true;
  }

  return false;
};

/**
 * GET /api/auth/captcha
 * Create a human-verification challenge.
 */
router.get('/captcha', captchaLimiter, async (req, res) => {
  try {
    const result = await createCaptchaChallenge();

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create captcha challenge',
    });
  }
});

/**
 * POST /api/auth/send-code
 * Send a registration verification code.
 */
router.post(
  '/send-code',
  emailLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('locale').optional().isIn(supportedLocales).withMessage('Invalid locale'),
    body('captchaId').notEmpty().withMessage('Captcha id is required'),
    body('captchaAnswer').isLength({ min: 4, max: 8 }).withMessage('Captcha answer is required'),
  ],
  async (req, res) => {
    if (handleValidationErrors(req, res)) {
      return;
    }

    try {
      const { email, locale, captchaId, captchaAnswer } = req.body;
      await verifyCaptchaChallenge(captchaId, captchaAnswer);
      const result = await sendRegistrationCode(email, locale);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to send verification code',
      });
    }
  }
);

/**
 * POST /api/auth/register
 * Register a new user after verification-code confirmation.
 */
router.post(
  '/register',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('code').isLength({ min: 6, max: 6 }).withMessage('Verification code must be 6 digits'),
    body('locale').optional().isIn(supportedLocales).withMessage('Invalid locale'),
  ],
  async (req, res) => {
    if (handleValidationErrors(req, res)) {
      return;
    }

    try {
      const { email, password, nickname, locale, code } = req.body;
      const result = await registerUser({ email, password, nickname, locale, code });

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Registration failed',
      });
    }
  }
);

/**
 * POST /api/auth/verify
 * Verify email with code (legacy compatibility route).
 */
router.post(
  '/verify',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('code').isLength({ min: 6, max: 6 }).withMessage('Verification code must be 6 digits'),
  ],
  async (req, res) => {
    if (handleValidationErrors(req, res)) {
      return;
    }

    try {
      const { email, code } = req.body;
      const result = await verifyEmail(email, code);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message || 'Verification failed',
      });
    }
  }
);

/**
 * POST /api/auth/resend-code
 * Resend verification code.
 */
router.post(
  '/resend-code',
  emailLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('locale').optional().isIn(supportedLocales).withMessage('Invalid locale'),
    body('captchaId').notEmpty().withMessage('Captcha id is required'),
    body('captchaAnswer').isLength({ min: 4, max: 8 }).withMessage('Captcha answer is required'),
  ],
  async (req, res) => {
    if (handleValidationErrors(req, res)) {
      return;
    }

    try {
      const { email, locale, captchaId, captchaAnswer } = req.body;
      await verifyCaptchaChallenge(captchaId, captchaAnswer);
      const result = await resendVerificationCode(email, locale);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to resend code',
      });
    }
  }
);

/**
 * POST /api/auth/login
 * Login user.
 */
router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    if (handleValidationErrors(req, res)) {
      return;
    }

    try {
      const { email, password } = req.body;

      const userResult = await pool.query(
        'SELECT id, email, password_hash, nickname, locale, is_verified, status FROM users WHERE email = $1',
        [email]
      );

      if (userResult.rows.length === 0) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
        });
      }

      const user = userResult.rows[0];

      if (user.status !== 'active') {
        return res.status(403).json({
          success: false,
          error: 'Account is disabled',
        });
      }

      if (!user.is_verified) {
        return res.status(403).json({
          success: false,
          error: 'Please verify your email before logging in.',
        });
      }

      const isValidPassword = await comparePassword(password, user.password_hash);

      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
        });
      }

      const token = generateToken(user.id, user.email);

      res.json({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            nickname: user.nickname,
            locale: user.locale,
            isVerified: user.is_verified,
          },
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Login failed',
      });
    }
  }
);

export default router;
