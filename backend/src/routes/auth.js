import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { registerUser, verifyEmail, resendVerificationCode } from '../services/authService.js';
import { generateToken, comparePassword } from '../utils/crypto.js';
import pool from '../config/database.js';
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
      const { email, password, nickname, locale } = req.body;
      const result = await registerUser({ email, password, nickname, locale });
      
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
      const { email, locale } = req.body;
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
      
      const isValidPassword = await comparePassword(password, user.password_hash);
      
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
        });
      }
      
      const token = generateToken(user.id, user.email);
      
      // Update last login IP
      const clientIP = req.ip || req.connection.remoteAddress;
      await pool.query(
        'UPDATE users SET last_login_ip = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [clientIP, user.id]
      );
      
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
