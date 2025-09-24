<template>
  <div class="panel network-panel">
    <div class="panel-header">
      <h3 class="panel-title">
        <span class="title-icon">🌐</span>
        网络拓扑
      </h3>
      <div class="header-controls">
        <div class="layout-controls">
          <button
              class="layout-btn"
              :class="{ active: currentLayout === 'force' }"
              @click="setLayout('force')"
              title="力导向布局"
          >
            ⭕
          </button>
          <button
              class="layout-btn"
              :class="{ active: currentLayout === 'radial' }"
              @click="setLayout('radial')"
              title="径向布局"
          >
            🎯
          </button>
          <button
              class="layout-btn"
              :class="{ active: currentLayout === 'grid' }"
              @click="setLayout('grid')"
              title="网格布局"
          >
            ⬜
          </button>
        </div>
        <div class="view-controls">
          <button
              class="control-btn"
              @click="centerGraph"
              title="居中显示"
          >
            🎪
          </button>
          <button
              class="control-btn"
              @click="resetZoom"
              title="重置缩放"
          >
            🔍
          </button>
          <button
              class="control-btn"
              @click="toggleFullscreen"
              title="全屏显示"
          >
            {{ isFullscreen ? '⤸' : '⤢' }}
          </button>
        </div>
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
                  <div
                      v-for="service in getNodeServices(selectedNode.id)"
                      :key="service"
                      class="service-item"
                  >
                    {{ service }}
                  </div>
                </div>
              </div>

              <div class="detail-section">
                <h5>流量统计</h5>
                <div class="traffic-stats">
                  <div class="traffic-item">
                    <span class="traffic-label">入站:</span>
                    <span class="traffic-value">{{ formatTraffic(getNodeTraffic(selectedNode.id, 'in')) }}</span>
                  </div>
                  <div class="traffic-item">
                    <span class="traffic-label">出站:</span>
                    <span class="traffic-value">{{ formatTraffic(getNodeTraffic(selectedNode.id, 'out')) }}</span>
                  </div>
                </div>
              </div>

              <div class="detail-actions">
                <button
                    class="action-btn scan-btn"
                    @click="scanNode(selectedNode)"
                    :disabled="selectedNode.status === 'offline'"
                >
                  <span class="btn-icon">🔍</span>
                  扫描节点
                </button>
                <button
                    class="action-btn ping-btn"
                    @click="pingNode(selectedNode)"
                    :disabled="selectedNode.status === 'offline'"
                >
                  <span class="btn-icon">📡</span>
                  Ping测试
                </button>
              </div>
            </div>
          </div>
        </Transition>

        <!-- 图例 -->
        <div class="network-legend">
          <div class="legend-title">图例</div>
          <div class="legend-items">
            <div class="legend-item">
              <span class="legend-icon">🖥️</span>
              <span class="legend-text">服务器</span>
            </div>
            <div class="legend-item">
              <span class="legend-icon">💻</span>
              <span class="legend-text">客户端</span>
            </div>
            <div class="legend-item">
              <span class="legend-icon">🌐</span>
              <span class="legend-text">路由器</span>
            </div>
            <div class="legend-item">
              <span class="legend-icon">🛡️</span>
              <span class="legend-text">防火墙</span>
            </div>
            <div class="legend-item">
              <span class="legend-icon">🗄️</span>
              <span class="legend-text">数据库</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useDashboardStore } from '@/stores/dashboard'
import { formatTraffic } from '@/utils/format'
import G6 from '@antv/g6'

// Store
const dashboardStore = useDashboardStore()

// 响应式数据
const networkRef = ref(null)
const currentLayout = ref('force')
const selectedNode = ref(null)
const isFullscreen = ref(false)
let graph = null

// 计算属性
const isLoading = computed(() => dashboardStore.isLoading)
const networkNodes = computed(() => dashboardStore.networkNodes)
const networkEdges = computed(() => dashboardStore.networkEdges)

const onlineNodesCount = computed(() => {
  return networkNodes.value.filter(node => node.status === 'active' || node.status === 'normal').length
})

// 方法
const initializeGraph = () => {
  if (!networkRef.value || graph) return

  const container = networkRef.value
  const width = container.clientWidth
  const height = container.clientHeight

  graph = new G6.Graph({
    container: networkRef.value,
    width,
    height,
    fitView: true,
    fitViewPadding: 20,
    modes: {
      default: [
        'drag-canvas',
        'zoom-canvas',
        'drag-node'
      ]
    },
    layout: {
      type: 'force',
      preventOverlap: true,
      nodeSize: 40,
      linkDistance: 150,
      nodeStrength: -200,
      edgeStrength: 0.2,
      coulombDisScale: 0.005
    },
    defaultNode: {
      type: 'circle',
      size: 40,
      style: {
        fill: '#112240',
        stroke: '#64FFDA',
        lineWidth: 2,
        cursor: 'pointer'
      },
      labelCfg: {
        position: 'bottom',
        offset: 5,
        style: {
          fill: '#CCD6F6',
          fontSize: 12,
          fontWeight: 500
        }
      }
    },
    defaultEdge: {
      type: 'line',
      style: {
        stroke: '#233554',
        lineWidth: 2,
        endArrow: {
          path: G6.Arrow.triangle(8, 6, 0),
          fill: '#233554'
        }
      }
    },
    nodeStateStyles: {
      hover: {
        fill: '#1D2D4A',
        stroke: '#4ECDC4',
        lineWidth: 3
      },
      selected: {
        fill: '#64FFDA',
        stroke: '#4ECDC4',
        lineWidth: 4
      }
    },
    edgeStateStyles: {
      hover: {
        stroke: '#64FFDA',
        lineWidth: 3
      },
      highlight: {
        stroke: '#64FFDA',
        lineWidth: 3,
        shadowBlur: 10,
        shadowColor: '#64FFDA'
      }
    }
  })

  // 绑定事件
  setupGraphEvents()

  // 渲染图数据
  renderGraph()
}

const setupGraphEvents = () => {
  if (!graph) return

  // 节点点击事件
  graph.on('node:click', (evt) => {
    const { item } = evt
    const nodeModel = item.getModel()
    selectedNode.value = nodeModel

    // 清除之前的状态
    graph.getNodes().forEach(node => {
      graph.clearItemStates(node, ['selected'])
    })
    graph.getEdges().forEach(edge => {
      graph.clearItemStates(edge, ['highlight'])
    })

    // 设置选中状态
    graph.setItemState(item, 'selected', true)

    // 高亮相邻边
    const edges = item.getEdges()
    edges.forEach(edge => {
      graph.setItemState(edge, 'highlight', true)
    })
  })

  // 节点悬停事件
  graph.on('node:mouseenter', (evt) => {
    graph.setItemState(evt.item, 'hover', true)
  })

  graph.on('node:mouseleave', (evt) => {
    graph.setItemState(evt.item, 'hover', false)
  })

  // 画布点击事件（取消选择）
  graph.on('canvas:click', () => {
    selectedNode.value = null
    graph.getNodes().forEach(node => {
      graph.clearItemStates(node, ['selected'])
    })
    graph.getEdges().forEach(edge => {
      graph.clearItemStates(edge, ['highlight'])
    })
  })

  // 边悬停事件
  graph.on('edge:mouseenter', (evt) => {
    graph.setItemState(evt.item, 'hover', true)
  })

  graph.on('edge:mouseleave', (evt) => {
    graph.setItemState(evt.item, 'hover', false)
  })
}

const renderGraph = () => {
  if (!graph) return

  // 处理节点数据
  const nodes = networkNodes.value.map(node => ({
    ...node,
    style: {
      fill: getNodeColor(node.status),
      stroke: getNodeBorderColor(node.status)
    }
  }))

  // 处理边数据
  const edges = networkEdges.value.map(edge => ({
    ...edge,
    style: {
      stroke: getEdgeColor(edge.type),
      lineWidth: getEdgeWidth(edge.type)
    }
  }))

  graph.data({ nodes, edges })
  graph.render()
  graph.fitView()
}

const getNodeColor = (status) => {
  const colors = {
    active: '#112240',
    normal: '#112240',
    warning: '#1A2332',
    danger: '#1F1A2E',
    offline: '#0F1419'
  }
  return colors[status] || colors.normal
}

const getNodeBorderColor = (status) => {
  const colors = {
    active: '#64FFDA',
    normal: '#64FFDA',
    warning: '#FFC107',
    danger: '#F44336',
    offline: '#8892B0'
  }
  return colors[status] || colors.normal
}

const getEdgeColor = (type) => {
  const colors = {
    normal: '#233554',
    warning: '#FFC107',
    danger: '#F44336'
  }
  return colors[type] || colors.normal
}

const getEdgeWidth = (type) => {
  const widths = {
    normal: 2,
    warning: 3,
    danger: 4
  }
  return widths[type] || 2
}

const getNodeIcon = (type) => {
  const icons = {
    server: '🖥️',
    client: '💻',
    router: '🌐',
    firewall: '🛡️',
    database: '🗄️'
  }
  return icons[type] || '🖥️'
}

const getNodeTypeName = (type) => {
  const names = {
    server: '服务器',
    client: '客户端',
    router: '路由器',
    firewall: '防火墙',
    database: '数据库'
  }
  return names[type] || '未知'
}

const getStatusText = (status) => {
  const texts = {
    active: '活跃',
    normal: '正常',
    warning: '警告',
    danger: '危险',
    offline: '离线'
  }
  return texts[status] || '未知'
}

const getNodeConnections = (nodeId) => {
  return networkEdges.value.filter(edge =>
      edge.source === nodeId || edge.target === nodeId
  ).length
}

const getNodeServices = (nodeId) => {
  // 从目标列表中查找对应的服务信息
  const target = dashboardStore.targets.find(t => t.id === nodeId)
  return target?.services || ['HTTP:80', 'HTTPS:443']
}

const getNodeTraffic = (nodeId, direction) => {
  // 模拟流量数据
  return Math.floor(Math.random() * 1000000)
}

const setLayout = (layoutType) => {
  if (!graph || currentLayout.value === layoutType) return

  currentLayout.value = layoutType

  const layouts = {
    force: {
      type: 'force',
      preventOverlap: true,
      nodeSize: 40,
      linkDistance: 150
    },
    radial: {
      type: 'radial',
      center: [0, 0],
      linkDistance: 150,
      maxIteration: 1000
    },
    grid: {
      type: 'grid',
      preventOverlap: true,
      nodeSize: 40,
      condense: false
    }
  }

  graph.updateLayout(layouts[layoutType])
}

const centerGraph = () => {
  if (!graph) return
  graph.fitCenter()
}

const resetZoom = () => {
  if (!graph) return
  graph.zoomTo(1)
  graph.fitView()
}

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value

  nextTick(() => {
    if (graph) {
      const container = networkRef.value
      const width = container.clientWidth
      const height = container.clientHeight
      graph.changeSize(width, height)
      graph.fitView()
    }
  })
}

const scanNode = async (node) => {
  try {
    console.log('🔍 扫描节点:', node.label)
    await dashboardStore.startScan(node.id)
    // 这里可以显示扫描启动的提示
  } catch (error) {
    console.error('❌ 节点扫描失败:', error)
  }
}

const pingNode = async (node) => {
  try {
    console.log('📡 Ping节点:', node.ip)
    // 模拟ping测试
    await new Promise(resolve => setTimeout(resolve, 1000))
    console.log('✅ Ping成功')
  } catch (error) {
    console.error('❌ Ping失败:', error)
  }
}

// 监听窗口大小变化
const handleResize = () => {
  if (graph && networkRef.value) {
    const container = networkRef.value
    const width = container.clientWidth
    const height = container.clientHeight
    graph.changeSize(width, height)
    graph.fitView()
  }
}

// 生命周期
onMounted(() => {
  nextTick(() => {
    initializeGraph()
    window.addEventListener('resize', handleResize)
  })
})

onUnmounted(() => {
  if (graph) {
    graph.destroy()
    graph = null
  }
  window.removeEventListener('resize', handleResize)
})

// 监听数据变化
watch([networkNodes, networkEdges], () => {
  if (graph) {
    renderGraph()
  }
})
</script>

<style scoped>
.network-panel {
  height: 100%;
  position: relative;
}

/* 头部控件 */
.header-controls {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
}

.layout-controls,
.view-controls {
  display: flex;
  gap: var(--spacing-xs);
}

.layout-btn,
.control-btn {
  width: 32px;
  height: 32px;
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

.layout-btn:hover,
.control-btn:hover {
  border-color: var(--color-text-accent);
  color: var(--color-text-accent);
}

.layout-btn.active {
  background-color: var(--color-text-accent);
  color: var(--color-bg-primary);
  border-color: var(--color-text-accent);
}

/* 网络容器 */
.network-container {
  position: relative;
  height: 100%;
  overflow: hidden;
}

.panel-content.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: var(--z-modal);
  background-color: var(--color-bg-primary);
}

.network-canvas {
  width: 100%;
  height: 100%;
  background-color: transparent;
}

/* 网络信息面板 */
.network-info {
  position: absolute;
  top: var(--spacing-md);
  left: var(--spacing-md);
  background-color: rgba(17, 34, 64, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  padding: var(--spacing-md);
}

.info-stats {
  display: flex;
  gap: var(--spacing-lg);
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text-accent);
  margin-bottom: var(--spacing-xs);
}

.stat-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

/* 节点详情面板 */
.node-details {
  position: absolute;
  top: var(--spacing-md);
  right: var(--spacing-md);
  width: 300px;
  max-height: 80%;
  background-color: rgba(17, 34, 64, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  overflow-y: auto;
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
  font-size: var(--font-size-xl);
}

.details-header h4 {
  flex: 1;
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
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

.detail-section {
  margin-bottom: var(--spacing-lg);
}

.detail-section:last-child {
  margin-bottom: 0;
}

.detail-section h5 {
  margin: 0 0 var(--spacing-sm);
  color: var(--color-text-accent);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
  padding: var(--spacing-xs) 0;
}

.detail-row:last-child {
  margin-bottom: 0;
}

.detail-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.detail-value {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  font-weight: 500;
}

.detail-value.ip {
  font-family: var(--font-family-mono);
  color: var(--color-text-accent);
}

.detail-value.status {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status.active .status-dot,
.status.normal .status-dot { background-color: var(--color-success); }
.status.warning .status-dot { background-color: var(--color-warning); }
.status.danger .status-dot { background-color: var(--color-danger); }
.status.offline .status-dot { background-color: var(--color-text-secondary); }

.services-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.service-item {
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  font-family: var(--font-family-mono);
}

.traffic-stats {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.traffic-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.traffic-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.traffic-value {
  font-size: var(--font-size-sm);
  color: var(--color-text-accent);
  font-weight: 600;
}

.detail-actions {
  display: flex;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm);
  border: 1px solid var(--color-border);
  background-color: transparent;
  color: var(--color-text-secondary);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  font-size: var(--font-size-xs);
  transition: all var(--transition-base);
}

.action-btn:hover:not(:disabled) {
  border-color: var(--color-text-accent);
  color: var(--color-text-accent);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon {
  font-size: var(--font-size-sm);
}

/* 图例 */
.network-legend {
  position: absolute;
  bottom: var(--spacing-md);
  left: var(--spacing-md);
  background-color: rgba(17, 34, 64, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  padding: var(--spacing-md);
}

.legend-title {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
}

.legend-items {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.legend-icon {
  font-size: var(--font-size-base);
  width: 20px;
  text-align: center;
}

.legend-text {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

/* 动画效果 */
.slide-in-enter-active,
.slide-in-leave-active {
  transition: all var(--transition-base);
}

.slide-in-enter-from,
.slide-in-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-controls {
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .node-details {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    max-width: 320px;
    max-height: none;
    z-index: var(--z-modal);
  }

  .network-info {
    top: auto;
    bottom: 80px;
    left: var(--spacing-sm);
    right: var(--spacing-sm);
  }

  .info-stats {
    justify-content: space-around;
  }

  .network-legend {
    bottom: var(--spacing-sm);
    left: var(--spacing-sm);
  }
}

@media (max-width: 480px) {
  .layout-controls,
  .view-controls {
    width: 100%;
    justify-content: space-between;
  }

  .network-info {
    bottom: 100px;
  }
}
</style>