<!-- src/components/common/StatusIndicator.vue -->
<template>
  <span class="status-indicator" :class="statusClass">
    <span class="status-dot" :style="{ backgroundColor: statusColor, boxShadow: statusGlow }"></span>
    <span v-if="showLabel" class="status-label">{{ statusLabel }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useStatusColors } from '../../composables/useStatusColors'
import type { DeviceStatus, LinkStatus } from '../../types/devices'

interface Props {
  status: DeviceStatus | LinkStatus
  size?: 'small' | 'medium' | 'large'
  showLabel?: boolean
  animated?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium',
  showLabel: false,
  animated: true
})

const { getStatusColor } = useStatusColors()

const statusColor = computed(() => getStatusColor(props.status))

const statusGlow = computed(() => {
  if (!props.animated) return 'none'
  return `0 0 8px ${statusColor.value}`
})

const statusClass = computed(() => [
  `status-${props.status}`,
  `size-${props.size}`,
  { animated: props.animated }
])

const statusLabel = computed(() => {
  const labels = {
    normal: '正常',
    warning: '告警',
    critical: '故障',
    offline: '离线',
    active: '活跃',
    down: '中断',
    unknown: '未知'
  }
  return labels[props.status] || props.status
})
</script>

<style scoped>
.status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.status-dot {
  border-radius: 50%;
  transition: all 0.3s ease;
}

.size-small .status-dot {
  width: 6px;
  height: 6px;
}

.size-medium .status-dot {
  width: 8px;
  height: 8px;
}

.size-large .status-dot {
  width: 12px;
  height: 12px;
}

.status-label {
  font-size: 14px;
  color: #E5E7EB;
  font-weight: 500;
}

/* 动画效果 */
.animated .status-dot {
  animation: status-pulse 2s ease-in-out infinite;
}

.status-critical.animated .status-dot {
  animation: critical-pulse 1.5s ease-in-out infinite;
}

.status-warning.animated .status-dot {
  animation: warning-pulse 2.5s ease-in-out infinite;
}

@keyframes status-pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

@keyframes critical-pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 8px currentColor;
  }
  50% {
    transform: scale(1.2);
    box-shadow: 0 0 16px currentColor;
  }
}

@keyframes warning-pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 6px currentColor;
  }
  50% {
    transform: scale(1.15);
    box-shadow: 0 0 12px currentColor;
  }
}

/* 无动画模式 */
@media (prefers-reduced-motion: reduce) {
  .animated .status-dot {
    animation: none;
  }
}
</style>