<template>
  <div class="panel traffic-panel">
    <div class="panel-header">
      <h3 class="panel-title">
        <span class="title-icon">📊</span>
        流量监控
      </h3>
      <div class="header-controls">
        <select v-model="timeRange" class="time-range-select">
          <option value="1h">近1小时</option>
          <option value="6h">近6小时</option>
          <option value="24h">近24小时</option>
          <option value="7d">近7天</option>
        </select>
        <button
            class="refresh-btn"
            @click="refreshTrafficData"
            :disabled="isRefreshing"
            title="刷新数据"
        >
          <span class="btn-icon" :class="{ spinning: isRefreshing }">🔄</span>
        </button>
      </div>
    </div>

    <div class="panel-content">
      <!-- 实时状态 -->
      <div class="realtime-stats">
        <div class="stat-item">
          <div class="stat-icon incoming">📥</div>
          <div class="stat-info">
            <div class="stat-value">{{ formatTraffic(realtimeStats.incoming) }}</div>
            <div class="stat-label">入站流量</div>
          </div>
          <div class="stat-trend" :class="getTrendClass(incomingTrend)">
            {{ getTrendIcon(incomingTrend) }}
          </div>
        </div>

        <div class="stat-item">
          <div class="stat-icon outgoing">📤</div>
          <div class="stat-info">
            <div class="stat-value">{{ formatTraffic(realtimeStats.outgoing) }}</div>
            <div class="stat-label">出站流量</div>
          </div>
          <div class="stat-trend" :class="getTrendClass(outgoingTrend)">
            {{ getTrendIcon(outgoingTrend) }}
          </div>
        </div>

        <div class="stat-item">
          <div class="stat-icon total">📊</div>
          <div class="stat-info">
            <div class="stat-value">{{ formatTraffic(realtimeStats.total) }}</div>
            <div class="stat-label">总流量</div>
          </div>
          <div class="stat-trend" :class="getTrendClass(totalTrend)">
            {{ getTrendIcon(totalTrend) }}
          </div>
        </div>
      </div>

      <!-- 流量图表 -->
      <div class="chart-section">
        <div class="chart-header">
          <h4>流量趋势图</h4>
          <div class="chart-legend">
            <div class="legend-item">
              <span class="legend-color incoming"></span>
              <span class="legend-text">入站</span>
            </div>
            <div class="legend-item">
              <span class="legend-color outgoing"></span>
              <span class="legend-text">出站</span>
            </div>
          </div>
        </div>

        <div v-if="isLoading" class="chart-loading">
          <div class="loading-spinner"></div>
          <p>加载流量数据...</p>
        </div>

        <div v-else ref="trafficChartRef" class="traffic-chart"></div>
      </div>

      <!-- 流量详情 -->
      <div class="traffic-details">
        <div class="details-tabs">
          <button
              class="tab-btn"
              :class="{ active: activeTab === 'summary' }"
              @click="activeTab = 'summary'"
          >
            统计摘要
          </button>
          <button
              class="tab-btn"
              :class="{ active: activeTab === 'protocols' }"
              @click="activeTab = 'protocols'"
          >
            协议分布
          </button>
          <button
              class="tab-btn"
              :class="{ active: activeTab === 'connections' }"
              @click="activeTab = 'connections'"
          >
            连接状态
          </button>
        </div>

        <!-- 统计摘要 -->
        <div v-if="activeTab === 'summary'" class="tab-content">
          <div class="summary-grid">
            <div class="summary-item">
              <span class="summary-label">峰值流量:</span>
              <span class="summary-value">{{ formatTraffic(trafficSummary.peakTraffic) }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">平均流量:</span>
              <span class="summary-value">{{ formatTraffic(trafficSummary.avgTraffic) }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">总数据包:</span>
              <span class="summary-value">{{ formatNumber(trafficSummary.totalPackets) }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">活跃连接:</span>
              <span class="summary-value">{{ trafficSummary.activeConnections }}</span>
            </div>
          </div>
        </div>

        <!-- 协议分布 -->
        <div v-if="activeTab === 'protocols'" class="tab-content">
          <div class="protocols-list">
            <div
                v-for="protocol in protocolStats"
                :key="protocol.name"
                class="protocol-item"
            >
              <div class="protocol-info">
                <span class="protocol-name">{{ protocol.name }}</span>
                <span class="protocol-percentage">{{ protocol.percentage }}%</span>
              </div>
              <div class="protocol-bar">
                <div
                    class="protocol-fill"
                    :style="{
                    width: `${protocol.percentage}%`,
                    backgroundColor: protocol.color
                  }"
                ></div>
              </div>
              <div class="protocol-traffic">
                {{ formatTraffic(protocol.traffic) }}
              </div>
            </div>
          </div>
        </div>

        <!-- 连接状态 -->
        <div v-if="activeTab === 'connections'" class="tab-content">
          <div class="connections-grid">
            <div class="connection-card">
              <div class="connection-icon">🔗</div>
              <div class="connection-info">
                <div class="connection-value">{{ connectionStats.established }}</div>
                <div class="connection-label">已建立</div>
              </div>
            </div>

            <div class="connection-card">
              <div class="connection-icon">⏳</div>
              <div class="connection-info">
                <div class="connection-value">{{ connectionStats.timeWait }}</div>
                <div class="connection-label">等待</div>
              </div>
            </div>

            <div class="connection-card">
              <div class="connection-icon">🚫</div>
              <div class="connection-info">
                <div class="connection-value">{{ connectionStats.closed }}</div>
                <div class="connection-label">已关闭</div>
              </div>
            </div>

            <div class="connection-card">
              <div class="connection-icon">⚠️</div>
              <div class="connection-info">
                <div class="connection-value">{{ connectionStats.failed }}</div>
                <div class="connection-label">失败</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 告警信息 -->
      <Transition name="slide-up">
        <div v-if="trafficAlerts.length > 0" class="traffic-alerts">
          <div class="alerts-header">
            <h4>流量告警</h4>
            <button class="clear-alerts" @click="clearAlerts">
              清除全部
            </button>
          </div>
          <div class="alerts-list">
            <div
                v-for="alert in trafficAlerts"
                :key="alert.id"
                class="alert-item"
                :class="alert.level"
            >
              <div class="alert-icon">
                {{ getAlertIcon(alert.level) }}
              </div>
              <div class="alert-content">
                <div class="alert-message">{{ alert.message }}</div>
                <div class="alert-time">{{ formatTime(alert.timestamp, 'short') }}</div>
              </div>
              <button class="alert-close" @click="dismissAlert(alert.id)">
                ×
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useDashboardStore } from '@/stores/dashboard'
import { formatTraffic, formatTime, formatNumber } from '@/utils/format'
import * as echarts from 'echarts'

// Store
const dashboardStore = useDashboardStore()

// 响应式数据
const trafficChartRef = ref(null)
const timeRange = ref('1h')
const activeTab = ref('summary')
const isRefreshing = ref(false)
let trafficChart = null

// 模拟数据
const realtimeStats = ref({
  incoming: 1500000,    // 1.5MB/s
  outgoing: 800000,     // 800KB/s
  total: 2300000        // 2.3MB/s
})

const incomingTrend = ref(0.15)    // 15% 增长
const outgoingTrend = ref(-0.05)   // 5% 下降
const totalTrend = ref(0.08)       // 8% 增长

const protocolStats = ref([
  { name: 'HTTP', traffic: 1200000, percentage: 45, color: '#64FFDA' },
  { name: 'HTTPS', traffic: 800000, percentage: 30, color: '#4ECDC4' },
  { name: 'TCP', traffic: 400000, percentage: 15, color: '#FFC107' },
  { name: 'UDP', traffic: 200000, percentage: 7, color: '#FF9800' },
  { name: 'Other', traffic: 80000, percentage: 3, color: '#8892B0' }
])

const connectionStats = ref({
  established: 156,
  timeWait: 23,
  closed: 8,
  failed: 2
})

const trafficAlerts = ref([
  {
    id: 1,
    level: 'warning',
    message: '检测到异常大流量，建议检查网络状态',
    timestamp: new Date(Date.now() - 300000).toISOString()
  },
  {
    id: 2,
    level: 'info',
    message: 'HTTPS流量占比提升至30%',
    timestamp: new Date(Date.now() - 600000).toISOString()
  }
])

// 计算属性
const isLoading = computed(() => dashboardStore.isLoading)
const selectedTarget = computed(() => dashboardStore.selectedTarget)

const trafficSummary = computed(() => {
  return {
    peakTraffic: 3200000,     // 3.2MB
    avgTraffic: 1800000,      // 1.8MB
    totalPackets: 156780,
    activeConnections: connectionStats.value.established
  }
})

// 方法
const initTrafficChart = () => {
  if (!trafficChartRef.value) return

  trafficChart = echarts.init(trafficChartRef.value)

  const option = {
    backgroundColor: 'transparent',
    grid: {
      top: '10%',
      left: '5%',
      right: '5%',
      bottom: '15%',
      containLabel: true
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#112240',
      borderColor: '#64FFDA',
      borderWidth: 1,
      textStyle: {
        color: '#CCD6F6'
      },
      formatter: function (params) {
        let tooltip = `<div style="margin-bottom:4px">${params[0].axisValue}</div>`
        params.forEach(param => {
          const traffic = formatTraffic(param.value)
          tooltip += `<div style="display:flex;align-items:center;margin-bottom:2px">
            <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background-color:${param.color};margin-right:8px;"></span>
            <span style="margin-right:auto;">${param.seriesName}</span>
            <span style="font-weight:600">${traffic}</span>
          </div>`
        })
        return tooltip
      }
    },
    legend: {
      show: false
    },
    xAxis: {
      type: 'category',
      data: generateTimeLabels(),
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
        formatter: function (value) {
          return formatTraffic(value)
        }
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
        name: '入站流量',
        type: 'line',
        data: generateTrafficData('incoming'),
        smooth: true,
        lineStyle: {
          color: '#64FFDA',
          width: 2
        },
        itemStyle: {
          color: '#64FFDA'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(100, 255, 218, 0.3)' },
              { offset: 1, color: 'rgba(100, 255, 218, 0.05)' }
            ]
          }
        }
      },
      {
        name: '出站流量',
        type: 'line',
        data: generateTrafficData('outgoing'),
        smooth: true,
        lineStyle: {
          color: '#FFC107',
          width: 2
        },
        itemStyle: {
          color: '#FFC107'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(255, 193, 7, 0.3)' },
              { offset: 1, color: 'rgba(255, 193, 7, 0.05)' }
            ]
          }
        }
      }
    ]
  }

  trafficChart.setOption(option)

  // 响应式调整
  const resizeChart = () => {
    if (trafficChart) {
      trafficChart.resize()
    }
  }

  window.addEventListener('resize', resizeChart)

  return () => {
    window.removeEventListener('resize', resizeChart)
  }
}

const generateTimeLabels = () => {
  const labels = []
  const now = new Date()
  const interval = timeRange.value === '1h' ? 5 :
      timeRange.value === '6h' ? 30 :
          timeRange.value === '24h' ? 60 : 360 // 分钟

  const points = timeRange.value === '1h' ? 12 :
      timeRange.value === '6h' ? 12 :
          timeRange.value === '24h' ? 24 : 28

  for (let i = points; i >= 0; i--) {
    const time = new Date(now.getTime() - (i * interval * 60000))
    if (timeRange.value === '7d') {
      labels.push(time.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }))
    } else {
      labels.push(time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }))
    }
  }

  return labels
}

const generateTrafficData = (type) => {
  const baseValue = type === 'incoming' ? 1500000 : 800000
  const variance = baseValue * 0.3
  const points = timeRange.value === '1h' ? 12 :
      timeRange.value === '6h' ? 12 :
          timeRange.value === '24h' ? 24 : 28

  const data = []
  for (let i = 0; i <= points; i++) {
    const random = (Math.random() - 0.5) * variance
    const value = Math.max(0, baseValue + random)
    data.push(Math.floor(value))
  }

  return data
}

const getTrendClass = (trend) => {
  if (trend > 0) return 'up'
  if (trend < 0) return 'down'
  return 'stable'
}

const getTrendIcon = (trend) => {
  if (trend > 0) return '📈'
  if (trend < 0) return '📉'
  return '➡️'
}

const getAlertIcon = (level) => {
  const icons = {
    info: 'ℹ️',
    warning: '⚠️',
    error: '❌'
  }
  return icons[level] || 'ℹ️'
}

const refreshTrafficData = async () => {
  try {
    isRefreshing.value = true

    // 模拟数据刷新
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 更新实时统计
    realtimeStats.value = {
      incoming: Math.floor(Math.random() * 2000000) + 1000000,
      outgoing: Math.floor(Math.random() * 1000000) + 500000,
      total: 0
    }
    realtimeStats.value.total = realtimeStats.value.incoming + realtimeStats.value.outgoing

    // 刷新图表
    if (trafficChart) {
      const option = trafficChart.getOption()
      option.xAxis[0].data = generateTimeLabels()
      option.series[0].data = generateTrafficData('incoming')
      option.series[1].data = generateTrafficData('outgoing')
      trafficChart.setOption(option)
    }

    console.log('🔄 流量数据已刷新')

  } catch (error) {
    console.error('❌ 刷新失败:', error)
  } finally {
    isRefreshing.value = false
  }
}

const clearAlerts = () => {
  trafficAlerts.value = []
}

const dismissAlert = (alertId) => {
  const index = trafficAlerts.value.findIndex(alert => alert.id === alertId)
  if (index > -1) {
    trafficAlerts.value.splice(index, 1)
  }
}

// 监听时间范围变化
watch(timeRange, () => {
  if (trafficChart) {
    const option = trafficChart.getOption()
    option.xAxis[0].data = generateTimeLabels()
    option.series[0].data = generateTrafficData('incoming')
    option.series[1].data = generateTrafficData('outgoing')
    trafficChart.setOption(option)
  }
})

// 实时更新数据
let updateInterval = null

const startRealTimeUpdates = () => {
  updateInterval = setInterval(() => {
    // 更新实时统计（小幅波动）
    const incomingVariation = (Math.random() - 0.5) * 200000
    const outgoingVariation = (Math.random() - 0.5) * 100000

    realtimeStats.value.incoming += incomingVariation
    realtimeStats.value.outgoing += outgoingVariation
    realtimeStats.value.total = realtimeStats.value.incoming + realtimeStats.value.outgoing

    // 确保数值不为负
    realtimeStats.value.incoming = Math.max(0, realtimeStats.value.incoming)
    realtimeStats.value.outgoing = Math.max(0, realtimeStats.value.outgoing)

    // 更新趋势
    incomingTrend.value = (Math.random() - 0.5) * 0.3
    outgoingTrend.value = (Math.random() - 0.5) * 0.3
    totalTrend.value = (incomingTrend.value + outgoingTrend.value) / 2

  }, 3000) // 每3秒更新一次
}

// 生命周期
onMounted(() => {
  nextTick(() => {
    initTrafficChart()
    startRealTimeUpdates()
  })
})

onUnmounted(() => {
  if (trafficChart) {
    trafficChart.dispose()
  }
  if (updateInterval) {
    clearInterval(updateInterval)
  }
})
</script>

<style scoped>
.traffic-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 头部控件 */
.header-controls {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
}

.time-range-select {
  padding: var(--spacing-xs) var(--spacing-sm);
  border: 1px solid var(--color-border);
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
}

.time-range-select:focus {
  outline: none;
  border-color: var(--color-text-accent);
}

.refresh-btn {
  width: 32px;
  height: 32px;
  border: 1px solid var(--color-border);
  background-color: transparent;
  color: var(--color-text-secondary);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: all var(--transition-base);
  display: flex;
  align-items: center;
  justify-content: center;
}

.refresh-btn:hover:not(:disabled) {
  border-color: var(--color-text-accent);
  color: var(--color-text-accent);
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon.spinning {
  animation: spin 1s linear infinite;
}

/* 实时统计 */
.realtime-stats {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.stat-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
}

.stat-icon {
  font-size: var(--font-size-xl);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.stat-icon.incoming { background-color: rgba(100, 255, 218, 0.2); }
.stat-icon.outgoing { background-color: rgba(255, 193, 7, 0.2); }
.stat-icon.total { background-color: rgba(33, 150, 243, 0.2); }

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
}

.stat-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.stat-trend {
  font-size: var(--font-size-base);
}

.stat-trend.up { color: var(--color-success); }
.stat-trend.down { color: var(--color-danger); }
.stat-trend.stable { color: var(--color-text-secondary); }

/* 图表部分 */
.chart-section {
  margin-bottom: var(--spacing-lg);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.chart-header h4 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  font-weight: 600;
}

.chart-legend {
  display: flex;
  gap: var(--spacing-md);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.legend-color.incoming { background-color: #64FFDA; }
.legend-color.outgoing { background-color: #FFC107; }

.legend-text {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.chart-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: var(--color-text-secondary);
}

.chart-loading p {
  margin-top: var(--spacing-md);
  font-size: var(--font-size-sm);
}

.traffic-chart {
  width: 100%;
  height: 200px;
}

/* 流量详情 */
.traffic-details {
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  overflow: hidden;
  margin-bottom: var(--spacing-lg);
}

.details-tabs {
  display: flex;
  background-color: var(--color-bg-tertiary);
  border-bottom: 1px solid var(--color-border);
}

.tab-btn {
  flex: 1;
  padding: var(--spacing-md);
  background: none;
  border: none;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: all var(--transition-base);
  border-bottom: 2px solid transparent;
}

.tab-btn:hover {
  color: var(--color-text-primary);
  background-color: var(--color-bg-secondary);
}

.tab-btn.active {
  color: var(--color-text-accent);
  border-bottom-color: var(--color-text-accent);
  background-color: var(--color-bg-secondary);
}

.tab-content {
  padding: var(--spacing-lg);
}

/* 统计摘要 */
.summary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) 0;
  border-bottom: 1px solid var(--color-border);
}

.summary-item:last-child {
  border-bottom: none;
}

.summary-label {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.summary-value {
  color: var(--color-text-primary);
  font-weight: 600;
  font-size: var(--font-size-sm);
}

/* 协议分布 */
.protocols-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.protocol-item {
  display: grid;
  grid-template-columns: 1fr 100px 80px;
  gap: var(--spacing-md);
  align-items: center;
}

.protocol-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.protocol-name {
  font-weight: 500;
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
}

.protocol-percentage {
  color: var(--color-text-accent);
  font-size: var(--font-size-xs);
  font-weight: 600;
}

.protocol-bar {
  height: 6px;
  background-color: var(--color-bg-secondary);
  border-radius: 3px;
  overflow: hidden;
}

.protocol-fill {
  height: 100%;
  border-radius: 3px;
  transition: width var(--transition-base);
}

.protocol-traffic {
  text-align: right;
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
  font-family: var(--font-family-mono);
}

/* 连接状态 */
.connections-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
}

.connection-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  transition: all var(--transition-base);
}

.connection-card:hover {
  border-color: var(--color-border-light);
  transform: translateY(-1px);
}

.connection-icon {
  font-size: var(--font-size-lg);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-bg-primary);
  border-radius: 50%;
}

.connection-info {
  flex: 1;
  text-align: center;
}

.connection-value {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
}

.connection-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

/* 流量告警 */
.traffic-alerts {
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  overflow: hidden;
}

.alerts-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  background-color: var(--color-bg-tertiary);
  border-bottom: 1px solid var(--color-border);
}

.alerts-header h4 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  font-weight: 600;
}

.clear-alerts {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
  cursor: pointer;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  transition: all var(--transition-base);
}

.clear-alerts:hover {
  color: var(--color-text-accent);
  background-color: var(--color-bg-secondary);
}

.alerts-list {
  padding: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.alert-item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  background-color: var(--color-bg-secondary);
}

.alert-item.info { border-left: 3px solid var(--color-info); }
.alert-item.warning { border-left: 3px solid var(--color-warning); }
.alert-item.error { border-left: 3px solid var(--color-danger); }

.alert-icon {
  font-size: var(--font-size-base);
  flex-shrink: 0;
  margin-top: 2px;
}

.alert-content {
  flex: 1;
  min-width: 0;
}

.alert-message {
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-xs);
  line-height: 1.4;
}

.alert-time {
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
}

.alert-close {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  font-size: var(--font-size-lg);
  cursor: pointer;
  width: 20px;
  height: 20px;
  border-radius: var(--border-radius-sm);
  transition: all var(--transition-base);
  flex-shrink: 0;
}

.alert-close:hover {
  color: var(--color-text-primary);
  background-color: var(--color-bg-tertiary);
}

/* 动画效果 */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all var(--transition-base);
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .realtime-stats {
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .chart-header {
    flex-direction: column;
    gap: var(--spacing-sm);
    align-items: flex-start;
  }

  .chart-legend {
    align-self: center;
  }

  .details-tabs {
    flex-wrap: wrap;
  }

  .tab-btn {
    flex: none;
    min-width: 33.333%;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }

  .protocol-item {
    grid-template-columns: 1fr;
    gap: var(--spacing-sm);
  }

  .protocol-info {
    grid-column: 1;
  }

  .protocol-bar {
    grid-column: 1;
  }

  .protocol-traffic {
    grid-column: 1;
    text-align: left;
  }

  .connections-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .header-controls {
    flex-direction: column;
    gap: var(--spacing-xs);
    width: 100%;
  }

  .time-range-select {
    width: 100%;
  }

  .stat-item {
    flex-direction: column;
    text-align: center;
    gap: var(--spacing-sm);
  }

  .traffic-chart {
    height: 150px;
  }

  .details-tabs {
    flex-direction: column;
  }

  .tab-btn {
    border-bottom: none;
    border-right: 2px solid transparent;
  }

  .tab-btn.active {
    border-bottom: none;
    border-right-color: var(--color-text-accent);
  }
}