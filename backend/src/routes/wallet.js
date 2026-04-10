import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';

import walletController from '../controllers/walletController.js';
import authMiddleware from '../middleware/auth.js';
import { transferLimiter } from '../middleware/rateLimiter.js';

const router = Router();

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  return res.status(400).json({
    success: false,
    error: errors.array()[0].msg,
    details: errors.array(),
  });
};

router.get('/balance', authMiddleware, walletController.getBalance.bind(walletController));

router.get(
  '/transactions',
  authMiddleware,
  [
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
    query('offset').optional().isInt({ min: 0 }).withMessage('offset must be 0 or greater'),
  ],
  handleValidation,
  walletController.getTransactions.bind(walletController)
);

router.post(
  '/transfer',
  authMiddleware,
  transferLimiter,
  [
    body('to').trim().notEmpty().withMessage('Recipient wallet address, user ID, or email is required'),
    body('amount').isFloat({ gt: 0 }).withMessage('Transfer amount must be greater than 0'),
    body('memo').optional().isString().isLength({ max: 120 }).withMessage('Memo must be 120 characters or less'),
  ],
  handleValidation,
  walletController.transfer.bind(walletController)
);

export default router;
