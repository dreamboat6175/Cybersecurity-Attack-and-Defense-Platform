<div class="stat-value">{{ vulnerabilityStats.low }}</div>
<div class="stat-label">低危</div>
</div>
</div>
</div>
</div>

<!-- 漏洞详情列表 -->
<div class="vulnerabilities-section">
<div class="section-header">
  <h4>漏洞详情</h4>
  <div class="section-controls">
    <select v-model="severityFilter" class="severity-filter">
      <option value="">全部级别</option>
      <option value="critical">严重</option>
      <option value="high">高危</option>
      <option value="medium">中危</option>
      <option value="low">低危</option>
    </select>
  </div>
</div>

<div class="vulnerabilities-list">
  <div
      v-for="vulnerability in filteredVulnerabilities"
      :key="vulnerability.id"
      class="vulnerability-item"
      :class="vulnerability.severity"
      @click="selectVulnerability(vulnerability)"
  >
    <div class="vuln-severity">
      <div class="severity-badge" :class="vulnerability.severity">
        {{ getSeverityIcon(vulnerability.severity) }}
      </div>
    </div>

    <div class="vuln-info">
      <div class="vuln-header">
        <h5 class="vuln-type">{{ vulnerability.type }}</h5>
        <span class="cvss-score">CVSS: {{ vulnerability.cvss }}</span>
      </div>
      <p class="vuln-description">{{ vulnerability.description }}</p>
    </div>

    <div class="vuln-expand">
                <span class="expand-icon">
                  {{ selectedVulnerability?.id === vulnerability.id ? '▼' : '▶' }}
                </span>
    </div>
  </div>

  <!-- 空状态 */
  <div v-if="filteredVulnerabilities.length === 0" class="empty-vulnerabilities">
    <div class="empty-icon">🔍</div>
    <p>没有找到相应级别的漏洞</p>
  </div>
</div>
</div>

<!-- 漏洞详细信息 -->
  <Transition name="slide-down">
    <div v-if="selectedVulnerability" class="vulnerability-details">
      <div class="details-header">
        <div class="vuln-title">
                <span class="severity-badge" :class="selectedVulnerability.severity">
                  {{ getSeverityIcon(selectedVulnerability.severity) }}
                </span>
          <h4>{{ selectedVulnerability.type }}</h4>
        </div>
        <button class="close-details" @click="selectedVulnerability = null">×</button>
      </div>

      <div class="details-content">
        <div class="detail-section">
          <h5>描述</h5>
          <p>{{ selectedVulnerability.description }}</p>
        </div>

        <div class="detail-section">
          <h5>风险评分</h5>
          <div class="cvss-info">
            <span class="cvss-score-large">{{ selectedVulnerability.cvss }}</span>
            <span class="cvss-level">{{ getCvssLevel(selectedVulnerability.cvss) }}</span>
          </div>
        </div>

        <div class="detail-section">
          <h5>修复建议</h5>
          <p class="recommendation">{{ selectedVulnerability.recommendation }}</p>
        </div>

        <div class="detail-actions">
          <button class="action-btn ignore-btn" @click="ignoreVulnerability(selectedVulnerability)">
            <span class="btn-icon">👁️‍🗨️</span>
            标记为已知
          </button>
          <button class="action-btn fix-btn" @click="markAsFixed(selectedVulnerability)">
            <span class="btn-icon">✅</span>
            标记为已修复
          </button>
        </div>
      </div>
    </div>
  </Transition>

  <!-- 扫描历史 -->
  <div class="history-section">
    <div class="section-header">
      <h4>扫描历史</h4>
    </div>
    <div class="scan-history">
      <div
          v-for="scan in scanHistory"
          :key="scan.id"
          class="history-item"
          @click="loadHistoryScan(scan)"
      >
        <div class="history-time">
          {{ formatTime(scan.timestamp, 'short') }}
        </div>
        <div class="history-stats">
          <span class="history-count critical">{{ scan.critical || 0 }}</span>
          <span class="history-count high">{{ scan.high || 0 }}</span>
          <span class="history-count medium">{{ scan.medium || 0 }}</span>
          <span class="history-count low">{{ scan.low || 0 }}</span>
        </div>
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
import { formatTime } from '@/utils/format'
import * as echarts from 'echarts'

// Store
const dashboardStore = useDashboardStore()

// 响应式数据
const radarChartRef = ref(null)
const selectedVulnerability = ref(null)
const severityFilter = ref('')
const isScanning = ref(false)
const isRefreshing = ref(false)
const scanProgress = ref(0)
let radarChart = null
let scanInterval = null

// 模拟扫描历史数据
const scanHistory = ref([
  { id: '1', timestamp: new Date(Date.now() - 86400000).toISOString(), critical: 2, high: 5, medium: 8, low: 12 },
  { id: '2', timestamp: new Date(Date.now() - 172800000).toISOString(), critical: 1, high: 3, medium: 6, low: 10 },
  { id: '3', timestamp: new Date(Date.now() - 259200000).toISOString(), critical: 3, high: 7, medium: 9, low: 15 }
])

// 计算属性
const selectedTarget = computed(() => dashboardStore.selectedTarget)
const vulnerabilityStats = computed(() => dashboardStore.vulnerabilityStats)
const scanResults = computed(() => dashboardStore.scanResults)

const hasScanResults = computed(() => {
  return scanResults.value && scanResults.value.radar && scanResults.value.radar.data.length > 0
})

const filteredVulnerabilities = computed(() => {
  if (!scanResults.value?.details) return []

  let vulnerabilities = [...scanResults.value.details]

  if (severityFilter.value) {
    vulnerabilities = vulnerabilities.filter(v => v.severity === severityFilter.value)
  }

  // 按严重程度排序
  const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
  vulnerabilities.sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity])

  return vulnerabilities
})

// 方法
const initRadarChart = () => {
  if (!radarChartRef.value || !hasScanResults.value) return

  radarChart = echarts.init(radarChartRef.value)

  const option = {
    backgroundColor: 'transparent',
    radar: {
      shape: 'polygon',
      center: ['50%', '50%'],
      radius: '70%',
      startAngle: 90,
      splitNumber: 5,
      axisName: {
        color: '#CCD6F6',
        fontSize: 12
      },
      splitLine: {
        lineStyle: {
          color: '#233554',
          width: 1
        }
      },
      splitArea: {
        show: true,
        areaStyle: {
          color: ['rgba(100, 255, 218, 0.05)', 'rgba(100, 255, 218, 0.1)']
        }
      },
      axisLine: {
        lineStyle: {
          color: '#233554'
        }
      },
      indicator: scanResults.value.radar.indicators
    },
    series: [{
      name: '漏洞扫描',
      type: 'radar',
      data: [{
        value: scanResults.value.radar.data[0].value,
        name: '风险等级',
        areaStyle: {
          color: 'rgba(100, 255, 218, 0.3)'
        },
        lineStyle: {
          color: '#64FFDA',
          width: 2
        },
        itemStyle: {
          color: '#64FFDA',
          borderColor: '#64FFDA',
          borderWidth: 2
        }
      }]
    }]
  }

  radarChart.setOption(option)

  // 响应式调整
  const resizeChart = () => {
    if (radarChart) {
      radarChart.resize()
    }
  }

  window.addEventListener('resize', resizeChart)

  return () => {
    window.removeEventListener('resize', resizeChart)
  }
}

const startScan = async () => {
  if (!selectedTarget.value || isScanning.value) return

  try {
    isScanning.value = true
    scanProgress.value = 0

    // 模拟扫描进度
    scanInterval = setInterval(() => {
      scanProgress.value += Math.random() * 10
      if (scanProgress.value >= 100) {
        scanProgress.value = 100
        completeScan()
      }
    }, 500)

    console.log('🔍 开始扫描:', selectedTarget.value.ip)

  } catch (error) {
    console.error('❌ 扫描启动失败:', error)
    isScanning.value = false
  }
}

const completeScan = async () => {
  try {
    // 清除扫描间隔
    if (scanInterval) {
      clearInterval(scanInterval)
      scanInterval = null
    }

    // 等待一段时间模拟扫描完成
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 加载扫描结果
    await dashboardStore.loadVulnerabilityScan(selectedTarget.value.id)

    console.log('✅ 扫描完成')

  } catch (error) {
    console.error('❌ 扫描失败:', error)
  } finally {
    isScanning.value = false
    scanProgress.value = 0
  }
}

const cancelScan = () => {
  if (scanInterval) {
    clearInterval(scanInterval)
    scanInterval = null
  }
  isScanning.value = false
  scanProgress.value = 0
  console.log('🛑 扫描已取消')
}

const refreshScan = async () => {
  if (!selectedTarget.value || isRefreshing.value) return

  try {
    isRefreshing.value = true
    await dashboardStore.loadVulnerabilityScan(selectedTarget.value.id)
    console.log('🔄 扫描数据已刷新')
  } catch (error) {
    console.error('❌ 刷新失败:', error)
  } finally {
    isRefreshing.value = false
  }
}

const selectVulnerability = (vulnerability) => {
  selectedVulnerability.value = selectedVulnerability.value?.id === vulnerability.id ? null : vulnerability
}

const getSeverityIcon = (severity) => {
  const icons = {
    critical: '🔴',
    high: '🟠',
    medium: '🟡',
    low: '🟢'
  }
  return icons[severity] || '⚪'
}

const getCvssLevel = (score) => {
  const numScore = parseFloat(score)
  if (numScore >= 9.0) return '严重'
  if (numScore >= 7.0) return '高危'
  if (numScore >= 4.0) return '中危'
  return '低危'
}

const getVulnerabilityLevel = (count) => {
  if (count >= 10) return 'critical'
  if (count >= 5) return 'high'
  if (count >= 1) return 'medium'
  return 'low'
}

const getDotStyle = (index) => {
  const angle = (index * 45) - 90 // 每个点间隔45度，从顶部开始
  const radius = 30
  const x = Math.cos(angle * Math.PI / 180) * radius
  const y = Math.sin(angle * Math.PI / 180) * radius

  return {
    transform: `translate(${x}px, ${y}px)`,
    animationDelay: `${index * 0.1}s`
  }
}

const ignoreVulnerability = (vulnerability) => {
  console.log('👁️‍🗨️ 标记为已知:', vulnerability.type)
  // 这里可以调用API标记漏洞
  selectedVulnerability.value = null
}

const markAsFixed = (vulnerability) => {
  console.log('✅ 标记为已修复:', vulnerability.type)
  // 这里可以调用API标记漏洞已修复
  selectedVulnerability.value = null
}

const loadHistoryScan = (scan) => {
  console.log('📜 加载历史扫描:', scan.id)
  // 这里可以加载历史扫描数据
}

// 监听数据变化
watch([hasScanResults], () => {
  if (hasScanResults.value) {
    nextTick(() => {
      initRadarChart()
    })
  }
})

watch(selectedTarget, (newTarget, oldTarget) => {
  if (newTarget?.id !== oldTarget?.id) {
    selectedVulnerability.value = null
    severityFilter.value = ''
  }
})

// 生命周期
onMounted(() => {
  if (hasScanResults.value) {
    nextTick(() => {
      initRadarChart()
    })
  }
})

onUnmounted(() => {
  if (radarChart) {
    radarChart.dispose()
  }
  if (scanInterval) {
    clearInterval(scanInterval)
  }
})
</script>

<style scoped>
.scan-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 头部信息 */
.header-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-border);
  background-color: transparent;
  color: var(--color-text-secondary);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: all var(--transition-base);
}

.action-btn:hover {
  border-color: var(--color-text-accent);
  color: var(--color-text-accent);
}

.ignore-btn:hover {
  border-color: var(--color-warning);
  color: var(--color-warning);
}

.fix-btn:hover {
  border-color: var(--color-success);
  color: var(--color-success);
}

/* 扫描历史 */
.history-section {
  min-height: 120px;
}

.scan-history {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  max-height: 150px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: all var(--transition-base);
}

.history-item:hover {
  border-color: var(--color-border-light);
  background-color: var(--color-bg-tertiary);
}

.history-time {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  font-family: var(--font-family-mono);
}

.history-stats {
  display: flex;
  gap: var(--spacing-sm);
}

.history-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 18px;
  font-size: var(--font-size-xs);
  font-weight: 600;
  border-radius: var(--border-radius-sm);
  padding: 0 var(--spacing-xs);
}

.history-count.critical { background-color: var(--color-danger); color: white; }
.history-count.high { background-color: #FF9800; color: white; }
.history-count.medium { background-color: var(--color-warning); color: var(--color-bg-primary); }
.history-count.low { background-color: var(--color-success); color: white; }

/* 动画效果 */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all var(--transition-base);
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-sm);
  }

  .vulnerability-item {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }

  .vuln-header {
    width: 100%;
  }

  .detail-actions {
    flex-direction: column;
  }

  .history-item {
    flex-direction: column;
    gap: var(--spacing-sm);
    align-items: flex-start;
  }

  .cvss-info {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .header-info {
    flex-direction: column;
    gap: var(--spacing-xs);
    align-items: flex-start;
  }

  .scan-results {
    gap: var(--spacing-md);
  }

  .section-header {
    flex-direction: column;
    gap: var(--spacing-sm);
    align-items: flex-start;
  }
}(--spacing-sm);
}

.target-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.target-name {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.vulnerability-count {
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 600;
}

.vulnerability-count.critical { background-color: rgba(244, 67, 54, 0.2); color: var(--color-danger); }
.vulnerability-count.high { background-color: rgba(255, 152, 0, 0.2); color: #FF9800; }
.vulnerability-count.medium { background-color: rgba(255, 193, 7, 0.2); color: var(--color-warning); }
.vulnerability-count.low { background-color: rgba(0, 212, 170, 0.2); color: var(--color-success); }

/* 状态页面 */
.no-target-state,
.no-scan-state,
.scanning-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
}

.state-icon {
  font-size: 4rem;
  margin-bottom: var(--spacing-lg);
  opacity: 0.6;
}

.state-text {
  font-size: var(--font-size-lg);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
}

.state-hint {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-lg);
}

.start-scan-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  background: linear-gradient(135deg, var(--color-text-accent), #4ECDC4);
  color: var(--color-bg-primary);
  border: none;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-size: var(--font-size-base);
  font-weight: 600;
  transition: all var(--transition-base);
}

.start-scan-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

/* 扫描动画 */
.scanning-animation {
  margin-bottom: var(--spacing-lg);
}

.scan-radar {
  position: relative;
  width: 120px;
  height: 120px;
  border: 2px solid var(--color-text-accent);
  border-radius: 50%;
  margin: 0 auto var(--spacing-lg);
}

.radar-sweep {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 2px;
  height: 50px;
  background: linear-gradient(to top, var(--color-text-accent), transparent);
  transform-origin: bottom center;
  transform: translate(-50%, -100%) rotate(0deg);
  animation: radar-sweep 2s linear infinite;
}

@keyframes radar-sweep {
  0% { transform: translate(-50%, -100%) rotate(0deg); }
  100% { transform: translate(-50%, -100%) rotate(360deg); }
}

.radar-dots {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.dot {
  position: absolute;
  width: 6px;
  height: 6px;
  background-color: var(--color-text-accent);
  border-radius: 50%;
  opacity: 0;
  animation: dot-pulse 2s ease-in-out infinite;
}

@keyframes dot-pulse {
  0%, 20% { opacity: 0; transform: scale(0.5); }
  40% { opacity: 1; transform: scale(1); }
  60%, 100% { opacity: 0; transform: scale(0.5); }
}

.scanning-text {
  font-size: var(--font-size-lg);
  color: var(--color-text-accent);
  margin-bottom: var(--spacing-sm);
}

.scanning-progress {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-md);
}

.progress-bar {
  width: 200px;
  height: 6px;
  background-color: var(--color-bg-primary);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: var(--spacing-lg);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-text-accent), #4ECDC4);
  transition: width var(--transition-base);
}

.cancel-scan-btn {
  padding: var(--spacing-sm) var(--spacing-lg);
  background-color: transparent;
  border: 1px solid var(--color-danger);
  color: var(--color-danger);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: all var(--transition-base);
}

.cancel-scan-btn:hover {
  background-color: var(--color-danger);
  color: white;
}

/* 扫描结果 */
.scan-results {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  overflow-y: auto;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.section-header h4 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  font-weight: 600;
}

/* 雷达图 */
.radar-section {
  min-height: 250px;
}

.chart-controls {
  display: flex;
  gap: var(--spacing-sm);
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

.radar-chart {
  width: 100%;
  height: 200px;
}

/* 统计卡片 */
.stats-section {
  margin-bottom: var(--spacing-md);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-sm);
}

.stat-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  transition: all var(--transition-base);
}

.stat-card:hover {
  border-color: var(--color-border-light);
  transform: translateY(-1px);
}

.stat-card.critical { border-left: 3px solid var(--color-danger); }
.stat-card.high { border-left: 3px solid #FF9800; }
.stat-card.medium { border-left: 3px solid var(--color-warning); }
.stat-card.low { border-left: 3px solid var(--color-success); }

.stat-icon {
  font-size: var(--font-size-lg);
}

.stat-info {
  flex: 1;
  text-align: center;
}

.stat-value {
  display: block;
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
}

.stat-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  font-weight: 500;
}

/* 漏洞列表 */
.vulnerabilities-section {
  flex: 1;
  min-height: 200px;
}

.section-controls {
  display: flex;
  gap: var(--spacing-sm);
}

.severity-filter {
  padding: var(--spacing-xs) var(--spacing-sm);
  border: 1px solid var(--color-border);
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
}

.vulnerabilities-list {
  max-height: 300px;
  overflow-y: auto;
}

.vulnerability-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  margin-bottom: var(--spacing-sm);
  cursor: pointer;
  transition: all var(--transition-base);
}

.vulnerability-item:hover {
  border-color: var(--color-border-light);
  transform: translateY(-1px);
}

.vulnerability-item.critical { border-left: 3px solid var(--color-danger); }
.vulnerability-item.high { border-left: 3px solid #FF9800; }
.vulnerability-item.medium { border-left: 3px solid var(--color-warning); }
.vulnerability-item.low { border-left: 3px solid var(--color-success); }

.vuln-severity {
  flex-shrink: 0;
}

.severity-badge {
  font-size: var(--font-size-base);
}

.vuln-info {
  flex: 1;
  min-width: 0;
}

.vuln-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xs);
}

.vuln-type {
  margin: 0;
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text-primary);
}

.cvss-score {
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
  color: var(--color-text-accent);
  background-color: rgba(100, 255, 218, 0.1);
  padding: 2px 6px;
  border-radius: var(--border-radius-sm);
}

.vuln-description {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: 1.4;
}

.vuln-expand {
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
}

.empty-vulnerabilities {
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--color-text-secondary);
}

.empty-icon {
  font-size: 3rem;
  opacity: 0.5;
  margin-bottom: var(--spacing-md);
}

/* 漏洞详情 */
.vulnerability-details {
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  overflow: hidden;
  margin-top: var(--spacing-md);
}

.details-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md);
  background-color: var(--color-bg-tertiary);
  border-bottom: 1px solid var(--color-border);
}

.vuln-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.vuln-title h4 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
}

.close-details {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  font-size: var(--font-size-lg);
  cursor: pointer;
  width: 24px;
  height: 24px;
  border-radius: var(--border-radius-sm);
  transition: all var(--transition-base);
}

.close-details:hover {
  background-color: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

.details-content {
  padding: var(--spacing-md);
}

.detail-section {
  margin-bottom: var(--spacing-lg);
}

.detail-section:last-child {
  margin-bottom: 0;
}

.detail-section h5 {
  margin: 0 0 var(--spacing-sm);
  color: var(--color-text-accent);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.detail-section p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  line-height: 1.5;
}

.cvss-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.cvss-score-large {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--color-text-accent);
  font-family: var(--font-family-mono);
}

.cvss-level {
  padding: var(--spacing-xs) var(--spacing-sm);
  background-color: var(--color-bg-secondary);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

.recommendation {
  background-color: var(--color-bg-secondary);
  padding: var(--spacing-md);
  border-radius: var(--border-radius-sm);
  border-left: 3px solid var(--color-text-accent);
}

.detail-actions {
  display: flex;
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var<template>
  <div class="panel scan-panel">
  <div class="panel-header">
  <h3 class="panel-title">
  <span class="title-icon">🔍</span>
  漏洞扫描
  </h3>
  <div class="header-info">
  <div v-if="selectedTarget" class="target-info">
  <span class="target-name">{{ selectedTarget.name || selectedTarget.ip }}</span>
<span class="vulnerability-count" :class="getVulnerabilityLevel(vulnerabilityStats.critical + vulnerabilityStats.high)">
{{ vulnerabilityStats.total }} 个漏洞
</span>
</div>
</div>
</div>

<div class="panel-content">
<!-- 无目标状态 -->
<div v-if="!selectedTarget" class="no-target-state">
<div class="state-icon">🎯</div>
<p class="state-text">请先选择扫描目标</p>
<p class="state-hint">从左侧目标列表中选择一个目标进行漏洞扫描</p>
</div>

<!-- 有目标但无扫描结果 -->
<div v-else-if="!hasScanResults && !isScanning" class="no-scan-state">
<div class="state-icon">🔍</div>
<p class="state-text">暂无扫描数据</p>
<button class="start-scan-btn" @click="startScan">
<span class="btn-icon">🚀</span>
开始扫描
</button>
</div>

<!-- 扫描中状态 -->
<div v-else-if="isScanning" class="scanning-state">
<div class="scanning-animation">
<div class="scan-radar">
<div class="radar-sweep"></div>
<div class="radar-dots">
<div class="dot" v-for="i in 8" :key="i" :style="getDotStyle(i)"></div>
</div>
</div>
</div>
<p class="scanning-text">正在扫描 {{ selectedTarget.ip }}...</p>
<p class="scanning-progress">进度: {{ scanProgress }}%</p>
<div class="progress-bar">
<div class="progress-fill" :style="{ width: `${scanProgress}%` }"></div>
</div>
<button class="cancel-scan-btn" @click="cancelScan">
取消扫描
</button>
</div>

<!-- 扫描结果 -->
<div v-else class="scan-results">
<!-- 雷达图 -->
<div class="radar-section">
<div class="section-header">
<h4>漏洞雷达图</h4>
<div class="chart-controls">
<button
class="refresh-btn"
@click="refreshScan"
:disabled="isRefreshing"
title="刷新扫描"
>
<span class="btn-icon" :class="{ spinning: isRefreshing }">🔄</span>
</button>
</div>
</div>
<div ref="radarChartRef" class="radar-chart"></div>
</div>

<!-- 漏洞统计 -->
<div class="stats-section">
<div class="stats-grid">
<div class="stat-card critical">
<div class="stat-icon">🔴</div>
<div class="stat-info">
<div class="stat-value">{{ vulnerabilityStats.critical }}</div>
<div class="stat-label">严重</div>
</div>
</div>
<div class="stat-card high">
<div class="stat-icon">🟠</div>
<div class="stat-info">
<div class="stat-value">{{ vulnerabilityStats.high }}</div>
<div class="stat-label">高危</div>
</div>
</div>
<div class="stat-card medium">
<div class="stat-icon">🟡</div>
<div class="stat-info">
<div class="stat-value">{{ vulnerabilityStats.medium }}</div>
<div class="stat-label">中危</div>
</div>
</div>
<div class="stat-card low">
<div class="stat-icon">🟢</div>
<div class="stat-info">
<div class="stat-value">{{ vulnerabilityStats.low }}</div>