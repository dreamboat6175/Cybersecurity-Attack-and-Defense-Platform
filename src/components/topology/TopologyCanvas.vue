<template>
  <div class="topology-canvas-container" ref="containerRef">
    <!-- 加载状态 -->
    <div v-if="topologyStore.isLoading" class="loading-overlay">
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p>加载拓扑数据中...</p>
        <div v-if="layoutProgress > 0" class="progress-bar">
          <div class="progress-fill" :style="{ width: `${layoutProgress}%` }"></div>
        </div>
      </div>
    </div>

    <!-- 主SVG画布 -->
    <svg
        ref="svgRef"
        class="topology-svg"
        :width="canvasWidth"
        :height="canvasHeight"
        @click="handleCanvasClick"
        @contextmenu.prevent="handleCanvasRightClick"
    >
      <!-- 定义渐变和滤镜 -->
      <defs>
        <linearGradient id="nodeGradientNormal" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" :stop-color="statusColors.normal" stop-opacity="0.8"/>
          <stop offset="100%" :stop-color="statusColors.normal" stop-opacity="0.6"/>
        </linearGradient>

        <linearGradient id="nodeGradientWarning" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" :stop-color="statusColors.warning" stop-opacity="0.8"/>
          <stop offset="100%" :stop-color="statusColors.warning" stop-opacity="0.6"/>
        </linearGradient>

        <linearGradient id="nodeGradientCritical" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" :stop-color="statusColors.critical" stop-opacity="0.8"/>
          <stop offset="100%" :stop-color="statusColors.critical" stop-opacity="0.6"/>
        </linearGradient>

        <linearGradient id="nodeGradientOffline" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" :stop-color="statusColors.offline" stop-opacity="0.8"/>
          <stop offset="100%" :stop-color="statusColors.offline" stop-opacity="0.6"/>
        </linearGradient>

        <!-- 辉光滤镜 -->
        <filter id="glowNormal">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>

        <filter id="glowCritical">
          <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>

        <!-- 箭头标记 -->
        <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
        >
          <polygon
              points="0 0, 10 3.5, 0 7"
              :fill="networkColors.a_network"
          />
        </marker>
      </defs>

      <!-- 背景网格 -->
      <g v-if="showGrid" class="grid-layer">
        <defs>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#1a202c" stroke-width="1" opacity="0.3"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </g>

      <!-- 主要绘制组 -->
      <g class="main-group" :transform="transform">
        <!-- 链路层 -->
        <g class="links-layer">
          <TopologyLink
              v-for="link in visibleLinks"
              :key="link.id"
              :link="link"
              :is-selected="selectedLinkId === link.id"
              :is-hovered="hoveredElementId === link.id"
              @click="handleLinkClick"
              @mouseenter="handleLinkMouseEnter"
              @mouseleave="handleLinkMouseLeave"
          />
        </g>

        <!-- 节点层 -->
        <g class="nodes-layer">
          <TopologyNode
              v-for="node in visibleNodes"
              :key="node.id"
              :node="node"
              :is-selected="selectedNodeId === node.id"
              :is-hovered="hoveredElementId === node.id"
              :zoom-level="zoomLevel"
              @click="handleNodeClick"
              @mouseenter="handleNodeMouseEnter"
              @mouseleave="handleNodeMouseLeave"
              @dblclick="handleNodeDoubleClick"
          />
        </g>

        <!-- 选择框 -->
        <rect
            v-if="selectionBox.isActive"
            class="selection-box"
            :x="Math.min(selectionBox.start.x, selectionBox.end.x)"
            :y="Math.min(selectionBox.start.y, selectionBox.end.y)"
            :width="Math.abs(selectionBox.end.x - selectionBox.start.x)"
            :height="Math.abs(selectionBox.end.y - selectionBox.start.y)"
            fill="rgba(100, 255, 218, 0.1)"
            stroke="#64FFDA"
            stroke-width="1"
            stroke-dasharray="5,5"
        />
      </g>
    </svg>

    <!-- 工具栏 -->
    <div class="topology-toolbar">
      <div class="toolbar-group">
        <!-- 缩放控制 -->
        <button
            class="toolbar-btn"
            @click="zoomIn"
            :disabled="zoomLevel >= maxZoom"
            title="放大"
        >
          <span class="icon">🔍+</span>
        </button>

        <button
            class="toolbar-btn"
            @click="zoomOut"
            :disabled="zoomLevel <= minZoom"
            title="缩小"
        >
          <span class="icon">🔍-</span>
        </button>

        <button
            class="toolbar-btn"
            @click="zoomToFit"
            title="适应窗口"
        >
          <span class="icon">⊞</span>
        </button>

        <button
            class="toolbar-btn"
            @click="resetView"
            title="重置视图"
        >
          <span class="icon">🏠</span>
        </button>
      </div>

      <div class="toolbar-group">
        <!-- 布局控制 -->
        <button
            class="toolbar-btn"
            :class="{ active: autoLayout }"
            @click="toggleAutoLayout"
            title="自动布局"
        >
          <span class="icon">🎯</span>
        </button>

        <select
            class="toolbar-select"
            v-model="layoutType"
            @change="handleLayoutChange"
        >
          <option value="hierarchical">分层布局</option>
          <option value="force">力导向布局</option>
          <option value="manual">手动布局</option>
        </select>
      </div>

      <div class="toolbar-group">
        <!-- 显示控制 -->
        <button
            class="toolbar-btn"
            :class="{ active: showGrid }"
            @click="toggleGrid"
            title="显示网格"
        >
          <span class="icon">⊞</span>
        </button>

        <button
            class="toolbar-btn"
            :class="{ active: enableAnimations }"
            @click="toggleAnimations"
            title="启用动画"
        >
          <span class="icon">✨</span>
        </button>
      </div>

      <!-- 缩放比例显示 -->
      <div class="zoom-indicator">
        {{ Math.round(zoomLevel * 100) }}%
      </div>
    </div>

    <!-- 小地图 -->
    <div v-if="showMinimap" class="minimap">
      <svg class="minimap-svg" :width="minimapWidth" :height="minimapHeight">
        <rect
            class="minimap-bg"
            width="100%"
            height="100%"
            fill="#1a202c"
            stroke="#374151"
        />

        <!-- 小地图内容 -->
        <g class="minimap-content" :transform="minimapTransform">
          <!-- 简化的节点显示 -->
          <circle
              v-for="node in visibleNodes"
              :key="`mini-${node.id}`"
              :cx="node.position.x"
              :cy="node.position.y"
              r="3"
              :fill="getNodeColor(node.status)"
          />

          <!-- 当前视窗区域 -->
          <rect
              class="viewport-indicator"
              :x="viewportRect.x"
              :y="viewportRect.y"
              :width="viewportRect.width"
              :height="viewportRect.height"
              fill="none"
              stroke="#64FFDA"
              stroke-width="1"
          />
        </g>
      </svg>
    </div>

    <!-- 右键菜单 -->
    <div
        v-if="contextMenu.visible"
        class="context-menu"
        :style="{
        left: `${contextMenu.x}px`,
        top: `${contextMenu.y}px`
      }"
    >
      <div class="menu-item" @click="handleMenuAction('zoomToNode')">
        缩放至节点
      </div>
      <div class="menu-item" @click="handleMenuAction('showDetails')">
        查看详情
      </div>
      <div class="menu-divider"></div>
      <div class="menu-item" @click="handleMenuAction('export')">
        导出图像
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as d3 from 'd3'
import { useTopologyStore } from '../../stores/topology'
import { useSystemStore } from '../../stores/system'
import { useTopology } from '../../composables/useTopology'
import { useStatusColors } from '../../composables/useStatusColors'
import { useAnimations } from '../../composables/useAnimations'
import { DEFAULT_TOPOLOGY_CONFIG } from '../../constants/config'
import TopologyNode from './NetworkNode.vue'
import TopologyLink from './NetworkLink.vue'
import type { TopologyNode as ITopologyNode, TopologyLink as ITopologyLink } from '../../types/topology'

// ===== Props & Emits =====
interface Props {
  width?: number
  height?: number
  enableZoom?: boolean
  enablePan?: boolean
  showMinimap?: boolean
  showGrid?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  width: 1200,
  height: 800,
  enableZoom: true,
  enablePan: true,
  showMinimap: true,
  showGrid: false
})

const emit = defineEmits<{
  nodeClick: [node: ITopologyNode, event: MouseEvent]
  linkClick: [link: ITopologyLink, event: MouseEvent]
  canvasClick: [event: MouseEvent]
  viewChanged: [transform: { zoom: number, pan: { x: number, y: number } }]
}>()

// ===== Stores & Composables =====
const topologyStore = useTopologyStore()
const systemStore = useSystemStore()
const {
  visibleNodes,
  visibleLinks,
  layoutProgress,
  handleNodeClick: topologyNodeClick,
  handleLinkClick: topologyLinkClick,
  handleCanvasClick: topologyCanvasClick,
  zoomToFit: topologyZoomToFit
} = useTopology()
const { statusColors, networkColors, getNodeColor } = useStatusColors()
const { animationsEnabled, setAnimationsEnabled } = useAnimations()

// ===== 响应式数据 =====
const containerRef = ref<HTMLElement>()
const svgRef = ref<SVGElement>()

// 画布尺寸
const canvasWidth = computed(() => props.width)
const canvasHeight = computed(() => props.height)

// 缩放和平移
const zoomLevel = computed(() => topologyStore.zoomLevel)
const panOffset = computed(() => topologyStore.panOffset)
const minZoom = ref(0.1)
const maxZoom = ref(5)

// 变换字符串
const transform = computed(() =>
    `translate(${panOffset.value.x}, ${panOffset.value.y}) scale(${zoomLevel.value})`
)

// 选择状态
const selectedNodeId = computed(() => topologyStore.selectedNodeId)
const selectedLinkId = computed(() => topologyStore.selectedLinkId)
const hoveredElementId = computed(() => topologyStore.hoveredElementId)

// 布局控制
const autoLayout = computed({
  get: () => topologyStore.autoLayout,
  set: (value) => topologyStore.toggleAutoLayout()
})

const layoutType = computed({
  get: () => topologyStore.layoutType,
  set: (value) => topologyStore.setLayoutType(value as any)
})

// 显示控制
const showGrid = ref(props.showGrid)
const enableAnimations = computed({
  get: () => animationsEnabled.value,
  set: (value) => setAnimationsEnabled(value)
})

// 选择框
const selectionBox = ref({
  isActive: false,
  start: { x: 0, y: 0 },
  end: { x: 0, y: 0 }
})

// 右键菜单
const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  target: null as ITopologyNode | ITopologyLink | null
})

// 小地图
const minimapWidth = ref(200)
const minimapHeight = ref(150)
const showMinimap = ref(props.showMinimap)

// D3相关
let zoomBehavior: d3.ZoomBehavior<SVGElement, unknown> | null = null
let simulation: d3.Simulation<any, any> | null = null

// ===== 计算属性 =====

// 小地图变换
const minimapTransform = computed(() => {
  const scaleX = minimapWidth.value / canvasWidth.value
  const scaleY = minimapHeight.value / canvasHeight.value
  const scale = Math.min(scaleX, scaleY) * 0.8

  return `scale(${scale})`
})

// 当前视窗区域（小地图中显示）
const viewportRect = computed(() => {
  const scale = minimapWidth.value / canvasWidth.value * 0.8
  return {
    x: -panOffset.value.x * scale / zoomLevel.value,
    y: -panOffset.value.y * scale / zoomLevel.value,
    width: canvasWidth.value * scale / zoomLevel.value,
    height: canvasHeight.value * scale / zoomLevel.value
  }
})

// ===== 缩放和平移方法 =====

// 初始化缩放行为
function initializeZoom(): void {
  if (!svgRef.value || !props.enableZoom) return

  zoomBehavior = d3.zoom<SVGElement, unknown>()
      .scaleExtent([minZoom.value, maxZoom.value])
      .on('zoom', handleZoom)

  d3.select(svgRef.value).call(zoomBehavior)
}

// 处理缩放事件
function handleZoom(event: d3.D3ZoomEvent<SVGElement, unknown>): void {
  const { k: zoom, x, y } = event.transform

  topologyStore.setViewTransform(zoom, { x, y })

  emit('viewChanged', {
    zoom,
    pan: { x, y }
  })
}

// 缩放方法
function zoomIn(): void {
  const newZoom = Math.min(zoomLevel.value * 1.2, maxZoom.value)
  animateZoomTo(newZoom)
}

function zoomOut(): void {
  const newZoom = Math.max(zoomLevel.value / 1.2, minZoom.value)
  animateZoomTo(newZoom)
}

function animateZoomTo(targetZoom: number): void {
  if (!svgRef.value || !zoomBehavior) return

  d3.select(svgRef.value)
      .transition()
      .duration(300)
      .call(
          zoomBehavior.transform,
          d3.zoomIdentity
              .translate(panOffset.value.x, panOffset.value.y)
              .scale(targetZoom)
      )
}

function zoomToFit(): void {
  topologyZoomToFit()
}

function resetView(): void {
  topologyStore.resetView()

  if (svgRef.value && zoomBehavior) {
    d3.select(svgRef.value)
        .transition()
        .duration(500)
        .call(zoomBehavior.transform, d3.zoomIdentity)
  }
}

// ===== 事件处理 =====

function handleNodeClick(node: ITopologyNode, event: MouseEvent): void {
  topologyNodeClick(node, event)
  emit('nodeClick', node, event)
}

function handleLinkClick(link: ITopologyLink, event: MouseEvent): void {
  topologyLinkClick(link, event)
  emit('linkClick', link, event)
}

function handleCanvasClick(event: MouseEvent): void {
  // 如果点击的是子元素，不处理
  if (event.target !== svgRef.value) return

  topologyCanvasClick(event)
  emit('canvasClick', event)

  // 隐藏右键菜单
  contextMenu.value.visible = false
}

function handleCanvasRightClick(event: MouseEvent): void {
  contextMenu.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY,
    target: null
  }
}

function handleNodeMouseEnter(node: ITopologyNode): void {
  topologyStore.setHoveredElement(node.id, 'node')
}

function handleNodeMouseLeave(): void {
  topologyStore.clearHover()
}

function handleLinkMouseEnter(link: ITopologyLink): void {
  topologyStore.setHoveredElement(link.id, 'link')
}

function handleLinkMouseLeave(): void {
  topologyStore.clearHover()
}

function handleNodeDoubleClick(node: ITopologyNode): void {
  if (node.type === 'ZC' || node.type === 'ATS') {
    // 双击进入子系统
    console.log('Drilling down to subsystem:', node)
  }
}

// ===== 工具栏方法 =====

function toggleAutoLayout(): void {
  topologyStore.toggleAutoLayout()
}

function handleLayoutChange(): void {
  // 布局类型已通过 v-model 更新
  console.log('Layout changed to:', layoutType.value)
}

function toggleGrid(): void {
  showGrid.value = !showGrid.value
}

function toggleAnimations(): void {
  setAnimationsEnabled(!animationsEnabled.value)
}

// ===== 右键菜单方法 =====

function handleMenuAction(action: string): void {
  switch (action) {
    case 'zoomToNode':
      // TODO: 实现缩放到节点
      break
    case 'showDetails':
      // TODO: 显示详情面板
      break
    case 'export':
      exportCanvas()
      break
  }

  contextMenu.value.visible = false
}

function exportCanvas(): void {
  if (!svgRef.value) return

  // TODO: 实现SVG导出功能
  console.log('Exporting canvas...')
}

// ===== 生命周期 =====

onMounted(async () => {
  await nextTick()
  initializeZoom()

  // 点击外部隐藏右键菜单
  document.addEventListener('click', () => {
    contextMenu.value.visible = false
  })
})

onUnmounted(() => {
  if (simulation) {
    simulation.stop()
  }
})

// ===== 监听器 =====

watch([zoomLevel, panOffset], () => {
  if (svgRef.value && zoomBehavior) {
    // 同步D3缩放状态
    d3.select(svgRef.value).call(
        zoomBehavior.transform,
        d3.zoomIdentity
            .translate(panOffset.value.x, panOffset.value.y)
            .scale(zoomLevel.value)
    )
  }
})
</script>

<style scoped>
.topology-canvas-container {
  position: relative;
  width: 100%;
  height: 100%;
  background: #0a192f;
  border-radius: 8px;
  overflow: hidden;
}

.topology-svg {
  display: block;
  cursor: grab;
}

.topology-svg:active {
  cursor: grabbing;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(10, 25, 47, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-spinner {
  text-align: center;
  color: #e5e7eb;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #374151;
  border-top: 3px solid #64ffda;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.progress-bar {
  width: 200px;
  height: 4px;
  background: #374151;
  border-radius: 2px;
  margin-top: 16px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #64ffda;
  transition: width 0.3s ease;
}

.selection-box {
  pointer-events: none;
}

.topology-toolbar {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  gap: 12px;
  align-items: center;
  background: rgba(26, 32, 44, 0.9);
  border: 1px solid #374151;
  border-radius: 8px;
  padding: 8px;
  backdrop-filter: blur(10px);
}

.toolbar-group {
  display: flex;
  gap: 4px;
  align-items: center;
}

.toolbar-btn {
  width: 32px;
  height: 32px;
  background: transparent;
  border: 1px solid #4b5563;
  border-radius: 4px;
  color: #e5e7eb;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.toolbar-btn:hover {
  background: #374151;
  border-color: #64ffda;
}

.toolbar-btn.active {
  background: #64ffda;
  color: #0a192f;
}

.toolbar-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toolbar-select {
  background: #374151;
  border: 1px solid #4b5563;
  border-radius: 4px;
  color: #e5e7eb;
  padding: 4px 8px;
  font-size: 12px;
}

.zoom-indicator {
  background: #374151;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  color: #e5e7eb;
  min-width: 50px;
  text-align: center;
}

.minimap {
  position: absolute;
  bottom: 16px;
  right: 16px;
  background: rgba(26, 32, 44, 0.9);
  border: 1px solid #374151;
  border-radius: 8px;
  backdrop-filter: blur(10px);
}

.minimap-svg {
  display: block;
}

.minimap-bg {
  stroke-width: 1;
}

.viewport-indicator {
  stroke-width: 2;
  stroke-dasharray: 2,2;
}

.context-menu {
  position: fixed;
  background: #1a202c;
  border: 1px solid #374151;
  border-radius: 8px;
  padding: 4px 0;
  min-width: 120px;
  z-index: 1000;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
}

.menu-item {
  padding: 8px 16px;
  color: #e5e7eb;
  cursor: pointer;
  font-size: 14px;
}

.menu-item:hover {
  background: #374151;
}

.menu-divider {
  height: 1px;
  background: #374151;
  margin: 4px 0;
}
</style>