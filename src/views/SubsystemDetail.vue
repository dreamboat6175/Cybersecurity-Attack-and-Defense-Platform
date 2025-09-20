<!-- src/views/SubsystemDetail.vue -->
<template>
  <div class="subsystem-detail">
    <!-- 顶部导航栏 -->
    <div class="detail-header">
      <div class="header-left">
        <button @click="goBack" class="back-btn" title="返回系统视图">
          ← 返回
        </button>

        <div class="title-section">
          <h2 class="page-title">
            <span class="subsystem-icon">{{ getSubsystemIcon(subsystemType) }}</span>
            {{ subsystemType }} 子系统详情
          </h2>
          <div class="breadcrumb">
            <span class="breadcrumb-item" @click="goBack">系统层视图</span>
            <span class="breadcrumb-separator">></span>
            <span class="breadcrumb-item active">{{ subsystemType }}-{{ subsystemId }}</span>
          </div>
        </div>
      </div>

      <div class="header-right">
        <div class="network-legend" v-if="subsystemType === 'ZC'">
          <div class="legend-item">
            <div class="legend-line a-network"></div>
            <span>A网 (数字薄荷绿)</span>
          </div>
          <div class="legend-item">
            <div class="legend-line b-network"></div>
            <span>B网 (电光洋红)</span>
          </div>
        </div>

        <div class="view-controls">
          <button @click="resetView" class="control-btn" title="重置视图">
            🎯 重置
          </button>
          <button @click="refreshSubsystemData" class="control-btn" :disabled="isLoading" title="刷新数据">
            🔄 刷新
          </button>
        </div>
      </div>
    </div>

    <!-- 子系统拓扑画布 -->
    <div class="subsystem-container">
      <TopologyCanvas
          :nodes="subsystemNodes"
          :links="subsystemLinks"
          :zoom-level="zoomLevel"
          :pan-offset="panOffset"
          :is-loading="isLoading"
          :layout-type="layoutType"
          :show-network-colors="subsystemType === 'ZC'"
          @node-click="handleNodeClick"
          @node-hover="handleNodeHover"
          @link-click="handleLinkClick"
          @link-hover="handleLinkHover"
          @canvas-click="handleCanvasClick"
          @view-transform="handleViewTransform"
      />

      <!-- 网络故障高亮 -->
      <div v-if="networkFaults.length > 0" class="fault-overlay">
        <div v-for="fault in networkFaults" :key="fault.id" class="fault-indicator"
             :style="{ top: fault.position.y + 'px', left: fault.position.x + 'px' }">
          <div class="fault-pulse"></div>
          <div class="fault-label">{{ fault.message }}</div>
        </div>
      </div>

      <!-- 加载遮罩 */
      <div v-if="isLoading" class="loading-overlay">
        <LoadingSpinner size="large" variant="network" :text="`加载${subsystemType}子系统...`" />
      </div>
    </div>

    <!-- 子系统状态面板 -->
      <div class="status-panel">
        <div class="panel-header">
          <h3>{{ subsystemType }} 状态监控</h3>
          <div class="health-score">
            <span class="score-label">健康度:</span>
            <span class="score-value" :class="getHealthScoreClass(healthScore)">
            {{ healthScore }}%
          </span>
          </div>
        </div>

        <div class="panel-content">
          <!-- 网络状态 (ZC专用) -->
          <div v-if="subsystemType === 'ZC'" class="network-status">
            <h4>双网状态</h4>
            <div class="network-grid">
              <div class="network-item">
                <div class="network-header">
                  <div class="network-indicator a-network"></div>
                  <span>A网状态</span>
                </div>
                <div class="network-stats">
                  <div class="stat-item">
                    <span class="stat-label">连通性:</span>
                    <StatusIndicator :status="aNetworkStatus" />
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">延迟:</span>
                    <span class="stat-value">{{ aNetworkLatency }}ms</span>
                  </div>
                </div>
              </div>

              <div class="network-item">
                <div class="network-header">
                  <div class="network-indicator b-network"></div>
                  <span>B网状态</span>
                </div>
                <div class="network-stats">
                  <div class="stat-item">
                    <span class="stat-label">连通性:</span>
                    <StatusIndicator :status="bNetworkStatus" />
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">延迟:</span>
                    <span class="stat-value">{{ bNetworkLatency }}ms</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 组件状态统计 -->
          <div class="component-stats">
            <h4>组件状态</h4>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-icon">✅</div>
                <div class="stat-info">
                  <span class="stat-number">{{ componentStats.normal }}</span>
                  <span class="stat-label">正常</span>
                </div>
              </div>
              <div class="stat-card warning">
                <div class="stat-icon">⚠️</div>
                <div class="stat-info">
                  <span class="stat-number">{{ componentStats.warning }}</span>
                  <span class="stat-label">告警</span>
                </div>
              </div>
              <div class="stat-card critical">
                <div class="stat-icon">🚨</div>
                <div class="stat-info">
                  <span class="stat-number">{{ componentStats.critical }}</span>
                  <span class="stat-label">故障</span>
                </div>
              </div>
              <div class="stat-card offline">
                <div class="stat-icon">📴</div>
                <div class="stat-info">
                  <span class="stat-number">{{ componentStats.offline }}</span>
                  <span class="stat-label">离线</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 告警列表 -->
          <div v-if="subsystemAlerts.length > 0" class="alerts-section">
            <h4>活跃告警</h4>
            <div class="alerts-list">
              <div v-for="alert in subsystemAlerts" :key="alert.id"
                   class="alert-item" :class="alert.severity">
                <div class="alert-icon">
                  {{ getAlertIcon(alert.severity) }}
                </div>
                <div class="alert-content">
                  <div class="alert-message">{{ alert.message }}</div>
                  <div class="alert-meta">
                    <span class="alert-time">{{ formatTime(alert.timestamp) }}</span>
                    <span class="alert-source">{{ alert.deviceId || alert.linkId }}</span>
                  </div>
                </div>
                <button @click="acknowledgeAlert(alert.id)" class="alert-ack-btn"
                        v-if="!alert.acknowledged">确认</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 节点详情模态框 -->
      <div v-if="selectedNode" class="node-detail-modal" @click.self="closeNodeDetail">
        <div class="modal-content">
          <div class="modal-header">
            <h3>{{ selectedNode.label }} 详情</h3>
            <button @click="closeNodeDetail" class="modal-close">✕</button>
          </div>

          <div class="modal-body">
            <div class="detail-section">
              <h4>基本信息</h4>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">设备类型:</span>
                  <span class="detail-value">{{ selectedNode.type }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">设备ID:</span>
                  <span class="detail-value">{{ selectedNode.id }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">当前状态:</span>
                  <StatusIndicator :status="selectedNode.status" />
                </div>
              </div>
            </div>

            <div v-if="selectedNode.metadata" class="detail-section">
              <h4>运行指标</h4>
              <div class="detail-grid">
                <div v-if="selectedNode.metadata.ip" class="detail-item">
                  <span class="detail-label">IP地址:</span>
                  <span class="detail-value">{{ selectedNode.metadata.ip }}</span>
                </div>
                <div v-if="selectedNode.metadata.cpuUsage !== undefined" class="detail-item">
                  <span class="detail-label">CPU使用率:</span>
                  <span class="detail-value">{{ selectedNode.metadata.cpuUsage }}%</span>
                </div>
                <div v-if="selectedNode.metadata.memoryUsage !== undefined" class="detail-item">
                  <span class="detail-label">内存使用率:</span>
                  <span class="detail-value">{{ selectedNode.metadata.memoryUsage }}%</span>
                </div>
                <div v-if="selectedNode.metadata.temperature !== undefined" class="detail-item">
                  <span class="detail-label">运行温度:</span>
                  <span class="detail-value">{{ selectedNode.metadata.temperature }}°C</span>
                </div>
                <div v-if="selectedNode.metadata.uptime" class="detail-item">
                  <span class="detail-label">运行时间:</span>
                  <span class="detail-value">{{ formatUptime(selectedNode.metadata.uptime) }}</span>
                </div>
              </div>
            </div>

            <!-- 网络连接信息 (ZC子系统专用) -->
            <div v-if="subsystemType === 'ZC' && nodeNetworkInfo" class="detail-section">
              <h4>网络连接</h4>
              <div class="network-connections">
                <div v-if="nodeNetworkInfo.aNetwork" class="connection-item">
                  <div class="connection-header">
                    <div class="network-indicator a-network"></div>
                    <span>A网连接</span>
                  </div>
                  <div class="connection-status">
                    <StatusIndicator :status="nodeNetworkInfo.aNetwork.status" />
                    <span class="connection-details">
                    {{ nodeNetworkInfo.aNetwork.connectedNodes }} 个节点连接
                  </span>
                  </div>
                </div>

                <div v-if="nodeNetworkInfo.bNetwork" class="connection-item">
                  <div class="connection-header">
                    <div class="network-indicator b-network"></div>
                    <span>B网连接</span>
                  </div>
                  <div class="connection-status">
                    <StatusIndicator :status="nodeNetworkInfo.bNetwork.status" />
                    <span class="connection-details">
                    {{ nodeNetworkInfo.bNetwork.connectedNodes }} 个节点连接
                  </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 悬浮提示 -->
      <NodeTooltip
          v-if="hoveredNode"
          :node="hoveredNode"
          :position="tooltipPosition"
      />

      <LinkTooltip
          v-if="hoveredLink"
          :link="hoveredLink"
          :position="tooltipPosition"
          :show-network-info="subsystemType === 'ZC'"
      />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTopologyStore } from '../stores/topology'
import { useAlertsStore } from '../stores/alerts'
import { useTopology } from '../composables/useTopology'
import { useWebSocket } from '../composables/useWebSocket'
import { getSubsystemTopology } from '../services/api/topology'
import TopologyCanvas from '../components/topology/TopologyCanvas.vue'
import NodeTooltip from '../components/topology/NodeTooltip.vue'
import LinkTooltip from '../components/topology/LinkTooltip.vue'
import LoadingSpinner from '../components/common/LoadingSpinner.vue'
import StatusIndicator from '../components/common/StatusIndicator.vue'
import type {
  TopologyNode,
  TopologyLink,
  Position,
  SubsystemType,
  AlertInfo
} from '../types/topology'
import type { DeviceStatus, LinkStatus, NetworkType } from '../types/devices'

// 路由和状态管理
const route = useRoute()
const router = useRouter()
const topologyStore = useTopologyStore()
const alertsStore = useAlertsStore()

// 组合式函数
const {
  currentNodes,
  currentLinks,
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

const { connect, disconnect, isConnected } = useWebSocket()

// 路由参数
const subsystemType = computed(() => {
  const type = route.params.type as string
  return type?.toUpperCase() as SubsystemType
})

const subsystemId = computed(() => route.params.id as string)

// 本地状态
const tooltipPosition = ref<Position>({ x: 0, y: 0 })
const layoutType = ref<'hierarchical' | 'force'>('hierarchical')
const networkFaults = ref<Array<{
  id: string
  position: Position
  message: string
  severity: string
}>>([])

// 子系统相关数据
const subsystemNodes = computed(() =>
    currentNodes.value.filter(node => node.parentSystem === subsystemId.value)
)

const subsystemLinks = computed(() =>
    currentLinks.value.filter(link => {
      const sourceNode = currentNodes.value.find(n => n.id === link.source)
      const targetNode = currentNodes.value.find(n => n.id === link.target)
      return sourceNode?.parentSystem === subsystemId.value ||
          targetNode?.parentSystem === subsystemId.value
    })
)

const subsystemAlerts = computed(() =>
    alertsStore.filteredAlerts.filter(alert =>
        alert.deviceId?.startsWith(subsystemId.value) ||
        alert.linkId?.includes(subsystemId.value)
    )
)

// 网络状态 (ZC专用)
const aNetworkStatus = ref<DeviceStatus>('normal')
const bNetworkStatus = ref<DeviceStatus>('normal')
const aNetworkLatency = ref(12)
const bNetworkLatency = ref(15)

// 组件统计
const componentStats = computed(() => {
  const stats = { normal: 0, warning: 0, critical: 0, offline: 0 }
  subsystemNodes.value.forEach(node => {
    stats[node.status]++
  })
  return stats
})

// 健康度评分
const healthScore = computed(() => {
  const total = subsystemNodes.value.length
  if (total === 0) return 100

  const normal = componentStats.value.normal
  const warning = componentStats.value.warning
  const critical = componentStats.value.critical

  // 正常=100%, 告警=70%, 故障=30%, 离线=0%
  const score = (normal * 100 + warning * 70 + critical * 30) / total
  return Math.round(score)
})

// 选中节点的网络信息 (ZC专用)
const nodeNetworkInfo = computed(() => {
  if (!selectedNode.value || subsystemType.value !== 'ZC') return null

  const nodeId = selectedNode.value.id
  const aNetworkLinks = subsystemLinks.value.filter(link =>
      (link.source === nodeId || link.target === nodeId) && link.network === 'A'
  )
  const bNetworkLinks = subsystemLinks.value.filter(link =>
      (link.source === nodeId || link.target === nodeId) && link.network === 'B'
  )

  return {
    aNetwork: aNetworkLinks.length > 0 ? {
      status: aNetworkLinks.every(link => link.status === 'active') ? 'normal' : 'critical',
      connectedNodes: aNetworkLinks.length
    } : null,
    bNetwork: bNetworkLinks.length > 0 ? {
      status: bNetworkLinks.every(link => link.status === 'active') ? 'normal' : 'critical',
      connectedNodes: bNetworkLinks.length
    } : null
  }
})

// 工具函数
function getSubsystemIcon(type: SubsystemType): string {
  return type === 'ZC' ? '🧠' : '🚆'
}

function getHealthScoreClass(score: number): string {
  if (score >= 90) return 'excellent'
  if (score >= 70) return 'good'
  if (score >= 50) return 'warning'
  return 'critical'
}

function getAlertIcon(severity: string): string {
  const icons = {
    low: 'ℹ️',
    medium: '⚠️',
    high: '🚨',
    critical: '💥'
  }
  return icons[severity] || '❓'
}

function formatTime(timestamp: Date): string {
  return new Date(timestamp).toLocaleTimeString('zh-CN')
}

function formatUptime(uptime: number): string {
  const days = Math.floor(uptime / 86400)
  const hours = Math.floor((uptime % 86400) / 3600)
  const minutes = Math.floor((uptime % 3600) / 60)

  if (days > 0) return `${days}天 ${hours}小时`
  if (hours > 0) return `${hours}小时 ${minutes}分钟`
  return `${minutes}分钟`
}

// 事件处理
function goBack() {
  router.push({ name: 'SystemTopology' })
}

function handleNodeClick(node: TopologyNode, event: MouseEvent) {
  selectNode(node.id)
}

function handleNodeHover(node: TopologyNode | null, event?: MouseEvent) {
  setHoveredElement(node?.id || null, 'node')
  updateTooltipPosition(event)
}

function handleLinkClick(link: TopologyLink, event: MouseEvent) {
  console.log('Link clicked:', link.id)
  // 可以添加链路详情显示逻辑
}

function handleLinkHover(link: TopologyLink | null, event?: MouseEvent) {
  setHoveredElement(link?.id || null, 'link')
  updateTooltipPosition(event)
}

function handleCanvasClick() {
  clearSelection()
}

function handleViewTransform(transform: { zoom: number, pan: Position }) {
  topologyStore.setViewTransform(transform.zoom, transform.pan)
}

function updateTooltipPosition(event?: MouseEvent) {
  if (event) {
    tooltipPosition.value = {
      x: event.clientX + 10,
      y: event.clientY - 10
    }
  }
}

function closeNodeDetail() {
  clearSelection()
}

function resetView() {
  resetTopologyView()
}

function acknowledgeAlert(alertId: string) {
  alertsStore.acknowledgeAlert(alertId)
}

async function refreshSubsystemData() {
  console.log(`Refreshing ${subsystemType.value} subsystem data...`)
  topologyStore.setLoading(true)

  try {
    const { nodes, links } = await getSubsystemTopology(
        subsystemType.value,
        subsystemId.value
    )
    topologyStore.setTopologyData(nodes, links)

    // 检测网络故障
    detectNetworkFaults()

    console.log('Subsystem topology refreshed:', {
      nodes: nodes.length,
      links: links.length
    })
  } catch (error) {
    console.error('Failed to refresh subsystem topology:', error)
    topologyStore.setError('子系统数据刷新失败')
  } finally {
    topologyStore.setLoading(false)
  }
}

function detectNetworkFaults() {
  if (subsystemType.value !== 'ZC') return

  networkFaults.value = []

  // 检查A/B网络故障
  subsystemLinks.value.forEach(link => {
    if (link.status === 'down' && link.network) {
      const sourceNode = subsystemNodes.value.find(n => n.id === link.source)
      const targetNode = subsystemNodes.value.find(n => n.id === link.target)

      if (sourceNode && targetNode) {
        const midPoint = {
          x: (sourceNode.position.x + targetNode.position.x) / 2,
          y: (sourceNode.position.y + targetNode.position.y) / 2
        }

        networkFaults.value.push({
          id: link.id,
          position: midPoint,
          message: `${link.network}网通信中断`,
          severity: 'critical'
        })
      }
    }
  })
}

// 生命周期
onMounted(async () => {
  console.log(`SubsystemDetail mounted: ${subsystemType.value}-${subsystemId.value}`)

  // 设置子系统视图
  topologyStore.switchToSubsystemView(subsystemType.value, subsystemId.value)

  // 连接WebSocket
  connect()

  // 加载子系统数据
  await refreshSubsystemData()
})

onUnmounted(() => {
  console.log('SubsystemDetail unmounted')
  disconnect()
})

// 监听路由变化
watch([subsystemType, subsystemId], async ([newType, newId]) => {
  if (newType && newId) {
    topologyStore.switchToSubsystemView(newType, newId)
    await refreshSubsystemData()
  }
})
</script>

<style scoped>
.subsystem-detail {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #0A192F;
  color: #E5E7EB;
  overflow: hidden;
}

/* 顶部导航栏 */
.detail-header {
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
  align-items: center;
  gap: 16px;
}

.back-btn {
  padding: 8px 16px;
  background: rgba(100, 255, 218, 0.1);
  border: 1px solid rgba(100, 255, 218, 0.3);
  border-radius: 6px;
  color: #64FFDA;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: rgba(100, 255, 218, 0.2);
  transform: translateX(-2px);
}

.title-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
  color: #64FFDA;
  display: flex;
  align-items: center;
  gap: 8px;
}

.subsystem-icon {
  font-size: 28px;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #8892B0;
}

.breadcrumb-item {
  cursor: pointer;
  transition: color 0.2s ease;
}

.breadcrumb-item:hover {
  color: #64FFDA;
}

.breadcrumb-item.active {
  color: #E5E7EB;
}

.breadcrumb-separator {
  color: #4B5563;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 24px;
}

.network-legend {
  display: flex;
  gap: 16px;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  border: 1px solid #374151;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.legend-line {
  width: 20px;
  height: 3px;
  border-radius: 2px;
}

.legend-line.a-network {
  background: #64FFDA;
  box-shadow: 0 0 8px rgba(100, 255, 218, 0.5);
}

.legend-line.b-network {
  background: #FF2DF7;
  box-shadow: 0 0 8px rgba(255, 45, 247, 0.5);
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

/* 子系统容器 */
.subsystem-container {
  flex: 1;
  display: flex;
  position: relative;
  overflow: hidden;
  background:
      radial-gradient(circle at 25% 25%, rgba(100, 255, 218, 0.02) 0%, transparent 50%),
      radial-gradient(circle at 75% 75%, rgba(255, 45, 247, 0.02) 0%, transparent 50%),
      #0A192F;
}

.fault-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 50;
}

.fault-indicator {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.fault-pulse {
  width: 16px;
  height: 16px;
  background: #E74C3C;
  border-radius: 50%;
  animation: fault-pulse 1.5s infinite;
}

@keyframes fault-pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.5);
    opacity: 0.7;
  }
}

.fault-label {
  background: rgba(231, 76, 60, 0.9);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
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

/* 状态面板 */
.status-panel {
  width: 350px;
  background: linear-gradient(135deg, #1A202C 0%, #2D3748 100%);
  border-left: 1px solid #374151;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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

.health-score {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.score-label {
  color: #8892B0;
}

.score-value {
  font-weight: 600;
  font-size: 16px;
}

.score-value.excellent {
  color: #2ECC71;
}

.score-value.good {
  color: #F39C12;
}

.score-value.warning {
  color: #E67E22;
}

.score-value.critical {
  color: #E74C3C;
}

.panel-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.panel-content h4 {
  margin: 0 0 16px 0;
  color: #E5E7EB;
  font-size: 16px;
  font-weight: 500;
  border-bottom: 1px solid #374151;
  padding-bottom: 8px;
}

/* 网络状态 */
.network-status {
  margin-bottom: 24px;
}

.network-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.network-item {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid #374151;
  border-radius: 8px;
  padding: 12px;
}

.network-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-weight: 500;
}

.network-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.network-indicator.a-network {
  background: #64FFDA;
  box-shadow: 0 0 6px rgba(100, 255, 218, 0.5);
}

.network-indicator.b-network {
  background: #FF2DF7;
  box-shadow: 0 0 6px rgba(255, 45, 247, 0.5);
}

.network-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.stat-label {
  color: #8892B0;
}

.stat-value {
  color: #E5E7EB;
  font-weight: 500;
}

/* 组件统计 */
.component-stats {
  margin-bottom: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.stat-card {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid #374151;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-card.warning {
  border-color: rgba(243, 156, 18, 0.3);
}

.stat-card.critical {
  border-color: rgba(231, 76, 60, 0.3);
}

.stat-card.offline {
  border-color: rgba(149, 165, 166, 0.3);
}

.stat-icon {
  font-size: 20px;
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-number {
  font-size: 18px;
  font-weight: 600;
  color: #E5E7EB;
}

.stat-info .stat-label {
  font-size: 12px;
  color: #8892B0;
}

/* 告警列表 */
.alerts-section {
  margin-bottom: 24px;
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.alert-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid #374151;
  border-radius: 6px;
}

.alert-item.medium {
  border-left: 3px solid #F39C12;
}

.alert-item.high {
  border-left: 3px solid #E67E22;
}

.alert-item.critical {
  border-left: 3px solid #E74C3C;
}

.alert-icon {
  font-size: 16px;
  margin-top: 2px;
}

.alert-content {
  flex: 1;
}

.alert-message {
  font-size: 14px;
  color: #E5E7EB;
  margin-bottom: 4px;
}

.alert-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #8892B0;
}

.alert-ack-btn {
  padding: 4px 8px;
  background: rgba(59, 130, 246, 0.2);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 4px;
  color: #3B82F6;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.alert-ack-btn:hover {
  background: rgba(59, 130, 246, 0.3);
}

/* 节点详情模态框 */
.node-detail-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(5px);
}

.modal-content {
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  background: linear-gradient(135deg, #1A202C 0%, #2D3748 100%);
  border: 1px solid #374151;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: rgba(100, 255, 218, 0.1);
  border-bottom: 1px solid #374151;
}

.modal-header h3 {
  margin: 0;
  color: #64FFDA;
  font-size: 20px;
  font-weight: 600;
}

.modal-close {
  background: none;
  border: none;
  color: #8892B0;
  font-size: 20px;
  cursor: pointer;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: rgba(231, 76, 60, 0.2);
  color: #E74C3C;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  max-height: calc(80vh - 100px);
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.detail-section h4 {
  margin: 0 0 16px 0;
  color: #E5E7EB;
  font-size: 16px;
  font-weight: 500;
  border-bottom: 1px solid #374151;
  padding-bottom: 8px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(55, 65, 81, 0.3);
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-label {
  color: #8892B0;
  font-size: 14px;
}

.detail-value {
  color: #E5E7EB;
  font-size: 14px;
  font-weight: 500;
}

.network-connections {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.connection-item {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid #374151;
  border-radius: 6px;
  padding: 12px;
}

.connection-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-weight: 500;
  font-size: 14px;
}

.connection-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.connection-details {
  font-size: 12px;
  color: #8892B0;
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .subsystem-container {
    flex-direction: column;
  }

  .status-panel {
    width: 100%;
    max-height: 300px;
  }
}

@media (max-width: 768px) {
  .detail-header {
    flex-direction: column;
    gap: 16px;
    padding: 12px 16px;
  }

  .header-right {
    width: 100%;
    justify-content: space-between;
  }

  .network-legend {
    flex-direction: column;
    gap: 8px;
  }

  .modal-content {
    width: 95%;
    max-height: 90vh;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>