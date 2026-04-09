<template>
  <div class="stock-list-panel">
    <!-- 顶部 Tab 导航 -->
    <div class="tabs-header">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        :class="['tab-btn', { active: currentTab === tab.id }]"
        @click="currentTab = tab.id; fetchStocks()"
      >
        {{ t(`stocks.tabs.${tab.id}`) }}
      </button>
      
      <!-- 板块下拉选择 (仅在热门板块 Tab 显示) -->
      <select 
        v-if="currentTab === 'sectors'" 
        v-model="selectedSector"
        @change="fetchStocks()"
        class="sector-select"
      >
        <option value="">{{ t('stocks.allSectors') }}</option>
        <option v-for="sector in sectors" :key="sector" :value="sector">
          {{ t(`sectors.${sector}`) || sector }}
        </option>
      </select>
    </div>

    <!-- 股票列表表格 -->
    <div class="stock-table-container">
      <table v-if="stocks.length > 0" class="stock-table">
        <thead>
          <tr>
            <th>{{ t('stocks.symbol') }}</th>
            <th>{{ t('stocks.name') }}</th>
            <th class="text-right">{{ t('stocks.price') }}</th>
            <th class="text-right">{{ t('stocks.changePercent') }}</th>
            <th class="text-right hide-mobile">{{ t('stocks.volume') }}</th>
            <th class="text-right hide-mobile">{{ t('stocks.marketCap') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="stock in stocks" 
            :key="stock.symbol"
            :class="['stock-row', { selected: selectedStock?.symbol === stock.symbol }]"
            @click="selectStock(stock)"
          >
            <td class="symbol-cell">
              <span class="symbol">{{ stock.symbol }}</span>
            </td>
            <td>
              <div class="stock-name">
                <span class="name-en">{{ stock.name_en }}</span>
                <span v-if="stock.name_cn" class="name-cn">{{ stock.name_cn }}</span>
              </div>
            </td>
            <td class="text-right price">{{ formatPrice(stock.price) }}</td>
            <td :class="['text-right', 'change', stock.change_percent >= 0 ? 'up' : 'down']">
              {{ stock.change_percent >= 0 ? '+' : '' }}{{ stock.change_percent.toFixed(2) }}%
            </td>
            <td class="text-right hide-mobile">{{ formatVolume(stock.volume) }}</td>
            <td class="text-right hide-mobile">{{ formatMarketCap(stock.market_cap) }}</td>
          </tr>
        </tbody>
      </table>

      <!-- 加载状态 -->
      <div v-else-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>{{ t('common.loading') }}</p>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <p>{{ t('stocks.noData') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { marketApi } from '@/api/market';

const props = defineProps({
  exchange: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['select-stock']);

const { t } = useI18n();

// Tab 配置
const tabs = [
  { id: 'all', label: '全部' },
  { id: 'hot', label: '热门' },
  { id: 'rising', label: '涨幅榜' },
  { id: 'volume', label: '成交榜' },
  { id: 'sectors', label: '板块' }
];

const currentTab = ref('all');
const selectedSector = ref('');
const sectors = ref([]);
const stocks = ref([]);
const loading = ref(false);
const selectedStock = ref(null);

// 获取股票列表
const fetchStocks = async () => {
  if (!props.exchange) return;
  
  loading.value = true;
  try {
    const params = {
      exchange: props.exchange,
      tab: currentTab.value
    };
    
    if (currentTab.value === 'sectors' && selectedSector.value) {
      params.sector = selectedSector.value;
    }
    
    const res = await marketApi.getStocks(params);
    if (res.success) {
      stocks.value = res.data;
      
      // 如果是板块 Tab，先获取板块列表
      if (currentTab.value === 'sectors' && sectors.value.length === 0) {
        const sectorRes = await marketApi.getSectors(props.exchange);
        if (sectorRes.success) {
          sectors.value = sectorRes.data;
        }
      }
    }
  } catch (error) {
    console.error('Failed to fetch stocks:', error);
  } finally {
    loading.value = false;
  }
};

// 选择股票
const selectStock = (stock) => {
  selectedStock.value = stock;
  emit('select-stock', stock);
};

// 格式化价格
const formatPrice = (price) => {
  if (!price) return '--';
  return price.toFixed(2);
};

// 格式化成交量
const formatVolume = (volume) => {
  if (!volume) return '--';
  if (volume >= 1e9) return (volume / 1e9).toFixed(2) + 'B';
  if (volume >= 1e6) return (volume / 1e6).toFixed(2) + 'M';
  if (volume >= 1e3) return (volume / 1e3).toFixed(2) + 'K';
  return volume.toString();
};

// 格式化市值
const formatMarketCap = (cap) => {
  if (!cap) return '--';
  if (cap >= 1e12) return (cap / 1e12).toFixed(2) + 'T';
  if (cap >= 1e9) return (cap / 1e9).toFixed(2) + 'B';
  if (cap >= 1e6) return (cap / 1e6).toFixed(2) + 'M';
  return cap.toString();
};

// 监听交易所变化
watch(() => props.exchange, (newVal) => {
  if (newVal) {
    sectors.value = [];
    selectedSector.value = '';
    fetchStocks();
  }
});

onMounted(() => {
  fetchStocks();
});
</script>

<style scoped lang="scss">
.stock-list-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: rgba(13, 17, 23, 0.85);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  overflow: hidden;
}

.tabs-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-wrap: wrap;
}

.tab-btn {
  padding: 6px 14px;
  background: transparent;
  border: 1px solid rgba(0, 243, 255, 0.3);
  color: #a0aec0;
  border-radius: 20px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.3s;
  
  &:hover {
    background: rgba(0, 243, 255, 0.1);
    color: #00f3ff;
  }
  
  &.active {
    background: rgba(0, 243, 255, 0.2);
    border-color: #00f3ff;
    color: #00f3ff;
    font-weight: 600;
  }
}

.sector-select {
  margin-left: auto;
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  
  option {
    background: #1a202c;
    color: #e2e8f0;
  }
}

.stock-table-container {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.stock-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  
  th {
    text-align: left;
    padding: 10px 12px;
    color: #718096;
    font-weight: 500;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    position: sticky;
    top: 0;
    background: rgba(13, 17, 23, 0.95);
  }
  
  .text-right {
    text-align: right;
  }
  
  tbody tr {
    cursor: pointer;
    transition: background 0.2s;
    
    &:hover {
      background: rgba(0, 243, 255, 0.05);
    }
    
    &.selected {
      background: rgba(0, 243, 255, 0.1);
    }
    
    td {
      padding: 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
  }
}

.symbol-cell {
  .symbol {
    font-weight: 700;
    color: #00f3ff;
    font-family: 'Courier New', monospace;
  }
}

.stock-name {
  display: flex;
  flex-direction: column;
  gap: 2px;
  
  .name-en {
    font-weight: 500;
    color: #e2e8f0;
  }
  
  .name-cn {
    font-size: 11px;
    color: #718096;
  }
}

.change {
  font-weight: 600;
  
  &.up {
    color: #00ff88;
  }
  
  &.down {
    color: #ff4d4d;
  }
}

.price {
  color: #e2e8f0;
  font-family: 'Courier New', monospace;
}

.hide-mobile {
  @media (max-width: 768px) {
    display: none;
  }
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #718096;
  
  p {
    margin-top: 16px;
    font-size: 14px;
  }
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(0, 243, 255, 0.2);
  border-top-color: #00f3ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
