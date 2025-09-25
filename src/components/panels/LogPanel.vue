<template>
  <div class="panel">
    <div class="panel-header">
      <h3 class="panel-title">ATTACK LOG</h3>
      <div class="panel-actions">
        <button class="action-btn" @click="refreshLogs" :disabled="loading">
          <span class="icon" :class="{ spinning: loading }">🔄</span>
        </button>
      </div>
    </div>

    <div class="panel-content">
      <!-- 实时指示器 -->
      <div class="realtime-indicator" :class="{ active: realtimeEnabled }">
        <span class="indicator-dot"></span>
        <span class="indicator-text">实时日志 {{ realtimeEnabled ? '已开启' : '已关闭' }}</span>
        <button class="toggle-realtime" @click="toggleRealtime">
          {{ realtimeEnabled ? '关闭' : '开启' }}
        </button>
      </div>

      <!-- 表头 -->
      <div class="log-header">
        <div class="header-time">TIME</div>
        <div class="header-target">TARGET</div>
        <div class="header-description">DESCRIPTION</div>
      </div>

      <!-- 日志列表 -->
      <div class="log-list" v-if="!loading">
        <div
            v-for="log in displayLogs"
            :key="log.id"
            class="log-item"
            :class="{
            blocked: log.blocked,
            critical: log.severity === 'critical',
            high: log.severity === 'high'
          }"
            @click="selectLog(log)"
        >
          <div class="log-time">{{ log.time }}</div>
          <div class="log-target">{{ log.target }}</div>
          <div class="log-description">{{ log.description }}</div>
          <div class="log-status">
            <span v-if="log.blocked" class="status-blocked">🛡️</span>
            <span v-else class="status-allowed">⚠️</span>
          </div>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-else class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载攻击日志...</p>
      </div>

      <!-- 空状态 -->
      <div v-if="!loading && displayLogs.length === 0" class="empty-state">
        <div class="empty-icon">📋</div>
        <p>暂无攻击日志</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useDashboardStore } from '@/stores/dashboard'

const dashboardStore = useDashboardStore()

// 响应式数据
const realtimeEnabled = ref(true)
const selectedLogId = ref(null)
const realtimeTimer = ref(null)

// 计算属性
const attackLogs = computed(() => dashboardStore.attackLogs)
const realtimeAttackLogs = computed(() => dashboardStore.realtimeAttackLogs)
const loading = computed(() => dashboardStore.loading)

const displayLogs = computed(() => {
  return realtimeEnabled.value ?
      [...realtimeAttackLogs.value, ...attackLogs.value].slice(0, 20) :
      attackLogs.value.slice(0, 20)
})

// 方法
const refreshLogs = () => {
  // 触发重新加载攻击日志
  dashboardStore.initializeDashboard()
}

const toggleRealtime = () => {
  realtimeEnabled.value = !realtimeEnabled.value

  if (realtimeEnabled.value) {
    startRealtimeUpdates()
  } else {
    stopRealtimeUpdates()
  }
}

const selectLog = (log) => {
  selectedLogId.value = selectedLogId.value === log.id ? null : log.id
}

const startRealtimeUpdates = () => {
  // 模拟实时日志更新
  realtimeTimer.value = setInterval(() => {
    if (Math.random() > 0.7) { // 30% 概率生成新日志
      const newLog = {
        id: `realtime_${Date.now()}`,
        timestamp: new Date().toISOString(),
        time: new Date().toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }),
        target: `192.168.1.${Math.floor(Math.random() * 100) + 10}`,
        type: ['sql_injection', 'xss', 'brute_force'][Math.floor(Math.random() * 3)],
        severity: ['medium', 'high', 'critical'][Math.floor(Math.random() * 3)],
        description: [
          'SQL injection attempt blocked',
          'XSS attack detected',
          'Brute force login attempt',
          'Port scan detected',
          'Malware signature found'
        ][Math.floor(Math.random() * 5)],
        blocked: Math.random() > 0.3
      }

      dashboardStore.realtimeAttackLogs.unshift(newLog)

      // 保持最近50条
      if (dashboardStore.realtimeAttackLogs.length > 50) {
        dashboardStore.realtimeAttackLogs.pop()
      }
    }
  }, 5000) // 每5秒检查一次
}

const stopRealtimeUpdates = () => {
  if (realtimeTimer.value) {
    clearInterval(realtimeTimer.value)
    realtimeTimer.value = null
  }
}

onMounted(() => {
  console.log('📋 LogPanel mounted')
  if (realtimeEnabled.value) {
    startRealtimeUpdates()
  }
})

onUnmounted(() => {
  stopRealtimeUpdates()
})
</script>

<style scoped>
.panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--color-border);
}

.panel-title {
  margin: 0;
  font-size: 16px;
  font-weight: bold;
  color: var(--color-text-primary);
  letter-spacing: 1px;
}

.panel-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 32px;
  height: 32px;
  background: none;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.action-btn:hover {
  border-color: var(--color-text-accent);
  color: var(--color-text-accent);
}

.icon.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.panel-content {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 实时指示器 */
.realtime-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  margin-bottom: 16px;
  font-size: 12px;
}

.indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--color-text-secondary);
  transition: background-color 0.2s ease;
}

.realtime-indicator.active .indicator-dot {
  background-color: var(--color-success);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.indicator-text {
  flex: 1;
  color: var(--color-text-secondary);
}

.toggle-realtime {
  background: none;
  border: none;
  color: var(--color-text-accent);
  cursor: pointer;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 2px;
  transition: all 0.2s ease;
}

.toggle-realtime:hover {
  background-color: var(--color-bg-tertiary);
}

/* 日志表头 */
.log-header {
  display: flex;
  margin-bottom: 12px;
  font-size: 12px;
  color: var(--color-text-secondary);
  font-weight: 600;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border);
}

.header-time {
  width: 80px;
  font-family: var(--font-family-mono);
}

.header-target {
  width: 120px;
  font-family: var(--font-family-mono);
}

.header-description {
  flex: 1;
}

/* 日志列表 */
.log-list {
  flex: 1;
  overflow-y: auto;
}

.log-item {
  display: flex;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--color-border);
  font-size: 12px;
  color: var(--color-text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
}

.log-item:hover {
  background-color: var(--color-bg-tertiary);
}

.log-item:last-child {
  border-bottom: none;
}

.log-item.blocked {
  border-left-color: var(--color-success);
}

.log-item.critical {
  border-left-color: var(--color-danger);
}

.log-item.high {
  border-left-color: var(--color-warning);
}

.log-time {
  width: 80px;
  font-family: var(--font-family-mono);
  color: var(--color-text-secondary);
}

.log-target {
  width: 120px;
  font-family: var(--font-family-mono);
}

.log-description {
  flex: 1;
}

.log-status {
  width: 24px;
  text-align: center;
}

.status-blocked {
  color: var(--color-success);
}

.status-allowed {
  color: var(--color-warning);
}

/* 加载和空状态 */
.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: var(--color-text-secondary);
  text-align: center;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid transparent;
  border-top: 3px solid var(--color-text-accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

.empty-icon {
  font-size: 3rem;
  opacity: 0.5;
  margin-bottom: 12px;
}
</style>