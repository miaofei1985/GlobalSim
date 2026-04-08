<template>
  <div class="login-container">
    <div class="login-box">
      <h1>{{ $t('auth.login_title') }}</h1>
      
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="email">{{ $t('auth.email') }}</label>
          <input 
            type="email" 
            id="email" 
            v-model="form.email" 
            :placeholder="$t('auth.email_placeholder')"
            required
          />
        </div>
        
        <div class="form-group">
          <label for="password">{{ $t('auth.password') }}</label>
          <input 
            type="password" 
            id="password" 
            v-model="form.password" 
            :placeholder="$t('auth.password_placeholder')"
            required
          />
        </div>
        
        <div class="form-options">
          <label class="checkbox-label">
            <input type="checkbox" v-model="form.remember" />
            {{ $t('auth.remember_me') }}
          </label>
          <router-link to="/forgot-password" class="forgot-link">
            {{ $t('auth.forgot_password') }}
          </router-link>
        </div>
        
        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? $t('common.loading') : $t('auth.login_button') }}
        </button>
        
        <div class="error-message" v-if="error">
          {{ error }}
        </div>
      </form>
      
      <div class="login-footer">
        <p>
          {{ $t('auth.no_account') }}
          <router-link to="/register">{{ $t('auth.register_now') }}</router-link>
        </p>
        <p class="demo-hint">
          {{ $t('common.simulation_only') }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { authApi } from '@/api/auth'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const { t } = useI18n()
const userStore = useUserStore()

const form = reactive({
  email: '',
  password: '',
  remember: false
})

const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const response = await authApi.login(form.email, form.password)
    userStore.setToken(response.token)
    userStore.setUser(response.user)
    
    if (form.remember) {
      localStorage.setItem('globalsim_token', response.token)
    } else {
      sessionStorage.setItem('globalsim_token', response.token)
    }
    
    router.push('/')
  } catch (err) {
    error.value = err.message || t('errors.login_failed')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  padding: 20px;
}

.login-box {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 40px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

h1 {
  color: #fff;
  text-align: center;
  margin-bottom: 30px;
  font-size: 28px;
  font-weight: 600;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  
  label {
    color: #a0a0a0;
    font-size: 14px;
    font-weight: 500;
  }
  
  input {
    padding: 12px 16px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.05);
    color: #fff;
    font-size: 16px;
    transition: all 0.3s ease;
    
    &:focus {
      outline: none;
      border-color: #4f46e5;
      background: rgba(255, 255, 255, 0.08);
    }
    
    &::placeholder {
      color: #666;
    }
  }
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  
  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #a0a0a0;
    cursor: pointer;
    
    input[type="checkbox"] {
      width: 16px;
      height: 16px;
      cursor: pointer;
    }
  }
  
  .forgot-link {
    color: #4f46e5;
    text-decoration: none;
    transition: color 0.3s ease;
    
    &:hover {
      color: #6366f1;
    }
  }
}

.btn-primary {
  padding: 14px;
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.error-message {
  color: #ef4444;
  font-size: 14px;
  text-align: center;
  padding: 10px;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 8px;
}

.login-footer {
  margin-top: 30px;
  text-align: center;
  color: #a0a0a0;
  font-size: 14px;
  
  a {
    color: #4f46e5;
    text-decoration: none;
    font-weight: 600;
    
    &:hover {
      text-decoration: underline;
    }
  }
  
  .demo-hint {
    margin-top: 15px;
    font-size: 12px;
    opacity: 0.7;
  }
}

// RTL Support
[dir="rtl"] {
  .form-options {
    flex-direction: row-reverse;
  }
}
</style>
