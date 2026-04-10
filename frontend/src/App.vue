<template>
  <div id="app" :class="{ 'rtl': isRTL }">
    <router-view />
  </div>
</template>

<script setup>
import { computed, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

const isRTL = computed(() => {
  const rtlLocales = ['ar', 'fa', 'he', 'ur']
  return rtlLocales.includes(locale.value.split('-')[0])
})

watchEffect(() => {
  if (typeof document === 'undefined') {
    return
  }

  document.documentElement.lang = locale.value
  document.documentElement.dir = isRTL.value ? 'rtl' : 'ltr'
})
</script>

<style lang="scss">
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

#app {
  width: 100%;
  height: 100%;
  background: #0a0e27;
  color: #ffffff;
}

.rtl {
  direction: rtl;
  text-align: right;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: rgba(100, 149, 237, 0.5);
  border-radius: 4px;
  
  &:hover {
    background: rgba(100, 149, 237, 0.7);
  }
}

/* 通用工具类 */
.text-gradient {
  background: linear-gradient(135deg, #6495ed 0%, #4169e1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.glass-panel {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
}

.btn-primary {
  background: linear-gradient(135deg, #6495ed 0%, #4169e1 100%);
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(100, 149, 237, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
}
</style>
