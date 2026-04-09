import pool from '../config/database.js';

/**
 * Stock Model
 * Handles all database operations related to stocks
 */
class StockModel {
  /**
   * Find stock by symbol and exchange
   * @param {string} symbol 
   * @param {string} exchange 
   * @returns {Promise<Object|null>}
   */
  async findBySymbolAndExchange(symbol, exchange) {
    const result = await pool.query(
      'SELECT * FROM stocks WHERE symbol = $1 AND exchange = $2',
      [symbol, exchange]
    );
    return result.rows[0] || null;
  }

  /**
   * Get stocks with filtering and sorting
   * @param {string} exchange 
   * @param {string} tab - 'all', 'rising', 'volume', 'hot'
   * @param {string} sector 
   * @returns {Promise<Array>}
   */
  async findWithFilters(exchange, tab = 'all', sector = null) {
    let query = 'SELECT * FROM stocks WHERE exchange = $1';
    let values = [exchange];
    let paramIndex = 2;

    // Sector filter
    if (sector) {
      query += ` AND sector = $${paramIndex}`;
      values.push(sector);
      paramIndex++;
    }

    // Sorting logic
    switch (tab) {
      case 'rising':
        query += ' ORDER BY change_percent DESC LIMIT 20';
        break;
      case 'volume':
        query += ' ORDER BY volume DESC LIMIT 20';
        break;
      case 'hot':
        query += ' ORDER BY (change_percent * 0.6 + (volume / 1000000) * 0.4) DESC LIMIT 20';
        break;
      default:
        query += ' ORDER BY market_cap DESC LIMIT 50';
    }

    const result = await pool.query(query, values);
    return result.rows;
  }

  /**
   * Get distinct sectors for an exchange
   * @param {string} exchange 
   * @returns {Promise<Array<string>>}
   */
  async findDistinctSectors(exchange) {
    const result = await pool.query(
      'SELECT DISTINCT sector FROM stocks WHERE exchange = $1 AND sector IS NOT NULL',
      [exchange]
    );
    return result.rows.map(r => r.sector);
  }

  /**
   * Update stock price and related fields
   * @param {string} symbol 
   * @param {string} exchange 
   * @param {Object} updateData 
   */
  async updatePrice(symbol, exchange, updateData) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updateData)) {
      fields.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(symbol);
    values.push(exchange);

    const query = `
      UPDATE stocks 
      SET ${fields.join(', ')}
      WHERE symbol = $${paramIndex} AND exchange = $${paramIndex + 1}
    `;

    await pool.query(query, values);
  }

  /**
   * Get stocks by sector
   * @param {string} sector 
   * @param {string} exchange 
   * @returns {Promise<Array>}
   */
  async findBySector(sector, exchange) {
    const result = await pool.query(
      'SELECT * FROM stocks WHERE sector = $1 AND exchange = $2 ORDER BY market_cap DESC',
      [sector, exchange]
    );
    return result.rows;
  }
}

export default new StockModel();
