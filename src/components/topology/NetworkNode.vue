<!-- src/components/topology/NetworkNode.vue -->
<template>
  <g
      class="network-node"
      :class="[
      `node-type-${node.type.toLowerCase()}`,
      `node-status-${node.status}`,
      {
        'node-selected': isSelected,
        'node-hovered': isHovered,
        'node-dragging': isDragging
      }
    ]"
      :transform="`translate(${node.position.x}, ${node.position.y})`"
      @click="handleClick"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
      @mousedown="handleMouseDown"
  >
    <!-- 节点背景与边框 -->
    <rect
        class="node-background"
        :x="-node.size.width / 2"
        :y="-node.size.height / 2"
        :width="node.size.width"
        :height="node.size.height"
        :rx="8"
        :ry="8"
        :fill="nodeBackgroundColor"
        :stroke="nodeStrokeColor"
        :stroke-width="strokeWidth"
        :filter="glowFilter"
    />

    <!-- 渐变背景 -->
    <defs v-if="enableGlow">
      <radialGradient :id="`node-gradient-${node.id}`" cx="50%" cy="30%" r="70%">
        <stop offset="0%" :style="`stop-color:${nodeBackgroundColor};stop-opacity:0.8`" />
        <stop offset="70%" :style="`stop-color:${nodeBackgroundColor};stop-opacity:0.4`" />
        <stop offset="100%" :style="`stop-color:${nodeBackgroundColor};stop-opacity:0.1`" />
      </radialGradient>
    </defs>

    <rect
        v-if="enableGlow"
        class="node-gradient"
        :x="-node.size.width / 2"
        :y="-node.size.height / 2"
        :width="node.size.width"
        :height="node.size.height"
        :rx="8"
        :ry="8"
        :fill="`url(#node-gradient-${node.id})`"
    />

    <!-- 设备图标 -->
    <g class="node-icon" :transform="`translate(0, -${iconOffset})`">
      <component
          :is="deviceIcon"
          :size="iconSize"
          :color="iconColor"
          :status="node.status"
      />
    </g>

    <!-- 节点标签 -->
    <text
        class="node-label"
        :x="0"
        :y="labelOffset"
        text-anchor="middle"
        dominant-baseline="middle"
        :font-size="labelFontSize"
        :fill="labelColor"
    >
      {{ node.label }}
    </text>

    <!-- 状态指示器 -->
    <circle
        class="status-indicator"
        :cx="node.size.width / 2 - 8"
        :cy="-node.size.height / 2 + 8"
        :r="6"
        :fill="statusIndicatorColor"
        :stroke="statusIndicatorStroke"
        :stroke-width="2"
    >
      <animate
          v-if="node.status === 'critical'"
          attributeName="r"
          values="6;8;6"
          dur="1.5s"
          repeatCount="indefinite"
      />
    </circle>

    <!-- 告警指示器 -->
    <g v-if="hasAlerts" class="alert-indicator" :transform="`translate(${-node.size.width / 2 + 8}, ${-node.size.height / 2 + 8})`">
      <circle
          r="8"
          fill="#E74C3C"
          stroke="#FFFFFF"
          stroke-width="2"
      >
        <animate
            attributeName="opacity"
            values="0.5;1;0.5"
            dur="1s"
            repeatCount="indefinite"
        />
      </circle>
      <text
          x="0"
          y="0"
          text-anchor="middle"
          dominant-baseline="middle"
          font-size="10"
          fill="white"
          font-weight="bold"
      >
        !
      </text>
    </g>

    <!-- 选中指示器 -->
    <rect
        v-if="isSelected"
        class="selection-indicator"
        :x="-node.size.width / 2 - 4"
        :y="-node.size.height / 2 - 4"
        :width="node.size.width + 8"
        :height="node.size.height + 8"
        :rx="12"
        :ry="12"
        fill="none"
        stroke="rgba(100, 255, 218, 0.8)"
        stroke-width="3"
        stroke-dasharray="8,4"
    >
      <animate
          attributeName="stroke-dashoffset"
          values="0;12"
          dur="1s"
          repeatCount="indefinite"
      />
    </rect>

    <!-- 连接点 -->
    <g v-if="showConnectionPoints" class="connection-points">
      <circle
          v-for="(point, index) in connectionPoints"
          :key="`connection-${index}`"
          class="connection-point"
          :cx="point.x"
          :cy="point.y"
          r="4"
          fill="rgba(100, 255, 218, 0.3)"
          stroke="rgba(100, 255, 218, 0.8)"
          stroke-width="2"
          opacity="0"
      >
        <animate
            attributeName="opacity"
            values="0;1;0"
            dur="2s"
            repeatCount="indefinite"
            :begin="`${index * 0.2}s`"
        />
      </circle>
    </g>

    <!-- 拖拽手柄 -->
    <circle
        v-if="enableDrag && (isSelected || isHovered)"
        class="drag-handle"
        :cx="node.size.width / 2 - 4"
        :cy="node.size.height / 2 - 4"
        r="6"
        fill="rgba(100, 255, 218, 0.8)"
        stroke="rgba(100, 255, 218, 1)"
        stroke-width="2"
        cursor="move"
        opacity="0.7"
    />

    <!-- 加载状态指示器 -->
    <g v-if="isLoading" class="loading-indicator">
      <circle
          :cx="0"
          :cy="0"
          :r="node.size.width / 2 + 10"
          fill="none"
          stroke="rgba(100, 255, 218, 0.5)"
          stroke-width="2"
          stroke-dasharray="20,5"
      >
        <animateTransform
            attributeName="transform"
            type="rotate"
            values="0;360"
            dur="2s"
            repeatCount="indefinite"
        />
      </circle>
    </g>
  </g>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useStatusColors } from '../../composables/useStatusColors'
import type { TopologyNode, Position } from '../../types/topology'
import type { DeviceType, DeviceStatus } from '../../types/devices'

// 设备图标组件导入
import DSUIcon from '../icons/DSUIcon.vue'
import ZCIcon from '../icons/ZCIcon.vue'
import ATSIcon from '../icons/ATSIcon.vue'
import CIIcon from '../icons/CIIcon.vue'
import VOBCIcon from '../icons/VOBCIcon.vue'
import PUIcon from '../icons/PUIcon.vue'
import CCIcon from '../icons/CCIcon.vue'
import FTSMIcon from '../icons/FTSMIcon.vue'
import GatewayIcon from '../icons/GatewayIcon.vue'
import TimetableIcon from '../icons/TimetableIcon.vue'
import DispatchIcon from '../icons/DispatchIcon.vue'
import APPIcon from '../icons/APPIcon.vue'
import DBIcon from '../icons/DBIcon.vue'

// Props定义
interface Props {
  node: TopologyNode
  isSelected?: boolean
  isHovered?: boolean
  enableGlow?: boolean
  enableDrag?: boolean
  showConnectionPoints?: boolean
  isLoading?: boolean
  hasAlerts?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isSelected: false,
  isHovered: false,
  enableGlow: true,
  enableDrag: true,
  showConnectionPoints: false,
  isLoading: false,
  hasAlerts: false
})

// Events定义
const emit = defineEmits<{
  'click': [node: TopologyNode, event: MouseEvent]
  'mouseenter': [node: TopologyNode, event: MouseEvent]
  'mouseleave': [node: TopologyNode, event: MouseEvent]
  'drag-start': [nodeId: string, event: MouseEvent]
  'drag': [nodeId: string, position: Position]
  'drag-end': [nodeId: string, position: Position]
}>()

// 组合式函数
const { getStatusColor, getStatusStrokeColor } = useStatusColors()

// 本地状态
const isDragging = ref(false)
const dragStartPosition = ref<Position>({ x: 0, y: 0 })

// 设备图标映射
const deviceIconMap = {
  DSU: DSUIcon,
  ZC: ZCIcon,
  ATS: ATSIcon,
  CI: CIIcon,
  VOBC: VOBCIcon,
  PU: PUIcon,
  CC: CCIcon,
  FTSM: FTSMIcon,
  GATEWAY: GatewayIcon,
  TIMETABLE: TimetableIcon,
  DISPATCH: DispatchIcon,
  APP: APPIcon,
  DB: DBIcon
}

// 计算属性
const deviceIcon = computed(() => {
  return deviceIconMap[props.node.type] || DSUIcon
})

const iconSize = computed(() => {
  const baseSize = Math.min(props.node.size.width, props.node.size.height)
  return Math.max(16, baseSize * 0.4)
})

const iconOffset = computed(() => {
  return Math.max(4, iconSize.value * 0.15)
})

const labelOffset = computed(() => {
  return props.node.size.height / 2 - 8
})

const labelFontSize = computed(() => {
  return Math.max(10, Math.min(14, props.node.size.width * 0.15))
})

const strokeWidth = computed(() => {
  if (props.isSelected) return 3
  if (props.isHovered) return 2.5
  return 2
})

const nodeBackgroundColor = computed(() => {
  const baseColor = '#1A202C'
  if (props.isSelected) return '#2D3748'
  if (props.isHovered) return '#374151'
  return baseColor
})

const nodeStrokeColor = computed(() => {
  return getStatusStrokeColor(props.node.status)
})

const iconColor = computed(() => {
  return getStatusColor(props.node.status)
})

const labelColor = computed(() => {
  if (props.node.status === 'offline') return '#6B7280'
  return '#E5E7EB'
})

const statusIndicatorColor = computed(() => {
  return getStatusColor(props.node.status)
})

const statusIndicatorStroke = computed(() => {
  return props.node.status === 'critical' ? '#FFFFFF' : 'none'
})

const glowFilter = computed(() => {
  if (!props.enableGlow) return 'none'

  switch (props.node.status) {
    case 'critical':
      return 'url(#node-glow-critical)'
    case 'warning':
      return 'url(#node-glow-warning)'
    case 'normal':
      return 'url(#node-glow-normal)'
    default:
      return 'none'
  }
})

const connectionPoints = computed(() => {
  if (!props.showConnectionPoints) return []

  const { width, height } = props.node.size
  const halfWidth = width / 2
  const halfHeight = height / 2

  return [
    { x: 0, y: -halfHeight },      // 上
    { x: halfWidth, y: 0 },        // 右
    { x: 0, y: halfHeight },       // 下
    { x: -halfWidth, y: 0 }        // 左
  ]
})

// 事件处理
function handleClick(event: MouseEvent) {
  event.stopPropagation()
  emit('click', props.node, event)
}

function handleMouseEnter(event: MouseEvent) {
  emit('mouseenter', props.node, event)
}

function handleMouseLeave(event: MouseEvent) {
  emit('mouseleave', props.node, event)
}

function handleMouseDown(event: MouseEvent) {
  if (!props.enableDrag || event.button !== 0) return

  event.stopPropagation()
  event.preventDefault()

  isDragging.value = true
  dragStartPosition.value = {
    x: event.clientX - props.node.position.x,
    y: event.clientY - props.node.position.y
  }

  emit('drag-start', props.node.id, event)

  // 添加全局事件监听器
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

function handleMouseMove(event: MouseEvent) {
  if (!isDragging.value) return

  const newPosition = {
    x: event.clientX - dragStartPosition.value.x,
    y: event.clientY - dragStartPosition.value.y
  }

  emit('drag', props.node.id, newPosition)
}

function handleMouseUp(event: MouseEvent) {
  if (!isDragging.value) return

  isDragging.value = false

  const finalPosition = {
    x: event.clientX - dragStartPosition.value.x,
    y: event.clientY - dragStartPosition.value.y
  }

  emit('drag-end', props.node.id, finalPosition)

  // 移除全局事件监听器
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
}

// 生命周期
onUnmounted(() => {
  // 清理事件监听器
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
})
</script>

<style scoped>
.network-node {
  cursor: pointer;
  transition: all 0.3s ease;
}

.network-node:hover {
  transform-origin: center;
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
  font-weight: 500;
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
  cursor: move;
  transition: all 0.2s ease;
}

.drag-handle:hover {
  transform: scale(1.2);
  opacity: 1 !important;
}

.loading-indicator {
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

/* 子系统内部设备样式 */
.node-type-pu .node-background,
.node-type-cc .node-background,
.node-type-ftsm .node-background {
  stroke-dasharray: 2,2;
}

.node-type-gateway .node-background,
.node-type-timetable .node-background,
.node-type-dispatch .node-background,
.node-type-app .node-background,
.node-type-db .node-background {
  stroke-dasharray: 4,2;
}

/* 状态特定样式 */
.node-status-critical .node-background {
  animation: pulse-critical 2s infinite;
}

.node-status-warning .node-background {
  animation: pulse-warning 3s infinite;
}

.node-status-offline .node-background {
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

/* 交互状态样式 */
.node-hovered {
  transform: scale(1.05);
}

.node-selected {
  transform: scale(1.02);
}

.node-dragging {
  transform: scale(1.08);
  opacity: 0.8;
  z-index: 1000;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .node-label {
    font-size: 10px;
  }

  .connection-point {
    r: 3;
  }

  .drag-handle {
    r: 5;
  }
}

/* 无障碍支持 */
@media (prefers-reduced-motion: reduce) {
  .network-node,
  .node-background,
  .node-icon,
  .node-label,
  .drag-handle {
    transition: none;
  }

  .node-status-critical .node-background,
  .node-status-warning .node-background {
    animation: none;
  }

  .status-indicator animate,
  .alert-indicator circle animate,
  .selection-indicator animate,
  .connection-point animate,
  .loading-indicator animateTransform {
    animation-duration: 0s;
  }
}
</style><!-- src/components/topology/NetworkNode.vue -->
<template>
  <g
      class="network-node"
      :class="[
      `node-type-${node.type.toLowerCase()}`,
      `node-status-${node.status}`,
      {
        'node-selected': isSelected,
        'node-hovered': isHovered,
        'node-dragging': isDragging
      }
    ]"
      :transform="`translate(${node.position.x}, ${node.position.y})`"
      @click="handleClick"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
      @mousedown="handleMouseDown"
  >
    <!-- 节点背景与边框 -->
    <rect
        class="node-background"
        :x="-node.size.width / 2"
        :y="-node.size.height / 2"
        :width="node.size.width"
        :height="node.size.height"
        :rx="8"
        :ry="8"
        :fill="nodeBackgroundColor"
        :stroke="nodeStrokeColor"
        :stroke-width="strokeWidth"
        :filter="glowFilter"
    />

    <!-- 渐变背景 -->
    <defs v-if="enableGlow">
      <radialGradient :id="`node-gradient-${node.id}`" cx="50%" cy="30%" r="70%">
        <stop offset="0%" :style="`stop-color:${nodeBackgroundColor};stop-opacity:0.8`" />
        <stop offset="70%" :style="`stop-color:${nodeBackgroundColor};stop-opacity:0.4`" />
        <stop offset="100%" :style="`stop-color:${nodeBackgroundColor};stop-opacity:0.1`" />
      </radialGradient>
    </defs>

    <rect
        v-if="enableGlow"
        class="node-gradient"
        :x="-node.size.width / 2"
        :y="-node.size.height / 2"
        :width="node.size.width"
        :height="node.size.height"
        :rx="8"
        :ry="8"
        :fill="`url(#node-gradient-${node.id})`"
    />

    <!-- 设备图标 -->
    <g class="node-icon" :transform="`translate(0, -${iconOffset})`">
      <component
          :is="deviceIcon"
          :size="iconSize"
          :color="iconColor"
          :status="node.status"
      />
    </g>

    <!-- 节点标签 -->
    <text
        class="node-label"
        :x="0"
        :y="labelOffset"
        text-anchor="middle"
        dominant-baseline="middle"
        :font-size="labelFontSize"
        :fill="labelColor"
    >
      {{ node.label }}
    </text>

    <!-- 状态指示器 -->
    <circle
        class="status-indicator"
        :cx="node.size.width / 2 - 8"
        :cy="-node.size.height / 2 + 8"
        :r="6"
        :fill="statusIndicatorColor"
        :stroke="statusIndicatorStroke"
        :stroke-width="2"
    >
      <animate
          v-if="node.status === 'critical'"
          attributeName="r"
          values="6;8;6"
          dur="1.5s"
          repeatCount="indefinite"
      />
    </circle>

    <!-- 告警指示器 -->
    <g v-if="hasAlerts" class="alert-indicator" :transform="`translate(${-node.size.width / 2 + 8}, ${-node.size.height / 2 + 8})`">
      <circle
          r="8"
          fill="#E74C3C"
          stroke="#FFFFFF"
          stroke-width="2"
      >
        <animate
            attributeName="opacity"
            values="0.5;1;0.5"
            dur="1s"
            repeatCount="indefinite"
        />
      </circle>
      <text
          x="0"
          y="0"
          text-anchor="middle"
          dominant-baseline="middle"
          font-size="10"
          fill="white"
          font-weight="bold"
      >
        !
      </text>
    </g>

    <!-- 选中指示器 -->
    <rect
        v-if="isSelected"
        class="selection-indicator"
        :x="-node.size.width / 2 - 4"
        :y="-node.size.height / 2 - 4"
        :width="node.size.width + 8"
        :height="node.size.height + 8"
        :rx="12"
        :ry="12"
        fill="none"
        stroke="rgba(100, 255, 218, 0.8)"
        stroke-width="3"
        stroke-dasharray="8,4"
    >
      <animate
          attributeName="stroke-dashoffset"
          values="0;12"
          dur="1s"
          repeatCount="indefinite"
      />
    </rect>

    <!-- 连接点 -->
    <g v-if="showConnectionPoints" class="connection-points">
      <circle
          v-for="(point, index) in connectionPoints"
          :key="`connection-${index}`"
          class="connection-point"
          :cx="point.x"
          :cy="point.y"
          r="4"
          fill="rgba(100, 255, 218, 0.3)"
          stroke="rgba(100, 255, 218, 0.8)"
          stroke-width="2"
          opacity="0"
      >
        <animate
            attributeName="opacity"
            values="0;1;0"
            dur="2s"
            repeatCount="indefinite"
            :begin="`${index * 0.2}s`"
        />
      </circle>
    </g>

    <!-- 拖拽手柄 -->
    <circle
        v-if="enableDrag && (isSelected || isHovered)"
        class="drag-handle"
        :cx="node.size.width / 2 - 4"
        :cy="node.size.height / 2 - 4"
        r="6"
        fill="rgba(100, 255, 218, 0.8)"
        stroke="rgba(100, 255, 218, 1)"
        stroke-width="2"
        cursor="move"
        opacity="0.7"
    />

    <!-- 加载状态指示器 -->
    <g v-if="isLoading" class="loading-indicator">
      <circle
          :cx="0"
          :cy="0"
          :r="node.size.width / 2 + 10"
          fill="none"
          stroke="rgba(100, 255, 218, 0.5)"
          stroke-width="2"
          stroke-dasharray="20,5"
      >
        <animateTransform
            attributeName="transform"
            type="rotate"
            values="0;360"
            dur="2s"
            repeatCount="indefinite"
        />
      </circle>
    </g>
  </g>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useStatusColors } from '../../composables/useStatusColors'
import type { TopologyNode, Position } from '../../types/topology'
import type { DeviceType, DeviceStatus } from '../../types/devices'

// 设备图标组件导入
import DSUIcon from '../icons/DSUIcon.vue'
import ZCIcon from '../icons/ZCIcon.vue'
import ATSIcon from '../icons/ATSIcon.vue'
import CIIcon from '../icons/CIIcon.vue'
import VOBCIcon from '../icons/VOBCIcon.vue'
import PUIcon from '../icons/PUIcon.vue'
import CCIcon from '../icons/CCIcon.vue'
import FTSMIcon from '../icons/FTSMIcon.vue'
import GatewayIcon from '../icons/GatewayIcon.vue'
import TimetableIcon from '../icons/TimetableIcon.vue'
import DispatchIcon from '../icons/DispatchIcon.vue'
import APPIcon from '../icons/APPIcon.vue'
import DBIcon from '../icons/DBIcon.vue'

// Props定义
interface Props {
  node: TopologyNode
  isSelected?: boolean
  isHovered?: boolean
  enableGlow?: boolean
  enableDrag?: boolean
  showConnectionPoints?: boolean
  isLoading?: boolean
  hasAlerts?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isSelected: false,
  isHovered: false,
  enableGlow: true,
  enableDrag: true,
  showConnectionPoints: false,
  isLoading: false,
  hasAlerts: false
})

// Events定义
const emit = defineEmits<{
  'click': [node: TopologyNode, event: MouseEvent]
  'mouseenter': [node: TopologyNode, event: MouseEvent]
  'mouseleave': [node: TopologyNode, event: MouseEvent]
  'drag-start': [nodeId: string, event: MouseEvent]
  'drag': [nodeId: string, position: Position]
  'drag-end': [nodeId: string, position: Position]
}>()

// 组合式函数
const { getStatusColor, getStatusStrokeColor } = useStatusColors()

// 本地状态
const isDragging = ref(false)
const dragStartPosition = ref<Position>({ x: 0, y: 0 })

// 设备图标映射
const deviceIconMap = {
  DSU: DSUIcon,
  ZC: ZCIcon,
  ATS: ATSIcon,
  CI: CIIcon,
  VOBC: VOBCIcon,
  PU: PUIcon,
  CC: CCIcon,
  FTSM: FTSMIcon,
  GATEWAY: GatewayIcon,
  TIMETABLE: TimetableIcon,
  DISPATCH: DispatchIcon,
  APP: APPIcon,
  DB: DBIcon
}

// 计算属性
const deviceIcon = computed(() => {
  return deviceIconMap[props.node.type] || DSUIcon
})

const iconSize = computed(() => {
  const baseSize = Math.min(props.node.size.width, props.node.size.height)
  return Math.max(16, baseSize * 0.4)
})

const iconOffset = computed(() => {
  return Math.max(4, iconSize.value * 0.15)
})

const labelOffset = computed(() => {
  return props.node.size.height / 2 - 8
})

const labelFontSize = computed(() => {
  return Math.max(10, Math.min(14, props.node.size.width * 0.15))
})

const strokeWidth = computed(() => {
  if (props.isSelected) return 3
  if (props.isHovered) return 2.5
  return 2
})

const nodeBackgroundColor = computed(() => {
  const baseColor = '#1A202C'
  if (props.isSelected) return '#2D3748'
  if (props.isHovered) return '#374151'
  return baseColor
})

const nodeStrokeColor = computed(() => {
  return getStatusStrokeColor(props.node.status)
})

const iconColor = computed(() => {
  return getStatusColor(props.node.status)
})

const labelColor = computed(() => {
  if (props.node.status === 'offline') return '#6B7280'
  return '#E5E7EB'
})

const statusIndicatorColor = computed(() => {
  return getStatusColor(props.node.status)
})

const statusIndicatorStroke = computed(() => {
  return props.node.status === 'critical' ? '#FFFFFF' : 'none'
})

const glowFilter = computed(() => {
  if (!props.enableGlow) return 'none'

  switch (props.node.status) {
    case 'critical':
      return 'url(#node-glow-critical)'
    case 'warning':
      return 'url(#node-glow-warning)'
    case 'normal':
      return 'url(#node-glow-normal)'
    default:
      return 'none'
  }
})

const connectionPoints = computed(() => {
  if (!props.showConnectionPoints) return []

  const { width, height } = props.node.size
  const halfWidth = width / 2
  const halfHeight = height / 2

  return [
    { x: 0, y: -halfHeight },      // 上
    { x: halfWidth, y: 0 },        // 右
    { x: 0, y: halfHeight },       // 下
    { x: -halfWidth, y: 0 }        // 左
  ]
})

// 事件处理
function handleClick(event: MouseEvent) {
  event.stopPropagation()
  emit('click', props.node, event)
}

function handleMouseEnter(event: MouseEvent) {
  emit('mouseenter', props.node, event)
}

function handleMouseLeave(event: MouseEvent) {
  emit('mouseleave', props.node, event)
}

function handleMouseDown(event: MouseEvent) {
  if (!props.enableDrag || event.button !== 0) return

  event.stopPropagation()
  event.preventDefault()

  isDragging.value = true
  dragStartPosition.value = {
    x: event.clientX - props.node.position.x,
    y: event.clientY - props.node.position.y
  }

  emit('drag-start', props.node.id, event)

  // 添加全局事件监听器
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

function handleMouseMove(event: MouseEvent) {
  if (!isDragging.value) return

  const newPosition = {
    x: event.clientX - dragStartPosition.value.x,
    y: event.clientY - dragStartPosition.value.y
  }

  emit('drag', props.node.id, newPosition)
}

function handleMouseUp(event: MouseEvent) {
  if (!isDragging.value) return

  isDragging.value = false

  const finalPosition = {
    x: event.clientX - dragStartPosition.value.x,
    y: event.clientY - dragStartPosition.value.y
  }

  emit('drag-end', props.node.id, finalPosition)

  // 移除全局事件监听器
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
}

// 生命周期
onUnmounted(() => {
  // 清理事件监听器
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
})
</script>

<style scoped>
.network-node {
  cursor: pointer;
  transition: all 0.3s ease;
}

.network-node:hover {
  transform-origin: center;
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
  font-weight: 500;
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
  cursor: move;
  transition: all 0.2s ease;
}

.drag-handle:hover {
  transform: scale(1.2);
  opacity: 1 !important;
}

.loading-indicator {
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

/* 子系统内部设备样式 */
.node-type-pu .node-background,
.node-type-cc .node-background,
.node-type-ftsm .node-background {
  stroke-dasharray: 2,2;
}

.node-type-gateway .node-background,
.node-type-timetable .node-background,
.node-type-dispatch .node-background,
.node-type-app .node-background,
.node-type-db .node-background {
  stroke-dasharray: 4,2;
}

/* 状态特定样式 */
.node-status-critical .node-background {
  animation: pulse-critical 2s infinite;
}

.node-status-warning .node-background {
  animation: pulse-warning 3s infinite;
}

.node-status-offline .node-background {
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

/* 交互状态样式 */
.node-hovered {
  transform: scale(1.05);
}

.node-selected {
  transform: scale(1.02);
}

.node-dragging {
  transform: scale(1.08);
  opacity: 0.8;
  z-index: 1000;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .node-label {
    font-size: 10px;
  }

  .connection-point {
    r: 3;
  }

  .drag-handle {
    r: 5;
  }
}

/* 无障碍支持 */
@media (prefers-reduced-motion: reduce) {
  .network-node,
  .node-background,
  .node-icon,
  .node-label,
  .drag-handle {
    transition: none;
  }

  .node-status-critical .node-background,
  .node-status-warning .node-background {
    animation: none;
  }

  .status-indicator animate,
  .alert-indicator circle animate,
  .selection-indicator animate,
  .connection-point animate,
  .loading-indicator animateTransform {
    animation-duration: 0s;
  }
}
</style>