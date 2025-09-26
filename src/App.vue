<!-- src/App.vue - 应用根组件 -->
<template>
  <div id="app" class="app-container">
    <!-- 路由视图 -->
    <RouterView />

    <!-- 全局加载指示器 -->
    <Transition name="fade">
      <div v-if="isGlobalLoading" class="global-loading">
        <div class="loading-spinner"></div>
        <p class="loading-text">{{ loadingText }}</p>
      </div>
    </Transition>

    <!-- 全局错误提示 -->
    <Transition name="slide-up">
      <div v-if="globalError" class="global-error" @click="clearGlobalError">
        <div class="error-content">
          <span class="error-icon">⚠️</span>
          <span class="error-message">{{ globalError }}</span>
          <button class="error-close" @click.stop="clearGlobalError">×</button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onErrorCaptured } from 'vue'
import { RouterView } from 'vue-router'

// 全局状态
const isGlobalLoading = ref(false)
const loadingText = ref('加载中...')
const globalError = ref('')

// 设置全局加载状态
function setGlobalLoading(loading, text = '加载中...') {
  isGlobalLoading.value = loading
  loadingText.value = text
}

// 设置全局错误
function setGlobalError(error) {
  globalError.value = error

  // 5秒后自动清除错误提示
  setTimeout(() => {
    globalError.value = ''
  }, 5000)
}

// 清除全局错误
function clearGlobalError() {
  globalError.value = ''
}

// 错误捕获
onErrorCaptured((error, instance, info) => {
  console.error('🚨 Vue应用错误:', error)
  console.error('📍 错误位置:', info)

  setGlobalError(`应用错误: ${error.message}`)

  // 返回false阻止错误继续传播
  return false
})

// 监听未捕获的Promise错误
window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 未捕获的Promise错误:', event.reason)
  setGlobalError(`网络错误: ${event.reason.message || '未知错误'}`)
})

// 组件挂载时的初始化
onMounted(() => {
  console.log('🎯 网络安全攻防平台已加载')

  // 设置全局CSS变量
  document.documentElement.style.setProperty('--app-primary-color', '#3b82f6')
  document.documentElement.style.setProperty('--app-danger-color', '#ef4444')
  document.documentElement.style.setProperty('--app-warning-color', '#f59e0b')
  document.documentElement.style.setProperty('--app-success-color', '#22c55e')
})

// 暴露方法给子组件使用
defineExpose({
  setGlobalLoading,
  setGlobalError,
  clearGlobalError
})
</script>

<style>
/* 全局CSS重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

/* 应用容器 */
.app-container {
  width: 100vw;
  height: 100vh;
  background: #0a1628;
  color: #ffffff;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  position: relative;
  overflow: hidden;
}

/* CSS变量定义 */
:root {
  --color-bg-primary: #0a1628;
  --color-bg-secondary: rgba(15, 23, 42, 0.8);
  --color-bg-tertiary: rgba(30, 41, 59, 0.6);

  --color-border: #334155;
  --color-border-light: #475569;

  --color-text-primary: #e2e8f0;
  --color-text-secondary: #94a3b8;
  --color-text-accent: #3b82f6;

  --color-danger: #ef4444;
  --color-warning: #f59e0b;
  --color-success: #22c55e;
  --color-info: #3b82f6;

  --border-radius-sm: 4px;
  --border-radius-md: 8px;
  --border-radius-lg: 12px;

  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;

  --font-size-xs: 11px;
  --font-size-sm: 13px;
  --font-size-base: 14px;
  --font-size-lg: 16px;
  --font-size-xl: 18px;

  --font-family-mono: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;

  --transition-base: all 0.3s ease;
  --transition-fast: all 0.15s ease;
}

/* 全局加载指示器 */
.global-loading {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(10, 22, 40, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(5px);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(59, 130, 246, 0.3);
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

.loading-text {
  color: #94a3b8;
  font-size: 14px;
  text-align: center;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 全局错误提示 */
.global-error {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  cursor: pointer;
}

.error-content {
  background: rgba(239, 68, 68, 0.9);
  border: 1px solid #dc2626;
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  max-width: 500px;
}

.error-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.error-message {
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
}

.error-close {
  background: none;
  border: none;
  color: #ffffff;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
  flex-shrink: 0;
}

.error-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active {
  transition: all 0.3s ease;
}

.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from {
  transform: translateX(-50%) translateY(-20px);
  opacity: 0;
}

.slide-up-leave-to {
  transform: translateX(-50%) translateY(-20px);
  opacity: 0;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: rgba(30, 41, 59, 0.3);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: rgba(71, 85, 105, 0.6);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(71, 85, 105, 0.8);
}

/* Firefox滚动条 */
* {
  scrollbar-width: thin;
  scrollbar-color: rgba(71, 85, 105, 0.6) rgba(30, 41, 59, 0.3);
}

/* 选择文本样式 */
::selection {
  background: rgba(59, 130, 246, 0.3);
  color: #ffffff;
}

/* 焦点样式 */
*:focus {
  outline: 2px solid rgba(59, 130, 246, 0.5);
  outline-offset: 2px;
}

/* 禁用用户选择（除了特定元素） */
* {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

input, textarea, [contenteditable] {
  -webkit-user-select: text;
  -moz-user-select: text;
  -ms-user-select: text;
  user-select: text;
}
</style>