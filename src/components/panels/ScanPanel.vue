<template>
  <div class="panel">
    <div class="panel-header">
      <h3 class="panel-title">
        <span class="title-icon">🔍</span>
        漏洞扫描
      </h3>
      <div class="panel-actions">
        <button
            class="action-btn"
            @click="startScan"
            :disabled="isScanning || !selectedTarget"
            :title="selectedTarget ? '开始扫描' : '请先选择目标'"
        >
          <span class="btn-icon" :class="{ spinning: isScanning }">
            {{ isScanning ? '🔄' : '▶️' }}
          </span>
        </button>
      </div>
    </div>

    <div class="panel-content">
      <!-- 目标信息 -->
      <div v-if="selectedTarget" class="target-info-card">
        <div class="target-header">
          <span class="target-ip">{{ selectedTarget.ip }}</span>
          <span class="target-status" :class="selectedTarget.status">
            {{ getStatusText(selectedTarget.status) }}
          </span>
        </div>
        <div class="scan-meta">
          <span class="last-scan">
            上次扫描: {{ formatLastScan(selectedTarget.lastScan) }}
          </span>
        </div>
      </div>

      <!-- 扫描中状态 -->
      <div v-if="isScanning" class="scanning-state">
        <div class="scanning-animation">
          <div class="scan-wave"></div>
          <div class="scan-wave"></div>
          <div class="scan-wave"></div>
        </div>
        <p>正在扫描目标...</p>
        <div class="scan-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: scanProgress + '%' }"></div>
          </div>
          <span class="progress-text">{{ scanProgress }}%</span>
        </div>
      </div>

      <!-- 雷达图容器 -->
      <div v-else-if="scanData" class="radar-container">
        <div ref="radarRef" class="radar-chart"></div>

        <!-- 扫描统计 -->
        <div class="scan-stats">
          <div class="stat-grid">
            <div class="stat-item critical">
              <span class="stat-value">{{ vulnerabilityStats.critical }}</span>
              <span class="stat-label">严重</span>
            </div>
            <div class="stat-item high">
              <span class="stat-value">{{ vulnerabilityStats.high }}</span>
              <span class="stat-label">高危</span>
            </div>
            <div class="stat-item medium">
              <span class="stat-value">{{ vulnerabilityStats.medium }}</span>
              <span class="stat-label">中危</span>
            </div>
            <div class="stat-item low">
              <span class="stat-value">{{ vulnerabilityStats.low }}</span>
              <span class="stat-label">低危</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 无数据状态 -->
      <div v-else class="empty-state">
        <div class="empty-icon">🔍</div>
        <div class="empty-text">
          {{ selectedTarget ? '暂无扫描数据' : '请选择扫描目标' }}
        </div>
        <button
            v-if="selectedTarget"
            class="btn-primary"
            @click="startScan"
            :disabled="isScanning"
        >
          开始扫描
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useDashboardStore } from '@/stores/dashboard'
import * as echarts from 'echarts'
import { formatTime } from '@/utils/format'

const dashboardStore = useDashboardStore()

// 响应式数据
const radarRef = ref(null)
const isScanning = ref(false)
const scanProgress = ref(0)
let radarChart = null

// 计算属性
const selectedTarget = computed(() => dashboardStore.selectedTarget)
const scanData = computed(() => dashboardStore.scanResults[selectedTarget.value?.id])
const vulnerabilityStats = computed(() => {
  if (!scanData.value) return { critical: 0, high: 0, medium: 0, low: 0 }

  return {
    critical: scanData.value.vulnerabilities?.filter(v => v.severity === 'critical').length || 0,
    high: scanData.value.vulnerabilities?.filter(v => v.severity === 'high').length || 0,
    medium: scanData.value.vulnerabilities?.filter(v => v.severity === 'medium').length || 0,
    low: scanData.value.vulnerabilities?.filter(v => v.severity === 'low').length || 0
  }
})

// 雷达图配置
const getRadarOption = () => ({
  backgroundColor: 'transparent',
  radar: {
    indicator: [
      { name: '端口扫描', max: 100 },
      { name: '服务识别', max: 100 },
      { name: '漏洞检测', max: 100 },
      { name: '配置检查', max: 100 },
      { name: '安全评估', max: 100 },
      { name: '合规检查', max: 100 }
    ],
    shape: 'polygon',
    splitNumber: 4,
    splitArea: {
      show: true,
      areaStyle: {
        color: ['rgba(100, 255, 218, 0.05)', 'rgba(100, 255, 218, 0.1)']
      }
    },
    splitLine: {
      lineStyle: {
        color: '#233554'
      }
    },
    axisLine: {
      lineStyle: {
        color: '#233554'
      }
    },
    name: {
      textStyle: {
        color: '#8892B0',
        fontSize: 12
      }
    }
  },
  series: [{
    type: 'radar',
    data: [{
      value: scanData.value ? [
        scanData.value.portScan || 0,
        scanData.value.serviceDetection || 0,
        scanData.value.vulnerability || 0,
        scanData.value.configCheck || 0,
        scanData.value.security || 0,
        scanData.value.compliance || 0
      ] : [0, 0, 0, 0, 0, 0],
      name: '扫描评分',
      areaStyle: {
        color: 'rgba(100, 255, 218, 0.2)'
      },
      lineStyle: {
        color: '#64FFDA',
        width: 2
      },
      itemStyle: {
        color: '#64FFDA',
        borderWidth: 2
      }
    }]
  }]
})

// 方法
const initRadarChart = async () => {
  await nextTick()

  if (radarRef.value && !radarChart) {
    radarChart = echarts.init(radarRef.value, 'dark')
    radarChart.setOption(getRadarOption())

    // 监听窗口大小变化
    window.addEventListener('resize', handleResize)
  }
}

const updateRadarChart = () => {
  if (radarChart) {
    radarChart.setOption(getRadarOption())
  }
}

const handleResize = () => {
  if (radarChart) {
    radarChart.resize()
  }
}

const startScan = async () => {
  if (!selectedTarget.value) return

  try {
    isScanning.value = true
    scanProgress.value = 0

    // 模拟扫描进度
    const progressTimer = setInterval(() => {
      scanProgress.value += Math.random() * 10
      if (scanProgress.value >= 100) {
        scanProgress.value = 100
        clearInterval(progressTimer)
      }
    }, 300)

    await dashboardStore.startScan(selectedTarget.value.id)

  } catch (error) {
    console.error('扫描失败:', error)
  } finally {
    isScanning.value = false
    scanProgress.value = 0
  }
}

const getStatusText = (status) => {
  const statusMap = {
    'online': '在线',
    'offline': '离线',
    'warning': '警告',
    'danger': '危险'
  }
  return statusMap[status] || '未知'
}

const formatLastScan = (timestamp) => {
  if (!timestamp) return '从未'
  return formatTime(timestamp, 'relative')
}

// 监听器
watch(() => scanData.value, () => {
  updateRadarChart()
}, { deep: true })

watch(() => selectedTarget.value, async () => {
  if (selectedTarget.value && radarChart) {
    updateRadarChart()
  }
})

// 生命周期
onMounted(() => {
  initRadarChart()
})

onUnmounted(() => {
  if (radarChart) {
    radarChart.dispose()
    radarChart = null
  }
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
/* 目标信息卡片 */
.target-info-card {
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.target-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xs);
}

.target-ip {
  font-family: var(--font-family-mono);
  font-weight: 600;
  color: var(--color-text-primary);
}

.target-status {
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 500;
}

.target-status.online {
  background-color: rgba(0, 212, 170, 0.2);
  color: var(--color-success);
}

.target-status.warning {
  background-color: rgba(255, 193, 7, 0.2);
  color: var(--color-warning);
}

.target-status.danger {
  background-color: rgba(244, 67, 54, 0.2);
  color: var(--color-danger);
}

.scan-meta {
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
}

/* 扫描状态 */
.scanning-state {
  text-align: center;
  padding: var(--spacing-xl) 0;
}

.scanning-animation {
  position: relative;
  width: 60px;
  height: 60px;
  margin: 0 auto var(--spacing-md);
}

.scan-wave {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 2px solid var(--color-text-accent);
  border-radius: 50%;
  animation: scan-pulse 2s ease-out infinite;
}

.scan-wave:nth-child(2) {
  animation-delay: 0.5s;
}

.scan-wave:nth-child(3) {
  animation-delay: 1s;
}

@keyframes scan-pulse {
  0% {
    transform: scale(0.1);
    opacity: 1;
  }
  100% {
    transform: scale(1.2);
    opacity: 0;
  }
}

.scan-progress {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
}

.progress-bar {
  flex: 1;
  height: 6px;
  background-color: var(--color-bg-primary);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-text-accent), #4ECDC4);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  min-width: 40px;
}

/* 雷达图 */
.radar-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.radar-chart {
  flex: 1;
  min-height: 200px;
}

/* 扫描统计 */
.scan-stats {
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--color-border);
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-sm);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-sm);
  background-color: var(--color-bg-primary);
  border-radius: var(--border-radius-sm);
  border-left: 3px solid var(--color-text-secondary);
}

.stat-item.critical {
  border-left-color: var(--color-danger);
}

.stat-item.high {
  border-left-color: #FF9800;
}

.stat-item.medium {
  border-left-color: var(--color-warning);
}

.stat-item.low {
  border-left-color: var(--color-info);
}

.stat-value {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--color-text-primary);
}

.stat-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  margin-top: var(--spacing-xs);
}
</style>