import pool from '../config/database.js';

class StockService {
  // 获取股票列表 (支持板块、排行筛选)
  async getStocks(exchange, tab = 'all', sector = null) {
    let query = 'SELECT * FROM stocks WHERE exchange = $1';
    let values = [exchange];
    let paramIndex = 2;

    // 板块筛选
    if (sector) {
      query += ` AND sector = $${paramIndex}`;
      values.push(sector);
      paramIndex++;
    }

    // 排序逻辑 (排行榜)
    switch (tab) {
      case 'rising': // 涨幅榜
        query += ' ORDER BY change_percent DESC LIMIT 20';
        break;
      case 'volume': // 成交榜
        query += ' ORDER BY volume DESC LIMIT 20';
        break;
      case 'hot': // 热门板块 (综合算法)
        query += ' ORDER BY (change_percent * 0.6 + (volume / 1000000) * 0.4) DESC LIMIT 20';
        break;
      default: // 全部
        query += ' ORDER BY market_cap DESC LIMIT 50';
    }

    const result = await pool.query(query, values);
    return result.rows;
  }

  // 获取单个股票详情
  async getStockDetail(symbol, exchange) {
    const result = await pool.query(
      'SELECT * FROM stocks WHERE symbol = $1 AND exchange = $2',
      [symbol, exchange]
    );
    return result.rows[0] || null;
  }

  // 获取所有板块列表
  async getSectors(exchange) {
    const result = await pool.query(
      'SELECT DISTINCT sector FROM stocks WHERE exchange = $1 AND sector IS NOT NULL',
      [exchange]
    );
    return result.rows.map(r => r.sector);
  }
}

export default new StockService();
