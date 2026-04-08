import { defineStore } from 'pinia'
import { authApi } from '@/api/auth'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token') || null,
    locale: localStorage.getItem('locale') || 'zh-CN'
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    currentUser: (state) => state.user,
    currentLocale: (state) => state.locale
  },

  actions: {
    async login(credentials) {
      try {
        const response = await authApi.login(credentials)
        const { token, user } = response.data
        
        this.token = token
        this.user = user
        
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        
        return { success: true }
      } catch (error) {
        return { 
          success: false, 
          error: error.response?.data?.message || 'Login failed' 
        }
      }
    },

    async logout() {
      this.user = null
      this.token = null
      
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },

    setLocale(locale) {
      this.locale = locale
      localStorage.setItem('locale', locale)
    },

    loadUserFromStorage() {
      const userStr = localStorage.getItem('user')
      if (userStr && !this.user) {
        try {
          this.user = JSON.parse(userStr)
        } catch (e) {
          console.error('Failed to parse user from storage')
        }
      }
    }
  }
})
