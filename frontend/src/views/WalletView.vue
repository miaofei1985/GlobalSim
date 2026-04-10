<template>
  <div class="wallet-view">
    <div class="wallet-header">
      <div>
        <h1>{{ t('nav.wallet') }}</h1>
        <p class="header-subtitle">钱包地址、余额和流水现在都走真实接口</p>
      </div>
      <div class="header-actions">
        <button @click="refreshWalletData" :disabled="loading">
          {{ loading ? '刷新中...' : '刷新' }}
        </button>
        <button @click="router.push('/')">返回地球</button>
      </div>
    </div>

    <div class="wallet-content">
      <div v-if="error" class="status-banner error">
        {{ error }}
      </div>
      <div v-else-if="notice" class="status-banner notice">
        {{ notice }}
      </div>

      <div class="balance-card">
        <div class="balance-label">钱包总余额</div>
        <div class="balance-amount">
          {{ loading ? '--' : formatAmount(balance) }} GSB
        </div>
        <div class="balance-sub">
          可用 {{ formatAmount(availableBalance) }} GSB
          <span class="dot">•</span>
          冻结 {{ formatAmount(frozenBalance) }} GSB
        </div>

        <div class="address-card">
          <div class="address-label">钱包地址</div>
          <div class="address-value">{{ walletAddress }}</div>
          <button
            class="copy-btn"
            @click="copyAddress"
            :disabled="!hasWalletAddress"
          >
            复制地址
          </button>
        </div>

        <div class="meta-grid">
          <div class="meta-item">
            <span>币种</span>
            <strong>{{ wallet?.currency || 'GSB' }}</strong>
          </div>
          <div class="meta-item">
            <span>最后刷新</span>
            <strong>{{ formatTime(lastRefreshAt) }}</strong>
          </div>
          <div class="meta-item">
            <span>钱包更新时间</span>
            <strong>{{ formatTime(wallet?.updatedAt || wallet?.updated_at) }}</strong>
          </div>
        </div>
      </div>

      <div class="actions-grid">
        <button @click="showTransfer = true" class="action-btn">
          <span class="icon">💸</span>
          <span>站内转账</span>
        </button>
        <button @click="showFeatureNotice('deposit')" class="action-btn">
          <span class="icon">📥</span>
          <span>充值</span>
        </button>
        <button @click="showFeatureNotice('withdraw')" class="action-btn">
          <span class="icon">📤</span>
          <span>提现</span>
        </button>
        <button @click="showFeatureNotice('export')" class="action-btn">
          <span class="icon">📊</span>
          <span>导出报表</span>
        </button>
      </div>

      <div class="transactions-section">
        <div class="section-head">
          <h3>交易流水</h3>
          <span>{{ transactions.length }} 条</span>
        </div>

        <div v-if="loading" class="empty-state">
          正在加载钱包数据...
        </div>

        <div v-else-if="!transactions.length" class="empty-state">
          还没有交易流水，首次进入会自动生成钱包地址和初始资金。
        </div>

        <div v-else class="transaction-list">
          <div
            v-for="tx in transactions"
            :key="tx.id"
            class="transaction-item"
          >
            <div class="tx-icon" :class="tx.type">
              {{ getTransactionIcon(tx.type) }}
            </div>
            <div class="tx-details">
              <div class="tx-title">{{ tx.description || getTransactionLabel(tx.type) }}</div>
              <div class="tx-time">{{ formatTime(tx.createdAt || tx.created_at) }}</div>
              <div v-if="tx.referenceId || tx.reference_id" class="tx-ref">
                {{ tx.referenceId || tx.reference_id }}
              </div>
            </div>
            <div class="tx-side">
              <div class="tx-amount" :class="getAmountClass(tx.amount)">
                {{ formatSignedAmount(tx.amount) }} GSB
              </div>
              <div class="tx-balance">
                余额 {{ formatAmount(tx.balanceAfter || tx.balance_after) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showTransfer" class="modal-overlay" @click="closeTransfer">
      <div class="modal" @click.stop>
        <h2>站内转账</h2>
        <div class="form-group">
          <label>收款地址 / 用户 ID / 邮箱</label>
          <input
            type="text"
            v-model.trim="transferAddress"
            placeholder="例如 GSB-XXXX / 2 / user@example.com"
          />
        </div>
        <div class="form-group">
          <label>金额 (GSB)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            v-model="transferAmount"
            placeholder="0.00"
          />
        </div>
        <div class="form-group">
          <label>备注</label>
          <input
            type="text"
            maxlength="120"
            v-model.trim="transferMemo"
            placeholder="可选"
          />
        </div>
        <div class="limit-info">
          单笔上限 50 亿 GSB，每日最多 20 笔。
        </div>
        <div class="modal-actions">
          <button @click="closeTransfer" class="btn-cancel">取消</button>
          <button
            @click="submitTransfer"
            class="btn-confirm"
            :disabled="submitting"
          >
            {{ submitting ? '提交中...' : '确认转账' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { walletApi } from '../api'

const { t } = useI18n()
const router = useRouter()

const wallet = ref(null)
const transactions = ref([])
const loading = ref(true)
const submitting = ref(false)
const error = ref('')
const notice = ref('')
const lastRefreshAt = ref(null)

const showTransfer = ref(false)
const transferAddress = ref('')
const transferAmount = ref('')
const transferMemo = ref('')

const balance = computed(() => Number(wallet.value?.balance || 0))
const availableBalance = computed(() => Number(wallet.value?.availableBalance || 0))
const frozenBalance = computed(() => Number(wallet.value?.frozenBalance || 0))
const walletAddress = computed(() => wallet.value?.address || '未生成')
const hasWalletAddress = computed(() => Boolean(wallet.value?.address))

const normalizeWallet = (rawWallet = {}) => {
  const normalizedBalance = Number(rawWallet.balance || 0)
  const normalizedFrozenBalance = Number(
    rawWallet.frozenBalance ?? rawWallet.frozen_balance ?? 0
  )
  const normalizedAvailableBalance = Number(
    rawWallet.availableBalance ??
      rawWallet.available_balance ??
      normalizedBalance - normalizedFrozenBalance
  )

  return {
    ...rawWallet,
    balance: normalizedBalance,
    frozenBalance: normalizedFrozenBalance,
    availableBalance: normalizedAvailableBalance,
    address: rawWallet.address || null
  }
}

const normalizeTransactions = (items = []) =>
  items.map((item) => ({
    ...item,
    amount: Number(item.amount || 0),
    balanceAfter: Number(item.balanceAfter ?? item.balance_after ?? 0)
  }))

const formatAmount = (value) =>
  new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(Number(value || 0))

const formatSignedAmount = (value) => {
  const amount = Number(value || 0)
  const sign = amount > 0 ? '+' : ''
  return `${sign}${formatAmount(amount)}`
}

const formatTime = (value) => {
  if (!value) {
    return '--'
  }

  return new Date(value).toLocaleString()
}

const getAmountClass = (value) => (Number(value) >= 0 ? 'positive' : 'negative')

const getTransactionIcon = (type) => {
  const iconMap = {
    deposit: '📥',
    withdraw: '📤',
    transfer_in: '📨',
    transfer_out: '💸',
    trade: '📈'
  }

  return iconMap[type] || '🧾'
}

const getTransactionLabel = (type) => {
  const labelMap = {
    deposit: '资金转入',
    withdraw: '资金转出',
    transfer_in: '收到转账',
    transfer_out: '发起转账',
    trade: '交易结算'
  }

  return labelMap[type] || '钱包流水'
}

const setNotice = (message) => {
  notice.value = message
  error.value = ''
}

const setError = (message) => {
  error.value = message
  notice.value = ''
}

const clearMessages = () => {
  error.value = ''
  notice.value = ''
}

const copyWithFallback = async (text) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'absolute'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
}

const copyAddress = async () => {
  if (!wallet.value?.address) {
    setError('钱包地址还没有生成，请先刷新钱包数据。')
    return
  }

  try {
    await copyWithFallback(wallet.value.address)
    setNotice('钱包地址已复制。')
  } catch (copyError) {
    setError('复制失败，请手动复制钱包地址。')
  }
}

const loadWallet = async () => {
  const response = await walletApi.getBalance()
  const payload = response.data?.data || response.data || {}
  wallet.value = normalizeWallet(payload.wallet || payload)
  lastRefreshAt.value = new Date().toISOString()

  if (payload.created) {
    setNotice('已自动为当前账号生成钱包地址和初始资金。')
  }
}

const loadTransactions = async () => {
  const response = await walletApi.getTransactions({ limit: 50 })
  const payload = response.data?.data || response.data || {}
  transactions.value = normalizeTransactions(
    payload.transactions || payload.items || payload
  )
}

const refreshWalletData = async () => {
  loading.value = true

  try {
    clearMessages()
    await loadWallet()
    await loadTransactions()
  } catch (requestError) {
    setError(
      requestError.response?.data?.error ||
        requestError.response?.data?.message ||
        '钱包数据加载失败，请重新登录后再试。'
    )
  } finally {
    loading.value = false
  }
}

const closeTransfer = () => {
  showTransfer.value = false
  transferAddress.value = ''
  transferAmount.value = ''
  transferMemo.value = ''
}

const submitTransfer = async () => {
  const amount = Number(transferAmount.value)

  if (!transferAddress.value) {
    setError('请填写收款地址、用户 ID 或邮箱。')
    return
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    setError('请输入正确的转账金额。')
    return
  }

  if (amount > 5000000000) {
    setError('超过单笔限额 50 亿 GSB。')
    return
  }

  if (amount > availableBalance.value) {
    setError('可用余额不足。')
    return
  }

  try {
    submitting.value = true
    clearMessages()

    const response = await walletApi.transfer({
      to: transferAddress.value,
      amount,
      memo: transferMemo.value
    })

    const payload = response.data?.data || response.data || {}
    if (payload.wallet) {
      wallet.value = normalizeWallet(payload.wallet)
    }

    await loadTransactions()
    closeTransfer()
    lastRefreshAt.value = new Date().toISOString()
    setNotice(
      `转账成功，已转给 ${payload.transfer?.recipient?.address || transferAddress.value}。`
    )
  } catch (requestError) {
    setError(
      requestError.response?.data?.error ||
        requestError.response?.data?.message ||
        '转账失败，请稍后重试。'
    )
  } finally {
    submitting.value = false
  }
}

const showFeatureNotice = (feature) => {
  const messages = {
    deposit: '当前钱包只开放站内转账，外部充值功能暂未开启。',
    withdraw: '当前钱包只开放站内转账，外部提现功能暂未开启。',
    export: '报表导出功能还在开发中，稍后会补上。'
  }

  setNotice(messages[feature] || '该功能暂未开启。')
}

onMounted(() => {
  refreshWalletData()
})
</script>

<style scoped lang="scss">
.wallet-view {
  min-height: 100vh;
  background:
    radial-gradient(circle at top right, rgba(74, 158, 255, 0.18), transparent 28%),
    linear-gradient(180deg, #07111f 0%, #0d1629 45%, #07111f 100%);
  color: #fff;
  padding: 24px;
}

.wallet-header {
  max-width: 980px;
  margin: 0 auto 28px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;

  h1 {
    font-size: 30px;
    color: #7dc0ff;
    margin-bottom: 8px;
  }

  .header-subtitle {
    color: rgba(255, 255, 255, 0.58);
    font-size: 14px;
  }

  .header-actions {
    display: flex;
    gap: 12px;
  }

  button {
    background: transparent;
    border: 1px solid rgba(125, 192, 255, 0.55);
    color: #7dc0ff;
    padding: 10px 16px;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.25s ease;

    &:hover:not(:disabled) {
      background: rgba(125, 192, 255, 0.12);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}

.wallet-content {
  max-width: 980px;
  margin: 0 auto;
}

.status-banner {
  border-radius: 14px;
  padding: 14px 16px;
  margin-bottom: 18px;
  font-size: 14px;

  &.error {
    background: rgba(239, 83, 80, 0.16);
    border: 1px solid rgba(239, 83, 80, 0.3);
    color: #ffb3b1;
  }

  &.notice {
    background: rgba(74, 158, 255, 0.14);
    border: 1px solid rgba(74, 158, 255, 0.24);
    color: #b7ddff;
  }
}

.balance-card,
.transactions-section {
  background: rgba(13, 22, 41, 0.9);
  border: 1px solid rgba(125, 192, 255, 0.16);
  border-radius: 18px;
  padding: 28px;
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.28);
}

.balance-card {
  margin-bottom: 24px;

  .balance-label {
    font-size: 14px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.56);
    margin-bottom: 10px;
  }

  .balance-amount {
    font-size: 44px;
    font-weight: 700;
    color: #ffe082;
    margin-bottom: 10px;
  }

  .balance-sub {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.62);
    margin-bottom: 22px;
  }

  .dot {
    display: inline-block;
    margin: 0 8px;
  }
}

.address-card {
  background: rgba(125, 192, 255, 0.08);
  border: 1px solid rgba(125, 192, 255, 0.16);
  border-radius: 14px;
  padding: 18px;
  margin-bottom: 20px;

  .address-label {
    color: rgba(255, 255, 255, 0.56);
    font-size: 13px;
    margin-bottom: 8px;
  }

  .address-value {
    font-family: 'Consolas', 'SFMono-Regular', monospace;
    font-size: 20px;
    color: #d9efff;
    word-break: break-all;
    margin-bottom: 14px;
  }

  .copy-btn {
    background: rgba(74, 158, 255, 0.16);
    color: #b7ddff;
    border: 1px solid rgba(74, 158, 255, 0.3);
    border-radius: 10px;
    padding: 8px 14px;
    cursor: pointer;

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;

  .meta-item {
    background: rgba(255, 255, 255, 0.04);
    border-radius: 12px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;

    span {
      color: rgba(255, 255, 255, 0.54);
      font-size: 12px;
    }

    strong {
      color: #f5fbff;
      font-size: 15px;
    }
  }
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 24px;

  .action-btn {
    background: rgba(125, 192, 255, 0.08);
    border: 1px solid rgba(125, 192, 255, 0.16);
    border-radius: 14px;
    padding: 22px 18px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    transition: transform 0.2s ease, background 0.2s ease;

    &:hover {
      background: rgba(125, 192, 255, 0.14);
      transform: translateY(-2px);
    }

    .icon {
      font-size: 30px;
    }

    span:last-child {
      color: rgba(255, 255, 255, 0.82);
      font-size: 14px;
    }
  }
}

.transactions-section {
  .section-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 18px;

    h3 {
      font-size: 20px;
      color: #d9efff;
    }

    span {
      color: rgba(255, 255, 255, 0.54);
      font-size: 13px;
    }
  }
}

.transaction-list {
  display: flex;
  flex-direction: column;
}

.transaction-item {
  display: grid;
  grid-template-columns: 48px 1fr auto;
  gap: 16px;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);

  &:last-child {
    border-bottom: none;
  }
}

.tx-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;

  &.deposit,
  &.transfer_in {
    background: rgba(38, 166, 154, 0.16);
  }

  &.withdraw,
  &.transfer_out {
    background: rgba(239, 83, 80, 0.16);
  }

  &.trade {
    background: rgba(255, 193, 7, 0.16);
  }
}

.tx-details {
  min-width: 0;

  .tx-title {
    color: rgba(255, 255, 255, 0.88);
    font-size: 15px;
    margin-bottom: 6px;
  }

  .tx-time,
  .tx-ref {
    color: rgba(255, 255, 255, 0.48);
    font-size: 12px;
    line-height: 1.5;
    word-break: break-all;
  }
}

.tx-side {
  text-align: right;
}

.tx-amount {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 6px;

  &.positive {
    color: #4cd2b2;
  }

  &.negative {
    color: #ff8e88;
  }
}

.tx-balance,
.empty-state {
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
}

.empty-state {
  padding: 36px 0;
  text-align: center;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.72);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 1000;
}

.modal {
  background: #0d1629;
  border: 1px solid rgba(125, 192, 255, 0.18);
  border-radius: 18px;
  padding: 30px;
  width: 100%;
  max-width: 460px;

  h2 {
    color: #7dc0ff;
    margin-bottom: 22px;
    font-size: 24px;
  }
}

.form-group {
  margin-bottom: 18px;

  label {
    display: block;
    color: rgba(255, 255, 255, 0.62);
    font-size: 13px;
    margin-bottom: 8px;
  }

  input {
    width: 100%;
    padding: 12px 14px;
    border-radius: 10px;
    border: 1px solid rgba(125, 192, 255, 0.18);
    background: rgba(255, 255, 255, 0.04);
    color: #fff;
    font-size: 14px;
    outline: none;

    &:focus {
      border-color: rgba(125, 192, 255, 0.52);
    }
  }
}

.limit-info {
  margin-bottom: 20px;
  padding: 12px 14px;
  border-radius: 10px;
  background: rgba(255, 193, 7, 0.12);
  color: rgba(255, 255, 255, 0.68);
  font-size: 12px;
}

.modal-actions {
  display: flex;
  gap: 12px;

  button {
    flex: 1;
    padding: 12px 16px;
    border-radius: 10px;
    border: none;
    cursor: pointer;
    font-weight: 600;
    transition: opacity 0.2s ease;

    &:disabled {
      opacity: 0.65;
      cursor: not-allowed;
    }
  }

  .btn-cancel {
    background: rgba(255, 255, 255, 0.12);
    color: #fff;
  }

  .btn-confirm {
    background: linear-gradient(135deg, #3a8eef 0%, #63b8ff 100%);
    color: #081120;
  }
}

@media (max-width: 900px) {
  .wallet-header,
  .header-actions {
    flex-direction: column;
  }

  .meta-grid,
  .actions-grid {
    grid-template-columns: 1fr;
  }

  .transaction-item {
    grid-template-columns: 48px 1fr;
  }

  .tx-side {
    grid-column: 2;
    text-align: left;
  }
}
</style>
