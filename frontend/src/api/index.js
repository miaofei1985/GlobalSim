import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const getStoredToken = () =>
  localStorage.getItem('token') ||
  sessionStorage.getItem('token') ||
  localStorage.getItem('globalsim_token') ||
  sessionStorage.getItem('globalsim_token')

const clearStoredAuth = () => {
  localStorage.removeItem('token')
  sessionStorage.removeItem('token')
  localStorage.removeItem('globalsim_token')
  sessionStorage.removeItem('globalsim_token')
  localStorage.removeItem('user')
  sessionStorage.removeItem('user')
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

apiClient.interceptors.request.use(
  (config) => {
    const token = getStoredToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearStoredAuth()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  getCaptcha: () => apiClient.get('/auth/captcha'),
  sendCode: (email, locale) =>
    apiClient.post(
      '/auth/send-code',
      typeof email === 'object' ? email : { email, locale }
    ),
  register: (data) => apiClient.post('/auth/register', data),
  login: (data) => apiClient.post('/auth/login', data),
  verify: (data) => apiClient.post('/auth/verify', data),
  resendCode: (email, locale) =>
    apiClient.post(
      '/auth/resend-code',
      typeof email === 'object' ? email : { email, locale }
    )
}

export const marketApi = {
  getCandles: (symbol, interval = '1d', limit = 100) =>
    apiClient.get('/market/candles', { params: { symbol, interval, limit } }),
  getDepth: (symbol, limit = 5) =>
    apiClient.get('/market/depth', { params: { symbol, limit } }),
  getIndices: (params = {}) =>
    apiClient.get('/market/indices', { params }),
  getStocks: (params) =>
    apiClient.get('/market/stocks', { params }),
  getSectors: (exchange) =>
    apiClient.get('/market/sectors', { params: { exchange } }),
  getStockDetail: (symbol, exchange) =>
    apiClient.get(`/market/stocks/${symbol}`, { params: { exchange } })
}

export const tradeApi = {
  createOrder: (data) => apiClient.post('/trade/orders', data),
  cancelOrder: (id) => apiClient.delete(`/trade/orders/${id}`),
  getOrders: (params) => apiClient.get('/trade/orders', { params })
}

export const walletApi = {
  getBalance: () => apiClient.get('/wallet/balance'),
  getTransactions: (params) => apiClient.get('/wallet/transactions', { params }),
  transfer: (data) => apiClient.post('/wallet/transfer', data)
}

export default apiClient
