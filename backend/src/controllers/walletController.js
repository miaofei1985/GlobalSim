import { randomUUID } from 'node:crypto';

import pool from '../config/database.js';
import WalletModel from '../models/WalletModel.js';

const DEFAULT_INITIAL_BALANCE = Number(
  process.env.INITIAL_WALLET_BALANCE || 100000000
);
const MAX_TRANSFER_AMOUNT = Number(
  process.env.TRANSFER_MAX_AMOUNT || 5000000000
);

class WalletController {
  toNumber(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  formatWallet(wallet) {
    const balance = this.toNumber(wallet.balance);
    const frozenBalance = this.toNumber(wallet.frozen_balance);

    return {
      id: wallet.id,
      userId: wallet.user_id,
      currency: wallet.currency,
      address: wallet.address,
      balance,
      frozenBalance,
      availableBalance: Math.max(balance - frozenBalance, 0),
      createdAt: wallet.created_at,
      updatedAt: wallet.updated_at,
    };
  }

  formatTransaction(transaction) {
    return {
      id: transaction.id,
      walletId: transaction.wallet_id,
      type: transaction.type,
      amount: this.toNumber(transaction.amount),
      balanceAfter: this.toNumber(transaction.balance_after),
      referenceId: transaction.reference_id,
      description: transaction.description,
      createdAt: transaction.created_at,
    };
  }

  async findUserById(userId, client = pool) {
    const result = await client.query(
      `SELECT id, email, nickname, locale
       FROM users
       WHERE id = $1 AND status = 'active'`,
      [userId]
    );

    return result.rows[0] || null;
  }

  async findUserByEmail(email, client = pool) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const result = await client.query(
      `SELECT id, email, nickname, locale
       FROM users
       WHERE LOWER(email) = $1 AND status = 'active'`,
      [normalizedEmail]
    );

    return result.rows[0] || null;
  }

  async resolveRecipient(target, client) {
    const normalizedTarget = String(target || '').trim();
    if (!normalizedTarget) {
      return null;
    }

    if (/^GSB-[A-Z0-9]+$/i.test(normalizedTarget)) {
      const wallet = await WalletModel.findByAddress(normalizedTarget, client, {
        forUpdate: true,
      });

      if (!wallet) {
        return null;
      }

      const user = await this.findUserById(wallet.user_id, client);
      return user ? { user, wallet } : null;
    }

    if (/^\d+$/.test(normalizedTarget)) {
      const user = await this.findUserById(Number(normalizedTarget), client);
      if (!user) {
        return null;
      }

      const { wallet } = await WalletModel.ensureUserWallet(user.id, client, {
        initialBalance: DEFAULT_INITIAL_BALANCE,
        forUpdate: true,
      });

      return { user, wallet };
    }

    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedTarget)) {
      const user = await this.findUserByEmail(normalizedTarget, client);
      if (!user) {
        return null;
      }

      const { wallet } = await WalletModel.ensureUserWallet(user.id, client, {
        initialBalance: DEFAULT_INITIAL_BALANCE,
        forUpdate: true,
      });

      return { user, wallet };
    }

    return null;
  }

  async getBalance(req, res) {
    try {
      const { wallet, created } = await WalletModel.ensureUserWallet(
        req.user.userId,
        pool,
        { initialBalance: DEFAULT_INITIAL_BALANCE }
      );

      res.json({
        success: true,
        data: {
          wallet: this.formatWallet(wallet),
          created,
        },
      });
    } catch (error) {
      console.error('Get wallet balance error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to load wallet balance',
      });
    }
  }

  async getTransactions(req, res) {
    try {
      const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
      const offset = Math.max(Number(req.query.offset) || 0, 0);

      const { wallet } = await WalletModel.ensureUserWallet(req.user.userId, pool, {
        initialBalance: DEFAULT_INITIAL_BALANCE,
      });
      const transactions = await WalletModel.listTransactions(wallet.id, pool, {
        limit,
        offset,
      });

      res.json({
        success: true,
        data: {
          transactions: transactions.map((item) => this.formatTransaction(item)),
          pagination: {
            limit,
            offset,
            count: transactions.length,
          },
        },
      });
    } catch (error) {
      console.error('Get wallet transactions error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to load wallet transactions',
      });
    }
  }

  async transfer(req, res) {
    const client = await pool.connect();

    try {
      const to = String(req.body.to || '').trim();
      const memo = String(req.body.memo || '').trim();
      const rawAmount = Number(req.body.amount);

      if (!to) {
        return res.status(400).json({
          success: false,
          error: 'Recipient wallet address, user ID, or email is required',
        });
      }

      if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Transfer amount must be greater than 0',
        });
      }

      const amount = Number(rawAmount.toFixed(2));
      if (amount > MAX_TRANSFER_AMOUNT) {
        return res.status(400).json({
          success: false,
          error: `Single transfer limit is ${MAX_TRANSFER_AMOUNT.toLocaleString()} GSB`,
        });
      }

      await client.query('BEGIN');

      const senderResult = await WalletModel.ensureUserWallet(
        req.user.userId,
        client,
        {
          initialBalance: DEFAULT_INITIAL_BALANCE,
          forUpdate: true,
        }
      );
      const senderWallet = senderResult.wallet;
      const recipient = await this.resolveRecipient(to, client);

      if (!recipient) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          error: 'Recipient not found',
        });
      }

      if (recipient.wallet.id === senderWallet.id) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: 'Cannot transfer to your own wallet',
        });
      }

      const senderAvailableBalance =
        this.toNumber(senderWallet.balance) - this.toNumber(senderWallet.frozen_balance);

      if (senderAvailableBalance < amount) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: 'Insufficient available balance',
        });
      }

      const referenceId = `wallet-transfer-${randomUUID()}`;
      const senderUpdated = await WalletModel.updateBalance(senderWallet.id, -amount, client);
      const recipientUpdated = await WalletModel.updateBalance(recipient.wallet.id, amount, client);

      const senderDescription = memo
        ? `转账至 ${recipient.wallet.address}｜${memo}`
        : `转账至 ${recipient.wallet.address}`;
      const recipientDescription = memo
        ? `来自 ${senderWallet.address} 的转账｜${memo}`
        : `来自 ${senderWallet.address} 的转账`;

      const senderTransaction = await WalletModel.createTransaction(
        {
          walletId: senderWallet.id,
          type: 'transfer_out',
          amount: -amount,
          balanceAfter: this.toNumber(senderUpdated.balance),
          referenceId,
          description: senderDescription,
        },
        client
      );

      const recipientTransaction = await WalletModel.createTransaction(
        {
          walletId: recipient.wallet.id,
          type: 'transfer_in',
          amount,
          balanceAfter: this.toNumber(recipientUpdated.balance),
          referenceId,
          description: recipientDescription,
        },
        client
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        data: {
          message: 'Transfer successful',
          wallet: this.formatWallet({
            ...senderWallet,
            balance: senderUpdated.balance,
            frozen_balance: senderUpdated.frozen_balance,
            updated_at: senderUpdated.updated_at,
          }),
          transfer: {
            referenceId,
            amount,
            recipient: {
              userId: recipient.user.id,
              email: recipient.user.email,
              nickname: recipient.user.nickname,
              address: recipient.wallet.address,
            },
          },
          transactions: {
            sender: this.formatTransaction(senderTransaction),
            recipient: this.formatTransaction(recipientTransaction),
          },
        },
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Wallet transfer error:', error);
      res.status(500).json({
        success: false,
        error: 'Transfer failed',
      });
    } finally {
      client.release();
    }
  }
}

export default new WalletController();
