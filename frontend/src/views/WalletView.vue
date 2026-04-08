<template>
  <div class="wallet-view">
    <div class="wallet-header">
      <h1>{{ t('nav.wallet') }}</h1>
      <button @click="$router.push('/')">← 返回地球</button>
    </div>

    <div class="wallet-content">
      <!-- Balance Card -->
      <div class="balance-card">
        <div class="balance-label">总余额</div>
        <div class="balance-amount">{{ balance.toLocaleString() }} GSB</div>
        <div class="balance-sub">≈ $0.00 USD (模拟盘)</div>
      </div>

      <!-- Actions -->
      <div class="actions-grid">
        <button @click="showTransfer = true" class="action-btn">
          <span class="icon">💸</span>
          <span>转账</span>
        </button>
        <button @click="showDeposit = true" class="action-btn">
          <span class="icon">📥</span>
          <span>充值</span>
        </button>
        <button @click="showWithdraw = true" class="action-btn">
          <span class="icon">📤</span>
          <span>提现</span>
        </button>
        <button @click="exportStatements" class="action-btn">
          <span class="icon">📊</span>
          <span>导出报表</span>
        </button>
      </div>

      <!-- Asset Allocation -->
      <div class="allocation-section">
        <h3>资产分布</h3>
        <div class="allocation-chart">
          <div class="chart-placeholder">
            📈 资产占比图表开发中
          </div>
        </div>
      </div>

      <!-- Transaction History -->
      <div class="transactions-section">
        <h3>交易流水</h3>
        <div class="transaction-list">
          <div 
            v-for="tx in transactions" 
            :key="tx.id"
            class="transaction-item"
          >
            <div class="tx-icon" :class="tx.type">
              {{ tx.type === 'deposit' ? '📥' : tx.type === 'withdraw' ? '📤' : '💸' }}
            </div>
            <div class="tx-details">
              <div class="tx-title">{{ tx.description }}</div>
              <div class="tx-time">{{ new Date(tx.createdAt).toLocaleString() }}</div>
            </div>
            <div class="tx-amount" :class="tx.amount > 0 ? 'positive' : 'negative'">
              {{ tx.amount > 0 ? '+' : '' }}{{ tx.amount.toLocaleString() }} GSB
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Transfer Modal -->
    <div v-if="showTransfer" class="modal-overlay" @click="showTransfer = false">
      <div class="modal" @click.stop>
        <h2>转账</h2>
        <div class="form-group">
          <label>收款地址</label>
          <input type="text" v-model="transferAddress" placeholder="输入用户 ID 或钱包地址" />
        </div>
        <div class="form-group">
          <label>金额 (GSB)</label>
          <input type="number" v-model.number="transferAmount" placeholder="0" />
        </div>
        <div class="form-group">
          <label>备注</label>
          <input type="text" v-model="transferMemo" placeholder="可选" />
        </div>
        <div class="limit-info">
          限额：50 亿 GSB/日 | 20 次/日
        </div>
        <div class="modal-actions">
          <button @click="showTransfer = false" class="btn-cancel">取消</button>
          <button @click="submitTransfer" class="btn-confirm">确认转账</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { walletApi } from '../api'

const { t } = useI18n()

const balance = ref(100000000) // 1 亿初始资金
const transactions = ref([])
const showTransfer = ref(false)
const transferAddress = ref('')
const transferAmount = ref(null)
const transferMemo = ref('')

// Mock transactions
const loadTransactions = async () => {
  try {
    const response = await walletApi.getTransactions({ limit: 20 })
    transactions.value = response.data.data
  } catch (error) {
    // Mock data
    transactions.value = [
      {
        id: 1,
        type: 'deposit',
        description: '新用户注册奖励',
        amount: 100000000,
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        type: 'trade',
        description: '买入 AAPL/GSB',
        amount: -15050,
        createdAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 3,
        type: 'trade',
        description: '卖出 TSLA/GSB',
        amount: 25300,
        createdAt: new Date(Date.now() - 172800000).toISOString()
      }
    ]
  }
}

const submitTransfer = async () => {
  if (!transferAddress.value || !transferAmount.value) {
    alert('请填写完整信息')
    return
  }
  
  if (transferAmount.value > 5000000000) {
    alert('超过单笔限额 50 亿 GSB')
    return
  }
  
  if (transferAmount.value > balance.value) {
    alert('余额不足')
    return
  }
  
  try {
    await walletApi.transfer({
      to: transferAddress.value,
      amount: transferAmount.value,
      memo: transferMemo.value
    })
    
    alert('转账成功！')
    showTransfer.value = false
    balance.value -= transferAmount.value
    
    // Add to transaction list
    transactions.value.unshift({
      id: Date.now(),
      type: 'transfer',
      description: `转账给 ${transferAddress.value}`,
      amount: -transferAmount.value,
      createdAt: new Date().toISOString()
    })
    
    // Reset form
    transferAddress.value = ''
    transferAmount.value = null
    transferMemo.value = ''
  } catch (error) {
    alert('转账失败：' + (error.response?.data?.message || error.message))
  }
}

const exportStatements = () => {
  alert('报表导出功能开发中，将生成 CSV/PDF 格式流水单')
}

onMounted(() => {
  loadTransactions()
})
</script>

<style scoped lang="scss">
.wallet-view {
  min-height: 100vh;
  background: #0f0f1a;
  color: #fff;
  padding: 24px;
}

.wallet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  
  h1 {
    font-size: 28px;
    color: #4a9eff;
  }
  
  button {
    background: transparent;
    border: 1px solid #4a9eff;
    color: #4a9eff;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s;
    
    &:hover {
      background: rgba(74, 158, 255, 0.2);
    }
  }
}

.wallet-content {
  max-width: 800px;
  margin: 0 auto;
}

.balance-card {
  background: linear-gradient(135deg, #1a1a2e 0%, #2a2a3e 100%);
  border: 1px solid rgba(74, 158, 255, 0.3);
  border-radius: 16px;
  padding: 32px;
  text-align: center;
  margin-bottom: 32px;
  
  .balance-label {
    font-size: 14px;
    color: rgba(255,255,255,0.6);
    margin-bottom: 8px;
  }
  
  .balance-amount {
    font-size: 42px;
    font-weight: 700;
    color: #ffd700;
    margin-bottom: 8px;
  }
  
  .balance-sub {
    font-size: 12px;
    color: rgba(255,255,255,0.4);
  }
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 32px;
  
  .action-btn {
    background: rgba(74, 158, 255, 0.1);
    border: 1px solid rgba(74, 158, 255, 0.2);
    border-radius: 12px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    transition: all 0.3s;
    
    &:hover {
      background: rgba(74, 158, 255, 0.2);
      transform: translateY(-2px);
    }
    
    .icon {
      font-size: 32px;
    }
    
    span:last-child {
      font-size: 14px;
      color: rgba(255,255,255,0.8);
    }
  }
}

.allocation-section,
.transactions-section {
  background: #1a1a2e;
  border: 1px solid #2a2a3e;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  
  h3 {
    font-size: 18px;
    color: rgba(255,255,255,0.8);
    margin-bottom: 20px;
  }
}

.allocation-chart {
  .chart-placeholder {
    background: rgba(74, 158, 255, 0.05);
    border: 2px dashed rgba(74, 158, 255, 0.3);
    border-radius: 8px;
    padding: 60px;
    text-align: center;
    color: rgba(255,255,255,0.4);
    font-size: 16px;
  }
}

.transaction-list {
  .transaction-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    border-bottom: 1px solid #2a2a3e;
    
    &:last-child {
      border-bottom: none;
    }
    
    .tx-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      
      &.deposit { background: rgba(38, 166, 154, 0.2); }
      &.withdraw { background: rgba(239, 83, 80, 0.2); }
      &.transfer { background: rgba(74, 158, 255, 0.2); }
      &.trade { background: rgba(255, 193, 7, 0.2); }
    }
    
    .tx-details {
      flex: 1;
      
      .tx-title {
        font-size: 14px;
        color: rgba(255,255,255,0.8);
        margin-bottom: 4px;
      }
      
      .tx-time {
        font-size: 12px;
        color: rgba(255,255,255,0.4);
      }
    }
    
    .tx-amount {
      font-size: 16px;
      font-weight: 600;
      
      &.positive { color: #26a69a; }
      &.negative { color: #ef5350; }
    }
  }
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  
  .modal {
    background: #1a1a2e;
    border: 1px solid #2a2a3e;
    border-radius: 12px;
    padding: 32px;
    width: 100%;
    max-width: 400px;
    
    h2 {
      margin: 0 0 24px 0;
      font-size: 22px;
      color: #4a9eff;
    }
    
    .form-group {
      margin-bottom: 20px;
      
      label {
        display: block;
        font-size: 13px;
        color: rgba(255,255,255,0.6);
        margin-bottom: 8px;
      }
      
      input {
        width: 100%;
        padding: 12px;
        background: rgba(255,255,255,0.05);
        border: 1px solid #2a2a3e;
        border-radius: 6px;
        color: #fff;
        font-size: 14px;
        outline: none;
        
        &:focus {
          border-color: #4a9eff;
        }
      }
    }
    
    .limit-info {
      font-size: 12px;
      color: rgba(255,255,255,0.4);
      margin-bottom: 24px;
      padding: 8px;
      background: rgba(255, 193, 7, 0.1);
      border-radius: 4px;
    }
    
    .modal-actions {
      display: flex;
      gap: 12px;
      
      button {
        flex: 1;
        padding: 12px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s;
        
        &.btn-cancel {
          background: rgba(255,255,255,0.1);
          color: #fff;
          
          &:hover {
            background: rgba(255,255,255,0.2);
          }
        }
        
        &.btn-confirm {
          background: #4a9eff;
          color: #fff;
          
          &:hover {
            background: #3a8eef;
          }
        }
      }
    }
  }
}
</style>
