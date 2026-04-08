<template>
  <div class="trading-view">
    <!-- Top Bar -->
    <header class="trade-header">
      <div class="symbol-info">
        <h1>{{ symbol }}</h1>
        <span class="price" :class="priceChange >= 0 ? 'up' : 'down'">
          {{ currentPrice.toFixed(2) }} GSB
          <span class="change">{{ priceChange >= 0 ? '+' : '' }}{{ priceChange.toFixed(2) }}%</span>
        </span>
      </div>
      
      <div class="toolbar">
        <button @click="toggleFullscreen" class="tool-btn">⛶</button>
        <button @click="toggleTheme" class="tool-btn">🌓</button>
      </div>
    </header>

    <div class="main-content">
      <!-- Left: K-Line Chart -->
      <div class="chart-section">
        <div ref="chartContainer" class="chart-container"></div>
        
        <!-- Timeframe Selector -->
        <div class="timeframe-bar">
          <button 
            v-for="tf in timeframes" 
            :key="tf"
            :class="{ active: selectedTimeframe === tf }"
            @click="changeTimeframe(tf)"
          >
            {{ tf }}
          </button>
        </div>
      </div>

      <!-- Right: Order Book & Trading Panel -->
      <div class="right-panel">
        <!-- Level 2 Order Book -->
        <div class="orderbook">
          <h3>Level 2 盘口</h3>
          <div class="orderbook-header">
            <span>价格 (GSB)</span>
            <span>数量</span>
            <span>累计</span>
          </div>
          
          <!-- Asks (Sell Orders) -->
          <div class="asks">
            <div 
              v-for="(ask, idx) in asks" 
              :key="'ask-' + idx"
              class="order-row ask"
              :style="{ background: `rgba(255, 68, 68, ${ask.intensity})` }"
            >
              <span class="price">{{ ask.price.toFixed(2) }}</span>
              <span class="quantity">{{ ask.quantity.toLocaleString() }}</span>
              <span class="total">{{ ask.total.toLocaleString() }}</span>
            </div>
          </div>
          
          <!-- Spread -->
          <div class="spread">
            <span class="spread-price">{{ currentPrice.toFixed(2) }}</span>
            <span class="spread-label">Spread</span>
          </div>
          
          <!-- Bids (Buy Orders) -->
          <div class="bids">
            <div 
              v-for="(bid, idx) in bids" 
              :key="'bid-' + idx"
              class="order-row bid"
              :style="{ background: `rgba(68, 255, 136, ${bid.intensity})` }"
            >
              <span class="price">{{ bid.price.toFixed(2) }}</span>
              <span class="quantity">{{ bid.quantity.toLocaleString() }}</span>
              <span class="total">{{ bid.total.toLocaleString() }}</span>
            </div>
          </div>
        </div>

        <!-- Trading Form -->
        <div class="trade-form">
          <div class="form-tabs">
            <button 
              :class="{ active: orderSide === 'buy' }"
              @click="orderSide = 'buy'"
              class="tab-buy"
            >
              {{ t('trade.buy') }}
            </button>
            <button 
              :class="{ active: orderSide === 'sell' }"
              @click="orderSide = 'sell'"
              class="tab-sell"
            >
              {{ t('trade.sell') }}
            </button>
          </div>

          <div class="form-group">
            <label>{{ t('trade.price') }}</label>
            <input 
              type="number" 
              v-model.number="orderPrice" 
              :disabled="orderType === 'market'"
              class="input-field"
            />
          </div>

          <div class="form-group">
            <label>{{ t('trade.quantity') }}</label>
            <input 
              type="number" 
              v-model.number="orderQuantity" 
              class="input-field"
              @input="calculateTotal"
            />
          </div>

          <div class="form-group">
            <label>{{ t('trade.total') }}</label>
            <div class="total-display">{{ orderTotal.toFixed(2) }} GSB</div>
          </div>

          <div class="balance-info">
            {{ t('trade.balance') }}: <strong>{{ walletBalance.toLocaleString() }} GSB</strong>
          </div>

          <button 
            @click="submitOrder"
            :class="['submit-btn', orderSide]"
            :disabled="!canSubmit"
          >
            {{ t('trade.submit') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Bottom: Real-time Bullet Comments -->
    <div class="bullet-comments">
      <div class="bullet-header">
        <h4>实时弹幕</h4>
        <label class="toggle-switch">
          <input type="checkbox" v-model="showBullets" />
          <span class="slider"></span>
        </label>
      </div>
      
      <div v-if="showBullets" class="bullet-container" ref="bulletContainer">
        <div 
          v-for="bullet in bullets" 
          :key="bullet.id"
          class="bullet-item"
          :style="{ left: bullet.position + '%' }"
        >
          <span class="bullet-time">{{ bullet.time }}</span>
          <span class="bullet-text">{{ bullet.text }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { createChart } from 'lightweight-charts'
import { marketApi, tradeApi } from '../api'
import { useWalletStore } from '../stores'

const route = useRoute()
const { t } = useI18n()
const walletStore = useWalletStore()

const symbol = ref(decodeURIComponent(route.params.symbol))
const chartContainer = ref(null)
const bulletContainer = ref(null)

// Chart state
let chart = null
let candleSeries = null
const selectedTimeframe = ref('1D')
const timeframes = ['1m', '5m', '15m', '30m', '1H', '4H', '1D', '1W', '1M']

// Market data
const currentPrice = ref(150.00)
const priceChange = ref(0.5)
const asks = ref([])
const bids = ref([])

// Order form
const orderSide = ref('buy')
const orderType = ref('limit')
const orderPrice = ref(150.00)
const orderQuantity = ref(100)
const orderTotal = computed(() => orderPrice.value * orderQuantity.value)

// Wallet
const walletBalance = ref(100000000) // 1 亿初始资金

// Bullet comments
const showBullets = ref(true)
const bullets = ref([])
let bulletInterval = null

// Can submit validation
const canSubmit = computed(() => {
  if (!orderQuantity.value || orderQuantity.value <= 0) return false
  if (orderType.value === 'limit' && (!orderPrice.value || orderPrice.value <= 0)) return false
  
  const total = orderType.value === 'market' ? currentPrice.value * orderQuantity.value : orderTotal.value
  
  if (orderSide.value === 'buy') {
    return total <= walletBalance.value
  }
  return true
})

// Initialize K-Line Chart
const initChart = async () => {
  if (!chartContainer.value) return

  chart = createChart(chartContainer.value, {
    width: chartContainer.value.clientWidth,
    height: chartContainer.value.clientHeight - 40,
    layout: {
      backgroundColor: '#1a1a2e',
      textColor: '#d1d4dc'
    },
    grid: {
      vertLines: { color: 'rgba(42, 46, 57, 0.5)' },
      horzLines: { color: 'rgba(42, 46, 57, 0.5)' }
    },
    crosshair: {
      mode: 1
    },
    rightPriceScale: {
      borderColor: 'rgba(197, 203, 206, 0.8)'
    },
    timeScale: {
      borderColor: 'rgba(197, 203, 206, 0.8)',
      timeVisible: true,
      secondsVisible: false
    }
  })

  candleSeries = chart.addCandlestickSeries({
    upColor: '#26a69a',
    downColor: '#ef5350',
    borderVisible: false,
    wickUpColor: '#26a69a',
    wickDownColor: '#ef5350'
  })

  // Load historical data
  await loadCandleData()

  // Handle resize
  window.addEventListener('resize', handleResize)
}

const loadCandleData = async () => {
  try {
    const interval = selectedTimeframe.value.toLowerCase()
    const response = await marketApi.getCandles(symbol.value, interval, 200)
    
    const candles = response.data.data.map(item => ({
      time: item.timestamp / 1000,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close
    }))

    candleSeries.setData(candles)
    
    if (candles.length > 0) {
      currentPrice.value = candles[candles.length - 1].close
    }
  } catch (error) {
    console.error('Failed to load candle data:', error)
    // Mock data for demo
    loadMockData()
  }
}

const loadMockData = () => {
  const mockData = []
  const now = Math.floor(Date.now() / 1000)
  let price = 150
  
  for (let i = 200; i > 0; i--) {
    const time = now - (i * 86400)
    const change = (Math.random() - 0.5) * 5
    const open = price
    const close = price + change
    const high = Math.max(open, close) + Math.random() * 2
    const low = Math.min(open, close) - Math.random() * 2
    
    mockData.push({ time, open, high, low, close })
    price = close
  }
  
  candleSeries.setData(mockData)
  currentPrice.value = mockData[mockData.length - 1].close
}

const handleResize = () => {
  if (chart && chartContainer.value) {
    chart.applyOptions({
      width: chartContainer.value.clientWidth,
      height: chartContainer.value.clientHeight - 40
    })
  }
}

const changeTimeframe = (tf) => {
  selectedTimeframe.value = tf
  loadCandleData()
}

// Load Order Book
const loadOrderBook = async () => {
  try {
    const response = await marketApi.getDepth(symbol.value, 10)
    const depth = response.data.data
    
    asks.value = depth.asks.map((item, idx) => ({
      price: item.price,
      quantity: item.quantity,
      total: item.cumulative,
      intensity: (idx + 1) / depth.asks.length * 0.3
    })).reverse()
    
    bids.value = depth.bids.map((item, idx) => ({
      price: item.price,
      quantity: item.quantity,
      total: item.cumulative,
      intensity: (idx + 1) / depth.bids.length * 0.3
    }))
  } catch (error) {
    // Mock order book
    generateMockOrderBook()
  }
}

const generateMockOrderBook = () => {
  const basePrice = currentPrice.value
  
  asks.value = Array.from({ length: 10 }, (_, i) => {
    const price = basePrice + (i + 1) * 0.05
    const quantity = Math.floor(Math.random() * 1000) + 100
    return {
      price,
      quantity,
      total: quantity * (i + 1),
      intensity: (i + 1) / 10 * 0.3
    }
  }).reverse()
  
  bids.value = Array.from({ length: 10 }, (_, i) => {
    const price = basePrice - (i + 1) * 0.05
    const quantity = Math.floor(Math.random() * 1000) + 100
    return {
      price,
      quantity,
      total: quantity * (i + 1),
      intensity: (i + 1) / 10 * 0.3
    }
  })
}

// Submit Order
const submitOrder = async () => {
  try {
    const orderData = {
      symbol: symbol.value,
      side: orderSide.value,
      type: orderType.value,
      quantity: orderQuantity.value
    }
    
    if (orderType.value === 'limit') {
      orderData.price = orderPrice.value
    }
    
    const response = await tradeApi.createOrder(orderData)
    
    alert(`订单提交成功！订单号：${response.data.orderId}`)
    
    // Update balance
    const total = orderTotal.value
    if (orderSide.value === 'buy') {
      walletBalance.value -= total
    }
  } catch (error) {
    alert('订单提交失败：' + (error.response?.data?.message || error.message))
  }
}

const calculateTotal = () => {
  // Auto-calculate total when quantity changes
}

// Bullet Comments System
const startBulletStream = () => {
  const mockBullets = [
    '看涨！目标价 160',
    '支撑位很稳',
    '突破在即！',
    '短线回调正常',
    '长期持有',
    '量价齐升',
    '注意风险',
    '加仓机会',
    'MACD 金叉',
    'RSI 超买'
  ]
  
  bulletInterval = setInterval(() => {
    const randomText = mockBullets[Math.floor(Math.random() * mockBullets.length)]
    const now = new Date()
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    
    bullets.value.push({
      id: Date.now(),
      text: randomText,
      time: timeStr,
      position: 0
    })
    
    // Animate bullet
    setTimeout(() => {
      const bulletEl = document.querySelector(`.bullet-item:last-child`)
      if (bulletEl) {
        bulletEl.style.transition = 'left 8s linear'
        bulletEl.style.left = '100%'
      }
    }, 100)
    
    // Remove old bullets
    if (bullets.value.length > 20) {
      bullets.value.shift()
    }
  }, 2000)
}

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}

const toggleTheme = () => {
  // Theme toggle logic
  alert('主题切换功能开发中')
}

onMounted(async () => {
  await initChart()
  await loadOrderBook()
  startBulletStream()
  
  // Refresh order book every 3 seconds
  setInterval(loadOrderBook, 3000)
})

onUnmounted(() => {
  if (chart) {
    chart.remove()
    chart = null
  }
  if (bulletInterval) {
    clearInterval(bulletInterval)
  }
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped lang="scss">
.trading-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #0f0f1a;
  color: #fff;
}

.trade-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: #1a1a2e;
  border-bottom: 1px solid #2a2a3e;
  
  .symbol-info {
    h1 {
      margin: 0;
      font-size: 20px;
      color: #4a9eff;
    }
    
    .price {
      font-size: 18px;
      font-weight: 600;
      
      &.up { color: #26a69a; }
      &.down { color: #ef5350; }
      
      .change {
        font-size: 14px;
        margin-left: 8px;
      }
    }
  }
  
  .toolbar {
    display: flex;
    gap: 12px;
    
    .tool-btn {
      background: rgba(74, 158, 255, 0.2);
      border: none;
      color: #fff;
      padding: 8px 12px;
      border-radius: 4px;
      cursor: pointer;
      transition: background 0.3s;
      
      &:hover {
        background: rgba(74, 158, 255, 0.4);
      }
    }
  }
}

.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.chart-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #2a2a3e;
  
  .chart-container {
    flex: 1;
    min-height: 400px;
  }
  
  .timeframe-bar {
    display: flex;
    gap: 4px;
    padding: 8px 12px;
    background: #1a1a2e;
    border-top: 1px solid #2a2a3e;
    
    button {
      background: transparent;
      border: none;
      color: rgba(255,255,255,0.6);
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
      transition: all 0.3s;
      
      &:hover {
        background: rgba(74, 158, 255, 0.2);
        color: #fff;
      }
      
      &.active {
        background: #4a9eff;
        color: #fff;
      }
    }
  }
}

.right-panel {
  width: 340px;
  display: flex;
  flex-direction: column;
  background: #1a1a2e;
}

.orderbook {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
  border-bottom: 1px solid #2a2a3e;
  
  h3 {
    margin: 0 0 12px 0;
    font-size: 14px;
    color: rgba(255,255,255,0.8);
  }
  
  .orderbook-header {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 8px;
    padding: 6px 8px;
    font-size: 11px;
    color: rgba(255,255,255,0.5);
    border-bottom: 1px solid #2a2a3e;
  }
  
  .asks, .bids {
    .order-row {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 8px;
      padding: 4px 8px;
      font-size: 12px;
      cursor: pointer;
      transition: background 0.2s;
      
      &:hover {
        filter: brightness(1.2);
      }
      
      .price {
        font-weight: 600;
      }
      
      &.ask .price { color: #ef5350; }
      &.bid .price { color: #26a69a; }
    }
  }
  
  .spread {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px;
    margin: 4px 0;
    background: rgba(74, 158, 255, 0.1);
    border-radius: 4px;
    
    .spread-price {
      font-size: 16px;
      font-weight: 700;
      color: #4a9eff;
    }
    
    .spread-label {
      font-size: 11px;
      color: rgba(255,255,255,0.5);
    }
  }
}

.trade-form {
  padding: 16px;
  border-top: 1px solid #2a2a3e;
  
  .form-tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
    
    button {
      flex: 1;
      padding: 10px;
      border: none;
      border-radius: 4px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
      
      &.tab-buy {
        background: rgba(38, 166, 154, 0.2);
        color: #26a69a;
        
        &.active {
          background: #26a69a;
          color: #fff;
        }
      }
      
      &.tab-sell {
        background: rgba(239, 83, 80, 0.2);
        color: #ef5350;
        
        &.active {
          background: #ef5350;
          color: #fff;
        }
      }
    }
  }
  
  .form-group {
    margin-bottom: 12px;
    
    label {
      display: block;
      font-size: 12px;
      color: rgba(255,255,255,0.6);
      margin-bottom: 6px;
    }
    
    .input-field {
      width: 100%;
      padding: 10px;
      background: rgba(255,255,255,0.05);
      border: 1px solid #2a2a3e;
      border-radius: 4px;
      color: #fff;
      font-size: 14px;
      outline: none;
      
      &:focus {
        border-color: #4a9eff;
      }
      
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
    
    .total-display {
      padding: 10px;
      background: rgba(74, 158, 255, 0.1);
      border-radius: 4px;
      font-size: 14px;
      color: #4a9eff;
      font-weight: 600;
    }
  }
  
  .balance-info {
    font-size: 12px;
    color: rgba(255,255,255,0.6);
    margin-bottom: 16px;
    
    strong {
      color: #ffd700;
    }
  }
  
  .submit-btn {
    width: 100%;
    padding: 12px;
    border: none;
    border-radius: 4px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
    
    &.buy {
      background: #26a69a;
      color: #fff;
      
      &:hover:not(:disabled) {
        background: #219688;
      }
    }
    
    &.sell {
      background: #ef5350;
      color: #fff;
      
      &:hover:not(:disabled) {
        background: #e04d4a;
      }
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

.bullet-comments {
  height: 120px;
  background: #1a1a2e;
  border-top: 1px solid #2a2a3e;
  padding: 12px 24px;
  overflow: hidden;
  
  .bullet-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    
    h4 {
      margin: 0;
      font-size: 14px;
      color: rgba(255,255,255,0.8);
    }
    
    .toggle-switch {
      position: relative;
      display: inline-block;
      width: 40px;
      height: 20px;
      
      input {
        opacity: 0;
        width: 0;
        height: 0;
        
        &:checked + .slider {
          background: #4a9eff;
        }
        
        &:checked + .slider:before {
          transform: translateX(20px);
        }
      }
      
      .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255,255,255,0.2);
        border-radius: 20px;
        transition: 0.3s;
        
        &:before {
          position: absolute;
          content: '';
          height: 16px;
          width: 16px;
          left: 2px;
          bottom: 2px;
          background: #fff;
          border-radius: 50%;
          transition: 0.3s;
        }
      }
    }
  }
  
  .bullet-container {
    position: relative;
    height: 60px;
    overflow: hidden;
    
    .bullet-item {
      position: absolute;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      background: rgba(74, 158, 255, 0.2);
      border-radius: 20px;
      font-size: 13px;
      white-space: nowrap;
      top: 10px;
      
      .bullet-time {
        font-size: 11px;
        color: rgba(255,255,255,0.6);
      }
      
      .bullet-text {
        color: #fff;
      }
    }
  }
}
</style>
