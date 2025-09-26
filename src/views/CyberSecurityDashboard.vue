<!-- src/views/CyberSecurityDashboard.vue - 修复版本，保持所有原有功能 -->
<template>
  <div class="dashboard-container">
    <!-- Dashboard Grid Layout -->
    <DashboardGrid>
      <!-- 目标管理面板 -->
      <template #targets>
        <TargetsPanel />
      </template>

      <!-- 攻击方法面板 -->
      <template #methods>
        <MethodsPanel />
      </template>

      <!-- 攻击日志面板 -->
      <template #logs>
        <LogPanel />
      </template>

      <!-- 网络拓扑面板 -->
      <template #network>
        <NetworkPanel />
      </template>

      <!-- 扫描面板 -->
      <template #scan>
        <ScanPanel />
      </template>

      <!-- 流量面板 -->
      <template #traffic>
        <TrafficPanel />
      </template>
    </DashboardGrid>

    <!-- 全屏模式背景 -->
    <div v-if="fullscreenMode" class="fullscreen-overlay" @click="exitFullscreen">
      <div class="fullscreen-content" @click.stop>
        <button class="fullscreen-close" @click="exitFullscreen">×</button>
        <component :is="fullscreenComponent" />
      </div>
    </div>

    <!-- 加载状态覆盖层 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <p>加载仪表盘数据...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, provide, onErrorCaptured } from 'vue'
import { useDashboardStore } from '@/stores/dashboard'
import wsManager from '@/api/websocket'

// 导入布局组件
import DashboardGrid from '@/components/layout/DashboardGrid.vue'

// 导入所有面板组件
import TargetsPanel from '@/components/panels/TargetsPanel.vue'
import MethodsPanel from '@/components/panels/MethodsPanel.vue'
import LogPanel from '@/components/panels/LogPanel.vue'
import NetworkPanel from '@/components/panels/NetworkPanel.vue'
import ScanPanel from '@/components/panels/ScanPanel.vue'
import TrafficPanel from '@/components/panels/TrafficPanel.vue'

const dashboardStore = useDashboardStore()

// 响应式数据
const fullscreenMode = ref(false)
const fullscreenComponent = ref(null)
const refreshTimer = ref(null)
const error = ref(null)

// 计算属性
const loading = computed(() => dashboardStore.loading)
const isInitialized = computed(() => dashboardStore.isInitialized)

// 全屏功能
const enterFullscreen = (componentName) => {
  fullscreenMode.value = true
  fullscreenComponent.value = componentName
  document.body.style.overflow = 'hidden'
}

const exitFullscreen = () => {
  fullscreenMode.value = false
  fullscreenComponent.value = null
  document.body.style.overflow = 'auto'
}

// 提供全局方法给子组件
provide('enterFullscreen', enterFullscreen)
provide('exitFullscreen', exitFullscreen)

// 自动刷新功能
const startAutoRefresh = () => {
  refreshTimer.value = setInterval(async () => {
    if (!loading.value) {
      try {
        await dashboardStore.refreshData()
      } catch (err) {
        console.warn('自动刷新失败:', err)
      }
    }
  }, 30000) // 每30秒刷新一次
}

const stopAutoRefresh = () => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
    refreshTimer.value = null
  }
}

// 键盘快捷键
const handleKeyboard = (event) => {
  if (event.key === 'Escape' && fullscreenMode.value) {
    exitFullscreen()
  }

  if (event.key === 'F5') {
    event.preventDefault()
    dashboardStore.refreshData()
  }
}

// WebSocket 事件处理
const handleWebSocketMessage = (data) => {
  try {
    switch (data.type) {
      case 'NEW_ATTACK':
        dashboardStore.addRealtimeAttack(data.payload)
        break
      case 'SCAN_RESULT':
        dashboardStore.updateScanResult(data.payload)
        break
      case 'TARGET_STATUS_CHANGE':
        dashboardStore.updateTargetStatus(data.payload)
        break
      case 'TRAFFIC_UPDATE':
        dashboardStore.updateTrafficData(data.payload)
        break
    }
  } catch (err) {
    console.error('WebSocket消息处理错误:', err)
  }
}

// 错误处理
onErrorCaptured((err, instance, info) => {
  console.error('Dashboard组件错误:', err, info)
  error.value = err
  return false
})

// 生命周期钩子
onMounted(async () => {
  console.log('🛡️ CyberSecurityDashboard 组件已挂载')

  try {
    // 初始化仪表板数据
    await dashboardStore.initializeDashboard()

    // 启动自动刷新
    startAutoRefresh()

    // 绑定键盘事件
    window.addEventListener('keydown', handleKeyboard)

    // 连接WebSocket并监听消息
    if (wsManager.isConnected) {
      wsManager.on('message', handleWebSocketMessage)
    } else {
      wsManager.connect()
      wsManager.on('connected', () => {
        wsManager.on('message', handleWebSocketMessage)
      })
    }

    console.log('✅ CyberSecurityDashboard 初始化完成')
  } catch (err) {
    console.error('❌ CyberSecurityDashboard 初始化失败:', err)
    error.value = err
  }
})

onUnmounted(() => {
  console.log('🛡️ CyberSecurityDashboard 组件已卸载')

  // 清理定时器
  stopAutoRefresh()

  // 移除键盘监听
  window.removeEventListener('keydown', handleKeyboard)

  // 清理全屏样式
  if (fullscreenMode.value) {
    document.body.style.overflow = 'auto'
  }

  // 断开WebSocket监听
  wsManager.off('message', handleWebSocketMessage)
})
</script>

<style scoped>
/* Dashboard 容器 */
.dashboard-container {
  height: 100vh;
  width: 100vw;
  background: linear-gradient(135deg, #0f1419 0%, #1a2332 100%);
  color: #ccd6f6;
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
  overflow: hidden;
  position: relative;
}

/* 全屏模式 */
.fullscreen-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 20, 25, 0.95);
  backdrop-filter: blur(10px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fullscreen-content {
  position: relative;
  width: 95%;
  height: 95%;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
}

.fullscreen-close {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  background: rgba(255, 107, 107, 0.2);
  border: 1px solid #ff6b6b;
  border-radius: 50%;
  color: #ff6b6b;
  font-size: 24px;
  font-weight: bold;
  cursor: pointer;
  z-index: 1001;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.fullscreen-close:hover {
  background: rgba(255, 107, 107, 0.3);
  transform: scale(1.1);
}

/* 加载状态覆盖层 */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 20, 25, 0.8);
  backdrop-filter: blur(5px);
  z-index: 500;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-content {
  text-align: center;
  padding: 40px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(100, 255, 218, 0.2);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 3px solid rgba(100, 255, 218, 0.3);
  border-top: 3px solid #64ffda;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .dashboard-container {
    overflow-x: auto;
    overflow-y: auto;
  }
}

@media (max-width: 768px) {
  .fullscreen-content {
    width: 100%;
    height: 100%;
    border-radius: 0;
  }

  .fullscreen-close {
    top: 10px;
    right: 10px;
    width: 35px;
    height: 35px;
    font-size: 20px;
  }
}

/* 错误状态 */
.dashboard-error {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  padding: 40px;
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid #ff6b6b;
  border-radius: 12px;
  z-index: 100;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.error-message {
  font-size: 16px;
  color: #ff6b6b;
  margin-bottom: 20px;
}

.retry-button {
  background: #64ffda;
  color: #0f1419;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.retry-button:hover {
  background: #5eead4;
  transform: translateY(-1px);
}
</style>