<template>
  <div class="panel">
    <div class="panel-header">
      <h3 class="panel-title">TARGETS</h3>
      <div class="panel-actions">
        <button class="action-btn" @click="refreshTargets" :disabled="loading">
          <span class="icon" :class="{ spinning: loading }">🔄</span>
        </button>
        <button class="action-btn" @click="showAddDialog = true">
          <span class="icon">➕</span>
        </button>
      </div>
    </div>

    <div class="panel-content">
      <!-- 目标列表 -->
      <div class="targets-list" v-if="!loading">
        <div
            v-for="target in targets"
            :key="target.id"
            class="target-item"
            :class="{
            active: target.id === selectedTargetId,
            offline: target.status === 'offline',
            warning: target.status === 'warning'
          }"
            @click="selectTarget(target.id)"
        >
          <div class="target-main">
            <div class="target-ip">{{ target.ip }}</div>
            <div class="target-meta">
              <span class="target-status" :class="target.status">
                <span class="status-dot"></span>
                {{ getStatusText(target.status) }}
              </span>
              <span class="target-vulns" v-if="target.vulnerabilities > 0">
                {{ target.vulnerabilities }} 漏洞
              </span>
            </div>
          </div>
          <div class="target-actions" @click.stop>
            <button class="mini-btn" @click="startScan(target.id)" :disabled="target.scanning">
              <span v-if="target.scanning">⏳</span>
              <span v-else>🔍</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-else class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载目标列表...</p>
      </div>

      <!-- 空状态 -->
      <div v-if="!loading && targets.length === 0" class="empty-state">
        <div class="empty-icon">🎯</div>
        <p>暂无目标</p>
        <button class="btn-primary" @click="showAddDialog = true">
          添加目标
        </button>
      </div>
    </div>

    <!-- 添加目标对话框 -->
    <div v-if="showAddDialog" class="modal-overlay" @click.self="showAddDialog = false">
      <div class="modal-content">
        <div class="modal-header">
          <h4>添加新目标</h4>
          <button class="modal-close" @click="showAddDialog = false">×</button>
        </div>
        <form @submit.prevent="addTarget" class="add-target-form">
          <div class="form-group">
            <label>IP地址</label>
            <input v-model="newTarget.ip" type="text" placeholder="192.168.1.100" required>
          </div>
          <div class="form-group">
            <label>名称</label>
            <input v-model="newTarget.name" type="text" placeholder="目标名称">
          </div>
          <div class="form-group">
            <label>类型</label>
            <select v-model="newTarget.type">
              <option value="server">服务器</option>
              <option value="client">客户端</option>
              <option value="device">设备</option>
            </select>
          </div>
          <div class="form-actions">
            <button type="button" class="btn-secondary" @click="showAddDialog = false">
              取消
            </button>
            <button type="submit" class="btn-primary" :disabled="addingTarget">
              {{ addingTarget ? '添加中...' : '添加' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useDashboardStore } from '@/stores/dashboard'

const dashboardStore = useDashboardStore()

// 响应式数据
const showAddDialog = ref(false)
const addingTarget = ref(false)
const newTarget = ref({
  ip: '',
  name: '',
  type: 'server'
})

// 计算属性
const targets = computed(() => dashboardStore.targets)
const selectedTargetId = computed(() => dashboardStore.selectedTargetId)
const loading = computed(() => dashboardStore.loading)

// 方法
const selectTarget = (targetId) => {
  dashboardStore.selectTarget(targetId)
}

const refreshTargets = () => {
  dashboardStore.initializeDashboard()
}

const startScan = (targetId) => {
  dashboardStore.startScan(targetId)
}

const addTarget = async () => {
  try {
    addingTarget.value = true
    await dashboardStore.addTarget({ ...newTarget.value })

    // 重置表单
    newTarget.value = { ip: '', name: '', type: 'server' }
    showAddDialog.value = false
  } catch (error) {
    alert('添加目标失败: ' + error.message)
  } finally {
    addingTarget.value = false
  }
}

const getStatusText = (status) => {
  const statusMap = {
    'normal': '正常',
    'warning': '警告',
    'danger': '危险',
    'offline': '离线'
  }
  return statusMap[status] || '未知'
}

onMounted(() => {
  console.log('🎯 TargetsPanel mounted')
})
</script>

<style scoped>
/* Panel基础样式 */
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
  font-family: var(--font-family-base);
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
  overflow-y: auto;
}

/* 目标列表样式 */
.targets-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.target-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
}

.target-item:hover {
  border-color: var(--color-border-light);
  transform: translateY(-1px);
}

.target-item.active {
  border-left-color: var(--color-text-accent);
  background-color: var(--color-bg-tertiary);
  color: var(--color-text-accent);
}

.target-item.warning {
  border-left-color: var(--color-warning);
}

.target-item.offline {
  opacity: 0.6;
}

.target-main {
  flex: 1;
}

.target-ip {
  font-family: var(--font-family-mono);
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
}

.target-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
}

.target-status {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--color-text-secondary);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--color-text-secondary);
}

.target-status.normal .status-dot {
  background-color: var(--color-success);
}

.target-status.warning .status-dot {
  background-color: var(--color-warning);
}

.target-status.danger .status-dot {
  background-color: var(--color-danger);
}

.target-vulns {
  color: var(--color-warning);
}

.target-actions {
  display: flex;
  gap: 4px;
}

.mini-btn {
  width: 24px;
  height: 24px;
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  border-radius: 2px;
  transition: all 0.2s ease;
}

.mini-btn:hover {
  background-color: var(--color-bg-tertiary);
  color: var(--color-text-accent);
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

/* 按钮样式 */
.btn-primary {
  padding: 8px 16px;
  background: linear-gradient(135deg, var(--color-text-accent), #4ECDC4);
  color: var(--color-bg-primary);
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(100, 255, 218, 0.3);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 8px 16px;
  background: none;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  border-color: var(--color-text-accent);
  color: var(--color-text-accent);
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
}

.modal-header h4 {
  margin: 0;
  color: var(--color-text-primary);
}

.modal-close {
  width: 24px;
  height: 24px;
  background: none;
  border: none;
  color: var(--color-text-secondary);
  font-size: 18px;
  cursor: pointer;
}

.add-target-form {
  padding: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  color: var(--color-text-primary);
  font-size: 14px;
  font-weight: 500;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 8px 12px;
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  color: var(--color-text-primary);
  font-size: 14px;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--color-text-accent);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}
</style>