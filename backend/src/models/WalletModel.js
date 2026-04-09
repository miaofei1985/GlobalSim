import pool from '../config/database.js';

/**
 * Wallet Model
 * Handles all database operations related to wallets
 */
class WalletModel {
  /**
   * Find wallet by user ID
   * @param {number} userId 
   * @returns {Promise<Object|null>}
   */
  async findByUserId(userId) {
    const result = await pool.query(
      'SELECT id, user_id, currency, balance, frozen_balance, created_at, updated_at FROM wallets WHERE user_id = $1',
      [userId]
    );
    return result.rows[0] || null;
  }

  /**
   * Create a new wallet for user
   * @param {number} userId 
   * @param {string} currency 
   * @param {number} initialBalance 
   * @param {Object} client - Database client (for transactions)
   * @returns {Promise<Object>}
   */
  async create(userId, currency = 'GSB', initialBalance = 0, client = pool) {
    const result = await client.query(
      `INSERT INTO wallets (user_id, currency, balance, frozen_balance)
       VALUES ($1, $2, $3, $4)
       RETURNING id, currency, balance, created_at`,
      [userId, currency, initialBalance, 0]
    );
    return result.rows[0];
  }

  /**
   * Update wallet balance
   * @param {number} walletId 
   * @param {number} amount - Amount to add (can be negative)
   * @returns {Promise<Object>}
   */
  async updateBalance(walletId, amount, client = pool) {
    const result = await client.query(
      `UPDATE wallets 
       SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, balance`,
      [amount, walletId]
    );
    return result.rows[0];
  }

  /**
   * Freeze wallet balance (for orders)
   * @param {number} walletId 
   * @param {number} amount 
   * @returns {Promise<boolean>} - Whether operation was successful
   */
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

  /**
   * Unfreeze wallet balance
   * @param {number} walletId 
   * @param {number} amount 
   */
  async unfreezeBalance(walletId, amount, client = pool) {
    await client.query(
      `UPDATE wallets 
       SET frozen_balance = GREATEST(frozen_balance - $1, 0), updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [amount, walletId]
    );
  }

  /**
   * Get wallet with sufficient balance check
   * @param {number} userId 
   * @param {number} requiredAmount 
   * @returns {Promise<Object|null>}
   */
  async getWithSufficientBalance(userId, requiredAmount) {
    const result = await pool.query(
      `SELECT * FROM wallets 
       WHERE user_id = $1 AND (balance - frozen_balance) >= $2`,
      [userId, requiredAmount]
    );
    return result.rows[0] || null;
  }
}

export default new WalletModel();
