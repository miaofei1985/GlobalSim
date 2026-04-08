import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || null)
  const user = ref(null)

  const isAuthenticated = computed(() => !!token.value)

  function setToken(newToken) {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  function setUser(userData) {
    user.value = userData
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
  }

  return { token, user, isAuthenticated, setToken, setUser, logout }
})

export const useWalletStore = defineStore('wallet', () => {
  const balance = ref(0)
  const transactions = ref([])

  function setBalance(amount) {
    balance.value = amount
  }

  function addTransaction(tx) {
    transactions.value.unshift(tx)
  }

  return { balance, transactions, setBalance, addTransaction }
})
