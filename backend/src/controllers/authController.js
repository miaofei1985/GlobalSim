import pool from '../config/database.js';
import UserModel from '../models/UserModel.js';
import WalletModel from '../models/WalletModel.js';
import { hashPassword, generateVerificationCode, comparePassword, generateToken } from '../utils/crypto.js';
import { sendVerificationEmail } from './emailService.js';

/**
 * Auth Controller
 * Handles user authentication and registration logic
 */
class AuthController {
  /**
   * Register a new user
   * POST /api/auth/register
   */
  async register(req, res) {
    const client = await pool.connect();
    
    try {
      const { email, password, nickname, locale = 'zh-CN' } = req.body;

      // Check if user already exists
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Email already registered',
        });
      }

      // Hash password and generate verification code
      const passwordHash = await hashPassword(password);
      const verificationCode = generateVerificationCode();
      const codeExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Begin transaction
      await client.query('BEGIN');

      // Create user
      const user = await UserModel.create({
        email,
        passwordHash,
        nickname,
        locale,
        verificationCode,
        codeExpiresAt,
      }, client);

      // Create wallet with 100 million GSB bonus
      const wallet = await WalletModel.create(user.id, 'GSB', 100000000.00, client);

      // Send verification email
      await sendVerificationEmail(email, verificationCode, locale);

      await client.query('COMMIT');

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            nickname: user.nickname,
            locale: user.locale,
            isVerified: false,
            createdAt: user.created_at,
          },
          wallet: {
            id: wallet.id,
            currency: wallet.currency,
            balance: wallet.balance,
            createdAt: wallet.created_at,
          },
          message: 'Registration successful! Please check your email for verification code.',
        },
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Register error:', error);
      
      if (error.message === 'Email already registered') {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Registration failed',
      });
    } finally {
      client.release();
    }
  }

  /**
   * Verify user email
   * POST /api/auth/verify
   */
  async verifyEmail(req, res) {
    try {
      const { email, code } = req.body;

      const verifiedUser = await UserModel.verifyEmail(email, code);
      
      if (!verifiedUser) {
        return res.status(400).json({
          success: false,
          error: 'Invalid or expired verification code',
        });
      }

      res.json({
        success: true,
        data: {
          message: 'Email verified successfully!',
          user: {
            id: verifiedUser.id,
            email: verifiedUser.email,
          },
        },
      });
    } catch (error) {
      console.error('Verify email error:', error);
      res.status(500).json({
        success: false,
        error: 'Verification failed',
      });
    }
  }

  /**
   * Resend verification code
   * POST /api/auth/resend-code
   */
  async resendCode(req, res) {
    try {
      const { email, locale = 'zh-CN' } = req.body;

      const user = await UserModel.findByEmail(email);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Email not found',
        });
      }

      if (user.is_verified) {
        return res.status(400).json({
          success: false,
          error: 'Email already verified',
        });
      }

      const newCode = generateVerificationCode();
      const codeExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await UserModel.updateVerificationCode(email, newCode, codeExpiresAt);
      await sendVerificationEmail(email, newCode, locale);

      res.json({
        success: true,
        data: {
          message: 'Verification code resent! Please check your email.',
        },
      });
    } catch (error) {
      console.error('Resend code error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to resend verification code',
      });
    }
  }

  /**
   * Login user
   * POST /api/auth/login
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      const user = await UserModel.findByEmail(email);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
        });
      }

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
      await UserModel.updateLastLoginIP(user.id, clientIP);

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
}

export default new AuthController();
