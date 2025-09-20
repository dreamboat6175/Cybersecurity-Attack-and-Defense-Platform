<!-- src/components/topology/TopologyCanvas.vue -->
<template>
  <div class="topology-canvas" ref="canvasContainer">
    <!-- SVG画布 -->
    <svg
        ref="svgCanvas"
        class="canvas-svg"
        :width="canvasWidth"
        :height="canvasHeight"
        :viewBox="`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`"
        @click="handleCanvasClick"
        @wheel.prevent="handleWheel"
        @mousedown="handleMouseDown"
        @mousemove="handleMouseMove"
        @mouseup="handleMouseUp"
        @mouseleave="handleMouseLeave"
    >
      <!-- 定义渐变和滤镜 -->
      <defs>
        <!-- 节点辉光效果 -->
        <filter id="node-glow-normal" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>

        <filter id="node-glow-warning" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>

        <filter id="node-glow-critical" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>

        <!-- 网络链路渐变 -->
        <linearGradient id="a-network-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#64FFDA;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#64FFDA;stop-opacity:0.8" />
          <stop offset="100%" style="stop-color:#64FFDA;stop-opacity:1" />
        </linearGradient>

        <linearGradient id="b-network-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#FF2DF7;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#FF2DF7;stop-opacity:0.8" />
          <stop offset="100%" style="stop-color:#FF2DF7;stop-opacity:1" />
        </linearGradient>

        <!-- 数据流动画标记 -->
        <marker id="flow-marker-a" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
          <circle cx="4" cy="4" r="2" fill="#64FFDA" opacity="0.8">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite"/>
          </circle>
        </marker>

        <marker id="flow-marker-b" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
          <circle cx="4" cy="4" r="2" fill="#FF2DF7" opacity="0.8">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite"/>
          </circle>
        </marker>
      </defs>

      <!-- 网格背景 -->
      <g v-if="showGrid" class="grid-layer">
        <defs>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(100,255,218,0.1)" stroke-width="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </g>

      <!-- 链路层 -->
      <g class="links-layer">
        <NetworkLink
            v-for="link in visibleLinks"
            :key="link.id"
            :link="link"
            :source-node="getNodeById(link.source)"
            :target-node="getNodeById(link.target)"
            :show-data-flow="enableFlowAnimation && link.status === 'active'"
            :show-network-colors="showNetworkColors"
            :is-hovered="hoveredElementId === link.id"
            :is-selected="selectedElementId === link.id"
            @click="handleLinkClick"
            @mouseenter="handleLinkHover"
            @mouseleave="handleLinkLeave"
        />
      </g>

      <!-- 节点层 -->
      <g class="nodes-layer">
        <NetworkNode
            v-for="node in visibleNodes"
            :key="node.id"
            :node="node"
            :is-selected="selectedElementId === node.id"
            :is-hovered="hoveredElementId === node.id"
            :enable-glow="enableGlowEffect"
            :enable-drag="enableNodeDrag"
            @click="handleNodeClick"
            @mouseenter="handleNodeHover"
            @mouseleave="handleNodeLeave"
            @drag-start="handleNodeDragStart"
            @drag="handleNodeDrag"
            @drag-end="handleNodeDragEnd"
        />
      </g>

      <!-- 选择框 -->
      <rect
          v-if="selectionBox.isActive"
          :x="Math.min(selectionBox.start.x, selectionBox.end.x)"
          :y="Math.min(selectionBox.start.y, selectionBox.end.y)"
          :width="Math.abs(selectionBox.end.x - selectionBox.start.x)"
          :height="Math.abs(selectionBox.end.y - selectionBox.start.y)"
          class="selection-box"
          fill="rgba(100, 255, 218, 0.1)"
          stroke="rgba(100, 255, 218, 0.5)"
          stroke-width="2"
          stroke-dasharray="5,5"
      />

      <!-- 动画层：数据流粒子效果 -->
      <g v-if="enableFlowAnimation" class="flow-particles-layer">
        <circle
            v-for="particle in flowParticles"
            :key="particle.id"
            :cx="particle.x"
            :cy="particle.y"
            :r="particle.size"
            :fill="particle.color"
            :opacity="particle.opacity"
            class="flow-particle"
        />
      </g>
    </svg>

    <!-- 加载指示器 -->
    <div v-if="isLoading" class="canvas-loading">
      <LoadingSpinner size="medium" variant="network" />
    </div>

    <!-- 画布控制器 -->
    <div class="canvas-controls">
      <!-- 缩放控制 -->
      <div class="zoom-controls">
        <button @click="zoomIn" class="zoom-btn" title="放大">+</button>
        <span class="zoom-level">{{ Math.round(currentZoom * 100) }}%</span>
        <button @click="zoomOut" class="zoom-btn" title="缩小">−</button>
      </div>

      <!-- 视图控制 -->
      <div class="view-controls">
        <button @click="fitToView" class="control-btn" title="适应窗口">
          📐
        </button>
        <button @click="centerView" class="control-btn" title="居中视图">
          🎯
        </button>
        <button @click="toggleGrid" class="control-btn" :class="{ active: showGrid }" title="显示网格">
          ⚏
        </button>
      </div>

      <!-- 布局控制 -->
      <div class="layout-controls">
        <button @click="applyHierarchicalLayout" class="control-btn"
                :class="{ active: layoutType === 'hierarchical' }" title="分层布局">
          📊
        </button>
        <button @click="applyForceLayout" class="control-btn"
                :class="{ active: layoutType === 'force' }" title="力导向布局">
          🌐
        </button>
      </div>
    </div>

    <!-- 小地图 -->
    <div v-if="showMinimap" class="minimap">
      <svg class="minimap-svg" :width="minimapWidth" :height="minimapHeight" :viewBox="minimapViewBox">
        <!-- 小地图中的节点 -->
        <circle
            v-for="node in visibleNodes"
            :key="`mini-${node.id}`"
            :cx="node.position.x / minimapScale"
            :cy="node.position.y / minimapScale"
            :r="3"
            :fill="getStatusColor(node.status)"
            opacity="0.8"
        />

        <!-- 当前视口指示器 -->
        <rect
            :x="viewBox.x / minimapScale"
            :y="viewBox.y / minimapScale"
            :width="viewBox.width / minimapScale"
            :height="viewBox.height / minimapScale"
            fill="none"
            stroke="rgba(100, 255, 218, 0.8)"
            stroke-width="2"
            class="viewport-indicator"
        />
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useStatusColors } from '../../composables/useStatusColors'
import { useAnimations } from '../../composables/useAnimations'
import NetworkNode from './NetworkNode.vue'
import NetworkLink from './NetworkLink.vue'
import LoadingSpinner from '../common/LoadingSpinner.vue'
import type {
  TopologyNode,
  TopologyLink,
  Position,
  TopologyEvent
} from '../../types/topology'
import type { DeviceStatus } from '../../types/devices'
import { calculateHierarchicalLayout, calculateForceLayout } from '../../utils/layout-algorithms'

// Props定义
interface Props {
  nodes: TopologyNode[]
  links: TopologyLink[]
  zoomLevel?: number
  panOffset?: Position
  layoutType?: 'hierarchical' | 'force' | 'manual'
  isLoading?: boolean
  enableGlowEffect?: boolean
  enableFlowAnimation?: boolean
  showNetworkColors?: boolean
  showMinimap?: boolean
  enableNodeDrag?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  zoomLevel: 1,
  panOffset: () => ({ x: 0, y: 0 }),
  layoutType: 'hierarchical',
  isLoading: false,
  enableGlowEffect: true,
  enableFlowAnimation: true,
  showNetworkColors: false,
  showMinimap: true,
  enableNodeDrag: true
})

// Events定义
const emit = defineEmits<{
  'node-click': [node: TopologyNode, event: MouseEvent]
  'node-hover': [node: TopologyNode | null, event?: MouseEvent]
  'link-click': [link: TopologyLink, event: MouseEvent]
  'link-hover': [link: TopologyLink | null, event?: MouseEvent]
  'canvas-click': [event: MouseEvent]
  'view-transform': [transform: { zoom: number, pan: Position }]
  'layout-change': [layoutType: string]
  'selection-change': [selectedIds: string[]]
}>()

// 组合式函数
const { getStatusColor } = useStatusColors()
const { startFlowAnimation, stopFlowAnimation, flowParticles } = useAnimations()

// 模板引用
const canvasContainer = ref<HTMLElement>()
const svgCanvas = ref<SVGElement>()

// 画布状态
const canvasWidth = ref(1200)
const canvasHeight = ref(800)
const currentZoom = ref(props.zoomLevel)
const currentPan = ref<Position>({ ...props.panOffset })
const showGrid = ref(false)

// 交互状态
const selectedElementId = ref<string | null>(null)
const hoveredElementId = ref<string | null>(null)
const isDragging = ref(false)
const dragState = ref<{
  target: 'canvas' | 'node' | null
  startPosition: Position
  nodeId?: string
}>({
  target: null,
  startPosition: { x: 0, y: 0 }
})

// 选择框状态
const selectionBox = ref<{
  isActive: boolean
  start: Position
  end: Position
}>({
  isActive: false,
  start: { x: 0, y: 0 },
  end: { x: 0, y: 0 }
})

// 小地图配置
const minimapWidth = 200
const minimapHeight = 150
const minimapScale = 10

// 计算属性
const viewBox = computed(() => ({
  x: -currentPan.value.x,
  y: -currentPan.value.y,
  width: canvasWidth.value / currentZoom.value,
  height: canvasHeight.value / currentZoom.value
}))

const minimapViewBox = computed(() => {
  const bounds = getLayoutBounds()
  return `${bounds.minX / minimapScale} ${bounds.minY / minimapScale} ${(bounds.maxX - bounds.minX) / minimapScale} ${(bounds.maxY - bounds.minY) / minimapScale}`
})

const visibleNodes = computed(() => {
  // TODO: 实现视口裁剪优化
  return props.nodes
})

const visibleLinks = computed(() => {
  // TODO: 实现视口裁剪优化
  return props.links
})

// 工具函数
function getNodeById(nodeId: string): TopologyNode | undefined {
  return props.nodes.find(node => node.id === nodeId)
}

function getLayoutBounds() {
  if (props.nodes.length === 0) {
    return { minX: 0, maxX: canvasWidth.value, minY: 0, maxY: canvasHeight.value }
  }

  const positions = props.nodes.map(node => node.position)
  return {
    minX: Math.min(...positions.map(p => p.x)) - 100,
    maxX: Math.max(...positions.map(p => p.x)) + 100,
    minY: Math.min(...positions.map(p => p.y)) - 100,
    maxY: Math.max(...positions.map(p => p.y)) + 100
  }
}

function screenToSVG(screenPoint: Position): Position {
  if (!svgCanvas.value) return screenPoint

  const rect = svgCanvas.value.getBoundingClientRect()
  const pt = svgCanvas.value.createSVGPoint()
  pt.x = screenPoint.x - rect.left
  pt.y = screenPoint.y - rect.top

  const svgP = pt.matrixTransform(svgCanvas.value.getScreenCTM()?.inverse())
  return { x: svgP.x, y: svgP.y }
}

// 视图控制
function zoomIn() {
  const newZoom = Math.min(currentZoom.value * 1.2, 5)
  updateZoom(newZoom)
}

function zoomOut() {
  const newZoom = Math.max(currentZoom.value / 1.2, 0.1)
  updateZoom(newZoom)
}

function updateZoom(zoom: number) {
  currentZoom.value = zoom
  emitViewTransform()
}

function updatePan(pan: Position) {
  currentPan.value = { ...pan }
  emitViewTransform()
}

function emitViewTransform() {
  emit('view-transform', {
    zoom: currentZoom.value,
    pan: currentPan.value
  })
}

function fitToView() {
  const bounds = getLayoutBounds()
  const boundsWidth = bounds.maxX - bounds.minX
  const boundsHeight = bounds.maxY - bounds.minY

  const scaleX = canvasWidth.value / boundsWidth
  const scaleY = canvasHeight.value / boundsHeight
  const scale = Math.min(scaleX, scaleY) * 0.9

  const centerX = (bounds.minX + bounds.maxX) / 2
  const centerY = (bounds.minY + bounds.maxY) / 2

  currentZoom.value = scale
  currentPan.value = {
    x: canvasWidth.value / 2 - centerX * scale,
    y: canvasHeight.value / 2 - centerY * scale
  }

  emitViewTransform()
}

function centerView() {
  const bounds = getLayoutBounds()
  const centerX = (bounds.minX + bounds.maxX) / 2
  const centerY = (bounds.minY + bounds.maxY) / 2

  currentPan.value = {
    x: canvasWidth.value / 2 - centerX * currentZoom.value,
    y: canvasHeight.value / 2 - centerY * currentZoom.value
  }

  emitViewTransform()
}

function toggleGrid() {
  showGrid.value = !showGrid.value
}

// 布局控制
async function applyHierarchicalLayout() {
  console.log('Applying hierarchical layout...')
  emit('layout-change', 'hierarchical')

  const layoutedNodes = await calculateHierarchicalLayout(props.nodes, props.links)

  // 触发节点位置更新动画
  layoutedNodes.forEach(node => {
    const originalNode = props.nodes.find(n => n.id === node.id)
    if (originalNode) {
      // 这里应该通过事件或状态管理来更新节点位置
      Object.assign(originalNode.position, node.position)
    }
  })

  await nextTick()
  fitToView()
}

async function applyForceLayout() {
  console.log('Applying force layout...')
  emit('layout-change', 'force')

  const layoutedNodes = await calculateForceLayout(props.nodes, props.links)

  // 触发节点位置更新动画
  layoutedNodes.forEach(node => {
    const originalNode = props.nodes.find(n => n.id === node.id)
    if (originalNode) {
      Object.assign(originalNode.position, node.position)
    }
  })

  await nextTick()
  fitToView()
}

// 事件处理
function handleCanvasClick(event: MouseEvent) {
  if (isDragging.value) return

  clearSelection()
  emit('canvas-click', event)
}

function handleNodeClick(node: TopologyNode, event: MouseEvent) {
  event.stopPropagation()
  selectedElementId.value = node.id
  emit('node-click', node, event)
}

function handleNodeHover(node: TopologyNode, event: MouseEvent) {
  hoveredElementId.value = node.id
  emit('node-hover', node, event)
}

function handleNodeLeave() {
  hoveredElementId.value = null
  emit('node-hover', null)
}

function handleLinkClick(link: TopologyLink, event: MouseEvent) {
  event.stopPropagation()
  selectedElementId.value = link.id
  emit('link-click', link, event)
}

function handleLinkHover(link: TopologyLink, event: MouseEvent) {
  hoveredElementId.value = link.id
  emit('link-hover', link, event)
}

function handleLinkLeave() {
  hoveredElementId.value = null
  emit('link-hover', null)
}

function clearSelection() {
  selectedElementId.value = null
}

// 鼠标交互
function handleWheel(event: WheelEvent) {
  const delta = -event.deltaY * 0.001
  const newZoom = Math.max(0.1, Math.min(5, currentZoom.value * (1 + delta)))

  // 缩放到鼠标位置
  const mousePos = screenToSVG({ x: event.clientX, y: event.clientY })
  const zoomRatio = newZoom / currentZoom.value

  currentPan.value = {
    x: currentPan.value.x + (mousePos.x - currentPan.value.x) * (1 - zoomRatio),
    y: currentPan.value.y + (mousePos.y - currentPan.value.y) * (1 - zoomRatio)
  }

  currentZoom.value = newZoom
  emitViewTransform()
}

function handleMouseDown(event: MouseEvent) {
  if (event.button !== 0) return // 只处理左键

  const svgPoint = screenToSVG({ x: event.clientX, y: event.clientY })

  dragState.value = {
    target: 'canvas',
    startPosition: svgPoint
  }

  // 开始选择框
  selectionBox.value = {
    isActive: true,
    start: svgPoint,
    end: svgPoint
  }

  isDragging.value = true
}

function handleMouseMove(event: MouseEvent) {
  if (!isDragging.value) return

  const svgPoint = screenToSVG({ x: event.clientX, y: event.clientY })

  if (dragState.value.target === 'canvas') {
    if (event.shiftKey) {
      // 更新选择框
      selectionBox.value.end = svgPoint
    } else {
      // 平移画布
      const deltaX = svgPoint.x - dragState.value.startPosition.x
      const deltaY = svgPoint.y - dragState.value.startPosition.y

      currentPan.value = {
        x: currentPan.value.x + deltaX,
        y: currentPan.value.y + deltaY
      }

      emitViewTransform()
    }
  }
}

function handleMouseUp(event: MouseEvent) {
  if (selectionBox.value.isActive && event.shiftKey) {
    // 处理选择框选择
    const box = selectionBox.value
    const selectedNodes = props.nodes.filter(node => {
      const x = node.position.x
      const y = node.position.y
      return x >= Math.min(box.start.x, box.end.x) &&
          x <= Math.max(box.start.x, box.end.x) &&
          y >= Math.min(box.start.y, box.end.y) &&
          y <= Math.max(box.start.y, box.end.y)
    })

    emit('selection-change', selectedNodes.map(node => node.id))
  }

  // 重置状态
  selectionBox.value.isActive = false
  isDragging.value = false
  dragState.value.target = null
}

function handleMouseLeave() {
  handleMouseUp(new MouseEvent('mouseup'))
}

// 节点拖拽
function handleNodeDragStart(nodeId: string, event: MouseEvent) {
  if (!props.enableNodeDrag) return

  event.stopPropagation()
  dragState.value = {
    target: 'node',
    nodeId,
    startPosition: screenToSVG({ x: event.clientX, y: event.clientY })
  }
  isDragging.value = true
}

function handleNodeDrag(nodeId: string, newPosition: Position) {
  const node = getNodeById(nodeId)
  if (node) {
    Object.assign(node.position, newPosition)
  }
}

function handleNodeDragEnd() {
  isDragging.value = false
  dragState.value.target = null
}

// 响应式更新画布尺寸
function updateCanvasSize() {
  if (!canvasContainer.value) return

  const rect = canvasContainer.value.getBoundingClientRect()
  canvasWidth.value = rect.width
  canvasHeight.value = rect.height
}

// 生命周期
onMounted(() => {
  updateCanvasSize()
  window.addEventListener('resize', updateCanvasSize)

  // 启动流动动画
  if (props.enableFlowAnimation) {
    startFlowAnimation(props.links.filter(link => link.status === 'active'))
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', updateCanvasSize)
  stopFlowAnimation()
})

// 监听器
watch(() => props.zoomLevel, (newZoom) => {
  currentZoom.value = newZoom
})

watch(() => props.panOffset, (newPan) => {
  currentPan.value = { ...newPan }
})

watch(() => props.enableFlowAnimation, (enabled) => {
  if (enabled) {
    startFlowAnimation(props.links.filter(link => link.status === 'active'))
  } else {
    stopFlowAnimation()
  }
})

watch(() => props.links, (newLinks) => {
  if (props.enableFlowAnimation) {
    startFlowAnimation(newLinks.filter(link => link.status === 'active'))
  }
}, { deep: true })
</script>

<style scoped>
.topology-canvas {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background:
      radial-gradient(circle at 25% 25%, rgba(100, 255, 218, 0.03) 0%, transparent 50%),
      radial-gradient(circle at 75% 75%, rgba(59, 130, 246, 0.03) 0%, transparent 50%),
      #0A192F;
}

.canvas-svg {
  width: 100%;
  height: 100%;
  cursor: grab;
  user-select: none;
}

.canvas-svg:active {
  cursor: grabbing;
}

.canvas-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;
}

/* 选择框样式 */
.selection-box {
  pointer-events: none;
  animation: selection-dash 1s linear infinite;
}

@keyframes selection-dash {
  to {
    stroke-dashoffset: 10;
  }
}

/* 流动粒子样式 */
.flow-particle {
  pointer-events: none;
  animation: particle-glow 2s ease-in-out infinite alternate;
}

@keyframes particle-glow {
  0% {
    filter: drop-shadow(0 0 2px currentColor);
  }
  100% {
    filter: drop-shadow(0 0 6px currentColor);
  }
}

/* 画布控制器 */
.canvas-controls {
  position: absolute;
  top: 20px;
  left: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 100;
}

.zoom-controls,
.view-controls,
.layout-controls {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(26, 32, 44, 0.9);
  border: 1px solid #374151;
  border-radius: 8px;
  padding: 8px;
  backdrop-filter: blur(10px);
}

.zoom-btn,
.control-btn {
  width: 32px;
  height: 32px;
  background: rgba(100, 255, 218, 0.1);
  border: 1px solid rgba(100, 255, 218, 0.3);
  border-radius: 6px;
  color: #64FFDA;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.zoom-btn:hover,
.control-btn:hover {
  background: rgba(100, 255, 218, 0.2);
  box-shadow: 0 0 8px rgba(100, 255, 218, 0.3);
  transform: translateY(-1px);
}

.control-btn.active {
  background: rgba(100, 255, 218, 0.3);
  border-color: rgba(100, 255, 218, 0.6);
  box-shadow: 0 0 12px rgba(100, 255, 218, 0.4);
}

.zoom-level {
  font-size: 12px;
  color: #E5E7EB;
  font-weight: 500;
  min-width: 45px;
  text-align: center;
  padding: 0 4px;
}

/* 小地图 */
.minimap {
  position: absolute;
  bottom: 20px;
  right: 20px;
  background: rgba(26, 32, 44, 0.9);
  border: 1px solid #374151;
  border-radius: 8px;
  padding: 8px;
  backdrop-filter: blur(10px);
  z-index: 100;
}

.minimap-svg {
  background: rgba(10, 25, 47, 0.5);
  border-radius: 4px;
}

.viewport-indicator {
  pointer-events: none;
  animation: viewport-pulse 2s ease-in-out infinite alternate;
}

@keyframes viewport-pulse {
  0% {
    stroke-opacity: 0.6;
  }
  100% {
    stroke-opacity: 1;
  }
}

/* 网格层样式 */
.grid-layer {
  opacity: 0.3;
  pointer-events: none;
}

/* 图层顺序 */
.links-layer {
  z-index: 1;
}

.nodes-layer {
  z-index: 2;
}

.flow-particles-layer {
  z-index: 3;
  pointer-events: none;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .canvas-controls {
    top: 10px;
    left: 10px;
    gap: 8px;
  }

  .zoom-controls,
  .view-controls,
  .layout-controls {
    padding: 6px;
    gap: 2px;
  }

  .zoom-btn,
  .control-btn {
    width: 28px;
    height: 28px;
    font-size: 12px;
  }

  .zoom-level {
    font-size: 10px;
    min-width: 35px;
  }

  .minimap {
    bottom: 10px;
    right: 10px;
    padding: 6px;
  }
}

/* 性能优化：减少重绘 */
.canvas-svg * {
  will-change: auto;
}

.canvas-svg .nodes-layer,
.canvas-svg .links-layer {
  transform-origin: 0 0;
}

/* 无障碍支持 */
@media (prefers-reduced-motion: reduce) {
  .selection-box,
  .flow-particle,
  .viewport-indicator {
    animation: none;
  }

  .zoom-btn:hover,
  .control-btn:hover {
    transform: none;
  }
}
</style>