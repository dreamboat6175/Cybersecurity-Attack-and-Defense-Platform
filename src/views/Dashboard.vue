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
          <div class="status-item connected">
            <span class="status-dot"></span>
            已连接
          </div>
          <div class="status-item">
            <span class="status-icon">⏰</span>
            刚刚更新
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
          <transition name="fade">
            <div v-if="showUserMenu" class="user-dropdown" @click.stop>
              <div class="dropdown-item" @click="logout">
                <span class="item-icon">🚪</span>
                退出登录
              </div>
            </div>
          </transition>
        </div>
      </div>
    </div>

    <!-- 仪表盘内容 -->
    <div class="dashboard-content">
      <!-- 欢迎卡片 -->
      <div class="welcome-card">
        <h2>欢迎使用网络安全攻防平台</h2>
        <p>登录成功！Mock环境已正常工作。</p>

        <div class="quick-stats">
          <div class="stat-item">
            <div class="stat-value">{{ dashboardData.targets?.length || 0 }}</div>
            <div class="stat-label">监控目标</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ dashboardData.threats?.active || 0 }}</div>
            <div class="stat-label">活跃威胁</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ dashboardData.attacks?.today || 0 }}</div>
            <div class="stat-label">今日攻击</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ dashboardData.vulnerabilities?.critical || 0 }}</div>
            <div class="stat-label">关键漏洞</div>
          </div>
        </div>
      </div>

      <!-- 数据加载状态 -->
      <div v-if="isLoading" class="loading-section">
        <div class="loading-spinner"></div>
        <p>正在加载仪表盘数据...</p>
      </div>

      <!-- 数据展示 -->
      <div v-else class="dashboard-grid">
        <!-- 目标列表 -->
        <div class="panel">
          <h3>监控目标</h3>
          <div class="target-list">
            <div v-for="target in dashboardData.targets?.slice(0, 5)" :key="target.id" class="target-item">
              <span class="target-name">{{ target.name }}</span>
              <span class="target-status" :class="target.status">{{ target.status }}</span>
            </div>
            <div v-if="!dashboardData.targets?.length" class="no-data">暂无监控目标</div>
          </div>
        </div>

        <!-- 威胁统计 -->
        <div class="panel">
          <h3>威胁统计</h3>
          <div class="threat-stats">
            <div class="threat-item high">
              <span class="threat-level">高危</span>
              <span class="threat-count">{{ dashboardData.threats?.high || 0 }}</span>
            </div>
            <div class="threat-item medium">
              <span class="threat-level">中危</span>
              <span class="threat-count">{{ dashboardData.threats?.medium || 0 }}</span>
            </div>
            <div class="threat-item low">
              <span class="threat-level">低危</span>
              <span class="threat-count">{{ dashboardData.threats?.low || 0 }}</span>
            </div>
          </div>
        </div>

        <!-- 系统状态 -->
        <div class="panel">
          <h3>系统状态</h3>
          <div class="system-info">
            <div class="info-item">
              <span class="info-label">Mock状态:</span>
              <span class="info-value success">正常运行</span>
            </div>
            <div class="info-item">
              <span class="info-label">API状态:</span>
              <span class="info-value success">连接正常</span>
            </div>
            <div class="info-item">
              <span class="info-label">最后更新:</span>
              <span class="info-value">{{ formatTime(new Date()) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 错误提示 -->
    <transition name="slide-up">
      <div v-if="error" class="error-toast" @click="clearError">
        <span class="error-icon">⚠️</span>
        <span class="error-text">{{ error }}</span>
        <button class="error-close" @click.stop="clearError">×</button>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import request from '@/api'

// 路由和stores
const router = useRouter()
const authStore = useAuthStore()

// 响应式数据
const showUserMenu = ref(false)
const isLoading = ref(true)
const error = ref(null)
const dashboardData = ref({})

// 计算属性
const userInfo = computed(() => authStore.userInfo)

// 方法
const refreshData = async () => {
  try {
    isLoading.value = true
    error.value = null

    console.log('🔄 刷新仪表盘数据...')

    // 调用Mock API获取数据
    const response = await request.get('/api/dashboard')

    if (response.success) {
      dashboardData.value = response.data
      console.log('✅ 仪表盘数据加载成功:', response.data)
    } else {
      throw new Error(response.message || '数据加载失败')
    }

  } catch (err) {
    console.error('❌ 仪表盘数据加载失败:', err)
    error.value = err.message
  } finally {
    isLoading.value = false
  }
}

const logout = async () => {
  try {
    console.log('🚪 用户登出')
    await authStore.logout()
    router.push('/login')
  } catch (error) {
    console.error('❌ 登出失败:', error)
  }
}

const clearError = () => {
  error.value = null
}

const formatTime = (date) => {
  return new Date(date).toLocaleTimeString()
}

// 点击外部关闭用户菜单
const handleClickOutside = (event) => {
  if (!event.target.closest('.user-menu')) {
    showUserMenu.value = false
  }
}

// 生命周期
onMounted(async () => {
  console.log('🚀 初始化简化仪表盘...')

  // 添加全局点击监听
  document.addEventListener('click', handleClickOutside)

  // 加载初始数据
  await refreshData()

  console.log('✅ 简化仪表盘初始化完成')
})
</script>

<style scoped>
/* 基础变量 */
:root {
  --color-bg-primary: #f8fafc;
  --color-bg-secondary: #ffffff;
  --color-bg-tertiary: #f1f5f9;
  --color-border: #e2e8f0;
  --color-text-primary: #1e293b;
  --color-text-secondary: #64748b;
  --color-text-accent: #3b82f6;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --border-radius-sm: 0.375rem;
  --border-radius-md: 0.5rem;
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  --transition-base: 150ms ease;
}

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
  box-shadow: var(--shadow-sm);
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
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-accent);
  margin: 0;
}

.title-icon {
  font-size: 1.5rem;
}

.status-indicators {
  display: flex;
  gap: var(--spacing-lg);
}

.status-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--color-success);
}

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
  font-size: 0.875rem;
  color: white;
}

.user-name {
  font-size: 0.875rem;
  color: var(--color-text-primary);
}

.menu-arrow {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  transition: transform var(--transition-base);
}

.user-dropdown {
  position: absolute;
  top: calc(100% + var(--spacing-xs));
  right: 0;
  min-width: 150px;
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  box-shadow: var(--shadow-lg);
  z-index: 1000;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all var(--transition-base);
}

.dropdown-item:hover {
  background-color: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

/* 仪表盘内容 */
.dashboard-content {
  flex: 1;
  padding: var(--spacing-lg);
  overflow-y: auto;
}

.welcome-card {
  background-color: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-xl);
  margin-bottom: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  text-align: center;
}

.welcome-card h2 {
  margin: 0 0 var(--spacing-sm) 0;
  color: var(--color-text-primary);
}

.welcome-card p {
  margin: 0 0 var(--spacing-lg) 0;
  color: var(--color-text-secondary);
}

.quick-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--spacing-lg);
  margin-top: var(--spacing-lg);
}

.stat-item {
  text-align: center;
  padding: var(--spacing-md);
  background-color: var(--color-bg-tertiary);
  border-radius: var(--border-radius-sm);
}

.stat-value {
  display: block;
  font-size: 2rem;
  font-weight: bold;
  color: var(--color-text-accent);
}

.stat-label {
  display: block;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin-top: var(--spacing-xs);
}

/* 加载状态 */
.loading-section {
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--color-text-secondary);
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--color-border);
  border-top: 3px solid var(--color-text-accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto var(--spacing-md) auto;
}

/* 仪表盘网格 */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-lg);
}

.panel {
  background-color: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
}

.panel h3 {
  margin: 0 0 var(--spacing-md) 0;
  color: var(--color-text-primary);
}

/* 目标列表 */
.target-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.target-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm);
  background-color: var(--color-bg-tertiary);
  border-radius: var(--border-radius-sm);
}

.target-name {
  font-weight: 500;
  color: var(--color-text-primary);
}

.target-status {
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
}

.target-status.normal {
  background-color: #dcfce7;
  color: #166534;
}

.target-status.warning {
  background-color: #fef3c7;
  color: #92400e;
}

.target-status.critical {
  background-color: #fee2e2;
  color: #991b1b;
}

/* 威胁统计 */
.threat-stats {
  display: flex;
  justify-content: space-between;
  gap: var(--spacing-md);
}

.threat-item {
  flex: 1;
  text-align: center;
  padding: var(--spacing-md);
  border-radius: var(--border-radius-sm);
}

.threat-item.high {
  background-color: #fee2e2;
  color: #991b1b;
}

.threat-item.medium {
  background-color: #fef3c7;
  color: #92400e;
}

.threat-item.low {
  background-color: #dcfce7;
  color: #166534;
}

.threat-level {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
}

.threat-count {
  display: block;
  font-size: 1.5rem;
  font-weight: bold;
  margin-top: var(--spacing-xs);
}

/* 系统信息 */
.system-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm);
  background-color: var(--color-bg-tertiary);
  border-radius: var(--border-radius-sm);
}

.info-label {
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}

.info-value {
  font-weight: 500;
  font-size: 0.875rem;
}

.info-value.success {
  color: var(--color-success);
}

/* 无数据提示 */
.no-data {
  text-align: center;
  padding: var(--spacing-lg);
  color: var(--color-text-secondary);
  font-style: italic;
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
  z-index: 1000;
  max-width: 400px;
  cursor: pointer;
}

.error-close {
  background: none;
  border: none;
  color: white;
  font-size: 1.125rem;
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
    flex-direction: column;
    gap: var(--spacing-sm);
    align-items: stretch;
  }

  .header-left {
    justify-content: center;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .dashboard-content {
    padding: var(--spacing-md);
  }

  .quick-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .threat-stats {
    flex-direction: column;
  }
}
</style>