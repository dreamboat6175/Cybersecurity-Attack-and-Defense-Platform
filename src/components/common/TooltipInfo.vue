<template>
  <div
      class="tooltip-container"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
      @focus="handleFocus"
      @blur="handleBlur"
  >
    <!-- 触发元素 -->
    <div class="tooltip-trigger" ref="triggerRef">
      <slot />
    </div>

    <!-- 工具提示内容 -->
    <Teleport to="body">
      <div
          v-if="isVisible"
          ref="tooltipRef"
          class="tooltip-popup"
          :class="tooltipClasses"
          :style="tooltipStyles"
          role="tooltip"
          :aria-describedby="tooltipId"
      >
        <!-- 箭头 -->
        <div v-if="showArrow" class="tooltip-arrow" :class="`arrow-${actualPlacement}`"></div>

        <!-- 内容区域 -->
        <div class="tooltip-content">
          <!-- 标题 -->
          <div v-if="title" class="tooltip-title">
            {{ title }}
          </div>

          <!-- 主要内容 -->
          <div class="tooltip-body">
            <slot name="content">
              {{ content }}
            </slot>
          </div>

          <!-- 设备详细信息模板 -->
          <div v-if="deviceInfo" class="device-info">
            <div class="info-row">
              <span class="info-label">设备类型:</span>
              <span class="info-value">{{ deviceInfo.type }}</span>
            </div>
            <div v-if="deviceInfo.ip" class="info-row">
              <span class="info-label">IP地址:</span>
              <span class="info-value">{{ deviceInfo.ip }}</span>
            </div>
            <div v-if="deviceInfo.status" class="info-row">
              <span class="info-label">状态:</span>
              <StatusIndicator
                  :status="deviceInfo.status"
                  variant="dot"
                  size="small"
                  show-label
                  :label="statusLabels[deviceInfo.status]"
              />
            </div>
            <div v-if="deviceInfo.cpuUsage !== undefined" class="info-row">
              <span class="info-label">CPU使用率:</span>
              <span class="info-value">{{ deviceInfo.cpuUsage }}%</span>
            </div>
            <div v-if="deviceInfo.memoryUsage !== undefined" class="info-row">
              <span class="info-label">内存使用率:</span>
              <span class="info-value">{{ deviceInfo.memoryUsage }}%</span>
            </div>
            <div v-if="deviceInfo.uptime" class="info-row">
              <span class="info-label">运行时间:</span>
              <span class="info-value">{{ formatUptime(deviceInfo.uptime) }}</span>
            </div>
          </div>

          <!-- 链路详细信息模板 -->
          <div v-if="linkInfo" class="link-info">
            <div class="info-row">
              <span class="info-label">链路类型:</span>
              <span class="info-value">{{ linkInfo.type?.toUpperCase() }}</span>
            </div>
            <div v-if="linkInfo.protocol" class="info-row">
              <span class="info-label">协议:</span>
              <span class="info-value">{{ linkInfo.protocol }}</span>
            </div>
            <div v-if="linkInfo.bandwidth" class="info-row">
              <span class="info-label">带宽:</span>
              <span class="info-value">{{ linkInfo.bandwidth }} Mbps</span>
            </div>
            <div v-if="linkInfo.latency !== undefined" class="info-row">
              <span class="info-label">延迟:</span>
              <span class="info-value">{{ linkInfo.latency }}ms</span>
            </div>
            <div v-if="linkInfo.packetLoss !== undefined" class="info-row">
              <span class="info-label">丢包率:</span>
              <span class="info-value">{{ linkInfo.packetLoss }}%</span>
            </div>
            <div v-if="linkInfo.status" class="info-row">
              <span class="info-label">状态:</span>
              <StatusIndicator
                  :status="linkStatusMap[linkInfo.status]"
                  variant="dot"
                  size="small"
                  show-label
                  :label="linkStatusLabels[linkInfo.status]"
              />
            </div>
          </div>

          <!-- 网络信息模板 -->
          <div v-if="networkInfo" class="network-info">
            <div v-if="networkInfo.network" class="info-row">
              <span class="info-label">网络:</span>
              <span class="info-value network-badge" :class="`network-${networkInfo.network.toLowerCase()}`">
                {{ networkInfo.network }}网
              </span>
            </div>
            <div v-if="networkInfo.redundancy" class="info-row">
              <span class="info-label">冗余状态:</span>
              <span class="info-value">{{ networkInfo.redundancy }}</span>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div v-if="actions && actions.length > 0" class="tooltip-actions">
            <button
                v-for="action in actions"
                :key="action.key"
                class="action-btn"
                :class="action.type || 'default'"
                @click="handleActionClick(action)"
            >
              {{ action.label }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import StatusIndicator from './StatusIndicator.vue'
import type { DeviceStatus, LinkStatus, NetworkType } from '../../types/devices'

// 工具提示动作接口
interface TooltipAction {
  key: string
  label: string
  type?: 'default' | 'primary' | 'danger'
  handler: () => void
}

// 设备信息接口
interface DeviceInfo {
  type: string
  ip?: string
  status?: DeviceStatus
  cpuUsage?: number
  memoryUsage?: number
  uptime?: number
  location?: string
}

// 链路信息接口
interface LinkInfo {
  type?: string
  protocol?: string
  bandwidth?: number
  latency?: number
  packetLoss?: number
  status?: LinkStatus
}

// 网络信息接口
interface NetworkInfo {
  network?: NetworkType
  redundancy?: string
}

interface Props {
  content?: string
  title?: string
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto'
  trigger?: 'hover' | 'click' | 'focus' | 'manual'
  delay?: number
  hideDelay?: number
  disabled?: boolean
  showArrow?: boolean
  maxWidth?: number
  theme?: 'dark' | 'light'
  deviceInfo?: DeviceInfo
  linkInfo?: LinkInfo
  networkInfo?: NetworkInfo
  actions?: TooltipAction[]
}

const props = withDefaults(defineProps<Props>(), {
  placement: 'auto',
  trigger: 'hover',
  delay: 0,
  hideDelay: 100,
  disabled: false,
  showArrow: true,
  maxWidth: 300,
  theme: 'dark'
})

const emit = defineEmits<{
  show: []
  hide: []
  actionClick: [action: TooltipAction]
}>()

// ===== 响应式数据 =====
const isVisible = ref(false)
const actualPlacement = ref<string>('top')
const triggerRef = ref<HTMLElement>()
const tooltipRef = ref<HTMLElement>()
const showTimer = ref<NodeJS.Timeout>()
const hideTimer = ref<NodeJS.Timeout>()
const tooltipId = ref(`tooltip-${Math.random().toString(36).substr(2, 9)}`)

// ===== 计算属性 =====

// 工具提示样式类
const tooltipClasses = computed(() => ({
  [`placement-${actualPlacement.value}`]: true,
  [`theme-${props.theme}`]: true,
  'with-arrow': props.showArrow,
  'has-actions': props.actions && props.actions.length > 0
}))

// 工具提示样式
const tooltipStyles = ref<Record<string, string>>({})

// 状态标签映射
const statusLabels = computed(() => ({
  normal: '正常',
  warning: '告警',
  critical: '故障',
  offline: '离线'
}))

// 链路状态映射
const linkStatusMap = computed(() => ({
  active: 'normal' as DeviceStatus,
  warning: 'warning' as DeviceStatus,
  down: 'critical' as DeviceStatus,
  unknown: 'offline' as DeviceStatus
}))

// 链路状态标签
const linkStatusLabels = computed(() => ({
  active: '活跃',
  warning: '告警',
  down: '中断',
  unknown: '未知'
}))

// ===== 方法 =====

// 显示工具提示
function show(): void {
  if (props.disabled) return

  clearTimeout(hideTimer.value)

  if (props.delay > 0) {
    showTimer.value = setTimeout(() => {
      isVisible.value = true
      emit('show')
      nextTick(() => updatePosition())
    }, props.delay)
  } else {
    isVisible.value = true
    emit('show')
    nextTick(() => updatePosition())
  }
}

// 隐藏工具提示
function hide(): void {
  clearTimeout(showTimer.value)

  if (props.hideDelay > 0) {
    hideTimer.value = setTimeout(() => {
      isVisible.value = false
      emit('hide')
    }, props.hideDelay)
  } else {
    isVisible.value = false
    emit('hide')
  }
}

// 更新工具提示位置
function updatePosition(): void {
  if (!triggerRef.value || !tooltipRef.value) return

  const trigger = triggerRef.value.getBoundingClientRect()
  const tooltip = tooltipRef.value.getBoundingClientRect()
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight
  }

  let placement = props.placement

  // 自动确定最佳位置
  if (placement === 'auto') {
    const spaceTop = trigger.top
    const spaceBottom = viewport.height - trigger.bottom
    const spaceLeft = trigger.left
    const spaceRight = viewport.width - trigger.right

    const maxSpace = Math.max(spaceTop, spaceBottom, spaceLeft, spaceRight)

    if (maxSpace === spaceTop) placement = 'top'
    else if (maxSpace === spaceBottom) placement = 'bottom'
    else if (maxSpace === spaceLeft) placement = 'left'
    else placement = 'right'
  }

  // 计算基础位置
  let top = 0
  let left = 0

  switch (placement) {
    case 'top':
      top = trigger.top - tooltip.height - 8
      left = trigger.left + (trigger.width - tooltip.width) / 2
      break
    case 'bottom':
      top = trigger.bottom + 8
      left = trigger.left + (trigger.width - tooltip.width) / 2
      break
    case 'left':
      top = trigger.top + (trigger.height - tooltip.height) / 2
      left = trigger.left - tooltip.width - 8
      break
    case 'right':
      top = trigger.top + (trigger.height - tooltip.height) / 2
      left = trigger.right + 8
      break
  }

  // 边界检查和调整
  const margin = 8

  // 水平边界检查
  if (left < margin) {
    left = margin
  } else if (left + tooltip.width > viewport.width - margin) {
    left = viewport.width - tooltip.width - margin
  }

  // 垂直边界检查
  if (top < margin) {
    top = margin
  } else if (top + tooltip.height > viewport.height - margin) {
    top = viewport.height - tooltip.height - margin
  }

  // 应用位置
  actualPlacement.value = placement
  tooltipStyles.value = {
    position: 'fixed',
    top: `${top}px`,
    left: `${left}px`,
    maxWidth: `${props.maxWidth}px`,
    zIndex: '1000'
  }
}

// 格式化运行时间
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (days > 0) {
    return `${days}天 ${hours}小时`
  } else if (hours > 0) {
    return `${hours}小时 ${minutes}分钟`
  } else {
    return `${minutes}分钟`
  }
}

// ===== 事件处理 =====

function handleMouseEnter(): void {
  if (props.trigger === 'hover') {
    show()
  }
}

function handleMouseLeave(): void {
  if (props.trigger === 'hover') {
    hide()
  }
}

function handleFocus(): void {
  if (props.trigger === 'focus') {
    show()
  }
}

function handleBlur(): void {
  if (props.trigger === 'focus') {
    hide()
  }
}

function handleActionClick(action: TooltipAction): void {
  action.handler()
  emit('actionClick', action)
  hide()
}

// 点击外部关闭
function handleClickOutside(event: MouseEvent): void {
  if (
      props.trigger === 'click' &&
      isVisible.value &&
      tooltipRef.value &&
      !tooltipRef.value.contains(event.target as Node) &&
      triggerRef.value &&
      !triggerRef.value.contains(event.target as Node)
  ) {
    hide()
  }
}

// 窗口大小变化时重新定位
function handleResize(): void {
  if (isVisible.value) {
    updatePosition()
  }
}

// ===== 生命周期 =====

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('resize', handleResize)
  window.addEventListener('scroll', handleResize)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('scroll', handleResize)
  clearTimeout(showTimer.value)
  clearTimeout(hideTimer.value)
})

// ===== 公开方法 =====
defineExpose({
  show,
  hide,
  updatePosition
})
</script>

<style scoped>
.tooltip-container {
  display: inline-block;
  position: relative;
}

.tooltip-trigger {
  display: inline-block;
}

.tooltip-popup {
  position: fixed;
  z-index: 1000;
  font-size: 14px;
  line-height: 1.4;
  word-wrap: break-word;
  animation: tooltip-fade-in 0.2s ease;
}

@keyframes tooltip-fade-in {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.tooltip-content {
  position: relative;
  border-radius: 8px;
  padding: 12px 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
}

/* 主题样式 */
.theme-dark .tooltip-content {
  background: rgba(26, 32, 44, 0.95);
  border: 1px solid #374151;
  color: #E5E7EB;
}

.theme-light .tooltip-content {
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #E5E7EB;
  color: #374151;
}

/* 箭头样式 */
.tooltip-arrow {
  position: absolute;
  width: 0;
  height: 0;
  border: 6px solid transparent;
}

.theme-dark .arrow-top {
  bottom: -12px;
  left: 50%;
  transform: translateX(-50%);
  border-top-color: rgba(26, 32, 44, 0.95);
}

.theme-dark .arrow-bottom {
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  border-bottom-color: rgba(26, 32, 44, 0.95);
}

.theme-dark .arrow-left {
  right: -12px;
  top: 50%;
  transform: translateY(-50%);
  border-left-color: rgba(26, 32, 44, 0.95);
}

.theme-dark .arrow-right {
  left: -12px;
  top: 50%;
  transform: translateY(-50%);
  border-right-color: rgba(26, 32, 44, 0.95);
}

.theme-light .arrow-top {
  bottom: -12px;
  left: 50%;
  transform: translateX(-50%);
  border-top-color: rgba(255, 255, 255, 0.95);
}

.theme-light .arrow-bottom {
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  border-bottom-color: rgba(255, 255, 255, 0.95);
}

.theme-light .arrow-left {
  right: -12px;
  top: 50%;
  transform: translateY(-50%);
  border-left-color: rgba(255, 255, 255, 0.95);
}

.theme-light .arrow-right {
  left: -12px;
  top: 50%;
  transform: translateY(-50%);
  border-right-color: rgba(255, 255, 255, 0.95);
}

/* 标题样式 */
.tooltip-title {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid;
}

.theme-dark .tooltip-title {
  border-color: #374151;
  color: #F3F4F6;
}

.theme-light .tooltip-title {
  border-color: #E5E7EB;
  color: #1F2937;
}

/* 内容样式 */
.tooltip-body {
  font-size: 13px;
  line-height: 1.5;
}

/* 信息行样式 */
.device-info,
.link-info,
.network-info {
  margin-top: 8px;
}

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
  gap: 12px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-label {
  font-size: 12px;
  opacity: 0.8;
  min-width: 80px;
  text-align: left;
}

.info-value {
  font-size: 12px;
  font-weight: 500;
  text-align: right;
  flex: 1;
}

/* 网络徽章 */
.network-badge {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: bold;
  text-transform: uppercase;
}

.network-a {
  background: rgba(100, 255, 218, 0.2);
  color: #64FFDA;
  border: 1px solid #64FFDA;
}

.network-b {
  background: rgba(255, 45, 247, 0.2);
  color: #FF2DF7;
  border: 1px solid #FF2DF7;
}

/* 操作按钮 */
.tooltip-actions {
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px solid;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.theme-dark .tooltip-actions {
  border-color: #374151;
}

.theme-light .tooltip-actions {
  border-color: #E5E7EB;
}

.action-btn {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn.default {
  background: transparent;
  color: #9CA3AF;
  border-color: #4B5563;
}

.action-btn.default:hover {
  background: #374151;
  color: #E5E7EB;
}

.action-btn.primary {
  background: #3B82F6;
  color: white;
  border-color: #3B82F6;
}

.action-btn.primary:hover {
  background: #2563EB;
}

.action-btn.danger {
  background: #EF4444;
  color: white;
  border-color: #EF4444;
}

.action-btn.danger:hover {
  background: #DC2626;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .tooltip-popup {
    max-width: 280px !important;
    font-size: 13px;
  }

  .tooltip-content {
    padding: 10px 12px;
  }

  .info-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }

  .info-label,
  .info-value {
    text-align: left;
    min-width: auto;
  }

  .tooltip-actions {
    flex-direction: column;
  }

  .action-btn {
    width: 100%;
  }
}

/* 无障碍支持 */
@media (prefers-reduced-motion: reduce) {
  .tooltip-popup {
    animation: none;
  }
}

/* 打印隐藏 */
@media print {
  .tooltip-popup {
    display: none !important;
  }
}
</style>