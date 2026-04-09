import pool from '../config/database.js';

/**
 * User Model
 * Handles all database operations related to users
 */
class UserModel {
  /**
   * Find user by email
   * @param {string} email 
   * @returns {Promise<Object|null>}
   */
  async findByEmail(email) {
    const result = await pool.query(
      'SELECT id, email, password_hash, nickname, locale, is_verified, status, created_at, updated_at FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  /**
   * Find user by ID
   * @param {number} id 
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    const result = await pool.query(
      'SELECT id, email, nickname, locale, is_verified, status, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Create a new user
   * @param {Object} userData 
   * @returns {Promise<Object>}
   */
  async create(userData, client = pool) {
    const query = `
      INSERT INTO users (email, password_hash, nickname, locale, verification_code, code_expires_at, is_verified, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, email, nickname, locale, created_at
    `;
    const values = [
      userData.email,
      userData.passwordHash,
      userData.nickname || null,
      userData.locale || 'zh-CN',
      userData.verificationCode,
      userData.codeExpiresAt,
      false,
      'active'
    ];
    
    const result = await client.query(query, values);
    return result.rows[0];
  }

  /**
   * Update user verification status
   * @param {string} email 
   * @param {string} code 
   * @returns {Promise<Object|null>}
   */
  async verifyEmail(email, code) {
    const result = await pool.query(
      `UPDATE users 
       SET is_verified = TRUE, verification_code = NULL, code_expires_at = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE email = $1 AND verification_code = $2 AND code_expires_at > NOW()
       RETURNING id, email`,
      [email, code]
    );
    return result.rows[0] || null;
  }

  /**
   * Update verification code
   * @param {string} email 
   * @param {string} newCode 
   * @param {Date} expiresAt 
   */
  async updateVerificationCode(email, newCode, expiresAt) {
    await pool.query(
      `UPDATE users 
       SET verification_code = $1, code_expires_at = $2, updated_at = CURRENT_TIMESTAMP
       WHERE email = $3`,
      [newCode, expiresAt, email]
    );
  }

  /**
   * Update last login IP
   * @param {number} userId 
   * @param {string} ip 
   */
  async updateLastLoginIP(userId, ip) {
    await pool.query(
      'UPDATE users SET last_login_ip = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [ip, userId]
    );
  }

  /**
   * Check if user exists by email
   * @param {string} email 
   * @returns {Promise<boolean>}
   */
  async existsByEmail(email) {
    const result = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    return result.rows.length > 0;
  }
}

export default new UserModel();
