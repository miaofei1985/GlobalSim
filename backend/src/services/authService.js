import pool from '../config/database.js';
import { hashPassword, generateVerificationCode, generateWalletAddress } from '../utils/crypto.js';
import { sendVerificationEmail } from '../services/emailService.js';

/**
 * Register a new user with email verification
 * @param {Object} userData - { email, password, nickname, locale }
 * @returns {Object} - { user, wallet, message }
 */
export const registerUser = async (userData) => {
  const { email, password, nickname, locale = 'zh-CN' } = userData;
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Check if user already exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      throw new Error('Email already registered');
    }
    
    // Hash password and generate verification code
    const passwordHash = await hashPassword(password);
    const verificationCode = generateVerificationCode();
    const codeExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Create user
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, nickname, locale, verification_code, code_expires_at, is_verified, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, email, nickname, locale, created_at`,
      [email, passwordHash, nickname || null, locale, verificationCode, codeExpiresAt, false, 'active']
    );
    
    const user = userResult.rows[0];
    
    // Create wallet with 100 million GSB bonus
    const walletResult = await client.query(
      `INSERT INTO wallets (user_id, currency, balance, frozen_balance)
       VALUES ($1, $2, $3, $4)
       RETURNING id, currency, balance, created_at`,
      [user.id, 'GSB', 100000000.00, 0.00]
    );
    
    const wallet = walletResult.rows[0];
    
    // Send verification email
    await sendVerificationEmail(email, verificationCode, locale);
    
    await client.query('COMMIT');
    
    return {
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        locale: user.locale,
        isVerified: user.is_verified,
        createdAt: user.created_at,
      },
      wallet: {
        id: wallet.id,
        currency: wallet.currency,
        balance: wallet.balance,
        createdAt: wallet.created_at,
      },
      message: 'Registration successful! Please check your email for verification code.',
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Registration error:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Verify user's email with code
 * @param {String} email 
 * @param {String} code 
 * @returns {Object} - { success, message }
 */
export const verifyEmail = async (email, code) => {
  const result = await pool.query(
    `UPDATE users 
     SET is_verified = TRUE, verification_code = NULL, code_expires_at = NULL, updated_at = CURRENT_TIMESTAMP
     WHERE email = $1 AND verification_code = $2 AND code_expires_at > NOW()
     RETURNING id, email`,
    [email, code]
  );
  
  if (result.rows.length === 0) {
    throw new Error('Invalid or expired verification code');
  }
  
  return {
    success: true,
    message: 'Email verified successfully!',
    user: { id: result.rows[0].id, email: result.rows[0].email },
  };
};

/**
 * Resend verification code
 * @param {String} email 
 * @param {String} locale 
 * @returns {Object}
 */
export const resendVerificationCode = async (email, locale = 'zh-CN') => {
  const result = await pool.query(
    'SELECT id, is_verified FROM users WHERE email = $1',
    [email]
  );
  
  if (result.rows.length === 0) {
    throw new Error('Email not found');
  }
  
  if (result.rows[0].is_verified) {
    throw new Error('Email already verified');
  }
  
  const newCode = generateVerificationCode();
  const codeExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
  
  await pool.query(
    `UPDATE users 
     SET verification_code = $1, code_expires_at = $2, updated_at = CURRENT_TIMESTAMP
     WHERE email = $3`,
    [newCode, codeExpiresAt, email]
  );
  
  await sendVerificationEmail(email, newCode, locale);
  
  return {
    success: true,
    message: 'Verification code resent! Please check your email.',
  };
};

export default { registerUser, verifyEmail, resendVerificationCode };
