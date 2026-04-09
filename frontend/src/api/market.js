import axios from './axios';

export const marketApi = {
  // 获取 K 线数据
  getCandles(params) {
    return axios.get('/market/candles', { params });
  },

  // 获取深度数据
  getDepth(params) {
    return axios.get('/market/depth', { params });
  },

  // 获取股票列表 (新增)
  getStocks(params) {
    return axios.get('/market/stocks', { params });
  },

  // 获取板块列表 (新增)
  getSectors(exchange) {
    return axios.get('/market/sectors', { params: { exchange } });
  },

  // 获取个股详情 (新增)
  getStockDetail(symbol, exchange) {
    return axios.get(`/market/stocks/${symbol}`, { params: { exchange } });
  }
};
