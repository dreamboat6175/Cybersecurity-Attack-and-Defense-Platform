<template>
  <div class="panel targets-panel">
    <div class="panel-header">
      <h3 class="panel-title">
        <span class="title-icon">🎯</span>
        目标列表
      </h3>
      <div class="header-actions">
        <span class="target-count">{{ targets.length }}</span>
        <button
            class="add-target-btn"
            @click="showAddDialog = true"
            title="添加目标"
        >
          <span class="btn-icon">➕</span>
        </button>
      </div>
    </div>

    <div class="panel-content">
      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载目标列表...</p>
      </div>

      <!-- 空状态 -->
      <div v-else-if="targets.length === 0" class="empty-state">
        <div class="empty-icon">🎯</div>
        <p class="empty-text">暂无目标</p>
        <button class="empty-action" @click="showAddDialog = true">
          添加第一个目标
        </button>
      </div>

      <!-- 目标列表 -->
      <div v-else class="targets-list">
        <div
            v-for="target in targets"
            :key="target.id"
            class="target-item"
            :class="[
            `status-${target.status}`,
            { active: selectedTargetId === target.id }
          ]"
            @click="selectTarget(target.id)"
        >
          <!-- 状态指示器 -->
          <div class="target-status">
            <div class="status-dot" :class="target.status"></div>
            <div class="status-icon">{{ getTargetIcon(target.type) }}</div>
          </div>

          <!-- 目标信息 -->
          <div class="target-info">
            <div class="target-header">
              <span class="target-name">{{ target.name || target.ip }}</span>
              <span class="vulnerability-count" v-if="target.vulnerabilities > 0">
                {{ target.vulnerabilities }}
              </span>
            </div>
            <div class="target-details">
              <span class="target-ip">{{ target.ip }}</span>
              <span class="target-type">{{ getTargetTypeText(target.type) }}</span>
            </div>
            <div class="target-meta">
              <span class="last-seen" :title="`最后发现: ${formatTime(target.lastSeen)}`">
                {{ formatRelativeTime(target.lastSeen) }}
              </span>
            </div>
          </div>

          <!-- 快捷操作 -->
          <div class="target-actions" @click.stop>
            <button
                class="action-btn scan-btn"
                @click="startScan(target.id)"
                :disabled="target.status === 'offline'"
                title="扫描目标"
            >
              🔍
            </button>
            <button
                class="action-btn delete-btn"
                @click="deleteTarget(target.id)"
                title="删除目标"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加目标对话框 -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showAddDialog" class="modal-overlay" @click="closeAddDialog">
          <div class="modal-content" @click.stop>
            <div class="modal-header">
              <h4>添加新目标</h4>
              <button class="modal-close" @click="closeAddDialog">×</button>
            </div>

            <form class="add-target-form" @submit.prevent="addTarget">
              <div class="form-group">
                <label>IP地址 *</label>
                <input
                    v-model="newTarget.ip"
                    type="text"
                    placeholder="192.168.1.10"
                    required
                    :class="{ error: ipError }"
                />
                <span v-if="ipError" class="field-error">{{ ipError }}</span>
              </div>

              <div class="form-group">
                <label>名称</label>
                <input
                    v-model="newTarget.name"
                    type="text"
                    placeholder="服务器名称"
                />
              </div>

              <div class="form-group">
                <label>类型</label>
                <select v-model="newTarget.type">
                  <option value="server">服务器</option>
                  <option value="client">客户端</option>
                  <option value="device">设备</option>
                  <option value="router">路由器</option>
                </select>
              </div>

              <div class="form-actions">
                <button type="button" class="btn-secondary" @click="closeAddDialog">
                  取消
                </button>
                <button type="submit" class="btn-primary" :disabled="isAdding">
                  <span v-if="isAdding" class="loading-spinner small"></span>
                  {{ isAdding ? '添加中...' : '添加' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useDashboardStore } from '@/stores/dashboard'
import { formatTime, formatRelativeTime } from '@/utils/format'
import { isValidIP } from '@/utils/helpers'
import * as dashboardApi from '@/api/dashboard'

// Store
const dashboardStore = useDashboardStore()

// 响应式数据
const showAddDialog = ref(false)
const isAdding = ref(false)
const newTarget = ref({
  ip: '',
  name: '',
  type: 'server'
})
const ipError = ref('')

// 计算属性
const isLoading = computed(() => dashboardStore.isLoading)
const targets = computed(() => dashboardStore.targets)
const selectedTargetId = computed(() => dashboardStore.selectedTargetId)

// 方法
const selectTarget = (targetId) => {
  dashboardStore.selectTarget(targetId)
}

const getTargetIcon = (type) => {
  const icons = {
    server: '🖥️',
    client: '💻',
    device: '📱',
    router: '🌐',
    database: '🗄️'
  }
  return icons[type] || '🖥️'
}

const getTargetTypeText = (type) => {
  const types = {
    server: '服务器',
    client: '客户端',
    device: '设备',
    router: '路由器',
    database: '数据库'
  }
  return types[type] || '未知'
}

const startScan = async (targetId) => {
  try {
    console.log('🔍 启动扫描:', targetId)
    await dashboardStore.startScan(targetId)
    // 这里可以显示扫描启动成功的提示
  } catch (error) {
    console.error('❌ 启动扫描失败:', error)
  }
}

const deleteTarget = async (targetId) => {
  if (!confirm('确定要删除这个目标吗？')) return

  try {
    await dashboardApi.deleteTarget(targetId)
    console.log('🗑️ 目标已删除:', targetId)
    // 刷新目标列表
    await dashboardStore.refreshData()
  } catch (error) {
    console.error('❌ 删除目标失败:', error)
  }
}

const addTarget = async () => {
  // 验证IP地址
  if (!isValidIP(newTarget.value.ip)) {
    ipError.value = 'IP地址格式不正确'
    return
  }
  ipError.value = ''

  try {
    isAdding.value = true

    await dashboardApi.addTarget(newTarget.value)
    console.log('✅ 目标添加成功:', newTarget.value.ip)

    // 关闭对话框并重置表单
    closeAddDialog()

    // 刷新目标列表
    await dashboardStore.refreshData()

  } catch (error) {
    console.error('❌ 添加目标失败:', error)
    if (error.message.includes('已存在')) {
      ipError.value = '该IP地址已存在'
    }
  } finally {
    isAdding.value = false
  }
}

const closeAddDialog = () => {
  showAddDialog.value = false
  newTarget.value = { ip: '', name: '', type: 'server' }
  ipError.value = ''
}
</script>

<style scoped>
.targets-panel {
  height: 100%;
}

/* 面板头部 */
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-icon {
  margin-right: var(--spacing-xs);
}

.header-actions {
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-target-btn:hover {
  border-color: var(--color-text-accent);
  color: var(--color-text-accent);
}

.btn-icon {
  font-size: var(--font-size-sm);
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
}

.loading-state p,
.empty-text {
  margin-top: var(--spacing-md);
  font-size: var(--font-size-sm);
}

.empty-icon {
  font-size: 3rem;
  opacity: 0.5;
}

.empty-action {
  margin-top: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-text-accent);
  color: var(--color-bg-primary);
  border: none;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: all var(--transition-base);
}

.empty-action:hover {
  background-color: #4ECDC4;
}

/* 目标列表 */
.targets-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.target-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: all var(--transition-base);
  position: relative;
}

.target-item:hover {
  border-color: var(--color-border-light);
  transform: translateY(-1px);
}

.target-item.active {
  border-color: var(--color-text-accent);
  background-color: rgba(100, 255, 218, 0.05);
}

.target-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background-color: var(--color-text-accent);
}

/* 状态样式 */
.target-item.status-danger {
  border-left: 3px solid var(--color-danger);
}

.target-item.status-warning {
  border-left: 3px solid var(--color-warning);
}

.target-item.status-normal {
  border-left: 3px solid var(--color-success);
}

.target-item.status-offline {
  opacity: 0.6;
}

/* 目标状态 */
.target-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
  flex-shrink: 0;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.normal { background-color: var(--color-success); }
.status-dot.warning { background-color: var(--color-warning); }
.status-dot.danger { background-color: var(--color-danger); }
.status-dot.offline { background-color: var(--color-text-secondary); }

.status-icon {
  font-size: var(--font-size-base);
}

/* 目标信息 */
.target-info {
  flex: 1;
  min-width: 0;
}

.target-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xs);
}

.target-name {
  font-weight: 600;
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.vulnerability-count {
  background-color: var(--color-danger);
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: var(--font-size-xs);
  font-weight: 600;
}

.target-details {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xs);
}

.target-ip {
  font-family: var(--font-family-mono);
  color: var(--color-text-accent);
  font-size: var(--font-size-xs);
}

.target-type {
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
}

.target-meta {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

/* 目标操作 */
.target-actions {
  display: flex;
  gap: var(--spacing-xs);
  opacity: 0;
  transition: opacity var(--transition-base);
}

.target-item:hover .target-actions {
  opacity: 1;
}

.action-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: all var(--transition-base);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-sm);
}

.scan-btn {
  background-color: var(--color-info);
  color: white;
}

.scan-btn:hover:not(:disabled) {
  background-color: #1976D2;
}

.scan-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.delete-btn {
  background-color: var(--color-danger);
  color: white;
}

.delete-btn:hover {
  background-color: #D32F2F;
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
  z-index: var(--z-modal);
  padding: var(--spacing-lg);
}

.modal-content {
  background-color: var(--color-bg-secondary);
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--color-border);
  width: 100%;
  max-width: 400px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);
}

.modal-header h4 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-lg);
}

.modal-close {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  font-size: var(--font-size-xl);
  cursor: pointer;
  width: 32px;
  height: 32px;
  border-radius: var(--border-radius-sm);
  transition: all var(--transition-base);
}

.modal-close:hover {
  background-color: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

/* 表单样式 */
.add-target-form {
  padding: var(--spacing-lg);
}

.form-group {
  margin-bottom: var(--spacing-lg);
}

.form-group label {
  display: block;
  margin-bottom: var(--spacing-sm);
  color: var(--color-text-primary);
  font-weight: 500;
  font-size: var(--font-size-sm);
}

.form-group input,
.form-group select {
  width: 100%;
  padding: var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  transition: border-color var(--transition-base);
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--color-text-accent);
}

.form-group input.error {
  border-color: var(--color-danger);
}

.field-error {
  display: block;
  margin-top: var(--spacing-xs);
  color: var(--color-danger);
  font-size: var(--font-size-xs);
}

.form-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: flex-end;
}

.btn-secondary,
.btn-primary {
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: all var(--transition-base);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.btn-secondary {
  background: none;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
}

.btn-secondary:hover {
  border-color: var(--color-text-accent);
  color: var(--color-text-accent);
}

.btn-primary {
  background-color: var(--color-text-accent);
  border: none;
  color: var(--color-bg-primary);
}

.btn-primary:hover:not(:disabled) {
  background-color: #4ECDC4;
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loading-spinner.small {
  width: 16px;
  height: 16px;
  border-width: 2px;
}

/* 模态框动画 */
.modal-enter-active,
.modal-leave-active {
  transition: all var(--transition-base);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.9) translateY(-20px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .target-item {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }

  .target-header {
    width: 100%;
  }

  .target-actions {
    opacity: 1;
    align-self: flex-end;
  }

  .modal-overlay {
    padding: var(--spacing-sm);
  }
}items: center;
gap: var(--spacing-sm);
}

.target-count {
  background-color: var(--color-text-accent);
  color: var(--color-bg-primary);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 600;
}

.add-target-btn {
  background: none;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  width: 32px;
  height: 32px;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: all var(--transition-base);
  display: flex;
  align-