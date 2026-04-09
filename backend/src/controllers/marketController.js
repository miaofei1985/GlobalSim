import StockModel from '../models/StockModel.js';

/**
 * Market Controller
 * Handles market data and stock information
 */
class MarketController {
  /**
   * Get stocks list with filters
   * GET /api/market/stocks
   */
  async getStocks(req, res) {
    try {
      const { exchange, tab, sector } = req.query;
      
      if (!exchange) {
        return res.status(400).json({ 
          success: false, 
          error: 'Exchange parameter is required' 
        });
      }

      const stocks = await StockModel.findWithFilters(exchange, tab, sector);
      
      res.json({ 
        success: true, 
        data: stocks 
      });
    } catch (error) {
      console.error('Get stocks error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch stocks' 
      });
    }
  }

  /**
   * Get sectors list
   * GET /api/market/sectors
   */
  async getSectors(req, res) {
    try {
      const { exchange } = req.query;
      
      if (!exchange) {
        return res.status(400).json({ 
          success: false, 
          error: 'Exchange parameter is required' 
        });
      }

      const sectors = await StockModel.findDistinctSectors(exchange);
      
      res.json({ 
        success: true, 
        data: sectors 
      });
    } catch (error) {
      console.error('Get sectors error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch sectors' 
      });
    }
  }

  /**
   * Get stock detail by symbol
   * GET /api/market/stocks/:symbol
   */
  async getStockDetail(req, res) {
    try {
      const { symbol } = req.params;
      const { exchange } = req.query;
      
      if (!symbol || !exchange) {
        return res.status(400).json({ 
          success: false, 
          error: 'Symbol and exchange are required' 
        });
      }

      const stock = await StockModel.findBySymbolAndExchange(symbol, exchange);
      
      if (!stock) {
        return res.status(404).json({ 
          success: false, 
          error: 'Stock not found' 
        });
      }

      res.json({ 
        success: true, 
        data: stock 
      });
    } catch (error) {
      console.error('Get stock detail error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch stock detail' 
      });
    }
  }
}

export default new MarketController();
