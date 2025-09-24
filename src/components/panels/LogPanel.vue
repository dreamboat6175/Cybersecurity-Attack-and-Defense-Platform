<template>
  <div class="panel log-panel">
    <div class="panel-header">
      <h3 class="panel-title">
        <span class="title-icon">📋</span>
        攻击日志
      </h3>
      <div class="header-controls">
        <div class="log-filters">
          <select v-model="severityFilter" class="filter-select">
            <option value="">全部级别</option>
            <option value="low">低</option>
            <option value="medium">中</option>
            <option value="high">高</option>
            <option value="critical">严重</option>
          </select>
          <select v-model="statusFilter" class="filter-select">
            <option value="">全部状态</option>
            <option value="blocked">已阻止</option>
            <option value="allowed">已通过</option>
          </select>
        </div>
        <div class="log-actions">
          <button
              class="action-btn clear-btn"
              @click="showClearDialog = true"
              :disabled="filteredLogs.length === 0"
              title="清空日志"
          >
            🗑️
          </button>
          <button
              class="action-btn export-btn"
              @click="exportLogs"
              :disabled="filteredLogs.length === 0"
              title="导出日志"
          >
            📥
          </button>
        </div>
      </div>
    </div>

    <div class="panel-content">
      <!-- 实时状态指示器 -->
      <div class="realtime-indicator" :class="{ active: isRealtime }">
        <div class="indicator-dot"></div>
        <span class="indicator-text">
          {{ isRealtime ? '实时监控中' : '监控已暂停' }}
        </span>
        <button
            class="toggle-realtime"
            @click="toggleRealtime"
            :title="isRealtime ? '暂停实时更新' : '开启实时更新'"
        >
          {{ isRealtime ? '⏸️' : '▶️' }}
        </button>
      </div>

      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载攻击日志...</p>
      </div>

      <!-- 空状态 -->
      <div v-else-if="filteredLogs.length === 0" class="empty-state">
        <div class="empty-icon">📋</div>
        <p class="empty-text">
          {{ attackLogs.length === 0 ? '暂无攻击日志' : '没有符合条件的日志' }}
        </p>
        <button v-if="attackLogs.length > 0" class="clear-filters" @click="clearFilters">
          清除筛选条件
        </button>
      </div>

      <!-- 日志列表 -->
      <div v-else class="logs-container">
        <div class="logs-header">
          <div class="log-count">
            显示 {{ filteredLogs.length }} 条记录
            <span v-if="totalLogs !== filteredLogs.length">
              / 共 {{ totalLogs }} 条
            </span>
          </div>
          <div class="auto-scroll-toggle">
            <label class="checkbox-label">
              <input
                  v-model="autoScroll"
                  type="checkbox"
                  class="checkbox-input"
              />
              <span class="checkbox-custom"></span>
              <span class="checkbox-text">自动滚动</span>
            </label>
          </div>
        </div>

        <div
            ref="logsListRef"
            class="logs-list"
            :class="{ 'auto-scroll': autoScroll }"
        >
          <TransitionGroup name="log-item" tag="div">
            <div
                v-for="log in displayLogs"
                :key="log.id"
                class="log-item"
                :class="[
                `severity-${log.severity}`,
                { blocked: log.blocked }
              ]"
                @click="selectLog(log)"
            >
              <!-- 时间戳 -->
              <div class="log-timestamp">
                {{ formatTime(log.timestamp, 'timestamp') }}
              </div>

              <!-- 状态和严重程度 */
              <div class="log-indicators">
                <div class="severity-badge" :class="`severity-${log.severity}`">
                  {{ getSeverityIcon(log.severity) }}
                </div>
                <div class="status-badge" :class="{ blocked: log.blocked }">
                  {{ log.blocked ? '🛡️' : '⚠️' }}
                </div>
              </div>

              <!-- 日志内容 -->
              <div class="log-content">
                <div class="log-main">
                  <span class="log-target">{{ log.targetName || log.target }}</span>
                  <span class="log-separator">-</span>
                  <span class="log-description">{{ log.description }}</span>
                </div>
                <div class="log-meta">
                  <span class="log-source">来源: {{ log.source || 'Unknown' }}</span>
                  <span class="log-type">类型: {{ getAttackTypeName(log.type) }}</span>
                </div>
              </div>

              <!-- 展开指示器 -->
              <div class="log-expand">
                <span class="expand-icon">{{ selectedLogId === log.id ? '▼' : '▶' }}</span>
              </div>
            </div>
          </TransitionGroup>

          <!-- 加载更多 -->
          <div v-if="hasMoreLogs" class="load-more">
            <button class="load-more-btn" @click="loadMoreLogs" :disabled="isLoadingMore">
              <span v-if="isLoadingMore" class="loading-spinner small"></span>
              {{ isLoadingMore ? '加载中...' : '加载更多' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 日志详情 -->
      <Transition name="slide-up">
        <div v-if="selectedLog" class="log-details">
          <div class="details-header">
            <h4>日志详情</h4>
            <button class="close-details" @click="selectedLogId = null">×</button>
          </div>

          <div class="details-content">
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">时间:</span>
                <span class="detail-value">{{ formatTime(selectedLog.timestamp) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">目标:</span>
                <span class="detail-value">{{ selectedLog.target }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">来源:</span>
                <span class="detail-value">{{ selectedLog.source || 'Unknown' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">攻击类型:</span>
                <span class="detail-value">{{ getAttackTypeName(selectedLog.type) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">严重程度:</span>
                <span class="detail-value severity-badge" :class="`severity-${selectedLog.severity}`">
                  {{ getSeverityLabel(selectedLog.severity) }}
                </span>
              </div>
              <div class="detail-item">
                <span class="detail-label">状态:</span>
                <span class="detail-value status-badge" :class="{ blocked: selectedLog.blocked }">
                  {{ selectedLog.blocked ? '已阻止' : '已通过' }}
                </span>
              </div>
            </div>

            <div class="detail-description">
              <h5>描述</h5>
              <p>{{ selectedLog.description }}</p>
            </div>

            <div v-if="selectedLog.details" class="detail-technical">
              <h5>技术详情</h5>
              <div class="technical-info">
                <div v-if="selectedLog.details.protocol" class="tech-item">
                  <span class="tech-label">协议:</span>
                  <span class="tech-value">{{ selectedLog.details.protocol }}</span>
                </div>
                <div v-if="selectedLog.details.port" class="tech-item">
                  <span class="tech-label">端口:</span>
                  <span class="tech-value">{{ selectedLog.details.port }}</span>
                </div>
                <div v-if="selectedLog.details.payload" class="tech-item">
                  <span class="tech-label">载荷:</span>
                  <span class="tech-value payload">{{ selectedLog.details.payload }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <!-- 清空确认对话框 -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showClearDialog" class="modal-overlay" @click="closeClearDialog">
          <div class="modal-content clear-dialog" @click.stop>
            <div class="modal-header">
              <div class="dialog-icon">⚠️</div>
              <h4>清空攻击日志</h4>
              <button class="modal-close" @click="closeClearDialog">×</button>
            </div>

            <div class="dialog-content">
              <p>确定要清空所有攻击日志吗？此操作不可撤销。</p>
              <div class="clear-options">
                <label class="checkbox-label">
                  <input v-model="clearOptions.keepBlocked" type="checkbox" class="checkbox-input" />
                  <span class="checkbox-custom"></span>
                  <span class="checkbox-text">保留已阻止的攻击记录</span>
                </label>
              </div>
            </div>

            <div class="dialog-actions">
              <button class="btn-secondary" @click="closeClearDialog">
                取消
              </button>
              <button class="btn-danger" @click="clearLogs" :disabled="isClearing">
                <span v-if="isClearing" class="loading-spinner small"></span>
                {{ isClearing ? '清空中...' : '确认清空' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useDashboardStore } from '@/stores/dashboard'
import { formatTime } from '@/utils/format'
import { ATTACK_TYPES } from '@/utils/constants'

// Store
const dashboardStore = useDashboardStore()

// 响应式数据
const severityFilter = ref('')
const statusFilter = ref('')
const selectedLogId = ref(null)
const isRealtime = ref(true)
const autoScroll = ref(true)
const showClearDialog = ref(false)
const isClearing = ref(false)
const isLoadingMore = ref(false)
const displayLimit = ref(50)
const logsListRef = ref(null)

const clearOptions = ref({
  keepBlocked: false
})

// 计算属性
const isLoading = computed(() => dashboardStore.isLoading)
const attackLogs = computed(() => dashboardStore.recentAttackLogs)

const filteredLogs = computed(() => {
  let logs = [...attackLogs.value]

  // 严重程度筛选
  if (severityFilter.value) {
    logs = logs.filter(log => log.severity === severityFilter.value)
  }

  // 状态筛选
  if (statusFilter.value) {
    if (statusFilter.value === 'blocked') {
      logs = logs.filter(log => log.blocked)
    } else if (statusFilter.value === 'allowed') {
      logs = logs.filter(log => !log.blocked)
    }
  }

  return logs
})

const displayLogs = computed(() => {
  return filteredLogs.value.slice(0, displayLimit.value)
})

const hasMoreLogs = computed(() => {
  return filteredLogs.value.length > displayLimit.value
})

const totalLogs = computed(() => attackLogs.value.length)

const selectedLog = computed(() => {
  return attackLogs.value.find(log => log.id === selectedLogId.value)
})

// 方法
const getSeverityIcon = (severity) => {
  const icons = {
    low: '🟢',
    medium: '🟡',
    high: '🟠',
    critical: '🔴'
  }
  return icons[severity] || '⚪'
}

const getSeverityLabel = (severity) => {
  const labels = {
    low: '低',
    medium: '中',
    high: '高',
    critical: '严重'
  }
  return labels[severity] || '未知'
}

const getAttackTypeName = (type) => {
  const names = {
    sql_injection: 'SQL注入',
    xss: 'XSS攻击',
    brute_force: '暴力破解',
    dos: 'DoS攻击',
    malware: '恶意软件',
    phishing: '钓鱼攻击'
  }
  return names[type] || type
}

const selectLog = (log) => {
  selectedLogId.value = selectedLogId.value === log.id ? null : log.id
}

const toggleRealtime = () => {
  isRealtime.value = !isRealtime.value
  console.log(`📊 实时监控${isRealtime.value ? '已开启' : '已暂停'}`)
}

const clearFilters = () => {
  severityFilter.value = ''
  statusFilter.value = ''
}

const loadMoreLogs = () => {
  isLoadingMore.value = true

  setTimeout(() => {
    displayLimit.value += 50
    isLoadingMore.value = false
  }, 500)
}

const exportLogs = () => {
  try {
    const csvContent = generateCSV(filteredLogs.value)
    downloadCSV(csvContent, `attack-logs-${new Date().toISOString().split('T')[0]}.csv`)
    console.log('📥 日志导出成功')
  } catch (error) {
    console.error('❌ 日志导出失败:', error)
  }
}

const generateCSV = (logs) => {
  const headers = ['时间', '目标', '来源', '攻击类型', '严重程度', '状态', '描述']
  const rows = logs.map(log => [
    formatTime(log.timestamp),
    log.target,
    log.source || 'Unknown',
    getAttackTypeName(log.type),
    getSeverityLabel(log.severity),
    log.blocked ? '已阻止' : '已通过',
    log.description
  ])

  const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

  return csvContent
}

const downloadCSV = (content, filename) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const clearLogs = async () => {
  try {
    isClearing.value = true

    // 模拟清空操作
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 这里应该调用API清空日志
    console.log('🗑️ 日志已清空')

    closeClearDialog()

  } catch (error) {
    console.error('❌ 清空日志失败:', error)
  } finally {
    isClearing.value = false
  }
}

const closeClearDialog = () => {
  showClearDialog.value = false
  clearOptions.value.keepBlocked = false
}

// 自动滚动到底部
const scrollToBottom = () => {
  if (autoScroll.value && logsListRef.value) {
    nextTick(() => {
      logsListRef.value.scrollTop = logsListRef.value.scrollHeight
    })
  }
}

// 监听日志变化，自动滚动
watch(
    () => attackLogs.value.length,
    (newLength, oldLength) => {
      if (newLength > oldLength && isRealtime.value) {
        scrollToBottom()
      }
    }
)
</script>

<style scoped>
.log-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 头部控件 */
.header-controls {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
}

.log-filters {
  display: flex;
  gap: var(--spacing-sm);
}

.filter-select {
  padding: var(--spacing-xs) var(--spacing-sm);
  border: 1px solid var(--color-border);
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  min-width: 80px;
}

.filter-select:focus {
  outline: none;
  border-color: var(--color-text-accent);
}

.log-actions {
  display: flex;
  gap: var(--spacing-xs);
}

.action-btn {
  width: 28px;
  height: 28px;
  border: 1px solid var(--color-border);
  background-color: transparent;
  color: var(--color-text-secondary);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: all var(--transition-base);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-sm);
}

.action-btn:hover:not(:disabled) {
  border-color: var(--color-text-accent);
  color: var(--color-text-accent);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 实时指示器 */
.realtime-indicator {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  margin-bottom: var(--spacing-md);
  font-size: var(--font-size-xs);
}

.indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--color-text-secondary);
  transition: background-color var(--transition-base);
}

.realtime-indicator.active .indicator-dot {
  background-color: var(--color-success);
  animation: pulse 1.5s infinite;
}

.indicator-text {
  flex: 1;
  color: var(--color-text-secondary);
}

.toggle-realtime {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: var(--font-size-sm);
  padding: var(--spacing-xs);
  border-radius: var(--border-radius-sm);
  transition: all var(--transition-base);
}

.toggle-realtime:hover {
  background-color: var(--color-bg-tertiary);
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: var(--color-text-secondary);
}

.empty-icon {
  font-size: 3rem;
  opacity: 0.5;
  margin-bottom: var(--spacing-md);
}

.empty-text {
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-md);
}

.clear-filters {
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-text-accent);
  color: var(--color-bg-primary);
  border: none;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  font-size: var(--font-size-sm);
}

/* 日志容器 */
.logs-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: var(--spacing-sm);
}

.log-count {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.auto-scroll-toggle {
  font-size: var(--font-size-xs);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  cursor: pointer;
  color: var(--color-text-secondary);
}

.checkbox-input {
  position: absolute;
  opacity: 0;
}

.checkbox-custom {
  width: 14px;
  height: 14px;
  border: 1px solid var(--color-border);
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-base);
}

.checkbox-input:checked + .checkbox-custom {
  background-color: var(--color-text-accent);
  border-color: var(--color-text-accent);
}

.checkbox-input:checked + .checkbox-custom::after {
  content: '✓';
  color: var(--color-bg-primary);
  font-size: 10px;
  font-weight: bold;
}

/* 日志列表 */
.logs-list {
  flex: 1;
  overflow-y: auto;
  padding-right: var(--spacing-xs);
}

.logs-list.auto-scroll {
  scroll-behavior: smooth;
}

.log-item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  margin-bottom: var(--spacing-xs);
  background-color: var(--color-bg-primary);
  cursor: pointer;
  transition: all var(--transition-base);
  position: relative;
}

.log-item:hover {
  background-color: var(--color-bg-tertiary);
  border-color: var(--color-border-light);
}

.log-item.blocked {
  border-left: 3px solid var(--color-success);
}

/* 严重程度样式 */
.log-item.severity-low { border-left: 3px solid var(--color-success); }
.log-item.severity-medium { border-left: 3px solid var(--color-warning); }
.log-item.severity-high { border-left: 3px solid #FF9800; }
.log-item.severity-critical { border-left: 3px solid var(--color-danger); }

.log-timestamp {
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  min-width: 80px;
  padding-top: 2px;
}

.log-indicators {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.severity-badge,
.status-badge {
  font-size: var(--font-size-sm);
}

.log-content {
  flex: 1;
  min-width: 0;
}

.log-main {
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-xs);
  line-height: 1.4;
}

.log-target {
  color: var(--color-text-accent);
  font-weight: 500;
}

.log-separator {
  color: var(--color-text-secondary);
  margin: 0 var(--spacing-xs);
}

.log-description {
  color: var(--color-text-primary);
}

.log-meta {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  display: flex;
  gap: var(--spacing-md);
}

.log-expand {
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
  padding-top: 2px;
}

/* 日志详情 */
.log-details {
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  margin-top: var(--spacing-md);
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  background-color: var(--color-bg-tertiary);
  border-bottom: 1px solid var(--color-border);
}

.details-header h4 {
  margin: 0;
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
}

.close-details {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  font-size: var(--font-size-lg);
  cursor: pointer;
  width: 24px;
  height: 24px;
  border-radius: var(--border-radius-sm);
  transition: all var(--transition-base);
}

.close-details:hover {
  background-color: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

.details-content {
  padding: var(--spacing-md);
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--color-border);
}

.detail-label {
  font-weight: 500;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.detail-value {
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  text-align: right;
}

.detail-description,
.detail-technical {
  margin-bottom: var(--spacing-md);
}

.detail-description h5,
.detail-technical h5 {
  margin: 0 0 var(--spacing-sm);
  color: var(--color-text-accent);
  font-size: var(--font-size-sm);
}

.detail-description p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  line-height: 1.5;
}

.technical-info {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.tech-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.tech-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  font-weight: 500;
}

.tech-value {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

.tech-value.payload {
  font-family: var(--font-family-mono);
  background-color: var(--color-bg-secondary);
  padding: var(--spacing-xs);
  border-radius: var(--border-radius-sm);
  word-break: break-all;
}

/* 加载更多 */
.load-more {
  text-align: center;
  padding: var(--spacing-md);
}

.load-more-btn {
  padding: var(--spacing-sm) var(--spacing-lg);
  background-color: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: all var(--transition-base);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin: 0 auto;
}

.load-more-btn:hover:not(:disabled) {
  border-color: var(--color-text-accent);
  color: var(--color-text-accent);
}

.load-more-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 清空对话框 */
.clear-dialog {
  max-width: 400px;
}

.clear-options {
  margin-top: var(--spacing-md);
  padding: var(--spacing-md);
  background-color: var(--color-bg-tertiary);
  border-radius: var(--border-radius-sm);
}

/* 动画效果 */
.log-item-enter-active,
.log-item-leave-active {
  transition: all var(--transition-base);
}

.log-item-enter-from,
.log-item-leave-to {
  opacity: 0;
  transform: translateX(-20px);
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
  .header-controls {
    flex-direction: column;
    gap: var(--spacing-sm);
    align-items: stretch;
  }

  .log-filters {
    justify-content: space-between;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }

  .logs-header {
    flex-direction: column;
    gap: var(--spacing-sm);
    align-items: stretch;
  }

  .technical-info {
    flex-direction: column;
  }
}