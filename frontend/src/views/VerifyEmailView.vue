<template>
  <div class="verify-container">
    <div class="verify-box">
      <h1>{{ t('auth.verification_title') }}</h1>
      <p class="verify-subtitle">{{ t('auth.verification_subtitle') }}</p>

      <div class="form-group">
        <label for="locale">{{ t('auth.language') }}</label>
        <select id="locale" v-model="form.locale" class="locale-select">
          <option v-for="option in localeOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>

      <form @submit.prevent="handleVerify" class="verify-form">
        <div class="form-group">
          <label for="email">{{ t('auth.email') }}</label>
          <input
            id="email"
            v-model.trim="form.email"
            type="email"
            :placeholder="t('auth.email_placeholder')"
            required
          />
        </div>

        <div class="form-group">
          <label for="code">{{ t('auth.verification_code') }}</label>
          <input
            id="code"
            v-model.trim="form.code"
            type="text"
            maxlength="6"
            inputmode="numeric"
            :placeholder="t('auth.verification_code_placeholder')"
            required
          />
        </div>

        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? t('common.loading') : t('auth.verify_button') }}
        </button>

        <button type="button" class="btn-secondary" :disabled="resending" @click="handleResend">
          {{ resending ? t('common.loading') : t('auth.resend_code') }}
        </button>

        <div v-if="message" class="success-message">{{ message }}</div>
        <div v-if="error" class="error-message">{{ error }}</div>
      </form>

      <div class="verify-footer">
        <p>{{ t('auth.code_sent_to', { email: form.email || '...' }) }}</p>
        <div class="footer-links">
          <router-link to="/register">{{ t('auth.change_email') }}</router-link>
          <router-link to="/login">{{ t('auth.back_to_login') }}</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { authApi } from '@/api/auth'
import { localeOptions } from '@/i18n/authMessages'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()

const form = reactive({
  email: typeof route.query.email === 'string' ? route.query.email : '',
  code: '',
  locale: typeof route.query.locale === 'string' ? route.query.locale : locale.value
})

const loading = ref(false)
const resending = ref(false)
const error = ref('')
const message = ref('')

watch(
  () => form.locale,
  (newLocale) => {
    locale.value = newLocale
    localStorage.setItem('locale', newLocale)
  },
  { immediate: true }
)

const validateEmail = () => /\S+@\S+\.\S+/.test(form.email)

const handleVerify = async () => {
  error.value = ''
  message.value = ''

  if (!validateEmail()) {
    error.value = t('errors.invalid_email')
    return
  }

  if (!form.code) {
    error.value = t('errors.code_required')
    return
  }

  try {
    loading.value = true
    await authApi.verify({
      email: form.email,
      code: form.code
    })

    message.value = t('auth.verify_success')
    setTimeout(() => {
      router.push('/login')
    }, 1200)
  } catch (err) {
    error.value =
      err.response?.data?.error ||
      err.response?.data?.message ||
      t('errors.verify_failed')
  } finally {
    loading.value = false
  }
}

const handleResend = async () => {
  error.value = ''
  message.value = ''

  if (!validateEmail()) {
    error.value = t('errors.invalid_email')
    return
  }

  try {
    resending.value = true
    await authApi.resendCode(form.email, form.locale)
    message.value = t('auth.resend_success')
  } catch (err) {
    error.value =
      err.response?.data?.error ||
      err.response?.data?.message ||
      t('errors.resend_failed')
  } finally {
    resending.value = false
  }
}
</script>

<style scoped lang="scss">
.verify-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  padding: 20px;
}

.verify-box {
  width: 100%;
  max-width: 460px;
  padding: 40px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
}

h1 {
  color: #fff;
  text-align: center;
  margin-bottom: 12px;
  font-size: 28px;
  font-weight: 600;
}

.verify-subtitle {
  margin-bottom: 24px;
  color: #a0a0a0;
  text-align: center;
  font-size: 14px;
}

.verify-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
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

  input,
  select {
    padding: 12px 16px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.05);
    color: #fff;
    font-size: 16px;

    &:focus {
      outline: none;
      border-color: #4f46e5;
      background: rgba(255, 255, 255, 0.08);
    }
  }

  select option {
    background: #1a1a2e;
    color: #fff;
  }
}

.btn-primary,
.btn-secondary {
  padding: 14px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  border: none;
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  color: #fff;
}

.btn-secondary {
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: transparent;
  color: #d1d5db;
}

.btn-primary:disabled,
.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message,
.success-message {
  padding: 10px;
  border-radius: 8px;
  text-align: center;
  font-size: 14px;
}

.error-message {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.success-message {
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}

.verify-footer {
  margin-top: 24px;
  text-align: center;
  color: #a0a0a0;
  font-size: 14px;
}

.footer-links {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 12px;

  a {
    color: #818cf8;
    text-decoration: none;
  }
}
</style>
