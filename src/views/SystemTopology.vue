<!-- src/views/SystemTopology.vue -->
<template>
  <div class="system-topology">
    <!-- 顶部操作栏 -->
    <div class="topology-header">
      <div class="header-left">
        <h2 class="page-title">🏗️ CBTC系统拓扑</h2>
        <div class="breadcrumb">
          <span class="breadcrumb-item active">系统层视图</span>
        </div>
      </div>

      <div class="header-right">
        <div class="view-controls">
          <button @click="resetView" class="control-btn" title="重置视图">
            🎯 重置
          </button>
          <button @click="toggleLayout" class="control-btn" title="切换布局">
            📐 布局
          </button>
          <button @click="refreshData" class="control-btn" :disabled="isLoading" title="刷新数据">
            🔄 刷新
          </button>
        </div>

        <div class="status-summary">
          <div class="summary-item">
            <span class="summary-dot green"></span>
            <span>正常: {{ nodeStats.normal }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-dot yellow"></span>
            <span>告警: {{ nodeStats.warning }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-dot red"></span>
            <span>故障: {{ nodeStats.critical }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 拓扑画布区域 -->
    <div class="topology-container">
      <TopologyCanvas
          :nodes="visibleNodes"
          :links="visibleLinks"
          :zoom-level="zoomLevel"
          :pan-offset="panOffset"
          :is-loading="isLoading"
          layout-type="hierarchical"
          @node-click="handleNodeClick"
          @node-hover="handleNodeHover"
          @link-hover="handleLinkHover"
          @canvas-click="handleCanvasClick"
          @view-transform="handleViewTransform"
      />

      <!-- 加载遮罩 -->
      <div v-if="isLoading" class="loading-overlay">
        <LoadingSpinner size="large" variant="network" text="加载系统拓扑..." />
      </div>
    </div>

    <!-- 侧边信息面板 -->
    <div v-if="selectedNode" class="info-panel">
      <div class="panel-header">
        <h3>{{ selectedNode.label }}</h3>
        <button @click="clearSelection" class="close-btn">✕</button>
      </div>

      <div class="panel-content">
        <div class="info-section">
          <h4>设备信息</h4>
          <div class="info-item">
            <span class="label">设备类型:</span>
            <span class="value">{{ selectedNode.type }}</span>
          </div>
          <div class="info-item">
            <span class="label">设备ID:</span>
            <span class="value">{{ selectedNode.id }}</span>
          </div>
          <div class="info-item">
            <span class="label">状态:</span>
            <StatusIndicator :status="selectedNode.status" />
          </div>
        </div>

        <div v-if="selectedNode.metadata" class="info-section">
          <h4>运行指标</h4>
          <div v-if="selectedNode.metadata.ip" class="info-item">
            <span class="label">IP地址:</span>
            <span class="value">{{ selectedNode.metadata.ip }}</span>
          </div>
          <div v-if="selectedNode.metadata.cpuUsage !== undefined" class="info-item">
            <span class="label">CPU使用率:</span>
            <span class="value">{{ selectedNode.metadata.cpuUsage }}%</span>
          </div>
          <div v-if="selectedNode.metadata.memoryUsage !== undefined" class="info-item">
            <span class="label">内存使用率:</span>
            <span class="value">{{ selectedNode.metadata.memoryUsage }}%</span>
          </div>
          <div v-if="selectedNode.metadata.uptime" class="info-item">
            <span class="label">运行时间:</span>
            <span class="value">{{ formatUptime(selectedNode.metadata.uptime) }}</span>
          </div>
        </div>

        <!-- 可钻取提示 -->
        <div v-if="canDrillDown(selectedNode)" class="drill-down-section">
          <button @click="drillDownToSubsystem" class="drill-down-btn">
            🔍 查看 {{ selectedNode.type }} 内部详情
          </button>
        </div>
      </div>
    </div>

    <!-- 节点悬浮提示 -->
    <NodeTooltip
        v-if="hoveredNode"
        :node="hoveredNode"
        :position="tooltipPosition"
    />

    <!-- 链路悬浮提示 -->
    <LinkTooltip
        v-if="hoveredLink"
        :link="hoveredLink"
        :position="tooltipPosition"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTopologyStore } from '../stores/topology'
import { useTopology } from '../composables/useTopology'
import { useWebSocket } from '../composables/useWebSocket'
import { getSystemTopology } from '../services/api/topology'
import TopologyCanvas from '../components/topology/TopologyCanvas.vue'
import NodeTooltip from '../components/topology/NodeTooltip.vue'
import LinkTooltip from '../components/topology/LinkTooltip.vue'
import LoadingSpinner from '../components/common/LoadingSpinner.vue'
import StatusIndicator from '../components/common/StatusIndicator.vue'
import type { TopologyNode, TopologyLink, Position } from '../types/topology'
import type { DeviceType } from '../types/devices'

const router = useRouter()
const topologyStore = useTopologyStore()
const {
  currentNodes,
  currentLinks,
  nodeStats,
  selectedNode,
  hoveredNode,
  hoveredLink,
  isLoading,
  zoomLevel,
  panOffset,
  clearSelection,
  resetView: resetTopologyView,
  selectNode,
  setHoveredElement
} = useTopology()

// WebSocket连接
const { connect, disconnect, isConnected } = useWebSocket()

// 本地状态
const tooltipPosition = ref<Position>({ x: 0, y: 0 })
const layoutType = ref<'hierarchical' | 'force'>('hierarchical')

// 计算属性
const visibleNodes = computed(() => currentNodes.value)
const visibleLinks = computed(() => currentLinks.value)

// 事件处理
function handleNodeClick(node: TopologyNode, event: MouseEvent) {
  console.log('Node clicked:', node.id)

  // 选中节点
  selectNode(node.id)

  // 检查是否可以钻取到子系统
  if (canDrillDown(node)) {
    // 等待信息面板显示后再决定是否钻取
    // 这里可以添加双击检测逻辑
  }
}

function handleNodeHover(node: TopologyNode | null, event?: MouseEvent) {
  setHoveredElement(node?.id || null, 'node')

  if (event) {
    tooltipPosition.value = {
      x: event.clientX + 10,
      y: event.clientY - 10
    }
  }
}

function handleLinkHover(link: TopologyLink | null, event?: MouseEvent) {
  setHoveredElement(link?.id || null, 'link')

  if (event) {
    tooltipPosition.value = {
      x: event.clientX + 10,
      y: event.clientY - 10
    }
  }
}

function handleCanvasClick() {
  clearSelection()
}

function handleViewTransform(transform: { zoom: number, pan: Position }) {
  topologyStore.setViewTransform(transform.zoom, transform.pan)
}

// 工具函数
function canDrillDown(node: TopologyNode): boolean {
  return node.type === 'ZC' || node.type === 'ATS'
}

function drillDownToSubsystem() {
  if (!selectedNode.value || !canDrillDown(selectedNode.value)) return

  const subsystemType = selectedNode.value.type as 'ZC' | 'ATS'
  const subsystemId = selectedNode.value.id

  console.log(`Drilling down to ${subsystemType} subsystem: ${subsystemId}`)

  // 切换到子系统视图
  topologyStore.switchToSubsystemView(subsystemType, subsystemId)

  // 导航到子系统详情页
  router.push({
    name: 'SubsystemDetail',
    params: {
      type: subsystemType.toLowerCase(),
      id: subsystemId
    }
  })
}

function formatUptime(uptime: number): string {
  const hours = Math.floor(uptime / 3600)
  const minutes = Math.floor((uptime % 3600) / 60)
  return `${hours}h ${minutes}m`
}

function resetView() {
  console.log('Resetting view...')
  resetTopologyView()
}

function toggleLayout() {
  layoutType.value = layoutType.value === 'hierarchical' ? 'force' : 'hierarchical'
  console.log('Layout switched to:', layoutType.value)
  // TODO: 重新计算布局
}

async function refreshData() {
  console.log('Refreshing system topology data...')
  topologyStore.setLoading(true)

  try {
    const { nodes, links } = await getSystemTopology()
    topologyStore.setTopologyData(nodes, links)
    console.log('System topology data refreshed:', { nodes: nodes.length, links: links.length })
  } catch (error) {
    console.error('Failed to refresh topology:', error)
    topologyStore.setError('数据刷新失败')
  } finally {
    topologyStore.setLoading(false)
  }
}

// 生命周期
onMounted(async () => {
  console.log('SystemTopology mounted')

  // 设置为系统视图
  topologyStore.switchToSystemView()

  // 连接WebSocket
  connect()

  // 加载初始数据
  await refreshData()
})

onUnmounted(() => {
  console.log('SystemTopology unmounted')
  disconnect()
})
</script>

<style scoped>
.system-topology {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #0A192F;
  color: #E5E7EB;
  overflow: hidden;
}

/* 顶部操作栏 */
.topology-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #1A202C 0%, #2D3748 100%);
  border-bottom: 1px solid #374151;
  padding: 16px 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
  color: #64FFDA;
  text-shadow: 0 0 10px rgba(100, 255, 218, 0.3);
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #8892B0;
}

.breadcrumb-item.active {
  color: #E5E7EB;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 24px;
}

.view-controls {
  display: flex;
  gap: 12px;
}

.control-btn {
  padding: 8px 16px;
  background: rgba(100, 255, 218, 0.1);
  border: 1px solid rgba(100, 255, 218, 0.3);
  border-radius: 6px;
  color: #64FFDA;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.control-btn:hover:not(:disabled) {
  background: rgba(100, 255, 218, 0.2);
  box-shadow: 0 0 10px rgba(100, 255, 218, 0.3);
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.status-summary {
  display: flex;
  gap: 16px;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  border: 1px solid #374151;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #E5E7EB;
}

.summary-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  box-shadow: 0 0 6px currentColor;
}

.summary-dot.green {
  background: #2ECC71;
}

.summary-dot.yellow {
  background: #F39C12;
}

.summary-dot.red {
  background: #E74C3C;
}

/* 拓扑画布容器 */
.topology-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  background:
      radial-gradient(circle at 25% 25%, rgba(100, 255, 218, 0.02) 0%, transparent 50%),
      radial-gradient(circle at 75% 75%, rgba(59, 130, 246, 0.02) 0%, transparent 50%),
      #0A192F;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(10, 25, 47, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

/* 侧边信息面板 */
.info-panel {
  position: absolute;
  top: 80px;
  right: 24px;
  width: 320px;
  max-height: calc(100vh - 120px);
  background: linear-gradient(135deg, #1A202C 0%, #2D3748 100%);
  border: 1px solid #374151;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  overflow: hidden;
  z-index: 100;
  backdrop-filter: blur(10px);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: rgba(100, 255, 218, 0.1);
  border-bottom: 1px solid #374151;
}

.panel-header h3 {
  margin: 0;
  color: #64FFDA;
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: #8892B0;
  font-size: 18px;
  cursor: pointer;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(231, 76, 60, 0.2);
  color: #E74C3C;
}

.panel-content {
  padding: 20px;
  overflow-y: auto;
  max-height: calc(100vh - 200px);
}

.info-section {
  margin-bottom: 24px;
}

.info-section:last-child {
  margin-bottom: 0;
}

.info-section h4 {
  margin: 0 0 12px 0;
  color: #E5E7EB;
  font-size: 16px;
  font-weight: 500;
  border-bottom: 1px solid #374151;
  padding-bottom: 8px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(55, 65, 81, 0.3);
}

.info-item:last-child {
  border-bottom: none;
}

.info-item .label {
  color: #8892B0;
  font-size: 14px;
}

.info-item .value {
  color: #E5E7EB;
  font-size: 14px;
  font-weight: 500;
}

.drill-down-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #374151;
}

.drill-down-btn {
  width: 100%;
  padding: 12px 16px;
  background: linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.drill-down-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .info-panel {
    width: 280px;
  }

  .status-summary {
    flex-direction: column;
    gap: 8px;
  }
}

@media (max-width: 768px) {
  .topology-header {
    flex-direction: column;
    gap: 16px;
    padding: 12px 16px;
  }

  .header-right {
    width: 100%;
    justify-content: space-between;
  }

  .info-panel {
    position: static;
    width: 100%;
    max-height: none;
    border-radius: 0;
    border-left: none;
    border-right: none;
  }
}
</style>