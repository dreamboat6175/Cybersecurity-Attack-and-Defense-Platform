<template>
  <div class="status-indicator" :class="indicatorClasses">
    <!-- 状态点指示器 -->
    <div v-if="variant === 'dot'" class="status-dot">
      <div class="dot-core" :style="dotStyles"></div>
      <div v-if="pulse" class="dot-pulse" :style="pulseStyles"></div>
    </div>

    <!-- 状态条指示器 -->
    <div v-else-if="variant === 'bar'" class="status-bar">
      <div class="bar-fill" :style="barStyles"></div>
      <div v-if="showPercentage && value !== undefined" class="bar-text">
        {{ Math.round(value) }}%
      </div>
    </div>

    <!-- 环形指示器 -->
    <div v-else-if="variant === 'ring'" class="status-ring">
      <svg class="ring-svg" :width="size" :height="size" viewBox="0 0 100 100">
        <!-- 背景圆环 -->
        <circle
            cx="50"
            cy="50"
            :r="ringRadius"
            fill="none"
            :stroke="ringBgColor"
            :stroke-width="ringStrokeWidth"
        />

        <!-- 进度圆环 -->
        <circle
            cx="50"
            cy="50"
            :r="ringRadius"
            fill="none"
            :stroke="ringColor"
            :stroke-width="ringStrokeWidth"
            :stroke-dasharray="ringCircumference"
            :stroke-dashoffset="ringOffset"
            stroke-linecap="round"
            class="progress-ring"
        />

        <!-- 中心文本 -->
        <text
            v-if="showText"
            x="50"
            y="50"
            text-anchor="middle"
            dominant-baseline="middle"
            :font-size="ringTextSize"
            :fill="textColor"
            class="ring-text"
        >
          {{ ringText }}
        </text>
      </svg>
    </div>

    <!-- 徽章指示器 -->
    <div v-else-if="variant === 'badge'" class="status-badge" :style="badgeStyles">
      <div v-if="icon" class="badge-icon">{{ icon }}</div>
      <span v-if="text" class="badge-text">{{ text }}</span>
      <div v-if="showCount && count !== undefined" class="badge-count">
        {{ formatCount(count) }}
      </div>
    </div>

    <!-- 信号强度指示器 -->
    <div v-else-if="variant === 'signal'" class="status-signal">
      <div
          v-for="(bar, index) in signalBars"
          :key="index"
          class="signal-bar"
          :class="{ active: bar.active }"
          :style="bar.style"
      ></div>
    </div>

    <!-- 网络连接指示器 -->
    <div v-else-if="variant === 'network'" class="status-network">
      <svg class="network-icon" viewBox="0 0 24 24">
        <path
            v-if="status === 'normal'"
            d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2M12 6.5L11.5 8.5L9.5 9L11.5 9.5L12 11.5L12.5 9.5L14.5 9L12.5 8.5L12 6.5Z"
            :fill="statusColor"
        />
        <path
            v-else-if="status === 'warning'"
            d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"
            :fill="statusColor"
            opacity="0.6"
        />
        <path
            v-else-if="status === 'critical'"
            d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"
            :fill="statusColor"
            opacity="0.3"
        />
        <path
            v-else
            d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"
            :fill="statusColor"
            opacity="0.2"
        />
      </svg>

      <!-- 连接线动画 -->
      <div v-if="status === 'normal'" class="connection-lines">
        <div v-for="i in 3" :key="i" class="connection-line" :style="{ animationDelay: `${i * 0.2}s` }"></div>
      </div>
    </div>

    <!-- 状态文本标签 -->
    <div v-if="showLabel && label" class="status-label" :style="{ color: textColor }">
      {{ label }}
    </div>

    <!-- 工具提示内容 -->
    <div v-if="showTooltip && tooltipContent" class="status-tooltip">
      {{ tooltipContent }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useStatusColors } from '../../composables/useStatusColors'
import type { DeviceStatus } from '../../types/devices'

interface Props {
  status: DeviceStatus
  variant?: 'dot' | 'bar' | 'ring' | 'badge' | 'signal' | 'network'
  size?: number | 'small' | 'medium' | 'large'
  value?: number // 0-100的进度值
  text?: string
  label?: string
  icon?: string
  count?: number
  pulse?: boolean
  showLabel?: boolean
  showText?: boolean
  showPercentage?: boolean
  showCount?: boolean
  showTooltip?: boolean
  tooltipContent?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'dot',
  size: 'medium',
  pulse: false,
  showLabel: false,
  showText: false,
  showPercentage: false,
  showCount: false,
  showTooltip: false
})

// ===== Composables =====
const { statusColors, getStatusColor } = useStatusColors()

// ===== 计算属性 =====

// 指示器样式类
const indicatorClasses = computed(() => ({
  [`variant-${props.variant}`]: true,
  [`status-${props.status}`]: true,
  [`size-${typeof props.size === 'string' ? props.size : 'custom'}`]: true,
  'with-pulse': props.pulse
}))

// 实际尺寸
const actualSize = computed(() => {
  if (typeof props.size === 'number') return props.size

  switch (props.size) {
    case 'small': return 16
    case 'medium': return 24
    case 'large': return 32
    default: return 24
  }
})

// 状态颜色
const statusColor = computed(() => getStatusColor(props.status))

// 文本颜色
const textColor = computed(() => {
  if (props.status === 'normal') return '#E5E7EB'
  return statusColor.value
})

// 点状指示器样式
const dotStyles = computed(() => ({
  backgroundColor: statusColor.value,
  width: `${actualSize.value}px`,
  height: `${actualSize.value}px`,
  boxShadow: props.pulse ? `0 0 ${actualSize.value / 2}px ${statusColor.value}` : 'none'
}))

const pulseStyles = computed(() => ({
  borderColor: statusColor.value,
  width: `${actualSize.value * 1.5}px`,
  height: `${actualSize.value * 1.5}px`,
  left: `${-actualSize.value * 0.25}px`,
  top: `${-actualSize.value * 0.25}px`
}))

// 条状指示器样式
const barStyles = computed(() => {
  const percentage = Math.max(0, Math.min(100, props.value || 0))
  return {
    backgroundColor: statusColor.value,
    width: `${percentage}%`,
    height: `${actualSize.value / 3}px`
  }
})

// 环形指示器相关
const ringRadius = computed(() => 45 - (actualSize.value < 30 ? 15 : 10))
const ringStrokeWidth = computed(() => actualSize.value < 30 ? 6 : 8)
const ringCircumference = computed(() => 2 * Math.PI * ringRadius.value)
const ringOffset = computed(() => {
  const percentage = Math.max(0, Math.min(100, props.value || 0))
  return ringCircumference.value - (percentage / 100) * ringCircumference.value
})
const ringColor = computed(() => statusColor.value)
const ringBgColor = computed(() => '#374151')
const ringTextSize = computed(() => actualSize.value < 30 ? '12' : '14')
const ringText = computed(() => {
  if (props.text) return props.text
  if (props.value !== undefined) return `${Math.round(props.value)}%`
  return statusLabels.value[props.status] || ''
})

// 徽章指示器样式
const badgeStyles = computed(() => ({
  backgroundColor: statusColor.value,
  color: '#FFFFFF',
  minWidth: `${actualSize.value}px`,
  height: `${actualSize.value}px`,
  fontSize: `${actualSize.value / 2}px`
}))

// 信号强度指示器
const signalBars = computed(() => {
  const strength = Math.max(0, Math.min(100, props.value || 0))
  const barCount = 4
  const bars = []

  for (let i = 0; i < barCount; i++) {
    const barStrength = ((i + 1) / barCount) * 100
    const isActive = strength >= barStrength

    bars.push({
      active: isActive,
      style: {
        height: `${(i + 1) * (actualSize.value / barCount)}px`,
        backgroundColor: isActive ? statusColor.value : '#374151',
        opacity: isActive ? 1 : 0.3
      }
    })
  }

  return bars
})

// 状态标签映射
const statusLabels = computed(() => ({
  normal: '正常',
  warning: '告警',
  critical: '故障',
  offline: '离线'
}))

// ===== 辅助函数 =====

function formatCount(count: number): string {
  if (count < 1000) return count.toString()
  if (count < 10000) return `${(count / 1000).toFixed(1)}K`
  if (count < 1000000) return `${Math.round(count / 1000)}K`
  return `${(count / 1000000).toFixed(1)}M`
}
</script>

<style scoped>
.status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  position: relative;
}

/* 尺寸变体 */
.size-small {
  font-size: 12px;
}

.size-medium {
  font-size: 14px;
}

.size-large {
  font-size: 16px;
}

/* === 点状指示器 === */
.status-dot {
  position: relative;
  display: inline-block;
}

.dot-core {
  border-radius: 50%;
  transition: all 0.3s ease;
}

.dot-pulse {
  position: absolute;
  border: 2px solid;
  border-radius: 50%;
  animation: pulse-ring 2s infinite;
}

@keyframes pulse-ring {
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  100% {
    transform: scale(1.4);
    opacity: 0;
  }
}

/* === 条状指示器 === */
.status-bar {
  position: relative;
  background: #374151;
  border-radius: 4px;
  overflow: hidden;
  min-width: 60px;
  display: flex;
  align-items: center;
}

.bar-fill {
  border-radius: 4px;
  transition: width 0.5s ease;
  position: relative;
}

.bar-text {
  position: absolute;
  right: 8px;
  color: #E5E7EB;
  font-size: 11px;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

/* === 环形指示器 === */
.status-ring {
  display: inline-block;
}

.ring-svg {
  transform: rotate(-90deg);
}

.progress-ring {
  transition: stroke-dashoffset 0.5s ease;
}

.ring-text {
  font-weight: 600;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* === 徽章指示器 === */
.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  padding: 4px 8px;
  font-weight: 600;
  text-align: center;
  white-space: nowrap;
  gap: 4px;
}

.badge-icon {
  font-size: inherit;
}

.badge-text {
  font-size: inherit;
}

.badge-count {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 2px 6px;
  font-size: 10px;
  min-width: 16px;
}

/* === 信号强度指示器 === */
.status-signal {
  display: inline-flex;
  align-items: flex-end;
  gap: 2px;
  height: 24px;
}

.signal-bar {
  width: 4px;
  background: #374151;
  border-radius: 1px;
  transition: all 0.3s ease;
}

.signal-bar.active {
  opacity: 1 !important;
}

/* === 网络连接指示器 === */
.status-network {
  position: relative;
  display: inline-block;
}

.network-icon {
  width: 24px;
  height: 24px;
  transition: all 0.3s ease;
}

.connection-lines {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.connection-line {
  position: absolute;
  width: 2px;
  height: 2px;
  background: #64FFDA;
  border-radius: 50%;
  animation: connection-pulse 2s ease-in-out infinite;
}

.connection-line:nth-child(1) {
  top: -8px;
  left: -1px;
}

.connection-line:nth-child(2) {
  top: -1px;
  left: 8px;
}

.connection-line:nth-child(3) {
  top: 8px;
  left: -1px;
}

@keyframes connection-pulse {
  0%, 100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.5);
  }
}

/* === 状态标签 === */
.status-label {
  font-weight: 500;
  transition: color 0.3s ease;
}

/* === 工具提示 === */
.status-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: #1a202c;
  color: #e5e7eb;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
  z-index: 1000;
  margin-bottom: 4px;
  border: 1px solid #374151;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.status-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 4px solid transparent;
  border-top-color: #1a202c;
}

.status-indicator:hover .status-tooltip {
  opacity: 1;
}

/* === 状态特定样式 === */
.status-normal .dot-core {
  box-shadow: 0 0 10px rgba(46, 204, 113, 0.4);
}

.status-warning .dot-core {
  box-shadow: 0 0 10px rgba(243, 156, 18, 0.4);
}

.status-critical .dot-core {
  box-shadow: 0 0 10px rgba(231, 76, 60, 0.4);
  animation: critical-pulse 1s ease-in-out infinite alternate;
}

.status-offline .dot-core {
  opacity: 0.6;
}

@keyframes critical-pulse {
  0% {
    transform: scale(1);
  }
  100% {
    transform: scale(1.1);
  }
}

/* === 变体特定样式 === */
.variant-ring .progress-ring {
  filter: drop-shadow(0 0 4px currentColor);
}

.variant-badge {
  cursor: default;
}

.variant-signal .signal-bar:hover {
  transform: scaleY(1.1);
}

.variant-network .network-icon:hover {
  transform: scale(1.1);
}

/* === 响应式调整 === */
@media (max-width: 768px) {
  .status-indicator {
    gap: 6px;
  }

  .status-tooltip {
    font-size: 11px;
    padding: 4px 8px;
  }
}

/* === 无障碍支持 === */
@media (prefers-reduced-motion: reduce) {
  .dot-pulse,
  .connection-line,
  .progress-ring,
  .signal-bar {
    animation: none;
  }

  .status-critical .dot-core {
    animation: none;
  }
}

/* === 深色主题优化 === */
.status-indicator {
  color: #e5e7eb;
}

.status-bar {
  background: #374151;
  border: 1px solid #4b5563;
}

.status-badge {
  border: 1px solid rgba(255, 255, 255, 0.1);
}
</style>