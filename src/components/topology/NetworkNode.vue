<template>
  <g
      class="network-node"
      :class="nodeClasses"
      :transform="`translate(${node.position.x}, ${node.position.y})`"
      @click="handleClick"
      @dblclick="handleDoubleClick"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
  >
    <!-- 节点背景圆形 -->
    <circle
        class="node-background"
        :r="nodeRadius"
        :fill="nodeColors.fill"
        :stroke="nodeColors.stroke"
        :stroke-width="strokeWidth"
        :filter="nodeFilter"
        :opacity="nodeOpacity"
    />

    <!-- 节点渐变背景 -->
    <circle
        v-if="enableGradient"
        class="node-gradient"
        :r="nodeRadius - strokeWidth"
        :fill="gradientUrl"
        :opacity="0.8"
    />

    <!-- 设备图标 -->
    <g class="node-icon" :transform="`scale(${iconScale})`">
      <!-- DSU 图标 -->
      <g v-if="node.type === 'DSU'">
        <rect x="-12" y="-8" width="24" height="16" rx="2"
              :fill="iconColor" stroke="none" opacity="0.9"/>
        <rect x="-10" y="-6" width="4" height="12"
              :fill="backgroundColor" opacity="0.6"/>
        <rect x="-4" y="-6" width="4" height="12"
              :fill="backgroundColor" opacity="0.6"/>
        <rect x="2" y="-6" width="4" height="12"
              :fill="backgroundColor" opacity="0.6"/>
        <rect x="8" y="-6" width="4" height="12"
              :fill="backgroundColor" opacity="0.6"/>
      </g>

      <!-- ZC 图标 -->
      <g v-else-if="node.type === 'ZC'">
        <circle :r="10" :fill="iconColor" opacity="0.9"/>
        <circle :r="6" :fill="backgroundColor" opacity="0.7"/>
        <rect x="-1" y="-8" width="2" height="16" :fill="iconColor"/>
        <rect x="-8" y="-1" width="16" height="2" :fill="iconColor"/>
      </g>

      <!-- ATS 图标 -->
      <g v-else-if="node.type === 'ATS'">
        <rect x="-10" y="-8" width="20" height="16" rx="2"
              :fill="iconColor" opacity="0.9"/>
        <rect x="-8" y="-6" width="16" height="3"
              :fill="backgroundColor" opacity="0.7"/>
        <rect x="-8" y="-2" width="16" height="3"
              :fill="backgroundColor" opacity="0.7"/>
        <rect x="-8" y="2" width="16" height="3"
              :fill="backgroundColor" opacity="0.7"/>
      </g>

      <!-- CI 图标 -->
      <g v-else-if="node.type === 'CI'">
        <polygon points="-8,-8 8,-8 10,0 8,8 -8,8 -10,0"
                 :fill="iconColor" opacity="0.9"/>
        <circle :r="4" :fill="backgroundColor" opacity="0.7"/>
        <rect x="-2" y="-2" width="4" height="4" :fill="iconColor"/>
      </g>

      <!-- VOBC 图标 -->
      <g v-else-if="node.type === 'VOBC'">
        <rect x="-12" y="-6" width="24" height="12" rx="6"
              :fill="iconColor" opacity="0.9"/>
        <circle cx="-6" cy="0" r="3" :fill="backgroundColor" opacity="0.8"/>
        <circle cx="6" cy="0" r="3" :fill="backgroundColor" opacity="0.8"/>
        <rect x="-2" y="-4" width="4" height="8" :fill="backgroundColor" opacity="0.6"/>
      </g>

      <!-- PU 图标 -->
      <g v-else-if="node.type === 'PU'">
        <rect x="-8" y="-8" width="16" height="16" rx="2"
              :fill="iconColor" opacity="0.9"/>
        <rect x="-6" y="-6" width="12" height="4" :fill="backgroundColor" opacity="0.7"/>
        <rect x="-6" y="-1" width="12" height="2" :fill="backgroundColor" opacity="0.7"/>
        <rect x="-6" y="2" width="12" height="4" :fill="backgroundColor" opacity="0.7"/>
      </g>

      <!-- CC 图标 -->
      <g v-else-if="node.type === 'CC'">
        <circle :r="8" :fill="iconColor" opacity="0.9"/>
        <path d="M -4,-4 L 4,-4 L 4,4 L -4,4 Z" :fill="backgroundColor" opacity="0.7"/>
        <circle cx="-2" cy="-2" r="1" :fill="iconColor"/>
        <circle cx="2" cy="-2" r="1" :fill="iconColor"/>
        <circle cx="0" cy="2" r="1" :fill="iconColor"/>
      </g>

      <!-- FTSM 图标 -->
      <g v-else-if="node.type === 'FTSM'">
        <polygon points="-6,-8 6,-8 8,-4 8,4 6,8 -6,8 -8,4 -8,-4"
                 :fill="iconColor" opacity="0.9"/>
        <text x="0" y="2" text-anchor="middle" :fill="backgroundColor"
              font-size="8" font-weight="bold">!</text>
      </g>

      <!-- GATEWAY 图标 -->
      <g v-else-if="node.type === 'GATEWAY'">
        <rect x="-10" y="-6" width="20" height="12" rx="2"
              :fill="iconColor" opacity="0.9"/>
        <rect x="-8" y="-2" width="6" height="4" :fill="backgroundColor" opacity="0.7"/>
        <rect x="2" y="-2" width="6" height="4" :fill="backgroundColor" opacity="0.7"/>
        <circle cx="0" cy="0" r="1" :fill="iconColor"/>
      </g>

      <!-- 其他设备类型的通用图标 -->
      <g v-else>
        <rect x="-8" y="-8" width="16" height="16" rx="2"
              :fill="iconColor" opacity="0.9"/>
        <text x="0" y="2" text-anchor="middle" :fill="backgroundColor"
              font-size="6" font-weight="bold">{{ node.type.charAt(0) }}</text>
      </g>
    </g>

    <!-- 节点标签 -->
    <text
        class="node-label"
        :x="0"
        :y="nodeRadius + 16"
        text-anchor="middle"
        :fill="labelColor"
        :font-size="labelFontSize"
        font-weight="500"
    >
      {{ node.label }}
    </text>

    <!-- 状态指示器 -->
    <circle
        v-if="showStatusIndicator"
        class="status-indicator"
        :cx="nodeRadius - 8"
        :cy="-nodeRadius + 8"
        r="4"
        :fill="statusIndicatorColor"
        :stroke="backgroundColor"
        stroke-width="1"
    />

    <!-- 告警指示器 -->
    <g v-if="hasAlerts" class="alert-indicator" :transform="`translate(${nodeRadius - 6}, ${-nodeRadius + 6})`">
      <circle r="6" fill="#E74C3C" opacity="0.9"/>
      <text x="0" y="2" text-anchor="middle" fill="white" font-size="8" font-weight="bold">!</text>

      <!-- 闪烁动画 -->
      <circle v-if="enablePulseAnimation" r="6" fill="none" stroke="#E74C3C" stroke-width="2" opacity="0.6">
        <animate attributeName="r" values="6;10;6" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite"/>
      </circle>
    </g>

    <!-- 选中指示器 -->
    <circle
        v-if="isSelected"
        class="selection-indicator"
        :r="nodeRadius + 4"
        fill="none"
        :stroke="selectionColor"
        stroke-width="2"
        stroke-dasharray="5,5"
        opacity="0.8"
    >
      <animateTransform
          attributeName="transform"
          type="rotate"
          values="0;360"
          dur="3s"
          repeatCount="indefinite"
      />
    </circle>

    <!-- 连接点 (用于手动连线) -->
    <g v-if="showConnectionPoints && (isSelected || isHovered)" class="connection-points">
      <circle
          v-for="(point, index) in connectionPoints"
          :key="index"
          class="connection-point"
          :cx="point.x"
          :cy="point.y"
          r="3"
          :fill="connectionPointColor"
          :stroke="backgroundColor"
          stroke-width="1"
          opacity="0.8"
      />
    </g>

    <!-- 拖拽手柄 (编辑模式) -->
    <circle
        v-if="enableDrag && isHovered"
        class="drag-handle"
        :r="nodeRadius + 2"
        fill="none"
        :stroke="dragHandleColor"
        stroke-width="1"
        stroke-dasharray="2,2"
        opacity="0.6"
        style="cursor: move"
    />
  </g>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useStatusColors } from '../../composables/useStatusColors'
import { useAlertsStore } from '../../stores/alerts'
import type { TopologyNode } from '../../types/topology'
import type { DeviceStatus } from '../../types/devices'

// ===== Props =====
interface Props {
  node: TopologyNode
  isSelected?: boolean
  isHovered?: boolean
  zoomLevel?: number
  showStatusIndicator?: boolean
  showConnectionPoints?: boolean
  enableDrag?: boolean
  enableGradient?: boolean
  enablePulseAnimation?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isSelected: false,
  isHovered: false,
  zoomLevel: 1,
  showStatusIndicator: true,
  showConnectionPoints: false,
  enableDrag: false,
  enableGradient: true,
  enablePulseAnimation: true
})

// ===== Emits =====
const emit = defineEmits<{
  click: [node: TopologyNode, event: MouseEvent]
  dblclick: [node: TopologyNode, event: MouseEvent]
  mouseenter: [node: TopologyNode]
  mouseleave: [node: TopologyNode]
  dragstart: [node: TopologyNode, event: MouseEvent]
  drag: [node: TopologyNode, event: MouseEvent]
  dragend: [node: TopologyNode, event: MouseEvent]
}>()

// ===== Composables =====
const {
  statusColors,
  getNodeColor,
  getDeviceIconColor,
  computeNodeDisplayColor
} = useStatusColors()
const alertsStore = useAlertsStore()

// ===== 计算属性 =====

// 节点样式类
const nodeClasses = computed(() => ({
  'node-selected': props.isSelected,
  'node-hovered': props.isHovered,
  'node-critical': props.node.status === 'critical',
  'node-warning': props.node.status === 'warning',
  'node-offline': props.node.status === 'offline',
  [`node-type-${props.node.type.toLowerCase()}`]: true
}))

// 节点半径
const nodeRadius = computed(() => {
  const baseRadius = Math.max(props.node.size.width, props.node.size.height) / 2
  let radius = baseRadius

  // 根据缩放级别调整大小
  if (props.zoomLevel < 0.5) {
    radius *= 1.5 // 缩放较小时放大节点
  } else if (props.zoomLevel > 2) {
    radius *= 0.8 // 缩放较大时缩小节点
  }

  // 选中或悬浮时略微放大
  if (props.isSelected) radius *= 1.1
  if (props.isHovered) radius *= 1.05

  return Math.max(radius, 15) // 最小半径
})

// 节点颜色
const nodeColors = computed(() => {
  return computeNodeDisplayColor(
      props.node.status,
      props.isSelected,
      props.isHovered,
      props.node.status === 'offline' ? 0.6 : 1
  )
})

// 图标颜色
const iconColor = computed(() =>
    getDeviceIconColor(props.node.type, props.node.status)
)

// 背景颜色
const backgroundColor = computed(() => '#0a192f')

// 标签颜色
const labelColor = computed(() => {
  if (props.isSelected) return '#64FFDA'
  if (props.isHovered) return '#A8B2D1'
  return '#8892B0'
})

// 标签字体大小
const labelFontSize = computed(() => {
  let size = 12
  if (props.zoomLevel < 0.5) size = 16
  else if (props.zoomLevel > 2) size = 10
  return size
})

// 边框宽度
const strokeWidth = computed(() => {
  if (props.isSelected) return 3
  if (props.isHovered) return 2
  return 1
})

// 节点透明度
const nodeOpacity = computed(() => {
  if (props.node.status === 'offline') return 0.6
  return 1
})

// 图标缩放
const iconScale = computed(() => {
  let scale = 1
  if (props.zoomLevel < 0.5) scale = 1.5
  else if (props.zoomLevel > 2) scale = 0.8
  return scale
})

// 滤镜效果
const nodeFilter = computed(() => {
  if (props.node.status === 'critical') return 'url(#glowCritical)'
  if (props.isSelected || props.isHovered) return 'url(#glowNormal)'
  return 'none'
})

// 渐变URL
const gradientUrl = computed(() => {
  const status = props.node.status
  return `url(#nodeGradient${status.charAt(0).toUpperCase() + status.slice(1)})`
})

// 状态指示器颜色
const statusIndicatorColor = computed(() => getNodeColor(props.node.status))

// 选中指示器颜色
const selectionColor = computed(() => '#64FFDA')

// 连接点颜色
const connectionPointColor = computed(() => '#3B82F6')

// 拖拽手柄颜色
const dragHandleColor = computed(() => '#64FFDA')

// 连接点位置
const connectionPoints = computed(() => {
  const radius = nodeRadius.value + 6
  return [
    { x: 0, y: -radius },      // 上
    { x: radius, y: 0 },       // 右
    { x: 0, y: radius },       // 下
    { x: -radius, y: 0 }       // 左
  ]
})

// 是否有告警
const hasAlerts = computed(() => {
  return alertsStore.getAlertsByDevice(props.node.id).length > 0
})

// ===== 事件处理 =====

function handleClick(event: MouseEvent): void {
  event.stopPropagation()
  emit('click', props.node, event)
}

function handleDoubleClick(event: MouseEvent): void {
  event.stopPropagation()
  emit('dblclick', props.node, event)
}

function handleMouseEnter(): void {
  emit('mouseenter', props.node)
}

function handleMouseLeave(): void {
  emit('mouseleave', props.node)
}

// 拖拽相关 (如果启用)
let isDragging = false
let dragStartPos = { x: 0, y: 0 }

function handleMouseDown(event: MouseEvent): void {
  if (!props.enableDrag) return

  isDragging = true
  dragStartPos = { x: event.clientX, y: event.clientY }

  emit('dragstart', props.node, event)

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

function handleMouseMove(event: MouseEvent): void {
  if (!isDragging) return

  emit('drag', props.node, event)
}

function handleMouseUp(event: MouseEvent): void {
  if (!isDragging) return

  isDragging = false
  emit('dragend', props.node, event)

  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
}
</script>

<style scoped>
.network-node {
  cursor: pointer;
  transition: all 0.2s ease;
}

.network-node:hover {
  transform: scale(1.05);
}

.node-selected {
  transform: scale(1.1) !important;
}

.node-background {
  transition: all 0.3s ease;
}

.node-gradient {
  pointer-events: none;
}

.node-icon {
  pointer-events: none;
  transition: transform 0.2s ease;
}

.node-label {
  pointer-events: none;
  transition: all 0.2s ease;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.status-indicator {
  pointer-events: none;
}

.alert-indicator {
  pointer-events: none;
}

.selection-indicator {
  pointer-events: none;
}

.connection-points {
  pointer-events: none;
}

.connection-point {
  cursor: crosshair;
  transition: all 0.2s ease;
}

.connection-point:hover {
  transform: scale(1.2);
}

.drag-handle {
  pointer-events: none;
}

/* 节点类型特定样式 */
.node-type-dsu .node-background {
  stroke-dasharray: none;
}

.node-type-zc .node-background {
  stroke-dasharray: none;
}

.node-type-ats .node-background {
  stroke-dasharray: none;
}

.node-type-ci .node-background {
  stroke-dasharray: 3,3;
}

.node-type-vobc .node-background {
  stroke-dasharray: 5,2;
}

/* 状态特定样式 */
.node-critical .node-background {
  animation: pulse-critical 2s infinite;
}

.node-warning .node-background {
  animation: pulse-warning 3s infinite;
}

.node-offline .node-background {
  opacity: 0.5;
  stroke-dasharray: 5,5;
}

@keyframes pulse-critical {
  0%, 100% {
    filter: drop-shadow(0 0 5px #E74C3C);
  }
  50% {
    filter: drop-shadow(0 0 15px #E74C3C);
  }
}

@keyframes pulse-warning {
  0%, 100% {
    filter: drop-shadow(0 0 3px #F39C12);
  }
  50% {
    filter: drop-shadow(0 0 10px #F39C12);
  }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .node-label {
    font-size: 10px;
  }
}
</style>