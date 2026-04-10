import pool from '../config/database.js';
import { generateWalletAddress } from '../utils/crypto.js';

const WALLET_SELECT_FIELDS = `
  id,
  user_id,
  currency,
  address,
  balance,
  frozen_balance,
  created_at,
  updated_at
`;

class WalletModel {
  constructor() {
    this.schemaReady = false;
  }

  async ensureSchema(client = pool) {
    if (this.schemaReady) {
      return;
    }

    await client.query(
      'ALTER TABLE wallets ADD COLUMN IF NOT EXISTS address VARCHAR(32)'
    );
    await client.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_wallets_user_id_unique ON wallets(user_id)'
    );
    await client.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_wallets_address_unique ON wallets(address) WHERE address IS NOT NULL'
    );

    this.schemaReady = true;
  }

  async findByUserId(userId, client = pool, options = {}) {
    await this.ensureSchema(client);

    const { forUpdate = false } = options;
    const lockClause = forUpdate ? ' FOR UPDATE' : '';
    const result = await client.query(
      `SELECT ${WALLET_SELECT_FIELDS} FROM wallets WHERE user_id = $1${lockClause}`,
      [userId]
    );

    const wallet = result.rows[0] || null;
    if (!wallet) {
      return null;
    }

    if (wallet.address) {
      return wallet;
    }

    return this.assignAddress(wallet.id, client);
  }

  async findByAddress(address, client = pool, options = {}) {
    await this.ensureSchema(client);

    const { forUpdate = false } = options;
    const lockClause = forUpdate ? ' FOR UPDATE' : '';
    const normalizedAddress = String(address || '').trim().toUpperCase();
    const result = await client.query(
      `SELECT ${WALLET_SELECT_FIELDS} FROM wallets WHERE address = $1${lockClause}`,
      [normalizedAddress]
    );

    return result.rows[0] || null;
  }

  async findById(walletId, client = pool, options = {}) {
    await this.ensureSchema(client);

    const { forUpdate = false } = options;
    const lockClause = forUpdate ? ' FOR UPDATE' : '';
    const result = await client.query(
      `SELECT ${WALLET_SELECT_FIELDS} FROM wallets WHERE id = $1${lockClause}`,
      [walletId]
    );

    return result.rows[0] || null;
  }

  async create(userId, currency = 'GSB', initialBalance = 0, client = pool) {
    await this.ensureSchema(client);

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const address = generateWalletAddress();

      try {
        const result = await client.query(
          `INSERT INTO wallets (user_id, currency, address, balance, frozen_balance)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING ${WALLET_SELECT_FIELDS}`,
          [userId, currency, address, initialBalance, 0]
        );

        return result.rows[0];
      } catch (error) {
        if (error.code === '23505') {
          continue;
        }

        throw error;
      }
    }

    throw new Error('Failed to generate a unique wallet address');
  }

  async assignAddress(walletId, client = pool) {
    await this.ensureSchema(client);

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const address = generateWalletAddress();

      try {
        const result = await client.query(
          `UPDATE wallets
           SET address = $1, updated_at = CURRENT_TIMESTAMP
           WHERE id = $2 AND address IS NULL
           RETURNING ${WALLET_SELECT_FIELDS}`,
          [address, walletId]
        );

        if (result.rows[0]) {
          return result.rows[0];
        }

        return this.findById(walletId, client);
      } catch (error) {
        if (error.code === '23505') {
          continue;
        }

        throw error;
      }
    }

    throw new Error('Failed to assign wallet address');
  }

  async ensureUserWallet(userId, client = pool, options = {}) {
    const {
      currency = 'GSB',
      initialBalance = 100000000,
      forUpdate = false,
      createInitialTransaction = true,
    } = options;

    let wallet = await this.findByUserId(userId, client, { forUpdate });
    if (wallet) {
      return { wallet, created: false };
    }

    try {
      wallet = await this.create(userId, currency, initialBalance, client);
    } catch (error) {
      if (error.code !== '23505') {
        throw error;
      }

      wallet = await this.findByUserId(userId, client, { forUpdate });
      if (wallet) {
        return { wallet, created: false };
      }

      throw error;
    }

    if (createInitialTransaction && Number(initialBalance) > 0) {
      await this.createTransaction(
        {
          walletId: wallet.id,
          type: 'deposit',
          amount: Number(initialBalance),
          balanceAfter: Number(initialBalance),
          referenceId: `wallet-init-${wallet.user_id}`,
          description: '系统初始化资金',
        },
        client
      );
    }

    return { wallet, created: true };
  }

  async updateBalance(walletId, amount, client = pool) {
    const result = await client.query(
      `UPDATE wallets
       SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, balance, frozen_balance, updated_at`,
      [amount, walletId]
    );

    return result.rows[0];
  }

  async freezeBalance(walletId, amount, client = pool) {
    const result = await client.query(
      `UPDATE wallets
       SET frozen_balance = frozen_balance + $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND balance >= $1
       RETURNING id`,
      [amount, walletId]
    );

    return result.rows.length > 0;
  }

  async unfreezeBalance(walletId, amount, client = pool) {
    await client.query(
      `UPDATE wallets
       SET frozen_balance = GREATEST(frozen_balance - $1, 0), updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [amount, walletId]
    );
  }

  async getWithSufficientBalance(userId, requiredAmount, client = pool, options = {}) {
    await this.ensureSchema(client);

    const { forUpdate = false } = options;
    const lockClause = forUpdate ? ' FOR UPDATE' : '';
    const result = await client.query(
      `SELECT ${WALLET_SELECT_FIELDS}
       FROM wallets
       WHERE user_id = $1 AND (balance - frozen_balance) >= $2${lockClause}`,
      [userId, requiredAmount]
    );

    const wallet = result.rows[0] || null;
    if (!wallet) {
      return null;
    }

    if (wallet.address) {
      return wallet;
    }

    return this.assignAddress(wallet.id, client);
  }

  async listTransactions(walletId, client = pool, options = {}) {
    const limit = Math.min(Math.max(Number(options.limit) || 20, 1), 100);
    const offset = Math.max(Number(options.offset) || 0, 0);

    const result = await client.query(
      `SELECT
         id,
         wallet_id,
         type,
         amount,
         balance_after,
         reference_id,
         description,
         created_at
       FROM transactions
       WHERE wallet_id = $1
       ORDER BY created_at DESC, id DESC
       LIMIT $2 OFFSET $3`,
      [walletId, limit, offset]
    );

    return result.rows;
  }

  async createTransaction(transaction, client = pool) {
    const result = await client.query(
      `INSERT INTO transactions (
         wallet_id,
         type,
         amount,
         balance_after,
         reference_id,
         description
       )
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING
         id,
         wallet_id,
         type,
         amount,
         balance_after,
         reference_id,
         description,
         created_at`,
      [
        transaction.walletId,
        transaction.type,
        transaction.amount,
        transaction.balanceAfter,
        transaction.referenceId || null,
        transaction.description || null,
      ]
    );

    return result.rows[0];
  }
}

export default new WalletModel();
