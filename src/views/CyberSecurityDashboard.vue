<!-- CyberSecurityDashboard.vue - 重构版本 -->
<template>
  <div class="cybersec-dashboard">
    <!-- 左侧面板 -->
    <div class="left-panel">
      <!-- 目标列表 -->
      <div class="panel targets-panel">
        <div class="panel-header">
          <h3>TARGETS</h3>
        </div>
        <div class="panel-content">
          <div
              v-for="target in targets"
              :key="target.ip"
              :class="['target-item', { active: selectedTarget === target.ip }]"
              @click="selectTarget(target.ip)"
          >
            {{ target.ip }}
          </div>
        </div>
      </div>

      <!-- 攻击方法 -->
      <div class="panel methods-panel">
        <div class="panel-header">
          <h3>ATTACK METHODS</h3>
        </div>
        <div class="panel-content">
          <div
              v-for="method in attackMethods"
              :key="method.id"
              class="method-item"
              @click="selectMethod(method)"
          >
            <div class="method-icon">
              <i :class="method.icon"></i>
            </div>
            <span>{{ method.name }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 中间面板 -->
    <div class="center-panel">
      <!-- 网络拓扑图 -->
      <div class="panel network-panel">
        <div class="panel-header">
          <h3>NETWORK MAP</h3>
        </div>
        <div class="panel-content">
          <div class="network-container">
            <!-- 中心节点 -->
            <div class="center-node" :class="{ compromised: centerNodeStatus === 'compromised' }">
              <div class="node-icon">
                <i class="fas fa-desktop"></i>
              </div>
              <div class="node-label">{{ centerNode }}</div>
            </div>

            <!-- 周围节点 -->
            <div
                v-for="(node, index) in networkNodes"
                :key="node.ip"
                :class="['network-node', `position-${index + 1}`, { warning: node.status === 'warning' }]"
            >
              <div class="node-icon">
                <i class="fas fa-desktop"></i>
              </div>
              <div class="node-label">{{ node.ip }}</div>
              <div v-if="node.status === 'warning'" class="warning-indicator">
                <i class="fas fa-exclamation-triangle"></i>
              </div>
            </div>

            <!-- 连接线 -->
            <svg class="connections" viewBox="0 0 400 400">
              <g v-for="(connection, index) in connections" :key="index">
                <line
                    :x1="connection.x1"
                    :y1="connection.y1"
                    :x2="connection.x2"
                    :y2="connection.y2"
                    :class="['connection-line', connection.type]"
                    :stroke-dasharray="connection.type === 'attack' ? '5,5' : 'none'"
                />
              </g>
            </svg>
          </div>
        </div>
      </div>

      <!-- 攻击日志 -->
      <div class="panel logs-panel">
        <div class="panel-header">
          <h3>ATTACK LOG</h3>
        </div>
        <div class="panel-content">
          <div class="log-table">
            <div class="table-header">
              <div class="col-time">TIME</div>
              <div class="col-target">TARGET</div>
              <div class="col-description">DESCRIPTION</div>
            </div>
            <div class="table-body">
              <div
                  v-for="log in attackLogs"
                  :key="log.id"
                  class="log-row"
              >
                <div class="col-time">{{ log.time }}</div>
                <div class="col-target">{{ log.target }}</div>
                <div class="col-description">{{ log.description }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧面板 -->
    <div class="right-panel">
      <!-- 漏洞扫描 -->
      <div class="panel scan-panel">
        <div class="panel-header">
          <h3>VULNERABILITY SCAN</h3>
        </div>
        <div class="panel-content">
          <div class="scan-chart">
            <canvas ref="scanChart" width="200" height="200"></canvas>
            <div class="chart-overlay">
              <div class="score-display">{{ vulnerabilityScore }}</div>
              <div class="score-label">安全评分</div>
            </div>
          </div>
          <div class="scan-metrics">
            <div class="metric">
              <span class="metric-label">SCORE</span>
              <span class="metric-value">{{ vulnerabilityScore }}</span>
            </div>
            <div class="metric">
              <span class="metric-label">SIGRE</span>
              <span class="metric-value">{{ sigreScore }}</span>
            </div>
            <div class="metric">
              <span class="metric-label">INTEGRITY</span>
              <span class="metric-value">{{ integrityScore }}</span>
            </div>
            <div class="metric">
              <span class="metric-label">AVAILABILITY</span>
              <span class="metric-value">{{ availabilityScore }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 攻击流量 -->
      <div class="panel traffic-panel">
        <div class="panel-header">
          <h3>ATTACK TRAFFIC</h3>
          <div class="traffic-indicator">+OTC</div>
        </div>
        <div class="panel-content">
          <div class="traffic-chart">
            <canvas ref="trafficChart" width="250" height="120"></canvas>
          </div>
          <div class="traffic-stats">
            <div class="stat-item">
              <span class="stat-value">{{ currentTraffic }}</span>
              <span class="stat-label">当前流量</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ peakTraffic }}</span>
              <span class="stat-label">峰值流量</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, nextTick } from 'vue'

export default {
  name: 'CyberSecurityDashboard',
  setup() {
    // 数据定义
    const selectedTarget = ref('')
    const centerNode = ref('192.168.1.10')
    const centerNodeStatus = ref('normal')
    const vulnerabilityScore = ref(87)
    const sigreScore = ref(92)
    const integrityScore = ref(85)
    const availabilityScore = ref(90)
    const currentTraffic = ref('1.2K')
    const peakTraffic = ref('5.8K')

    // 目标列表
    const targets = ref([
      { ip: '192.168.1.10' },
      { ip: '192.168.1.20' },
      { ip: '192.168.1.30' },
      { ip: '192.168.1.40' },
      { ip: '192.168.1.50' }
    ])

    // 攻击方法
    const attackMethods = ref([
      { id: 'vuln_scan', name: 'VULNERABILITY SCAN', icon: 'fas fa-search' },
      { id: 'brute_force', name: 'BRUTE FORCE', icon: 'fas fa-hammer' },
      { id: 'sql_injection', name: 'SQL INJECTION', icon: 'fas fa-database' },
      { id: 'command_injection', name: 'COMMAND INJECTION', icon: 'fas fa-terminal' },
      { id: 'dos', name: 'DENIAL OF SERVICE', icon: 'fas fa-ban' },
      { id: 'mitm', name: 'MAN-IN-THE-MIDDLE', icon: 'fas fa-user-secret' }
    ])

    // 网络节点
    const networkNodes = ref([
      { ip: '192.168.1.20', status: 'normal' },
      { ip: '192.168.1.30', status: 'warning' },
      { ip: '192.168.1.40', status: 'normal' },
      { ip: '192.168.1.50', status: 'normal' },
      { ip: '192.168.1.60', status: 'normal' },
      { ip: '192.168.1.70', status: 'normal' }
    ])

    // 连接线
    const connections = ref([
      { x1: 200, y1: 200, x2: 200, y2: 100, type: 'normal' },
      { x1: 200, y1: 200, x2: 300, y2: 150, type: 'attack' },
      { x1: 200, y1: 200, x2: 300, y2: 250, type: 'normal' },
      { x1: 200, y1: 200, x2: 200, y2: 300, type: 'normal' },
      { x1: 200, y1: 200, x2: 100, y2: 250, type: 'normal' },
      { x1: 200, y1: 200, x2: 100, y2: 150, type: 'normal' }
    ])

    // 攻击日志
    const attackLogs = ref([
      { id: 1, time: '10:34:21', target: '192.168.1.10', description: 'SQL injection attempt' },
      { id: 2, time: '10:32:49', target: '192.168.1.300', description: 'Command injection attempt' },
      { id: 3, time: '10:30:15', target: '192.168.1.20', description: 'Brute force attack' },
      { id: 4, time: '10:27:58', target: '192.168.1.10', description: 'Vulnerability scan' }
    ])

    // 方法
    const selectTarget = (ip) => {
      selectedTarget.value = ip
    }

    const selectMethod = (method) => {
      console.log('Selected method:', method)
    }

    // 绘制漏洞扫描图表
    const drawScanChart = () => {
      const canvas = document.querySelector('.scan-panel canvas')
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      const radius = 80

      // 清空画布
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // 绘制背景圆环
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
      ctx.strokeStyle = '#334155'
      ctx.lineWidth = 8
      ctx.stroke()

      // 绘制进度圆环
      const progress = vulnerabilityScore.value / 100
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * progress)
      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 8
      ctx.lineCap = 'round'
      ctx.stroke()

      // 绘制六边形
      const hexRadius = 40
      ctx.beginPath()
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3
        const x = centerX + hexRadius * Math.cos(angle)
        const y = centerY + hexRadius * Math.sin(angle)
        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }
      ctx.closePath()
      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 2
      ctx.stroke()
    }

    // 绘制流量图表
    const drawTrafficChart = () => {
      const canvas = document.querySelector('.traffic-panel canvas')
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      const width = canvas.width
      const height = canvas.height

      // 清空画布
      ctx.clearRect(0, 0, width, height)

      // 生成模拟数据
      const points = 50
      const data = []
      for (let i = 0; i < points; i++) {
        const baseValue = 100 + Math.sin(i * 0.1) * 50
        const noise = (Math.random() - 0.5) * 30
        data.push(Math.max(0, baseValue + noise))
      }

      // 绘制区域图
      ctx.beginPath()
      ctx.moveTo(0, height)

      data.forEach((value, index) => {
        const x = (index / (points - 1)) * width
        const y = height - (value / 200) * height
        if (index === 0) {
          ctx.lineTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })

      ctx.lineTo(width, height)
      ctx.closePath()

      // 填充渐变
      const gradient = ctx.createLinearGradient(0, 0, 0, height)
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.5)')
      gradient.addColorStop(1, 'rgba(59, 130, 246, 0.1)')
      ctx.fillStyle = gradient
      ctx.fill()

      // 绘制线条
      ctx.beginPath()
      data.forEach((value, index) => {
        const x = (index / (points - 1)) * width
        const y = height - (value / 200) * height
        if (index === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })
      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 2
      ctx.stroke()
    }

    // 生命周期
    onMounted(() => {
      nextTick(() => {
        drawScanChart()
        drawTrafficChart()
      })
    })

    return {
      selectedTarget,
      centerNode,
      centerNodeStatus,
      vulnerabilityScore,
      sigreScore,
      integrityScore,
      availabilityScore,
      currentTraffic,
      peakTraffic,
      targets,
      attackMethods,
      networkNodes,
      connections,
      attackLogs,
      selectTarget,
      selectMethod
    }
  }
}
</script>

<style scoped>
.cybersec-dashboard {
  display: grid;
  grid-template-columns: 280px 1fr 300px;
  gap: 16px;
  padding: 16px;
  height: 100vh;
  background: #0a1628;
  color: #e2e8f0;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  overflow: hidden;
}

/* 面板通用样式 */
.panel {
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid #334155;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 12px 16px;
  background: rgba(30, 41, 59, 0.8);
  border-bottom: 1px solid #334155;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h3 {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 1px;
  color: #94a3b8;
}

.panel-content {
  flex: 1;
  padding: 16px;
  overflow: auto;
}

/* 左侧面板 */
.left-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.targets-panel {
  flex: 0 0 200px;
}

.methods-panel {
  flex: 1;
}

.target-item {
  padding: 8px 12px;
  margin-bottom: 4px;
  background: rgba(30, 41, 59, 0.6);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'Courier New', monospace;
  font-size: 13px;
}

.target-item:hover,
.target-item.active {
  background: rgba(59, 130, 246, 0.2);
  border-left: 3px solid #3b82f6;
}

.method-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  margin-bottom: 6px;
  background: rgba(30, 41, 59, 0.6);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 11px;
  font-weight: 500;
}

.method-item:hover {
  background: rgba(59, 130, 246, 0.2);
  transform: translateX(2px);
}

.method-icon {
  width: 20px;
  margin-right: 10px;
  color: #3b82f6;
}

/* 中间面板 */
.center-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.network-panel {
  flex: 2;
}

.logs-panel {
  flex: 1;
}

.network-container {
  position: relative;
  width: 100%;
  height: 300px;
  margin: 20px 0;
}

.center-node {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #ef4444, #dc2626);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.5);
  z-index: 10;
}

.center-node.compromised {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 20px rgba(239, 68, 68, 0.5); }
  50% { box-shadow: 0 0 30px rgba(239, 68, 68, 0.8); }
}

.network-node {
  position: absolute;
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
}

.network-node.warning {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  box-shadow: 0 0 10px rgba(245, 158, 11, 0.5);
}

.position-1 { top: 20%; left: 50%; transform: translateX(-50%); }
.position-2 { top: 30%; right: 20%; }
.position-3 { bottom: 30%; right: 20%; }
.position-4 { bottom: 20%; left: 50%; transform: translateX(-50%); }
.position-5 { bottom: 30%; left: 20%; }
.position-6 { top: 30%; left: 20%; }

.node-icon {
  color: white;
  font-size: 16px;
}

.node-label {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10px;
  white-space: nowrap;
  margin-top: 4px;
  color: #94a3b8;
}

.warning-indicator {
  position: absolute;
  top: -5px;
  right: -5px;
  width: 16px;
  height: 16px;
  background: #f59e0b;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 8px;
  color: white;
}

.connections {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.connection-line {
  stroke-width: 2;
  stroke: #475569;
}

.connection-line.attack {
  stroke: #f59e0b;
  animation: dash 2s linear infinite;
}

@keyframes dash {
  to { stroke-dashoffset: -10; }
}

/* 日志表格 */
.log-table {
  width: 100%;
}

.table-header {
  display: grid;
  grid-template-columns: 80px 120px 1fr;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #334155;
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
  letter-spacing: 0.5px;
}

.log-row {
  display: grid;
  grid-template-columns: 80px 120px 1fr;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(51, 65, 85, 0.3);
  font-size: 12px;
  transition: background 0.2s;
}

.log-row:hover {
  background: rgba(30, 41, 59, 0.5);
}

.col-time {
  font-family: 'Courier New', monospace;
  color: #94a3b8;
}

.col-target {
  font-family: 'Courier New', monospace;
  color: #3b82f6;
}

/* 右侧面板 */
.right-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.scan-panel {
  flex: 2;
}

.traffic-panel {
  flex: 1;
}

/* 漏洞扫描图表 */
.scan-chart {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;
}

.chart-overlay {
  position: absolute;
  text-align: center;
}

.score-display {
  font-size: 28px;
  font-weight: bold;
  color: #3b82f6;
}

.score-label {
  font-size: 10px;
  color: #94a3b8;
  margin-top: 4px;
}

.scan-metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.metric {
  text-align: center;
  padding: 8px;
  background: rgba(30, 41, 59, 0.6);
  border-radius: 4px;
}

.metric-label {
  display: block;
  font-size: 9px;
  color: #94a3b8;
  margin-bottom: 4px;
  letter-spacing: 0.5px;
}

.metric-value {
  display: block;
  font-size: 16px;
  font-weight: bold;
  color: #3b82f6;
}

/* 流量面板 */
.traffic-indicator {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
}

.traffic-chart {
  margin-bottom: 16px;
  border-radius: 4px;
  overflow: hidden;
}

.traffic-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 18px;
  font-weight: bold;
  color: #3b82f6;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 10px;
  color: #94a3b8;
}

/* 响应式设计 */
@media (max-width: 1400px) {
  .cybersec-dashboard {
    grid-template-columns: 260px 1fr 280px;
  }
}

@media (max-width: 1200px) {
  .cybersec-dashboard {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
    gap: 12px;
    padding: 12px;
  }

  .left-panel,
  .right-panel {
    flex-direction: row;
    gap: 12px;
  }

  .targets-panel,
  .methods-panel,
  .scan-panel,
  .traffic-panel {
    flex: 1;
  }
}
</style>