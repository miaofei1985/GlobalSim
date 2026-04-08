import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  register: (data) => apiClient.post('/auth/register', data),
  login: (data) => apiClient.post('/auth/login', data),
  verify: (data) => apiClient.post('/auth/verify', data),
  resendCode: (email) => apiClient.post('/auth/resend-code', { email })
}

export const marketApi = {
  getCandles: (symbol, interval = '1d', limit = 100) => 
    apiClient.get('/market/candles', { params: { symbol, interval, limit } }),
  getDepth: (symbol, limit = 5) => 
    apiClient.get('/market/depth', { params: { symbol, limit } })
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
