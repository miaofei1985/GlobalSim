import rateLimit from 'express-rate-limit';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per 15 minutes
  message: { error: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Email/verification code rate limiter (防刷关键)
export const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 emails per hour per IP
  message: { error: 'Too many verification emails sent, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Transfer rate limiter (虚拟经济防刷：20 次/日)
export const transferLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: parseInt(process.env.TRANSFER_DAILY_LIMIT) || 20,
  message: { error: 'Daily transfer limit reached (20 transfers/day).' },
  standardHeaders: true,
  legacyHeaders: false,
});

export default {
  apiLimiter,
  authLimiter,
  emailLimiter,
  transferLimiter,
};
