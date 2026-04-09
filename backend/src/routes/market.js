import { Router } from 'express';
import marketController from '../controllers/marketController.js';

const router = Router();

/**
 * GET /api/market/stocks
 * Get stocks list with filters (ranking/sector)
 */
router.get('/stocks', async (req, res) => {
  try {
    await marketController.getStocks(req, res);
  } catch (error) {
    console.error('Get stocks route error:', error);
  }
});

/**
 * GET /api/market/sectors
 * Get sectors list
 */
router.get('/sectors', async (req, res) => {
  try {
    await marketController.getSectors(req, res);
  } catch (error) {
    console.error('Get sectors route error:', error);
  }
});

/**
 * GET /api/market/stocks/:symbol
 * Get stock detail by symbol
 */
router.get('/stocks/:symbol', async (req, res) => {
  try {
    await marketController.getStockDetail(req, res);
  } catch (error) {
    console.error('Get stock detail route error:', error);
  }
});

export default router;
