import { createHmac } from 'crypto';
import pool from '../config/database.js';
import redisClient from '../config/redis.js';
import {
  generateToken,
  generateVerificationCode,
  hashPassword,
} from '../utils/crypto.js';
import { assessPasswordStrength } from '../utils/passwordPolicy.js';
import { sendVerificationEmail } from '../services/emailService.js';
import WalletModel from '../models/WalletModel.js';

const REGISTRATION_CODE_TTL_SECONDS = 10 * 60;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_DAILY_SENDS_PER_EMAIL = 5;
const MAX_VERIFY_ATTEMPTS = 5;
const VERIFY_LOCK_SECONDS = 30 * 60;

const normalizeEmail = (email = '') => String(email).trim().toLowerCase();

const codeDigest = (email, code) =>
  createHmac(
    'sha256',
    process.env.VERIFICATION_CODE_SECRET || process.env.JWT_SECRET || 'globalsim-register'
  )
    .update(`${normalizeEmail(email)}:${String(code || '').trim()}`)
    .digest('hex');

const getRegistrationKeys = (email) => {
  const normalizedEmail = normalizeEmail(email);
  const dateKey = new Date().toISOString().slice(0, 10);

  return {
    code: `auth:register:code:${normalizedEmail}`,
    cooldown: `auth:register:cooldown:${normalizedEmail}`,
    daily: `auth:register:daily:${dateKey}:${normalizedEmail}`,
    attempts: `auth:register:attempts:${normalizedEmail}`,
    lock: `auth:register:lock:${normalizedEmail}`,
  };
};

const parseRedisJson = (value) => {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
};

const clearRegistrationState = async (keys) => {
  await redisClient.del(keys.code, keys.attempts, keys.lock, keys.cooldown);
};

const ensureRegistrationCodeNotLocked = async (keys) => {
  const locked = await redisClient.get(keys.lock);
  if (locked) {
    throw new Error('Too many invalid verification attempts, please try again later.');
  }
};

const validateRegistrationCode = async (email, code, options = {}) => {
  const normalizedEmail = normalizeEmail(email);
  const normalizedCode = String(code || '').trim();
  const keys = getRegistrationKeys(normalizedEmail);

  await ensureRegistrationCodeNotLocked(keys);

  const cachedRecord = parseRedisJson(await redisClient.get(keys.code));
  if (!cachedRecord?.digest) {
    throw new Error('Invalid or expired verification code');
  }

  const isValid = cachedRecord.digest === codeDigest(normalizedEmail, normalizedCode);
  if (!isValid) {
    const attempts = await redisClient.incr(keys.attempts);
    if (attempts === 1) {
      const ttl = await redisClient.ttl(keys.code);
      await redisClient.expire(keys.attempts, ttl > 0 ? ttl : REGISTRATION_CODE_TTL_SECONDS);
    }

    if (attempts >= MAX_VERIFY_ATTEMPTS) {
      await redisClient.setEx(keys.lock, VERIFY_LOCK_SECONDS, '1');
    }

    throw new Error('Invalid or expired verification code');
  }

  if (options.consume !== false) {
    await clearRegistrationState(keys);
  } else {
    await redisClient.del(keys.attempts, keys.lock);
  }

  return {
    email: normalizedEmail,
    locale: cachedRecord.locale || options.locale || 'zh-CN',
  };
};

const buildAuthPayload = (user, wallet, token, message) => ({
  token,
  user: {
    id: user.id,
    email: user.email,
    nickname: user.nickname,
    locale: user.locale,
    isVerified: true,
    createdAt: user.created_at,
  },
  wallet: {
    id: wallet.id,
    currency: wallet.currency,
    address: wallet.address,
    balance: wallet.balance,
    createdAt: wallet.created_at,
  },
  message,
});

export const sendRegistrationCode = async (email, locale = 'zh-CN') => {
  const normalizedEmail = normalizeEmail(email);
  const keys = getRegistrationKeys(normalizedEmail);
  const existingUserResult = await pool.query(
    `SELECT id, is_verified
     FROM users
     WHERE email = $1
     LIMIT 1`,
    [normalizedEmail]
  );

  if (existingUserResult.rows[0]?.is_verified) {
    throw new Error('This email is already registered. Please log in instead.');
  }

  const cooldownTtl = await redisClient.ttl(keys.cooldown);
  if (cooldownTtl > 0) {
    throw new Error(`Please wait ${cooldownTtl} seconds before requesting another verification code.`);
  }

  const dailyCount = await redisClient.incr(keys.daily);
  if (dailyCount === 1) {
    await redisClient.expire(keys.daily, 24 * 60 * 60);
  }
  if (dailyCount > MAX_DAILY_SENDS_PER_EMAIL) {
    throw new Error('Too many verification emails sent, please try again later.');
  }

  const verificationCode = generateVerificationCode();
  await redisClient.setEx(
    keys.code,
    REGISTRATION_CODE_TTL_SECONDS,
    JSON.stringify({
      digest: codeDigest(normalizedEmail, verificationCode),
      email: normalizedEmail,
      locale,
      sentAt: new Date().toISOString(),
    })
  );
  await redisClient.setEx(keys.cooldown, RESEND_COOLDOWN_SECONDS, '1');
  await redisClient.del(keys.attempts, keys.lock);

  await sendVerificationEmail(normalizedEmail, verificationCode, locale);

  return {
    success: true,
    cooldownSeconds: RESEND_COOLDOWN_SECONDS,
    expiresInSeconds: REGISTRATION_CODE_TTL_SECONDS,
    message: 'Verification code sent. Please check your email.',
  };
};

/**
 * Register a user after email-code verification.
 * Compatible with legacy unverified rows created by the previous flow.
 */
export const registerUser = async (userData) => {
  const {
    email,
    password,
    nickname,
    locale = 'zh-CN',
    code,
  } = userData;
  const normalizedEmail = normalizeEmail(email);
  const passwordAssessment = assessPasswordStrength(password);

  if (!passwordAssessment.isAcceptable) {
    throw new Error(
      'Password is too weak. Use upper/lowercase letters, numbers, and symbols.'
    );
  }

  await validateRegistrationCode(normalizedEmail, code, { consume: true, locale });

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const existingUserResult = await client.query(
      `SELECT id, email, nickname, locale, is_verified, status, created_at
       FROM users
       WHERE email = $1
       FOR UPDATE`,
      [normalizedEmail]
    );

    const passwordHash = await hashPassword(password);
    let user;

    if (existingUserResult.rows.length > 0) {
      const existingUser = existingUserResult.rows[0];

      if (existingUser.is_verified) {
        throw new Error('This email is already in use. Please log in or reset your password.');
      }

      const updatedUserResult = await client.query(
        `UPDATE users
         SET password_hash = $2,
             nickname = $3,
             locale = $4,
             verification_code = NULL,
             code_expires_at = NULL,
             is_verified = TRUE,
             status = 'active',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING id, email, nickname, locale, created_at`,
        [existingUser.id, passwordHash, nickname || null, locale]
      );

      user = updatedUserResult.rows[0];
    } else {
      const userResult = await client.query(
        `INSERT INTO users (
           email,
           password_hash,
           nickname,
           locale,
           verification_code,
           code_expires_at,
           is_verified,
           status
         )
         VALUES ($1, $2, $3, $4, NULL, NULL, TRUE, 'active')
         RETURNING id, email, nickname, locale, created_at`,
        [normalizedEmail, passwordHash, nickname || null, locale]
      );

      user = userResult.rows[0];
    }

    const { wallet } = await WalletModel.ensureUserWallet(user.id, client, {
      currency: 'GSB',
      initialBalance: 100000000,
      forUpdate: true,
      createInitialTransaction: true,
    });

    await client.query('COMMIT');

    const token = generateToken(user.id, user.email);

    return buildAuthPayload(
      user,
      wallet,
      token,
      'Registration successful. You are now signed in.'
    );
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Registration error:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Legacy verification endpoint kept for backward compatibility.
 */
export const verifyEmail = async (email, code) => {
  const normalizedEmail = normalizeEmail(email);

  try {
    await validateRegistrationCode(normalizedEmail, code, { consume: true });
  } catch (error) {
    const result = await pool.query(
      `UPDATE users
       SET is_verified = TRUE,
           verification_code = NULL,
           code_expires_at = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE email = $1 AND verification_code = $2 AND code_expires_at > NOW()
       RETURNING id, email`,
      [normalizedEmail, code]
    );

    if (result.rows.length === 0) {
      throw error;
    }

    return {
      success: true,
      message: 'Email verified successfully!',
      user: { id: result.rows[0].id, email: result.rows[0].email },
    };
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const userResult = await client.query(
      `SELECT id, email
       FROM users
       WHERE email = $1
       FOR UPDATE`,
      [normalizedEmail]
    );

    if (userResult.rows.length === 0) {
      throw new Error('Please complete registration after verifying your email.');
    }

    const updateResult = await client.query(
      `UPDATE users
       SET is_verified = TRUE,
           verification_code = NULL,
           code_expires_at = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, email`,
      [userResult.rows[0].id]
    );

    await WalletModel.ensureUserWallet(updateResult.rows[0].id, client, {
      currency: 'GSB',
      initialBalance: 100000000,
      forUpdate: true,
      createInitialTransaction: true,
    });

    await client.query('COMMIT');

    return {
      success: true,
      message: 'Email verified successfully!',
      user: { id: updateResult.rows[0].id, email: updateResult.rows[0].email },
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const resendVerificationCode = async (email, locale = 'zh-CN') =>
  sendRegistrationCode(email, locale);

export default {
  sendRegistrationCode,
  registerUser,
  verifyEmail,
  resendVerificationCode,
};
