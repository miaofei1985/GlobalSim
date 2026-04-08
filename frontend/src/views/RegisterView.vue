<template>
  <div class="register-container">
    <div class="register-box">
      <h1>{{ $t('auth.register_title') }}</h1>
      
      <form @submit.prevent="handleRegister" class="register-form">
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
        
        <div class="form-row">
          <div class="form-group">
            <label for="password">{{ $t('auth.password') }}</label>
            <input 
              type="password" 
              id="password" 
              v-model="form.password" 
              :placeholder="$t('auth.password_placeholder')"
              required
              minlength="8"
            />
          </div>
          
          <div class="form-group">
            <label for="confirmPassword">{{ $t('auth.confirm_password') }}</label>
            <input 
              type="password" 
              id="confirmPassword" 
              v-model="form.confirmPassword" 
              :placeholder="$t('auth.confirm_password_placeholder')"
              required
            />
          </div>
        </div>
        
        <div class="form-group">
          <label for="locale">{{ $t('auth.language') }}</label>
          <select id="locale" v-model="form.locale" class="locale-select">
            <option value="zh-CN">简体中文</option>
            <option value="en">English</option>
            <option value="hi">हिन्दी (Hindi)</option>
            <option value="es">Español</option>
            <option value="ar">العربية (Arabic)</option>
            <option value="bn">বাংলা (Bengali)</option>
            <option value="pt-BR">Português (BR)</option>
            <option value="ru">Русский</option>
            <option value="ja">日本語</option>
            <option value="fr">Français</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="inviteCode">{{ $t('auth.invite_code') }} ({{ $t('common.optional') }})</label>
          <input 
            type="text" 
            id="inviteCode" 
            v-model="form.inviteCode" 
            :placeholder="$t('auth.invite_code_placeholder')"
          />
        </div>
        
        <div class="form-group checkbox-group">
          <label class="checkbox-label">
            <input type="checkbox" v-model="form.agreeTerms" required />
            <span>
              {{ $t('auth.agree_terms') }}
              <a href="/terms" target="_blank">{{ $t('auth.terms_of_service') }}</a>
              {{ $t('auth.and') }}
              <a href="/privacy" target="_blank">{{ $t('auth.privacy_policy') }}</a>
            </span>
          </label>
        </div>
        
        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? $t('common.loading') : $t('auth.register_button') }}
        </button>
        
        <div class="error-message" v-if="error">
          {{ error }}
        </div>
        
        <div class="success-message" v-if="success">
          {{ success }}
        </div>
      </form>
      
      <div class="register-footer">
        <p>
          {{ $t('auth.have_account') }}
          <router-link to="/login">{{ $t('auth.login_now') }}</router-link>
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

const router = useRouter()
const { t, locale } = useI18n()

const form = reactive({
  email: '',
  password: '',
  confirmPassword: '',
  locale: 'zh-CN',
  inviteCode: '',
  agreeTerms: false
})

const loading = ref(false)
const error = ref('')
const success = ref('')

const handleRegister = async () => {
  loading.value = true
  error.value = ''
  success.value = ''
  
  // 验证密码匹配
  if (form.password !== form.confirmPassword) {
    error.value = t('errors.password_mismatch')
    loading.value = false
    return
  }
  
  // 验证密码强度
  if (form.password.length < 8) {
    error.value = t('errors.password_too_short')
    loading.value = false
    return
  }
  
  try {
    await authApi.register({
      email: form.email,
      password: form.password,
      locale: form.locale,
      inviteCode: form.inviteCode || null
    })
    
    success.value = t('auth.register_success')
    
    // 切换语言
    locale.value = form.locale
    
    // 2 秒后跳转到登录页
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  } catch (err) {
    error.value = err.message || t('errors.register_failed')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  padding: 20px;
}

.register-box {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 40px;
  width: 100%;
  max-width: 480px;
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

.register-form {
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
  
  input, select {
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
  
  select {
    cursor: pointer;
    option {
      background: #1a1a2e;
      color: #fff;
    }
  }
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.checkbox-group {
  .checkbox-label {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    color: #a0a0a0;
    font-size: 14px;
    cursor: pointer;
    
    input[type="checkbox"] {
      width: 18px;
      height: 18px;
      margin-top: 2px;
      cursor: pointer;
    }
    
    a {
      color: #4f46e5;
      text-decoration: none;
      
      &:hover {
        text-decoration: underline;
      }
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

.success-message {
  color: #10b981;
  font-size: 14px;
  text-align: center;
  padding: 10px;
  background: rgba(16, 185, 129, 0.1);
  border-radius: 8px;
}

.register-footer {
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
  .form-row {
    direction: rtl;
  }
  
  .checkbox-group {
    .checkbox-label {
      flex-direction: row-reverse;
    }
  }
}

// Responsive
@media (max-width: 520px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
