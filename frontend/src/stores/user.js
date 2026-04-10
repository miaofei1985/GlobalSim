import { defineStore } from 'pinia'
import { authApi } from '@/api/auth'

const getStoredToken = () =>
  localStorage.getItem('token') ||
  sessionStorage.getItem('token') ||
  localStorage.getItem('globalsim_token') ||
  sessionStorage.getItem('globalsim_token') ||
  null

const getStoredUser = () => {
  const raw =
    localStorage.getItem('user') ||
    sessionStorage.getItem('user') ||
    null

  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw)
  } catch (error) {
    console.error('Failed to parse stored user')
    return null
  }
}

const clearStoredAuth = () => {
  localStorage.removeItem('token')
  sessionStorage.removeItem('token')
  localStorage.removeItem('globalsim_token')
  sessionStorage.removeItem('globalsim_token')
  localStorage.removeItem('user')
  sessionStorage.removeItem('user')
}

export const useUserStore = defineStore('user', {
  state: () => ({
    user: getStoredUser(),
    token: getStoredToken(),
    locale: localStorage.getItem('locale') || 'zh-CN'
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    currentUser: (state) => state.user,
    currentLocale: (state) => state.locale
  },

  actions: {
    setToken(token, remember = true) {
      this.token = token

      if (remember) {
        localStorage.setItem('token', token)
        sessionStorage.removeItem('token')
        localStorage.setItem('globalsim_token', token)
        sessionStorage.removeItem('globalsim_token')
      } else {
        sessionStorage.setItem('token', token)
        localStorage.removeItem('token')
        sessionStorage.setItem('globalsim_token', token)
        localStorage.removeItem('globalsim_token')
      }
    },

    setUser(user, remember = true) {
      this.user = user
      const serializedUser = JSON.stringify(user)

      if (remember) {
        localStorage.setItem('user', serializedUser)
        sessionStorage.removeItem('user')
      } else {
        sessionStorage.setItem('user', serializedUser)
        localStorage.removeItem('user')
      }
    },

    setAuth(payload, remember = true) {
      this.setToken(payload.token, remember)
      this.setUser(payload.user, remember)
    },

    async login(credentials, options = {}) {
      try {
        const response = await authApi.login(credentials)
        const payload = response.data?.data || response.data

        this.setAuth(
          {
            token: payload.token,
            user: payload.user
          },
          options.remember ?? true
        )

        return { success: true, data: payload }
      } catch (error) {
        return {
          success: false,
          error:
            error.response?.data?.error ||
            error.response?.data?.message ||
            'Login failed'
        }
      }
    },

    async register(payload, options = {}) {
      try {
        const response = await authApi.register(payload)
        const authPayload = response.data?.data || response.data

        if (authPayload?.token && authPayload?.user) {
          this.setAuth(
            {
              token: authPayload.token,
              user: authPayload.user
            },
            options.remember ?? true
          )
        }

        return { success: true, data: authPayload }
      } catch (error) {
        return {
          success: false,
          error:
            error.response?.data?.error ||
            error.response?.data?.message ||
            'Registration failed'
        }
      }
    },

    async logout() {
      this.user = null
      this.token = null
      clearStoredAuth()
    },

    setLocale(locale) {
      this.locale = locale
      localStorage.setItem('locale', locale)
    },

    loadUserFromStorage() {
      this.user = getStoredUser()
      this.token = getStoredToken()
    }
  }
})
