<template>
  <div class="panel">
    <div class="panel-header">
      <h3 class="panel-title">
        <span class="title-icon">📊</span>
        攻击流量
      </h3>
      <div class="panel-actions">
        <select v-model="timeRange" class="time-select">
          <option value="1h">近1小时</option>
          <option value="6h">近6小时</option>
          <option value="24h">近24小时</option>
          <option value="7d">近7天</option>
        </select>
        <button class="action-btn" @click="refreshData" :disabled="isLoading">
          <span class="btn-icon" :class="{ spinning: isLoading }">🔄</span>
        </button>
      </div>
    </div>

    <div class="panel-content">
      <!-- 实时统计 -->
      <div class="traffic-stats">
        <div class="stat-card">
          <div class="stat-icon">📈</div>
          <div class="stat-info">
            <span class="stat-value">{{ formatNumber(realtimeTraffic.total) }}</span>
            <span class="stat-label">总流量</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⬇️</div>
          <div class="stat-info">
            <span class="stat-value">{{ formatNumber(realtimeTraffic.incoming) }}</span>
            <span class="stat-label">入站</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⬆️</div>
          <div class="stat-info">
            <span class="stat-value">{{ formatNumber(realtimeTraffic.outgoing) }}</span>
            <span class="stat-label">出站</span>
          </div>
        </div>
      </div>

      <!-- 流量图表 -->
      <div class="chart-container">
        <div v-if="isLoading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>加载流量数据...</p>
        </div>
        <div v-else ref="chartRef" class="traffic-chart"></div>
      </div>

      <!-- 攻击类型分布 -->
      <div class="attack-distribution">
        <h4>攻击类型分布</h4>
        <div class="distribution-list">
          <div
              v-for="item in attackTypeDistribution"
              :key="item.type"
              class="distribution-item"
          >
            <div class="item-info">
              <span class="item-name">{{ item.name }}</span>
              <span class="item-count">{{ item.count }}次</span>
            </div>
            <div class="item-progress">
              <div
                  class="progress-fill"
                  :style="{
                  width: item.percentage + '%',
                  backgroundColor: item.color
                }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useDashboardStore } from '@/stores/dashboard'
import * as echarts from 'echarts'
import { formatNumber } from '@/utils/format'

const dashboardStore = useDashboardStore()

// 响应式数据
const chartRef = ref(null)
const timeRange = ref('6h')
const isLoading = ref(false)
let trafficChart = null

// 计算属性
const realtimeTraffic = computed(() => dashboardStore.realtimeTraffic)
const trafficData = computed(() => dashboardStore.trafficData[timeRange.value] || {})

const attackTypeDistribution = computed(() => {
  const types = [
    { type: 'sql_injection', name: 'SQL注入', color: '#F44336' },
    { type: 'xss', name: 'XSS攻击', color: '#FF9800' },
    { type: 'brute_force', name: '暴力破解', color: '#FFC107' },
    { type: 'dos', name: 'DOS攻击', color: '#2196F3' }
  ]

  const logs = dashboardStore.recentAttackLogs
  const totalCount = logs.length

  return types.map(type => {
    const count = logs.filter(log => log.type === type.type).length
    const percentage = totalCount > 0 ? (count / totalCount) * 100 : 0

    return {
      ...type,
      count,
      percentage: Math.round(percentage)
    }
  }).sort((a, b) => b.count - a.count)
})

// ECharts配置
const getChartOption = () => ({
  backgroundColor: 'transparent',
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    top: '10%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    data: trafficData.value.timestamps || [],
    axisLine: {
      lineStyle: { color: '#233554' }
    },
    axisLabel: {
      color: '#8892B0',
      fontSize: 11
    },
    splitLine: {
      show: false
    }
  },
  yAxis: {
    type: 'value',
    axisLine: {
      lineStyle: { color: '#233554' }
    },
    axisLabel: {
      color: '#8892B0',
      fontSize: 11,
      formatter: (value) => formatNumber(value)
    },
    splitLine: {
      lineStyle: {
        color: '#233554',
        type: 'dashed'
      }
    }
  },
  series: [
    {
      name: '攻击流量',
      type: 'line',
      data: trafficData.value.values || [],
      smooth: true,
      lineStyle: {
        color: '#64FFDA',
        width: 2
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(100, 255, 218, 0.3)' },
            { offset: 1, color: 'rgba(100, 255, 218, 0.05)' }
          ]
        }
      },
      itemStyle: {
        color: '#64FFDA',
        borderWidth: 2,
        borderColor: '#64FFDA'
      },
      emphasis: {
        itemStyle: {
          color: '#64FFDA',
          borderWidth: 3,
          shadowBlur: 10,
          shadowColor: 'rgba(100, 255, 218, 0.5)'
        }
      }
    }
  ],
  tooltip: {
    trigger: 'axis',
    backgroundColor: '#112240',
    borderColor: '#233554',
    textStyle: {
      color: '#CCD6F6'
    },
    formatter: (params) => {
      if (params && params.length > 0) {
        const param = params[0]
        return `时间: ${param.name}<br/>流量: ${formatNumber(param.value)}`
      }
      return ''
    }
  }
})

// 方法
const initChart = async () => {
  await nextTick()

  if (chartRef.value && !trafficChart) {
    trafficChart = echarts.init(chartRef.value, 'dark')
    updateChart()

    // 监听窗口大小变化
    window.addEventListener('resize', handleResize)
  }
}

const updateChart = () => {
  if (trafficChart) {
    trafficChart.setOption(getChartOption(), true)
  }
}

const handleResize = () => {
  if (trafficChart) {
    trafficChart.resize()
  }
}

const refreshData = async () => {
  try {
    isLoading.value = true
    await dashboardStore.refreshTrafficData(timeRange.value)
  } catch (error) {
    console.error('刷新流量数据失败:', error)
  } finally {
    isLoading.value = false
  }
}

// 监听器
watch(() => timeRange.value, () => {
  refreshData()
})

watch(() => trafficData.value, () => {
  updateChart()
}, { deep: true })

// 生命周期
onMounted(() => {
  initChart()
  refreshData()
})

onUnmounted(() => {
  if (trafficChart) {
    trafficChart.dispose()
    trafficChart = null
  }
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
/* 流量统计卡片 */
.traffic-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.stat-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
}

.stat-icon {
  font-size: var(--font-size-lg);
  opacity: 0.8;
}

.stat-info {
  flex: 1;
  text-align: center;
}

.stat-value {
  display: block;
  font-size: var(--font-size-base);
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
}

.stat-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

/* 图表容器 */
.chart-container {
  flex: 1;
  min-height: 200px;
  margin-bottom: var(--spacing-md);
  position: relative;
}

.traffic-chart {
  width: 100%;
  height: 100%;
  min-height: 200px;
}

/* 时间选择器 */
.time-select {
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  margin-right: var(--spacing-sm);
}

.time-select:focus {
  outline: none;
  border-color: var(--color-text-accent);
}

/* 攻击类型分布 */
.attack-distribution {
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--color-border);
}

.attack-distribution h4 {
  margin: 0 0 var(--spacing-md);
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

.distribution-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.distribution-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.item-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-name {
  font-size: var(--font-size-xs);
  color: var(--color-text-primary);
}

.item-count {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  font-family: var(--font-family-mono);
}

.item-progress {
  height: 4px;
  background-color: var(--color-bg-primary);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  transition: width 0.3s ease;
  border-radius: 2px;
}

/* 响应式 */
@media (max-width: 768px) {
  .traffic-stats {
    grid-template-columns: 1fr;
  }

  .stat-card {
    flex-direction: column;
    text-align: center;
  }
}
</style>