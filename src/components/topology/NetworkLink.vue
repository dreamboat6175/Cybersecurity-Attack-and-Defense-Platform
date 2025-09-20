<template>
  <g
      class="network-link"
      :class="linkClasses"
      @click="handleClick"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
  >
    <!-- 主链路路径 -->
    <path
        class="link-path"
        :d="linkPath"
        :stroke="linkColors.stroke"
        :stroke-width="linkColors.width"
        :stroke-dasharray="strokeDashArray"
        :opacity="linkOpacity"
        fill="none"
        :marker-end="showArrow ? 'url(#arrowhead)' : ''"
    />

    <!-- A/B双网络支持 - A网链路 -->
    <path
        v-if="link.network === 'A' || isZCSubsystem"
        class="link-path-a"
        :d="aNetworkPath"
        :stroke="aNetworkColor"
        :stroke-width="networkLinkWidth"
        :stroke-dasharray="aNetworkDashArray"
        :opacity="networkLinkOpacity"
        fill="none"
        :marker-end="showArrow ? 'url(#arrowhead-a)' : ''"
    />

    <!-- A/B双网络支持 - B网链路 -->
    <path
        v-if="link.network === 'B' || isZCSubsystem"
        class="link-path-b"
        :d="bNetworkPath"
        :stroke="bNetworkColor"
        :stroke-width="networkLinkWidth"
        :stroke-dasharray="bNetworkDashArray"
        :opacity="networkLinkOpacity"
        fill="none"
        :marker-end="showArrow ? 'url(#arrowhead-b)' : ''"
    />

    <!-- 数据流动画点 -->
    <g v-if="showDataFlow && isActive" class="data-flow">
      <circle
          v-for="(dot, index) in flowDots"
          :key="index"
          class="flow-dot"
          :cx="dot.x"
          :cy="dot.y"
          :r="flowDotRadius"
          :fill="flowDotColor"
          :opacity="dot.opacity"
      />
    </g>

    <!-- 选中指示器 -->
    <path
        v-if="isSelected"
        class="selection-indicator"
        :d="linkPath"
        :stroke="selectionColor"
        :stroke-width="linkColors.width + 4"
        stroke-dasharray="10,5"
        fill="none"
        opacity="0.6"
        pointer-events="none"
    >
      <animate
          attributeName="stroke-dashoffset"
          values="0;15"
          dur="1s"
          repeatCount="indefinite"
      />
    </path>

    <!-- 悬浮指示器 -->
    <path
        v-if="isHovered && !isSelected"
        class="hover-indicator"
        :d="linkPath"
        :stroke="hoverColor"
        :stroke-width="linkColors.width + 2"
        fill="none"
        opacity="0.4"
        pointer-events="none"
    />

    <!-- 链路标签 -->
    <g v-if="showLabel && labelPosition" class="link-label" :transform="`translate(${labelPosition.x}, ${labelPosition.y})`">
      <!-- 标签背景 -->
      <rect
          class="label-background"
          :x="-labelWidth / 2"
          :y="-10"
          :width="labelWidth"
          height="20"
          rx="4"
          :fill="labelBackgroundColor"
          :stroke="labelBorderColor"
          stroke-width="1"
          opacity="0.9"
      />

      <!-- 标签文本 -->
      <text
          class="label-text"
          x="0"
          y="4"
          text-anchor="middle"
          :fill="labelTextColor"
          :font-size="labelFontSize"
          font-weight="500"
      >
        {{ linkLabel }}
      </text>
    </g>

    <!-- 状态指示器 -->
    <circle
        v-if="showStatusIndicator && labelPosition"
        class="status-indicator"
        :cx="labelPosition.x + labelWidth / 2 + 8"
        :cy="labelPosition.y"
        r="4"
        :fill="statusIndicatorColor"
        :stroke="labelBackgroundColor"
        stroke-width="1"
    />

    <!-- 网络类型标识 (ZC子系统) -->
    <g v-if="isZCSubsystem && showNetworkLabels" class="network-labels">
      <!-- A网标签 -->
      <text
          v-if="aNetworkPosition"
          class="network-label"
          :x="aNetworkPosition.x"
          :y="aNetworkPosition.y - 8"
          text-anchor="middle"
          :fill="aNetworkColor"
          font-size="10"
          font-weight="bold"
      >
        A
      </text>

      <!-- B网标签 -->
      <text
          v-if="bNetworkPosition"
          class="network-label"
          :x="bNetworkPosition.x"
          :y="bNetworkPosition.y + 15"
          text-anchor="middle"
          :fill="bNetworkColor"
          font-size="10"
          font-weight="bold"
      >
        B
      </text>
    </g>

    <!-- 故障指示器 -->
    <g v-if="isFaulted" class="fault-indicator">
      <circle
          :cx="faultPosition.x"
          :cy="faultPosition.y"
          r="8"
          fill="#E74C3C"
          opacity="0.9"
      />
      <text
          :x="faultPosition.x"
          :y="faultPosition.y + 3"
          text-anchor="middle"
          fill="white"
          font-size="10"
          font-weight="bold"
      >
        ×
      </text>

      <!-- 故障闪烁动画 -->
      <circle
          :cx="faultPosition.x"
          :cy="faultPosition.y"
          r="8"
          fill="none"
          stroke="#E74C3C"
          stroke-width="2"
          opacity="0.6"
      >
        <animate attributeName="r" values="8;15;8" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite"/>
      </circle>
    </g>

    <!-- 带宽利用率指示器 -->
    <g v-if="showBandwidthIndicator && bandwidthPosition" class="bandwidth-indicator">
      <rect
          :x="bandwidthPosition.x - 20"
          :y="bandwidthPosition.y - 3"
          width="40"
          height="6"
          rx="3"
          fill="#374151"
          opacity="0.8"
      />
      <rect
          :x="bandwidthPosition.x - 20"
          :y="bandwidthPosition.y - 3"
          :width="40 * bandwidthUtilization"
          height="6"
          rx="3"
          :fill="bandwidthColor"
          opacity="0.9"
      />
    </g>
  </g>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { useStatusColors } from '../../composables/useStatusColors'
import { useTopologyStore } from '../../stores/topology'
import type { TopologyLink, Position } from '../../types/topology'
import type { NetworkType } from '../../types/devices'

// ===== Props =====
interface Props {
  link: TopologyLink
  isSelected?: boolean
  isHovered?: boolean
  showLabel?: boolean
  showArrow?: boolean
  showDataFlow?: boolean
  showStatusIndicator?: boolean
  showBandwidthIndicator?: boolean
  showNetworkLabels?: boolean
  sourcePosition?: Position
  targetPosition?: Position
}

const props = withDefaults(defineProps<Props>(), {
  isSelected: false,
  isHovered: false,
  showLabel: true,
  showArrow: true,
  showDataFlow: true,
  showStatusIndicator: true,
  showBandwidthIndicator: false,
  showNetworkLabels: true
})

// ===== Emits =====
const emit = defineEmits<{
  click: [link: TopologyLink, event: MouseEvent]
  mouseenter: [link: TopologyLink]
  mouseleave: [link: TopologyLink]
}>()

// ===== Composables =====
const {
  statusColors,
  networkColors,
  getLinkColor,
  getNetworkLinkColor,
  computeLinkDisplayColor
} = useStatusColors()
const topologyStore = useTopologyStore()

// ===== 响应式数据 =====
const flowDots = ref<Array<{ x: number, y: number, opacity: number }>>([])
const animationFrameId = ref<number | null>(null)

// ===== 计算属性 =====

// 链路样式类
const linkClasses = computed(() => ({
  'link-selected': props.isSelected,
  'link-hovered': props.isHovered,
  'link-active': isActive.value,
  'link-down': props.link.status === 'down',
  'link-warning': props.link.status === 'warning',
  [`link-type-${props.link.type}`]: true,
  [`link-network-${props.link.network?.toLowerCase()}`]: props.link.network
}))

// 获取源节点和目标节点位置
const sourceNode = computed(() =>
    topologyStore.nodes.find(n => n.id === props.link.source)
)
const targetNode = computed(() =>
    topologyStore.nodes.find(n => n.id === props.link.target)
)

const sourcePos = computed(() =>
    props.sourcePosition || sourceNode.value?.position || { x: 0, y: 0 }
)
const targetPos = computed(() =>
    props.targetPosition || targetNode.value?.position || { x: 0, y: 0 }
)

// 是否为ZC子系统 (需要显示A/B双网络)
const isZCSubsystem = computed(() =>
    topologyStore.currentLevel === 'subsystem' && topologyStore.currentSubsystem === 'ZC'
)

// 链路是否活跃
const isActive = computed(() =>
    props.link.status === 'active' || props.link.status === 'warning'
)

// 链路是否故障
const isFaulted = computed(() =>
    props.link.status === 'down'
)

// 链路颜色配置
const linkColors = computed(() => {
  return computeLinkDisplayColor(
      props.link.status,
      props.link.network,
      props.isSelected,
      props.isHovered
  )
})

// 网络颜色
const aNetworkColor = computed(() => {
  if (props.link.status === 'down' && props.link.network === 'A') {
    return statusColors.value.critical
  }
  return networkColors.value.a_network
})

const bNetworkColor = computed(() => {
  if (props.link.status === 'down' && props.link.network === 'B') {
    return statusColors.value.critical
  }
  return networkColors.value.b_network
})

// 主链路路径
const linkPath = computed(() => {
  return calculateLinkPath(sourcePos.value, targetPos.value)
})

// A网络路径 (上偏移)
const aNetworkPath = computed(() => {
  if (!isZCSubsystem.value) return linkPath.value
  const offset = calculatePerpendicularOffset(sourcePos.value, targetPos.value, -8)
  return calculateLinkPath(
      { x: sourcePos.value.x + offset.x, y: sourcePos.value.y + offset.y },
      { x: targetPos.value.x + offset.x, y: targetPos.value.y + offset.y }
  )
})

// B网络路径 (下偏移)
const bNetworkPath = computed(() => {
  if (!isZCSubsystem.value) return linkPath.value
  const offset = calculatePerpendicularOffset(sourcePos.value, targetPos.value, 8)
  return calculateLinkPath(
      { x: sourcePos.value.x + offset.x, y: sourcePos.value.y + offset.y },
      { x: targetPos.value.x + offset.x, y: targetPos.value.y + offset.y }
  )
})

// 链路标签
const linkLabel = computed(() => {
  if (props.link.metadata?.protocol) {
    return `${props.link.type.toUpperCase()} (${props.link.metadata.protocol})`
  }
  return props.link.type.toUpperCase()
})

// 标签位置 (链路中点)
const labelPosition = computed(() => {
  return {
    x: (sourcePos.value.x + targetPos.value.x) / 2,
    y: (sourcePos.value.y + targetPos.value.y) / 2
  }
})

// 标签宽度
const labelWidth = computed(() => {
  return Math.max(linkLabel.value.length * 6, 60)
})

// 标签字体大小
const labelFontSize = computed(() => 10)

// 故障位置 (链路中点附近)
const faultPosition = computed(() => {
  const midX = (sourcePos.value.x + targetPos.value.x) / 2
  const midY = (sourcePos.value.y + targetPos.value.y) / 2
  return { x: midX, y: midY }
})

// 带宽指示器位置
const bandwidthPosition = computed(() => {
  const ratio = 0.3 // 在链路30%位置显示
  return {
    x: sourcePos.value.x + (targetPos.value.x - sourcePos.value.x) * ratio,
    y: sourcePos.value.y + (targetPos.value.y - sourcePos.value.y) * ratio
  }
})

// 网络标签位置
const aNetworkPosition = computed(() => {
  const ratio = 0.2
  const offset = calculatePerpendicularOffset(sourcePos.value, targetPos.value, -8)
  return {
    x: sourcePos.value.x + (targetPos.value.x - sourcePos.value.x) * ratio + offset.x,
    y: sourcePos.value.y + (targetPos.value.y - sourcePos.value.y) * ratio + offset.y
  }
})

const bNetworkPosition = computed(() => {
  const ratio = 0.2
  const offset = calculatePerpendicularOffset(sourcePos.value, targetPos.value, 8)
  return {
    x: sourcePos.value.x + (targetPos.value.x - sourcePos.value.x) * ratio + offset.x,
    y: sourcePos.value.y + (targetPos.value.y - sourcePos.value.y) * ratio + offset.y
  }
})

// 链路透明度
const linkOpacity = computed(() => {
  if (props.link.status === 'unknown') return 0.3
  if (props.link.status === 'down') return 0.5
  return 1
})

// 网络链路透明度
const networkLinkOpacity = computed(() => {
  if (!isZCSubsystem.value) return 0
  return linkOpacity.value
})

// 网络链路宽度
const networkLinkWidth = computed(() => {
  return linkColors.value.width - 1
})

// 虚线样式
const strokeDashArray = computed(() => {
  if (props.link.status === 'down') return '5,5'
  if (props.link.status === 'unknown') return '3,3'
  return 'none'
})

const aNetworkDashArray = computed(() => {
  if (props.link.status === 'down' && props.link.network === 'A') return '5,5'
  return 'none'
})

const bNetworkDashArray = computed(() => {
  if (props.link.status === 'down' && props.link.network === 'B') return '5,5'
  return 'none'
})

// 数据流相关
const flowDotRadius = computed(() => 2)
const flowDotColor = computed(() => {
  if (props.link.status === 'down') return statusColors.value.critical
  return networkColors.value.a_network
})

// 带宽利用率
const bandwidthUtilization = computed(() => {
  // 模拟带宽利用率，实际应从metadata获取
  return Math.random() * 0.8 + 0.1
})

const bandwidthColor = computed(() => {
  const util = bandwidthUtilization.value
  if (util > 0.8) return statusColors.value.critical
  if (util > 0.6) return statusColors.value.warning
  return statusColors.value.normal
})

// UI颜色
const selectionColor = computed(() => '#64FFDA')
const hoverColor = computed(() => '#3B82F6')
const labelBackgroundColor = computed(() => 'rgba(26, 32, 44, 0.9)')
const labelBorderColor = computed(() => '#374151')
const labelTextColor = computed(() => '#E5E7EB')
const statusIndicatorColor = computed(() => getLinkColor(props.link.status))

// ===== 辅助函数 =====

// 计算链路路径
function calculateLinkPath(source: Position, target: Position): string {
  const dx = target.x - source.x
  const dy = target.y - source.y
  const distance = Math.sqrt(dx * dx + dy * dy)

  if (distance < 1) {
    return `M ${source.x} ${source.y} L ${target.x} ${target.y}`
  }

  // 计算节点边缘的连接点 (假设节点半径为20)
  const nodeRadius = 20
  const unitX = dx / distance
  const unitY = dy / distance

  const startX = source.x + unitX * nodeRadius
  const startY = source.y + unitY * nodeRadius
  const endX = target.x - unitX * nodeRadius
  const endY = target.y - unitY * nodeRadius

  // 对于较长的链路，使用贝塞尔曲线
  if (distance > 200) {
    const controlOffset = Math.min(distance * 0.2, 50)
    const midX = (startX + endX) / 2
    const midY = (startY + endY) / 2

    // 垂直偏移创建弧形
    const perpX = -unitY * controlOffset
    const perpY = unitX * controlOffset

    return `M ${startX} ${startY} Q ${midX + perpX} ${midY + perpY} ${endX} ${endY}`
  }

  return `M ${startX} ${startY} L ${endX} ${endY}`
}

// 计算垂直偏移
function calculatePerpendicularOffset(source: Position, target: Position, distance: number): Position {
  const dx = target.x - source.x
  const dy = target.y - source.y
  const length = Math.sqrt(dx * dx + dy * dy)

  if (length === 0) return { x: 0, y: 0 }

  // 垂直向量
  const perpX = -dy / length * distance
  const perpY = dx / length * distance

  return { x: perpX, y: perpY }
}

// 获取路径上的点
function getPointOnPath(path: string, ratio: number): Position {
  // 简化实现，实际项目中应使用SVG路径计算库
  const sourceX = sourcePos.value.x
  const sourceY = sourcePos.value.y
  const targetX = targetPos.value.x
  const targetY = targetPos.value.y

  return {
    x: sourceX + (targetX - sourceX) * ratio,
    y: sourceY + (targetY - sourceY) * ratio
  }
}

// ===== 动画相关 =====

// 启动数据流动画
function startDataFlowAnimation(): void {
  if (!props.showDataFlow || !isActive.value) return

  const animate = () => {
    // 更新流动点位置
    const newDots: Array<{ x: number, y: number, opacity: number }> = []

    for (let i = 0; i < 3; i++) {
      const ratio = (Date.now() / 2000 + i * 0.3) % 1
      const point = getPointOnPath(linkPath.value, ratio)

      // 计算透明度（渐入渐出）
      let opacity = 1
      if (ratio < 0.1) opacity = ratio * 10
      else if (ratio > 0.9) opacity = (1 - ratio) * 10

      newDots.push({
        x: point.x,
        y: point.y,
        opacity: Math.max(0, Math.min(1, opacity))
      })
    }

    flowDots.value = newDots

    if (props.showDataFlow && isActive.value) {
      animationFrameId.value = requestAnimationFrame(animate)
    }
  }

  animate()
}

// 停止数据流动画
function stopDataFlowAnimation(): void {
  if (animationFrameId.value) {
    cancelAnimationFrame(animationFrameId.value)
    animationFrameId.value = null
  }
  flowDots.value = []
}

// ===== 事件处理 =====

function handleClick(event: MouseEvent): void {
  event.stopPropagation()
  emit('click', props.link, event)
}

function handleMouseEnter(): void {
  emit('mouseenter', props.link)
}

function handleMouseLeave(): void {
  emit('mouseleave', props.link)
}

// ===== 生命周期 =====

onMounted(() => {
  if (props.showDataFlow && isActive.value) {
    startDataFlowAnimation()
  }
})

// ===== 监听器 =====

watch([() => props.showDataFlow, isActive], ([newShowDataFlow, newIsActive]) => {
  if (newShowDataFlow && newIsActive) {
    startDataFlowAnimation()
  } else {
    stopDataFlowAnimation()
  }
})

watch(() => props.link.status, () => {
  if (props.showDataFlow && isActive.value) {
    startDataFlowAnimation()
  } else {
    stopDataFlowAnimation()
  }
})