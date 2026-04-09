const express = require('express');
const router = express.Router();
const stockService = require('../services/stockService');

// 获取股票列表 (支持排行/板块)
router.get('/stocks', async (req, res) => {
  try {
    const { exchange, tab, sector } = req.query;
    if (!exchange) {
      return res.status(400).json({ success: false, error: 'Exchange parameter is required' });
    }
    
    const stocks = await stockService.getStocks(exchange, tab, sector);
    res.json({ success: true, data: stocks });
  } catch (error) {
    console.error('Get stocks error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stocks' });
  }
});

// 获取板块列表
router.get('/sectors', async (req, res) => {
  try {
    const { exchange } = req.query;
    if (!exchange) {
      return res.status(400).json({ success: false, error: 'Exchange parameter is required' });
    }
    
    const sectors = await stockService.getSectors(exchange);
    res.json({ success: true, data: sectors });
  } catch (error) {
    console.error('Get sectors error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch sectors' });
  }
});

// 获取个股详情
router.get('/stocks/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { exchange } = req.query;
    
    if (!symbol || !exchange) {
      return res.status(400).json({ success: false, error: 'Symbol and exchange are required' });
    }
    
    const stock = await stockService.getStockDetail(symbol, exchange);
    if (!stock) {
      return res.status(404).json({ success: false, error: 'Stock not found' });
    }
    
    res.json({ success: true, data: stock });
  } catch (error) {
    console.error('Get stock detail error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stock detail' });
  }
});

module.exports = router;
