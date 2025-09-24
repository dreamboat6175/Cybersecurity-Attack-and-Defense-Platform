<template>
  <div class="dashboard-container">
    <!-- 顶部状态栏 -->
    <div class="dashboard-header">
      <div class="header-left">
        <h1 class="dashboard-title">
          <span class="title-icon">🛡️</span>
          网络安全攻防平台
        </h1>
        <div class="status-indicators">
          <div class="status-item" :class="wsStatus">
            <span class="status-dot"></span>
            {{ wsStatusText }}
          </div>
          <div class="status-item">
            <span class="status-icon">⏰</span>
            {{ lastUpdated }}
          </div>
        </div>
      </div>

      <div class="header-right">
        <button class="refresh-btn" @click="refreshData" :disabled="isLoading">
          <span class="btn-icon" :class="{ spinning: isLoading }">🔄</span>
          刷新数据
        </button>
        <div class="user-menu" @click="showUserMenu = !showUserMenu">
          <span class="user-avatar">👤</span>
          <span class="user-name">{{ userInfo?.username || 'Admin' }}</span>
          <span class="menu-arrow">▼</span>

          <!-- 用户菜单下拉 -->
          <Transition name="fade">
            <div v-if="showUserMenu" class="user-dropdown" @click.stop>
              <div class="dropdown-item" @click="logout">
                <span class="item-icon">🚪</span>
                退出登录
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <!-- 全局加载状态 -->
    <Transition name="fade">
      <div v-if="isInitialLoading" class="dashboard-loading">
        <div class="loading-content">
          <div class="loading-spinner large"></div>
          <p>正在加载仪表盘数据...</p>
        </div>
      </div>
    </Transition>

    <!-- 仪表盘网格 -->
    <DashboardGrid v-else>
      <template #targets>
        <TargetsPanel />
      </template>

      <template #methods>
        <MethodsPanel />
      </template>

      <template #logs>
        <LogPanel />
      </template>

      <template #network>
        <NetworkPanel />
      </template>

      <template #scan>
        <ScanPanel />
      </template>

      <template #traffic>
        <TrafficPanel />
      </template>
    </DashboardGrid>

    <!-- 全局错误提示 -->
    <Transition name="slide-up">
      <div v-if="error" class="error-toast" @click="clearError">
        <span class="error-icon">⚠️</span>
        <span class="error-text">{{ error }}</span>
        <button class="error-close" @click.stop="clearError">×</button>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDashboardStore } from '@/stores/dashboard'
import { useAuthStore } from '@/stores/auth'
import wsManager from '@/api/websocket'
import { formatTime } from '@/utils/format'

// 组件导入
import DashboardGrid from '@/components/layout/DashboardGrid.vue'
import TargetsPanel from '@/components/panels/TargetsPanel.vue'
import MethodsPanel from '@/components/panels/MethodsPanel.vue'
import LogPanel from '@/components/panels/LogPanel.vue'
import NetworkPanel from '@/components/panels/NetworkPanel.vue'
import ScanPanel from '@/components/panels/ScanPanel.vue'
import TrafficPanel from '@/components/panels/TrafficPanel.vue'

// 路由和stores
const router = useRouter()
const dashboardStore = useDashboardStore()
const authStore = useAuthStore()

// 响应式数据
const showUserMenu = ref(false)
const isInitialLoading = ref(true)

// 计算属性
const isLoading = computed(() => dashboardStore.isLoading)
const error = computed(() => dashboardStore.error)
const userInfo = computed(() => authStore.userInfo)

const lastUpdated = computed(() => {
  if (!dashboardStore.lastUpdated) return '从未更新'
  return formatTime(dashboardStore.lastUpdated, 'short')
})

// WebSocket状态
const wsStatus = computed(() => {
  const status = wsManager.getStatus()
  if (status.isConnected) return 'connected'
  if (status.reconnectAttempts > 0) return 'reconnecting'
  return 'disconnected'
})

const wsStatusText = computed(() => {
  const statusMap = {
    connected: '已连接',
    reconnecting: '重连中',
    disconnected: '已断开'
  }
  return statusMap[wsStatus.value] || '未知'
})

// 方法
const refreshData = async () => {
  try {
    await dashboardStore.refreshData()
    console.log('🔄 数据刷新完成')
  } catch (error) {
    console.error('❌ 数据刷新失败:', error)
  }
}

const logout = async () => {
  try {
    console.log('🚪 用户登出')
    await authStore.logout()
    wsManager.disconnect()
    router.push('/login')
  } catch (error) {
    console.error('❌ 登出失败:', error)
  }
}

const clearError = () => {
  dashboardStore.clearError()
}

// 点击外部关闭用户菜单
const handleClickOutside = (event) => {
  if (!event.target.closest('.user-menu')) {
    showUserMenu.value = false
  }
}

// 生命周期
onMounted(async () => {
  try {
    console.log('🚀 初始化仪表盘...')

    // 初始化仪表盘数据
    await dashboardStore.initializeDashboard()

    // 添加全局点击监听
    document.addEventListener('click', handleClickOutside)

    console.log('✅ 仪表盘初始化完成')

  } catch (error) {
    console.error('❌ 仪表盘初始化失败:', error)
  } finally {
    isInitialLoading.value = false
  }
})

onUnmounted(() => {
  // 清理事件监听
  document.removeEventListener('click', handleClickOutside)

  // 断开WebSocket连接
  wsManager.disconnect()

  console.log('🧹 仪表盘组件已卸载')
})
</script>

<style scoped>
.dashboard-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--color-bg-primary);
}

/* 顶部状态栏 */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
  background-color: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
  z-index: var(--z-sticky);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.dashboard-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text-accent);
  margin: 0;
}

.title-icon {
  font-size: var(--font-size-xl);
}

.status-indicators {
  display: flex;
  gap: var(--spacing-lg);
}

.status-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  transition: background-color var(--transition-base);
}

.status-item.connected .status-dot {
  background-color: var(--color-success);
}

.status-item.reconnecting .status-dot {
  background-color: var(--color-warning);
  animation: pulse 1s infinite;
}

.status-item.disconnected .status-dot {
  background-color: var(--color-danger);
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.status-icon {
  font-size: var(--font-size-sm);
}

/* 头部右侧 */
.header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: all var(--transition-base);
}

.refresh-btn:hover:not(:disabled) {
  border-color: var(--color-text-accent);
  color: var(--color-text-accent);
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon {
  font-size: var(--font-size-base);
  transition: transform var(--transition-base);
}

.btn-icon.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 用户菜单 */
.user-menu {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: all var(--transition-base);
}

.user-menu:hover {
  border-color: var(--color-text-accent);
}

.user-avatar {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-text-accent);
  border-radius: 50%;
  font-size: var(--font-size-sm);
}

.user-name {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

.menu-arrow {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  transition: transform var(--transition-base);
}

.user-menu:hover .menu-arrow {
  transform: rotate(180deg);
}

/* 用户下拉菜单 */
.user-dropdown {
  position: absolute;
  top: calc(100% + var(--spacing-xs));
  right: 0;
  min-width: 150px;
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  box-shadow: var(--shadow-lg);
  z-index: var(--z-dropdown);
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: all var(--transition-base);
}

.dropdown-item:hover {
  background-color: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

.item-icon {
  font-size: var(--font-size-base);
}

/* 加载状态 */
.dashboard-loading {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-bg-primary);
}

.loading-content {
  text-align: center;
  color: var(--color-text-secondary);
}

.loading-content p {
  margin-top: var(--spacing-md);
  font-size: var(--font-size-base);
}

.loading-spinner.large {
  width: 32px;
  height: 32px;
  border-width: 3px;
}

/* 错误提示 */
.error-toast {
  position: fixed;
  bottom: var(--spacing-lg);
  right: var(--spacing-lg);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  background-color: var(--color-danger);
  color: white;
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-lg);
  z-index: var(--z-modal);
  max-width: 400px;
  cursor: pointer;
}

.error-icon {
  font-size: var(--font-size-base);
  flex-shrink: 0;
}

.error-text {
  flex: 1;
  font-size: var(--font-size-sm);
}

.error-close {
  background: none;
  border: none;
  color: white;
  font-size: var(--font-size-lg);
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color var(--transition-base);
}

.error-close:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

/* 动画效果 */
.fade-enter-active,
.fade-leave-active {
  transition: all var(--transition-base);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all var(--transition-base);
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .dashboard-header {
    padding: var(--spacing-sm);
    flex-direction: column;
    gap: var(--spacing-sm);
    align-items: stretch;
  }

  .header-left {
    justify-content: center;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .dashboard-title {
    font-size: var(--font-size-base);
  }

  .status-indicators {
    justify-content: center;
    gap: var(--spacing-md);
  }

  .header-right {
    justify-content: space-between;
  }

  .error-toast {
    bottom: var(--spacing-sm);
    right: var(--spacing-sm);
    left: var(--spacing-sm);
    max-width: none;
  }
}

@media (max-width: 480px) {
  .dashboard-title .title-icon {
    display: none;
  }

  .status-indicators {
    flex-direction: column;
    gap: var(--spacing-xs);
    align-items: center;
  }

  .refresh-btn span:not(.btn-icon) {
    display: none;
  }
}
</style>