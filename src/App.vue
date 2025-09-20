<!-- src/App.vue -->
<template>
  <div id="app" :style="cssVars">
    <router-view />

    <!-- 全局通知组件 -->
    <div v-if="notifications.length > 0" class="notifications-container">
      <div v-for="notification in notifications" :key="notification.id"
           class="notification" :class="notification.type">
        <div class="notification-icon">
          {{ getNotificationIcon(notification.type) }}
        </div>
        <div class="notification-content">
          <div class="notification-title">{{ notification.title }}</div>
          <div class="notification-message">{{ notification.message }}</div>
        </div>
        <button @click="dismissNotification(notification.id)" class="notification-close">
          ✕
        </button>
      </div>
    </div>

    <!-- 全局加载遮罩 -->
    <div v-if="globalLoading" class="global-loading">
      <LoadingSpinner size="large" variant="network" text="系统初始化中..." />
    </div>

    <!-- 全局错误边界 -->
    <div v-if="globalError" class="global-error">
      <div class="error-content">
        <h2>🚨 系统错误</h2>
        <p>{{ globalError }}</p>
        <button @click="reloadApp" class="reload-btn">重新加载</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onErrorCaptured } from 'vue'
import { useRouter } from 'vue-router'
import { useStatusColors } from './composables/useStatusColors'
import LoadingSpinner from './components/common/LoadingSpinner.vue'

// 全局状态
const globalLoading = ref(false)
const globalError = ref<string | null>(null)
const notifications = ref<Array<{
  id: string
  type: 'success' | 'warning' | 'error' | 'info'
  title: string
  message: string
  timestamp: Date
}>>([])

const router = useRouter()
const { statusColorVars } = useStatusColors()

// CSS变量
const cssVars = computed(() => ({
  ...statusColorVars.value
}))

// 通知管理
function addNotification(notification: Omit<typeof notifications.value[0], 'id' | 'timestamp'>) {
  const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  notifications.value.push({
    ...notification,
    id,
    timestamp: new Date()
  })

  // 自动移除通知
  setTimeout(() => {
    dismissNotification(id)
  }, 5000)
}

function dismissNotification(id: string) {
  const index = notifications.value.findIndex(n => n.id === id)
  if (index > -1) {
    notifications.value.splice(index, 1)
  }
}

function getNotificationIcon(type: string): string {
  const icons = {
    success: '✅',
    warning: '⚠️',
    error: '🚨',
    info: 'ℹ️'
  }
  return icons[type] || 'ℹ️'
}

// 错误处理
onErrorCaptured((error, instance, info) => {
  console.error('Vue Error Captured:', error, info)
  globalError.value = `应用程序遇到错误: ${error.message}`
  return false
})

function reloadApp() {
  window.location.reload()
}

// 全局事件监听
onMounted(() => {
  // 监听未捕获的错误
  window.addEventListener('error', (event) => {
    console.error('Global Error:', event.error)
    addNotification({
      type: 'error',
      title: '系统错误',
      message: '发生未预期的错误，请刷新页面重试'
    })
  })

  // 监听未处理的Promise拒绝
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled Promise Rejection:', event.reason)
    addNotification({
      type: 'error',
      title: '网络错误',
      message: '网络请求失败，请检查网络连接'
    })
  })

  // 监听路由错误
  router.onError((error) => {
    console.error('Router Error:', error)
    addNotification({
      type: 'error',
      title: '导航错误',
      message: '页面导航失败，请重试'
    })
  })

  console.log('CBTC System Monitoring Platform initialized')
})

// 暴露全局方法给其他组件使用
window.appNotify = addNotification
</script>

<style>
/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: #0A192F;
  color: #E5E7EB;
  overflow-x: hidden;
}

#app {
  height: 100vh;
  background: #0A192F;
  color: #E5E7EB;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(55, 65, 81, 0.3);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: rgba(100, 255, 218, 0.3);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 255, 218, 0.5);
}

/* 全局通知样式 */
.notifications-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 400px;
}

.notification {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(26, 32, 44, 0.95);
  border: 1px solid #374151;
  border-radius: 8px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  animation: slideInRight 0.3s ease-out;
}

.notification.success {
  border-left: 4px solid #2ECC71;
}

.notification.warning {
  border-left: 4px solid #F39C12;
}

.notification.error {
  border-left: 4px solid #E74C3C;
}

.notification.info {
  border-left: 4px solid #64FFDA;
}

.notification-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.notification-content {
  flex: 1;
}

.notification-title {
  font-weight: 600;
  font-size: 14px;
  color: #E5E7EB;
  margin-bottom: 4px;
}

.notification-message {
  font-size: 13px;
  color: #8892B0;
  line-height: 1.4;
}

.notification-close {
  background: none;
  border: none;
  color: #8892B0;
  font-size: 16px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.notification-close:hover {
  background: rgba(231, 76, 60, 0.2);
  color: #E74C3C;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* 全局加载遮罩 */
.global-loading {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(10, 25, 47, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(5px);
}

/* 全局错误显示 */
.global-error {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(10, 25, 47, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
  backdrop-filter: blur(10px);
}

.error-content {
  text-align: center;
  max-width: 500px;
  padding: 40px;
  background: rgba(26, 32, 44, 0.9);
  border: 1px solid #374151;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.error-content h2 {
  color: #E74C3C;
  margin-bottom: 16px;
  font-size: 24px;
}

.error-content p {
  color: #8892B0;
  margin-bottom: 24px;
  line-height: 1.6;
}

.reload-btn {
  padding: 12px 24px;
  background: linear-gradient(135deg, #64FFDA 0%, #3B82F6 100%);
  color: #0A192F;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.reload-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(100, 255, 218, 0.4);
}

/* 全局实用类 */
.text-primary {
  color: var(--color-status-normal);
}

.text-warning {
  color: var(--color-status-warning);
}

.text-danger {
  color: var(--color-status-critical);
}

.text-muted {
  color: #8892B0;
}

.bg-primary {
  background-color: var(--color-status-normal);
}

.bg-warning {
  background-color: var(--color-status-warning);
}

.bg-danger {
  background-color: var(--color-status-critical);
}

/* 响应式工具类 */
.d-none {
  display: none !important;
}

.d-block {
  display: block !important;
}

.d-flex {
  display: flex !important;
}

.justify-center {
  justify-content: center !important;
}

.align-center {
  align-items: center !important;
}

.text-center {
  text-align: center !important;
}

/* 响应式断点 */
@media (max-width: 768px) {
  .notifications-container {
    top: 10px;
    right: 10px;
    left: 10px;
    max-width: none;
  }

  .notification {
    padding: 12px;
  }

  .error-content {
    margin: 20px;
    padding: 30px 20px;
  }
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  /* 已经是深色主题，无需额外适配 */
}

/* 无障碍支持 */
@media (prefers-reduced-motion: reduce) {
  .notification {
    animation: none;
  }

  .reload-btn:hover {
    transform: none;
  }

  * {
    transition: none !important;
    animation: none !important;
  }
}

/* 打印样式 */
@media print {
  .notifications-container,
  .global-loading,
  .global-error {
    display: none !important;
  }

  * {
    background: white !important;
    color: black !important;
  }
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  .notification {
    border-width: 2px;
  }

  .notification-close {
    border: 1px solid currentColor;
  }
}
</style>