<template>
  <div class="panel">
    <div class="panel-header">
      <h3 class="panel-title">
        <span class="title-icon">🌐</span>
        网络拓扑
      </h3>
      <div class="panel-actions">
        <button
            class="action-btn"
            @click="toggleFullscreen"
            :title="isFullscreen ? '退出全屏' : '全屏显示'"
        >
          <span class="btn-icon">{{ isFullscreen ? '⤸' : '⤢' }}</span>
        </button>
        <button class="action-btn" @click="refreshNetwork" :disabled="isLoading">
          <span class="btn-icon" :class="{ spinning: isLoading }">🔄</span>
        </button>
      </div>
    </div>

    <div class="panel-content" :class="{ fullscreen: isFullscreen }">
      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载网络拓扑...</p>
      </div>

      <!-- 网络图容器 -->
      <div v-else class="network-container">
        <div ref="networkRef" class="network-canvas"></div>

        <!-- 网络信息面板 -->
        <div class="network-info">
          <div class="info-stats">
            <div class="stat-item">
              <span class="stat-value">{{ networkNodes.length }}</span>
              <span class="stat-label">节点</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ networkEdges.length }}</span>
              <span class="stat-label">连接</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ onlineNodesCount }}</span>
              <span class="stat-label">在线</span>
            </div>
          </div>
        </div>

        <!-- 节点详情面板 -->
        <Transition name="slide-in">
          <div v-if="selectedNode" class="node-details">
            <div class="details-header">
              <div class="node-icon">{{ getNodeIcon(selectedNode.type) }}</div>
              <h4>{{ selectedNode.label }}</h4>
              <button class="close-details" @click="selectedNode = null">×</button>
            </div>

            <div class="details-content">
              <div class="detail-section">
                <div class="detail-row">
                  <span class="detail-label">类型:</span>
                  <span class="detail-value">{{ getNodeTypeName(selectedNode.type) }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">IP地址:</span>
                  <span class="detail-value ip">{{ selectedNode.ip }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">状态:</span>
                  <span class="detail-value status" :class="selectedNode.status">
                    <span class="status-dot"></span>
                    {{ getStatusText(selectedNode.status) }}
                  </span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">连接数:</span>
                  <span class="detail-value">{{ getNodeConnections(selectedNode.id) }}</span>
                </div>
              </div>

              <div class="detail-section">
                <h5>服务端口</h5>
                <div class="services-list">
                  <span
                      v-for="service in selectedNode.services || []"
                      :key="service"
                      class="service-tag"
                  >
                    {{ service }}
                  </span>
                </div>
              </div>

              <div class="detail-section">
                <h5>最近活动</h5>
                <div class="activity-list">
                  <div
                      v-for="activity in getNodeActivity(selectedNode.id)"
                      :key="activity.id"
                      class="activity-item"
                  >
                    <span class="activity-time">{{ formatTime(activity.timestamp) }}</span>
                    <span class="activity-desc">{{ activity.description }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- 控制面板 -->
      <div class="control-panel">
        <div class="layout-controls">
          <button
              v-for="layout in layouts"
              :key="layout.type"
              :class="['layout-btn', { active: currentLayout === layout.type }]"
              @click="changeLayout(layout.type)"
              :title="layout.name"
          >
            {{ layout.icon }}
          </button>
        </div>
        <div class="zoom-controls">
          <button class="zoom-btn" @click="zoomIn">+</button>
          <button class="zoom-btn" @click="zoomOut">-</button>
          <button class="zoom-btn" @click="fitView">⌂</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useDashboardStore } from '@/stores/dashboard'
import G6 from '@antv/g6'
import { formatTime } from '@/utils/format'

const dashboardStore = useDashboardStore()

// 响应式数据
const networkRef = ref(null)
const selectedNode = ref(null)
const isLoading = ref(false)
const isFullscreen = ref(false)
const currentLayout = ref('force')
let graph = null

// 布局选项
const layouts = [
  { type: 'force', name: '力导向', icon: '⚡' },
  { type: 'circular', name: '环形', icon: '⭕' },
  { type: 'radial', name: '辐射', icon: '🎯' },
  { type: 'grid', name: '网格', icon: '⚏' }
]

// 计算属性
const networkNodes = computed(() => dashboardStore.networkNodes)
const networkEdges = computed(() => dashboardStore.networkEdges)
const onlineNodesCount = computed(() =>
    networkNodes.value.filter(node => node.status === 'online').length
)

// G6图配置
const getGraphConfig = () => ({
  container: networkRef.value,
  width: networkRef.value.clientWidth,
  height: networkRef.value.clientHeight,

  // 布局配置
  layout: getLayoutConfig(currentLayout.value),

  // 默认节点样式
  defaultNode: {
    type: 'circle',
    size: [40, 40],
    style: {
      fill: '#112240',
      stroke: '#233554',
      lineWidth: 2
    },
    labelCfg: {
      style: {
        fill: '#8892B0',
        fontSize: 12
      }
    }
  },

  // 默认边样式
  defaultEdge: {
    type: 'line',
    style: {
      stroke: '#233554',
      lineWidth: 1,
      endArrow: {
        path: G6.Arrow.vee(8, 8),
        fill: '#233554'
      }
    }
  },

  // 节点状态样式
  nodeStateStyles: {
    hover: {
      stroke: '#64FFDA',
      lineWidth: 3,
      shadowColor: 'rgba(100, 255, 218, 0.5)',
      shadowBlur: 10
    },
    selected: {
      stroke: '#64FFDA',
      lineWidth: 3,
      fill: 'rgba(100, 255, 218, 0.1)'
    },
    warning: {
      fill: 'rgba(255, 193, 7, 0.2)',
      stroke: '#FFC107'
    },
    danger: {
      fill: 'rgba(244, 67, 54, 0.2)',
      stroke: '#F44336'
    }
  },

  // 边状态样式
  edgeStateStyles: {
    hover: {
      stroke: '#64FFDA',
      lineWidth: 2
    },
    selected: {
      stroke: '#64FFDA',
      lineWidth: 3
    }
  },

  // 交互模式
  modes: {
    default: [
      'drag-canvas',
      'zoom-canvas',
      'drag-node',
      'hover-node',
      'hover-edge',
      'click-select'
    ]
  },

  // 动画配置
  animate: true,
  animateCfg: {
    duration: 300,
    easing: 'easeLinear'
  }
})

// 获取布局配置
const getLayoutConfig = (layoutType) => {
  const configs = {
    force: {
      type: 'force',
      preventOverlap: true,
      nodeSize: 40,
      linkDistance: 100,
      nodeStrength: -100,
      edgeStrength: 0.2
    },
    circular: {
      type: 'circular',
      radius: 150,
      startRadius: 50,
      endRadius: 200
    },
    radial: {
      type: 'radial',
      center: [250, 150],
      linkDistance: 100,
      maxIteration: 1000,
      focusNode: getCenterNodeId()
    },
    grid: {
      type: 'grid',
      rows: Math.ceil(Math.sqrt(networkNodes.value.length)),
      cols: Math.ceil(Math.sqrt(networkNodes.value.length)),
      sortBy: 'degree'
    }
  }

  return configs[layoutType] || configs.force
}

// 方法
const initGraph = async () => {
  await nextTick()

  if (!networkRef.value || graph) return

  try {
    graph = new G6.Graph(getGraphConfig())

    // 绑定事件
    bindGraphEvents()

    // 加载数据
    updateGraphData()

    // 渲染图
    graph.render()

  } catch (error) {
    console.error('初始化网络图失败:', error)
  }
}

const bindGraphEvents = () => {
  if (!graph) return

  // 节点点击事件
  graph.on('node:click', (evt) => {
    const { item } = evt
    const model = item.getModel()
    selectedNode.value = model

    // 设置选中状态
    graph.setItemState(item, 'selected', true)
  })

  // 画布点击事件
  graph.on('canvas:click', () => {
    // 清除选中状态
    const selectedNodes = graph.findAllByState('node', 'selected')
    selectedNodes.forEach(node => {
      graph.setItemState(node, 'selected', false)
    })
    selectedNode.value = null
  })

  // 节点悬停事件
  graph.on('node:mouseenter', (evt) => {
    const { item } = evt
    graph.setItemState(item, 'hover', true)
  })

  graph.on('node:mouseleave', (evt) => {
    const { item } = evt
    graph.setItemState(item, 'hover', false)
  })
}

const updateGraphData = () => {
  if (!graph) return

  const data = {
    nodes: networkNodes.value.map(node => ({
      ...node,
      style: getNodeStyle(node)
    })),
    edges: networkEdges.value
  }

  graph.data(data)
  graph.render()

  // 设置节点状态
  networkNodes.value.forEach(node => {
    const item = graph.findById(node.id)
    if (item && node.status) {
      graph.setItemState(item, node.status, true)
    }
  })
}

const getNodeStyle = (node) => {
  const baseStyle = {
    fill: '#112240',
    stroke: '#233554'
  }

  // 根据节点类型设置样式
  if (node.type === 'central') {
    return {
      ...baseStyle,
      fill: 'rgba(244, 67, 54, 0.2)',
      stroke: '#F44336'
    }
  }

  // 根据状态设置样式
  switch (node.status) {
    case 'online':
      return { ...baseStyle, stroke: '#00D4AA' }
    case 'warning':
      return { ...baseStyle, stroke: '#FFC107' }
    case 'danger':
      return { ...baseStyle, stroke: '#F44336' }
    default:
      return baseStyle
  }
}

const changeLayout = (layoutType) => {
  if (!graph || currentLayout.value === layoutType) return

  currentLayout.value = layoutType

  graph.updateLayout(getLayoutConfig(layoutType))
}

const zoomIn = () => {
  if (graph) {
    const currentZoom = graph.getZoom()
    graph.zoomTo(Math.min(currentZoom * 1.2, 3))
  }
}

const zoomOut = () => {
  if (graph) {
    const currentZoom = graph.getZoom()
    graph.zoomTo(Math.max(currentZoom * 0.8, 0.2))
  }
}

const fitView = () => {
  if (graph) {
    graph.fitView(20)
  }
}

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value

  // 延迟调整图大小，等待CSS transition完成
  setTimeout(() => {
    if (graph) {
      graph.changeSize(networkRef.value.clientWidth, networkRef.value.clientHeight)
      graph.fitView(20)
    }
  }, 300)
}

const refreshNetwork = async () => {
  try {
    isLoading.value = true
    await dashboardStore.refreshNetworkData()
  } catch (error) {
    console.error('刷新网络数据失败:', error)
  } finally {
    isLoading.value = false
  }
}

// 工具方法
const getCenterNodeId = () => {
  const centralNode = networkNodes.value.find(node => node.type === 'central')
  return centralNode ? centralNode.id : null
}

const getNodeIcon = (type) => {
  const icons = {
    'central': '🎯',
    'server': '🖥️',
    'client': '💻',
    'router': '🌐',
    'firewall': '🛡️'
  }
  return icons[type] || '💻'
}

const getNodeTypeName = (type) => {
  const names = {
    'central': '中心节点',
    'server': '服务器',
    'client': '客户端',
    'router': '路由器',
    'firewall': '防火墙'
  }
  return names[type] || '未知'
}

const getStatusText = (status) => {
  const statusMap = {
    'online': '在线',
    'offline': '离线',
    'warning': '警告',
    'danger': '危险'
  }
  return statusMap[status] || '未知'
}

const getNodeConnections = (nodeId) => {
  return networkEdges.value.filter(edge =>
      edge.source === nodeId || edge.target === nodeId
  ).length
}

const getNodeActivity = (nodeId) => {
  return dashboardStore.recentAttackLogs
      .filter(log => log.target === nodeId)
      .slice(0, 5)
      .map(log => ({
        id: log.id,
        timestamp: log.timestamp,
        description: log.description
      }))
}

// 监听器
watch(() => [networkNodes.value, networkEdges.value], () => {
  updateGraphData()
}, { deep: true })

// 生命周期
onMounted(() => {
  initGraph()
})

onUnmounted(() => {
  if (graph) {
    graph.destroy()
    graph = null
  }
})
</script>

<style scoped>
/* 网络容器 */
.network-container {
  position: relative;
  height: 100%;
  width: 100%;
}

.network-canvas {
  width: 100%;
  height: 100%;
}

/* 全屏模式 */
.panel-content.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: var(--z-modal);
  background-color: var(--color-bg-secondary);
  padding: var(--spacing-lg);
}

/* 网络信息面板 */
.network-info {
  position: absolute;
  top: var(--spacing-md);
  left: var(--spacing-md);
  background-color: rgba(17, 34, 64, 0.9);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  padding: var(--spacing-sm);
  backdrop-filter: blur(8px);
}

.info-stats {
  display: flex;
  gap: var(--spacing-md);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.stat-value {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--color-text-primary);
}

.stat-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  margin-top: var(--spacing-xs);
}

/* 节点详情面板 */
.node-details {
  position: absolute;
  top: var(--spacing-md);
  right: var(--spacing-md);
  width: 280px;
  background-color: rgba(17, 34, 64, 0.95);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  backdrop-filter: blur(12px);
  overflow: hidden;
}

.details-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background-color: var(--color-bg-tertiary);
  border-bottom: 1px solid var(--color-border);
}

.node-icon {
  font-size: var(--font-size-lg);
}

.details-header h4 {
  flex: 1;
  margin: 0;
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
}

.close-details {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: var(--font-size-lg);
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius-sm);
  transition: all var(--transition-base);
}

.close-details:hover {
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
}

.details-content {
  padding: var(--spacing-md);
  max-height: 400px;
  overflow-y: auto;
}

.detail-section {
  margin-bottom: var(--spacing-md);
}

.detail-section:last-child {
  margin-bottom: 0;
}

.detail-section h5 {
  margin: 0 0 var(--spacing-sm);
  font-size: var(--font-size-sm);
  color: var(--color-text-accent);
  font-weight: 600;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xs);
}

.detail-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.detail-value {
  font-size: var(--font-size-xs);
  color: var(--color-text-primary);
  font-weight: 500;
}

.detail-value.ip {
  font-family: var(--font-family-mono);
}

.detail-value.status {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--color-text-secondary);
}

.status.online .status-dot {
  background-color: var(--color-success);
}

.status.warning .status-dot {
  background-color: var(--color-warning);
}

.status.danger .status-dot {
  background-color: var(--color-danger);
}

/* 服务列表 */
.services-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.service-tag {
  padding: var(--spacing-xs) var(--spacing-sm);
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  font-family: var(--font-family-mono);
}

/* 活动列表 */
.activity-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.activity-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm);
  background-color: var(--color-bg-primary);
  border-radius: var(--border-radius-sm);
  border-left: 2px solid var(--color-border);
}

.activity-time {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  font-family: var(--font-family-mono);
}

.activity-desc {
  font-size: var(--font-size-xs);
  color: var(--color-text-primary);
}

/* 控制面板 */
.control-panel {
  position: absolute;
  bottom: var(--spacing-md);
  left: var(--spacing-md);
  display: flex;
  gap: var(--spacing-md);
}

.layout-controls,
.zoom-controls {
  display: flex;
  background-color: rgba(17, 34, 64, 0.9);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  backdrop-filter: blur(8px);
}

.layout-btn,
.zoom-btn {
  padding: var(--spacing-sm);
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: all var(--transition-base);
  min-width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.layout-btn:hover,
.zoom-btn:hover {
  color: var(--color-text-accent);
  background-color: var(--color-bg-primary);
}

.layout-btn.active {
  color: var(--color-text-accent);
  background-color: var(--color-bg-primary);
}

.layout-btn:not(:last-child),
.zoom-btn:not(:last-child) {
  border-right: 1px solid var(--color-border);
}

/* 动画 */
.slide-in-enter-active,
.slide-in-leave-active {
  transition: all 0.3s ease;
}

.slide-in-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.slide-in-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* 响应式 */
@media (max-width: 1024px) {
  .node-details {
    width: 260px;
  }

  .control-panel {
    bottom: var(--spacing-sm);
    left: var(--spacing-sm);
  }
}

@media (max-width: 768px) {
  .network-info {
    position: relative;
    margin-bottom: var(--spacing-md);
  }

  .node-details {
    position: relative;
    width: 100%;
    margin-top: var(--spacing-md);
  }

  .control-panel {
    position: relative;
    justify-content: center;
    margin-top: var(--spacing-md);
  }
}
</style>