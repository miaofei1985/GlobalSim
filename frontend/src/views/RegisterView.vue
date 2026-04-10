<template>
  <div class="register-container">
    <div class="register-box">
      <h1>{{ t('auth.register_title') }}</h1>

      <form ref="registerFormRef" @submit.prevent="handleRegister" class="register-form">
        <div class="form-group">
          <label for="email">{{ t('auth.email') }}</label>
          <div class="email-row">
            <input
              id="email"
              v-model.trim="form.email"
              type="email"
              autocomplete="email"
              :placeholder="t('auth.email_placeholder')"
              :disabled="verificationPending"
              required
            />

            <button
              type="button"
              class="send-code-button"
              :class="{ counting: resendCountdown > 0 }"
              :disabled="sendingCode || submitting || resendCountdown > 0"
              :aria-label="sendCodeAriaLabel"
              @click="handleSendCode"
            >
              <span aria-hidden="true">{{ sendCodeButtonText }}</span>
            </button>
          </div>
        </div>

        <div class="form-group">
          <label for="captchaAnswer">{{ t('auth.human_verification') }}</label>
          <div class="captcha-row">
            <input
              id="captchaAnswer"
              v-model.trim="captchaAnswer"
              type="text"
              inputmode="text"
              autocomplete="off"
              :placeholder="t('auth.human_verification_placeholder')"
              :disabled="captchaLoading || sendingCode || submitting"
            />

            <div class="captcha-preview" :class="{ loading: captchaLoading }">
              <div v-if="captchaLoading" class="captcha-loading">
                {{ t('auth.captcha_loading') }}
              </div>
              <div v-else v-html="captchaSvg"></div>
            </div>

            <button
              type="button"
              class="captcha-refresh-button"
              :disabled="captchaLoading || sendingCode || submitting"
              :aria-label="t('auth.refresh_captcha')"
              @click="loadCaptcha"
            >
              <span aria-hidden="true">&#8635;</span>
            </button>
          </div>
        </div>

        <div class="form-group">
          <label for="verificationCode">{{ t('auth.verification_code') }}</label>
          <input
            id="verificationCode"
            v-model.trim="verificationCode"
            type="text"
            maxlength="6"
            inputmode="numeric"
            autocomplete="one-time-code"
            :placeholder="t('auth.verification_code_placeholder')"
            :disabled="!verificationPending"
            required
          />
          <p v-if="verificationPending" class="inline-note">
            {{ t('auth.code_sent_to', { email: verificationEmail }) }}
          </p>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="password">{{ t('auth.password') }}</label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              autocomplete="new-password"
              :placeholder="t('auth.password_placeholder')"
              minlength="8"
              required
            />

            <div v-if="showPasswordStrength" class="password-strength">
              <div class="password-strength-head">
                <span>{{ t('auth.password_strength') }}</span>
                <strong :class="['strength-label', passwordStrength.level]">
                  {{ passwordStrengthLabel }}
                </strong>
              </div>

              <div class="strength-bars" aria-hidden="true">
                <span
                  v-for="segment in 3"
                  :key="segment"
                  :class="[
                    'strength-bar',
                    passwordStrength.level,
                    { active: segment <= passwordStrength.segmentCount }
                  ]"
                ></span>
              </div>

              <p class="strength-hint">{{ t('auth.password_strength_hint') }}</p>
            </div>
          </div>

          <div class="form-group">
            <label for="confirmPassword">{{ t('auth.confirm_password') }}</label>
            <input
              id="confirmPassword"
              v-model="form.confirmPassword"
              type="password"
              autocomplete="new-password"
              :placeholder="t('auth.confirm_password_placeholder')"
              required
            />
          </div>
        </div>

        <div class="form-group">
          <label for="locale">{{ t('auth.language') }}</label>
          <select id="locale" v-model="form.locale" class="locale-select">
            <option v-for="option in localeOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="inviteCode">
            {{ t('auth.invite_code') }} ({{ t('common.optional') }})
          </label>
          <input
            id="inviteCode"
            v-model.trim="form.inviteCode"
            type="text"
            :placeholder="t('auth.invite_code_placeholder')"
          />
        </div>

        <div class="form-group checkbox-group">
          <label class="checkbox-label">
            <input v-model="form.agreeTerms" type="checkbox" required />
            <span>
              {{ t('auth.agree_terms') }}
              <a href="/terms" target="_blank">{{ t('auth.terms_of_service') }}</a>
              {{ t('auth.and') }}
              <a href="/privacy" target="_blank">{{ t('auth.privacy_policy') }}</a>
            </span>
          </label>
        </div>

        <div class="form-actions">
          <button
            type="submit"
            class="btn-primary"
            :disabled="submitting || !verificationPending"
          >
            {{ submitting ? t('common.loading') : t('auth.register_button') }}
          </button>

          <button
            v-if="verificationPending"
            type="button"
            class="btn-secondary"
            @click="handleChangeEmail"
          >
            {{ t('auth.change_email') }}
          </button>
        </div>
      </form>

      <div v-if="error" class="error-message">{{ error }}</div>
      <div v-if="success" class="success-message">{{ success }}</div>

      <div class="register-footer">
        <p>
          {{ t('auth.have_account') }}
          <router-link to="/login">{{ t('auth.login_now') }}</router-link>
        </p>
        <p class="demo-hint">{{ t('common.simulation_only') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { authApi } from '@/api/auth'
import { localeOptions } from '@/i18n/authMessages'
import { useUserStore } from '@/stores/user'
import { assessPasswordStrength } from '@/utils/passwordStrength'

const RESEND_COUNTDOWN_SECONDS = 60

const router = useRouter()
const userStore = useUserStore()
const { t, locale } = useI18n()

const registerFormRef = ref(null)
const captchaId = ref('')
const captchaSvg = ref('')
const captchaAnswer = ref('')
const captchaLoading = ref(false)
const verificationCode = ref('')
const verificationPending = ref(false)
const verificationEmail = ref('')
const sendingCode = ref(false)
const submitting = ref(false)
const resendCountdown = ref(0)
const error = ref('')
const success = ref('')
let resendTimerId = null

const form = reactive({
  email: '',
  password: '',
  confirmPassword: '',
  locale: locale.value,
  inviteCode: '',
  agreeTerms: false
})

const passwordStrength = computed(() => assessPasswordStrength(form.password))
const showPasswordStrength = computed(() => form.password.length > 0)
const passwordStrengthLabel = computed(() =>
  t(`auth.password_strength_${passwordStrength.value.level}`)
)

watch(
  () => form.locale,
  (newLocale) => {
    locale.value = newLocale
    userStore.setLocale(newLocale)
  },
  { immediate: true }
)

const sendCodeButtonText = computed(() =>
  resendCountdown.value > 0 ? `${resendCountdown.value}s` : '\u2192'
)

const sendCodeAriaLabel = computed(() => {
  if (resendCountdown.value > 0) {
    return `countdown-${resendCountdown.value}-seconds`
  }

  return verificationPending.value ? 'resend-code' : 'send-code'
})

const clearResendCountdown = () => {
  if (resendTimerId !== null) {
    window.clearInterval(resendTimerId)
    resendTimerId = null
  }
}

const startResendCountdown = () => {
  clearResendCountdown()
  resendCountdown.value = RESEND_COUNTDOWN_SECONDS

  resendTimerId = window.setInterval(() => {
    if (resendCountdown.value <= 1) {
      resendCountdown.value = 0
      clearResendCountdown()
      return
    }

    resendCountdown.value -= 1
  }, 1000)
}

const loadCaptcha = async () => {
  try {
    captchaLoading.value = true
    const response = await authApi.getCaptcha()
    const payload = response.data?.data || {}
    captchaId.value = payload.captchaId || ''
    captchaSvg.value = payload.svg || ''
    captchaAnswer.value = ''
  } catch (err) {
    error.value = err.response?.data?.error || t('errors.captcha_failed')
  } finally {
    captchaLoading.value = false
  }
}

onMounted(async () => {
  userStore.loadUserFromStorage()
  if (userStore.isLoggedIn) {
    router.replace('/')
    return
  }

  await loadCaptcha()
})

onBeforeUnmount(() => {
  clearResendCountdown()
})

const isEmailValid = () => /\S+@\S+\.\S+/.test(form.email)

const validateSendCode = () => {
  if (!isEmailValid()) {
    error.value = t('errors.invalid_email')
    return false
  }

  if (!captchaId.value || !captchaAnswer.value.trim()) {
    error.value = t('errors.captcha_required')
    return false
  }

  return true
}

const validateRegisterForm = () => {
  if (!registerFormRef.value?.reportValidity()) {
    return false
  }

  if (!verificationPending.value) {
    error.value = t('errors.code_required')
    return false
  }

  if (form.password !== form.confirmPassword) {
    error.value = t('errors.password_mismatch')
    return false
  }

  if (form.password.length < 8) {
    error.value = t('errors.password_too_short')
    return false
  }

  if (!passwordStrength.value.isAcceptable) {
    error.value = t('errors.password_too_weak')
    return false
  }

  return true
}

const normalizeAuthError = (message, fallback) => {
  const raw = String(message || '').trim()

  if (!raw) {
    return fallback
  }

  if (raw.includes('Human verification failed')) {
    return t('errors.captcha_failed')
  }

  if (raw.includes('Password is too weak')) {
    return t('errors.password_too_weak')
  }

  if (raw.includes('already registered') || raw.includes('already in use')) {
    return locale.value === 'zh-CN'
      ? '该邮箱已注册，请直接登录'
      : 'This email is already registered. Please log in instead.'
  }

  if (raw.includes('Invalid or expired verification code')) {
    return t('errors.verify_failed')
  }

  const cooldownMatch = raw.match(/Please wait (\d+) seconds before requesting another verification code\./)
  if (cooldownMatch && locale.value === 'zh-CN') {
    return `请等待 ${cooldownMatch[1]} 秒后再重新获取验证码`
  }

  return raw
}

const refreshCaptchaAfterAttempt = async () => {
  await loadCaptcha()
}

const handleSendCode = async () => {
  error.value = ''
  success.value = ''

  if (!validateSendCode()) {
    return
  }

  try {
    sendingCode.value = true

    const payload = {
      email: form.email,
      locale: form.locale,
      captchaId: captchaId.value,
      captchaAnswer: captchaAnswer.value
    }

    if (verificationPending.value) {
      await authApi.resendCode(payload)
      success.value = t('auth.resend_success')
    } else {
      await authApi.sendCode(payload)
      verificationPending.value = true
      verificationEmail.value = form.email
      success.value = t('auth.code_sent_to', { email: form.email })
    }

    startResendCountdown()
  } catch (err) {
    error.value = normalizeAuthError(
      err.response?.data?.error || err.response?.data?.message,
      t('errors.captcha_failed')
    )
  } finally {
    sendingCode.value = false
    await refreshCaptchaAfterAttempt()
  }
}

const handleRegister = async () => {
  error.value = ''
  success.value = ''

  if (!validateRegisterForm()) {
    return
  }

  try {
    submitting.value = true

    const result = await userStore.register(
      {
        email: verificationEmail.value || form.email,
        password: form.password,
        locale: form.locale,
        inviteCode: form.inviteCode || null,
        code: verificationCode.value
      },
      {
        remember: true
      }
    )

    if (!result.success) {
      throw new Error(result.error)
    }

    success.value = result.data?.message || 'Registration successful. You are now signed in.'
    setTimeout(() => {
      router.push('/')
    }, 800)
  } catch (err) {
    error.value = normalizeAuthError(err.message, t('errors.register_failed'))
  } finally {
    submitting.value = false
  }
}

const handleChangeEmail = async () => {
  clearResendCountdown()
  resendCountdown.value = 0
  verificationPending.value = false
  verificationEmail.value = ''
  verificationCode.value = ''
  error.value = ''
  success.value = ''
  await loadCaptcha()
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
  max-width: 620px;
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
  gap: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.form-group label {
  color: #a0a0a0;
  font-size: 14px;
  font-weight: 500;
}

.form-group input:not([type='checkbox']),
.form-group select {
  width: 100%;
  min-height: 48px;
  padding: 12px 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  font-size: 16px;
  transition: all 0.3s ease;
}

.form-group input:not([type='checkbox']):focus,
.form-group select:focus {
  outline: none;
  border-color: #4f46e5;
  background: rgba(255, 255, 255, 0.08);
}

.form-group input:not([type='checkbox'])::placeholder {
  color: #666;
}

.form-group input:not([type='checkbox']):disabled,
.form-group select:disabled {
  opacity: 0.72;
  cursor: not-allowed;
}

.form-group select {
  cursor: pointer;
}

.form-group select option {
  background: #1a1a2e;
  color: #fff;
}

.email-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 52px;
  gap: 10px;
  align-items: stretch;
}

.captcha-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 160px 48px;
  gap: 10px;
  align-items: stretch;
}

.captcha-preview {
  min-height: 48px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(129, 140, 248, 0.22);
  background: rgba(15, 23, 42, 0.55);
}

.captcha-preview :deep(svg) {
  display: block;
  width: 100%;
  height: 100%;
}

.captcha-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  color: #cbd5e1;
  font-size: 13px;
}

.send-code-button,
.captcha-refresh-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  color: #fff;
  font-size: 24px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
}

.send-code-button.counting {
  font-size: 16px;
  letter-spacing: 0.02em;
}

.send-code-button:hover:not(:disabled),
.captcha-refresh-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
}

.send-code-button:disabled,
.captcha-refresh-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.inline-note {
  margin: 0;
  color: #93c5fd;
  font-size: 13px;
  line-height: 1.5;
}

.password-strength {
  margin-top: 6px;
  padding: 12px 14px;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.password-strength-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: #cbd5e1;
  font-size: 13px;
}

.strength-label.weak {
  color: #f87171;
}

.strength-label.medium {
  color: #fbbf24;
}

.strength-label.strong {
  color: #34d399;
}

.strength-bars {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-top: 10px;
}

.strength-bar {
  height: 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  transition: all 0.25s ease;
}

.strength-bar.active.weak {
  background: #ef4444;
}

.strength-bar.active.medium {
  background: #f59e0b;
}

.strength-bar.active.strong {
  background: #10b981;
}

.strength-hint {
  margin: 10px 0 0;
  color: #94a3b8;
  font-size: 12px;
  line-height: 1.5;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 15px;
  align-items: start;
}

.form-row .form-group label {
  min-height: 40px;
  display: flex;
  align-items: flex-end;
}

.checkbox-group .checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  color: #a0a0a0;
  font-size: 14px;
  cursor: pointer;
}

.checkbox-group input[type='checkbox'] {
  width: 18px;
  height: 18px;
  margin-top: 2px;
  cursor: pointer;
}

.checkbox-group a {
  color: #4f46e5;
  text-decoration: none;
}

.checkbox-group a:hover {
  text-decoration: underline;
}

.form-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.btn-primary,
.btn-secondary {
  min-height: 48px;
  padding: 14px 18px;
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

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
}

.btn-secondary {
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.02);
  color: #e5e7eb;
}

.btn-secondary:hover:not(:disabled) {
  border-color: rgba(129, 140, 248, 0.45);
  background: rgba(129, 140, 248, 0.08);
}

.btn-primary:disabled,
.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message,
.success-message {
  margin-top: 18px;
  font-size: 14px;
  text-align: center;
  padding: 10px;
  border-radius: 8px;
}

.error-message {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.success-message {
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}

.register-footer {
  margin-top: 30px;
  text-align: center;
  color: #a0a0a0;
  font-size: 14px;
}

.register-footer a {
  color: #4f46e5;
  text-decoration: none;
  font-weight: 600;
}

.register-footer a:hover {
  text-decoration: underline;
}

.demo-hint {
  margin-top: 15px;
  font-size: 12px;
  opacity: 0.7;
}

[dir='rtl'] .form-row {
  direction: rtl;
}

[dir='rtl'] .checkbox-group .checkbox-label {
  flex-direction: row-reverse;
}

@media (max-width: 700px) {
  .captcha-row {
    grid-template-columns: 1fr;
  }

  .captcha-refresh-button {
    width: 100%;
  }
}

@media (max-width: 520px) {
  .register-box {
    padding: 28px 20px;
  }

  .email-row,
  .form-row {
    grid-template-columns: 1fr;
  }

  .send-code-button {
    width: 100%;
  }

  .form-row .form-group label {
    min-height: 0;
  }

  .form-actions {
    flex-direction: column;
  }
}
</style>
