import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(
    localStorage.getItem('token') ||
      sessionStorage.getItem('token') ||
      localStorage.getItem('globalsim_token') ||
      sessionStorage.getItem('globalsim_token') ||
      null
  )
  const user = ref(null)

  const isAuthenticated = computed(() => !!token.value)

  function setToken(newToken) {
    token.value = newToken
    localStorage.setItem('token', newToken)
    localStorage.setItem('globalsim_token', newToken)
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('globalsim_token')
  }

  function setUser(userData) {
    user.value = userData
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    sessionStorage.removeItem('token')
    localStorage.removeItem('globalsim_token')
    sessionStorage.removeItem('globalsim_token')
    localStorage.removeItem('user')
    sessionStorage.removeItem('user')
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
