<!-- src/components/panels/NetworkPanel.vue -->
<template>
  <div class="panel">
    <div class="panel-header">
      <h3 class="panel-title">
        <span class="title-icon">🌐</span>
        网络拓扑
      </h3>
      <div class="panel-actions">
        <button class="action-btn" @click="refreshNetwork" :disabled="loading">
          <span class="btn-icon" :class="{ spinning: loading }">🔄</span>
        </button>
        <button class="action-btn" @click="toggleFullscreen" title="全屏">
          <span class="btn-icon">⛶</span>
        </button>
      </div>
    </div>

    <div class="panel-content">
      <!-- 网络统计 -->
      <div class="network-stats">
        <div class="stat-item">
          <span class="stat-label">节点</span>
          <span class="stat-value">{{ networkNodes.length }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">连接</span>
          <span class="stat-value">{{ networkEdges.length }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">异常</span>
          <span class="stat-value warning">{{ anomalyCount }}</span>
        </div>
      </div>

      <!-- 网络图容器 -->
      <div class="network-container">
        <div v-if="loading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>加载网络拓扑...</p>
        </div>
        <div v-else ref="networkRef" class="network-graph"></div>
      </div>

      <!-- 选中节点信息 -->
      <div v-if="selectedNode" class="node-info">
        <div class="node-header">
          <span class="node-ip">{{ selectedNode.ip }}</span>
          <span class="node-status" :class="selectedNode.status">
            {{ getStatusText(selectedNode.status) }}
          </span>
        </div>
        <div class="node-details">
          <div class="detail-row">
            <span class="detail-label">类型:</span>
            <span class="detail-value">{{ getNodeTypeText(selectedNode.type) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">连接数:</span>
            <span class="detail-value">{{ getNodeConnections(selectedNode.id) }}</span>
          </div>
          <div class="detail-row" v-if="selectedNode.lastSeen">
            <span class="detail-label">最后活动:</span>
            <span class="detail-value">{{ formatTime(selectedNode.lastSeen) }}</span>
          </div>
        </div>
      </div>

      <!-- 图例 -->
      <div class="network-legend">
        <div class="legend-item">
          <span class="legend-dot normal"></span>
          <span class="legend-text">正常</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot warning"></span>
          <span class="legend-text">警告</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot danger"></span>
          <span class="legend-text">危险</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot offline"></span>
          <span class="legend-text">离线</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick, inject } from 'vue'
import { useDashboardStore } from '@/stores/dashboard'

const dashboardStore = useDashboardStore()
const enterFullscreen = inject('enterFullscreen', () => {})

// 响应式数据
const networkRef = ref(null)
const selectedNode = ref(null)
const loading = ref(false)

// Mock网络节点数据
const networkNodes = ref([
  {
    id: 'central',
    ip: '192.168.1.1',
    type: 'router',
    status: 'normal',
    x: 250,
    y: 150,
    lastSeen: new Date().toISOString()
  },
  {
    id: 'server1',
    ip: '192.168.1.10',
    type: 'server',
    status: 'normal',
    x: 150,
    y: 100,
    lastSeen: new Date().toISOString()
  },
  {
    id: 'server2',
    ip: '192.168.1.20',
    type: 'server',
    status: 'warning',
    x: 350,
    y: 100,
    lastSeen: new Date(Date.now() - 300000).toISOString()
  },
  {
    id: 'client1',
    ip: '192.168.1.30',
    type: 'client',
    status: 'normal',
    x: 100,
    y: 200,
    lastSeen: new Date().toISOString()
  },
  {
    id: 'client2',
    ip: '192.168.1.40',
    type: 'client',
    status: 'normal',
    x: 400,
    y: 200,
    lastSeen: new Date().toISOString()
  },
  {
    id: 'device1',
    ip: '192.168.1.50',
    type: 'device',
    status: 'offline',
    x: 200,
    y: 250,
    lastSeen: new Date(Date.now() - 3600000).toISOString()
  }
])

// Mock网络连接数据
const networkEdges = ref([
  { source: 'central', target: 'server1', type: 'normal' },
  { source: 'central', target: 'server2', type: 'warning' },
  { source: 'central', target: 'client1', type: 'normal' },
  { source: 'central', target: 'client2', type: 'normal' },
  { source: 'central', target: 'device1', type: 'offline' },
  { source: 'server1', target: 'client1', type: 'normal' }
])

// 计算属性
const anomalyCount = computed(() => {
  return networkNodes.value.filter(node =>
      node.status === 'warning' || node.status === 'danger' || node.status === 'offline'
  ).length
})

// 方法
const getStatusText = (status) => {
  const statusMap = {
    'normal': '正常',
    'warning': '警告',
    'danger': '危险',
    'offline': '离线'
  }
  return statusMap[status] || '未知'
}

const getNodeTypeText = (type) => {
  const typeMap = {
    'router': '路由器',
    'server': '服务器',
    'client': '客户端',
    'device': '设备'
  }
  return typeMap[type] || '未知'
}

const getNodeConnections = (nodeId) => {
  return networkEdges.value.filter(edge =>
      edge.source === nodeId || edge.target === nodeId
  ).length
}

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleString('zh-CN')
}

const refreshNetwork = async () => {
  loading.value = true
  try {
    // 模拟刷新网络数据
    await new Promise(resolve => setTimeout(resolve, 1000))
    // 随机更新一些节点状态
    networkNodes.value.forEach(node => {
      if (Math.random() > 0.8) {
        const statuses = ['normal', 'warning', 'danger']
        node.status = statuses[Math.floor(Math.random() * statuses.length)]
        node.lastSeen = new Date().toISOString()
      }
    })
    renderNetwork()
  } finally {
    loading.value = false
  }
}

const toggleFullscreen = () => {
  enterFullscreen('NetworkPanel')
}

const renderNetwork = () => {
  if (!networkRef.value) return

  const container = networkRef.value
  container.innerHTML = ''

  // 创建SVG
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('width', '100%')
  svg.setAttribute('height', '100%')
  svg.style.background = 'transparent'

  // 获取容器尺寸
  const rect = container.getBoundingClientRect()
  const width = rect.width || 500
  const height = rect.height || 300

  // 绘制连接线
  networkEdges.value.forEach(edge => {
    const sourceNode = networkNodes.value.find(n => n.id === edge.source)
    const targetNode = networkNodes.value.find(n => n.id === edge.target)

    if (sourceNode && targetNode) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
      line.setAttribute('x1', sourceNode.x)
      line.setAttribute('y1', sourceNode.y)
      line.setAttribute('x2', targetNode.x)
      line.setAttribute('y2', targetNode.y)
      line.setAttribute('stroke', getEdgeColor(edge.type))
      line.setAttribute('stroke-width', '2')
      line.setAttribute('opacity', '0.8')
      svg.appendChild(line)
    }
  })

  // 绘制节点
  networkNodes.value.forEach(node => {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    group.style.cursor = 'pointer'

    // 节点圆圈
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    circle.setAttribute('cx', node.x)
    circle.setAttribute('cy', node.y)
    circle.setAttribute('r', getNodeSize(node.type))
    circle.setAttribute('fill', getNodeColor(node.status))
    circle.setAttribute('stroke', '#233554')
    circle.setAttribute('stroke-width', '2')

    // 节点标签
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    text.setAttribute('x', node.x)
    text.setAttribute('y', node.y + getNodeSize(node.type) + 15)
    text.setAttribute('text-anchor', 'middle')
    text.setAttribute('fill', '#8892B0')
    text.setAttribute('font-size', '10')
    text.setAttribute('font-family', 'monospace')
    text.textContent = node.ip

    // 点击事件
    group.addEventListener('click', () => {
      selectedNode.value = node
      // 高亮选中节点
      document.querySelectorAll('.network-graph circle').forEach(c => {
        c.setAttribute('stroke-width', '2')
        c.setAttribute('stroke', '#233554')
      })
      circle.setAttribute('stroke-width', '3')
      circle.setAttribute('stroke', '#64FFDA')
    })

    group.appendChild(circle)
    group.appendChild(text)
    svg.appendChild(group)
  })

  container.appendChild(svg)
}

const getNodeSize = (type) => {
  const sizeMap = {
    'router': 20,
    'server': 16,
    'client': 12,
    'device': 10
  }
  return sizeMap[type] || 12
}

const getNodeColor = (status) => {
  const colorMap = {
    'normal': '#64FFDA',
    'warning': '#FFB347',
    'danger': '#FF6B6B',
    'offline': '#8892B0'
  }
  return colorMap[status] || '#8892B0'
}

const getEdgeColor = (type) => {
  const colorMap = {
    'normal': '#64FFDA',
    'warning': '#FFB347',
    'danger': '#FF6B6B',
    'offline': '#8892B0'
  }
  return colorMap[type] || '#64FFDA'
}

// 监听器
watch(() => networkNodes.value, () => {
  renderNetwork()
}, { deep: true })

// 生命周期
onMounted(async () => {
  console.log('🌐 NetworkPanel mounted')
  await nextTick()
  renderNetwork()

  // 监听窗口大小变化
  window.addEventListener('resize', renderNetwork)
})

onUnmounted(() => {
  window.removeEventListener('resize', renderNetwork)
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
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  font-size: 18px;
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

.btn-icon.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.panel-content {
  flex: 1;
  padding: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 网络统计 */
.network-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 16px;
  padding: 12px;
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: 6px;
}

.stat-item {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-bottom: 4px;
}

.stat-value {
  display: block;
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.stat-value.warning {
  color: var(--color-warning);
}

/* 网络图 */
.network-container {
  flex: 1;
  position: relative;
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  margin-bottom: 16px;
}

.network-graph {
  width: 100%;
  height: 100%;
  min-height: 250px;
}

/* 节点信息 */
.node-info {
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 12px;
}

.node-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.node-ip {
  font-family: var(--font-family-mono);
  font-weight: 600;
  color: var(--color-text-primary);
}

.node-status {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.node-status.normal {
  background-color: rgba(100, 255, 218, 0.2);
  color: #64FFDA;
}

.node-status.warning {
  background-color: rgba(255, 179, 71, 0.2);
  color: #FFB347;
}

.node-status.danger {
  background-color: rgba(255, 107, 107, 0.2);
  color: #FF6B6B;
}

.node-status.offline {
  background-color: rgba(136, 146, 176, 0.2);
  color: #8892B0;
}

.node-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.detail-label {
  color: var(--color-text-secondary);
}

.detail-value {
  color: var(--color-text-primary);
}

/* 图例 */
.network-legend {
  display: flex;
  justify-content: space-around;
  padding: 8px;
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: 6px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.legend-dot.normal {
  background-color: #64FFDA;
}

.legend-dot.warning {
  background-color: #FFB347;
}

.legend-dot.danger {
  background-color: #FF6B6B;
}

.legend-dot.offline {
  background-color: #8892B0;
}

.legend-text {
  font-size: 11px;
  color: var(--color-text-secondary);
}

/* 加载状态 */
.loading-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: var(--color-text-secondary);
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
</style>