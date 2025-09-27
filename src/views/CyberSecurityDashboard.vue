<template>
  <div class="cybersec-dashboard">
    <div class="left-panel">
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

    <div class="center-panel">
      <div class="panel network-panel">
        <div class="panel-header">
          <h3>NETWORK MAP</h3>
        </div>
        <div class="panel-content">
          <div class="network-container">
            <div class="center-node" :class="{ compromised: centerNodeStatus === 'compromised' }">
              <div class="node-icon">
                <i class="fas fa-laptop"></i>
              </div>
              <div class="node-label">{{ centerNode }}</div>
            </div>

            <div
                v-for="(node, index) in networkNodes"
                :key="node.ip"
                :class="['network-node', `position-${index + 1}`, { warning: node.status === 'warning' }]"
            >
              <div class="node-icon">
                <i class="fas fa-laptop"></i>
              </div>
              <div class="node-label">{{ node.ip }}</div>
              <div v-if="node.status === 'warning'" class="warning-indicator">
                <i class="fas fa-exclamation-triangle"></i>
              </div>
            </div>

            <svg class="connections" viewBox="0 0 400 400">
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <line x1="200" y1="200" x2="200" y2="20" class="connection-line normal" />  <line x1="200" y1="200" x2="327" y2="73" class="connection-line normal" />  <line x1="200" y1="200" x2="380" y2="200" class="connection-line normal" /> <line x1="200" y1="200" x2="200" y2="380" class="connection-line normal" /> <line x1="200" y1="200" x2="73" y2="327" class="connection-line normal" />  <line x1="200" y1="200" x2="20" y2="200" class="connection-line normal" />   <line x1="200" y1="200" x2="73" y2="73" class="connection-line normal" />   <line x1="200" y1="200" x2="327" y2="327" class="connection-line attack" stroke-dasharray="5,5" filter="url(#glow)" /> </svg>
          </div>
        </div>
      </div>

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

    <div class="right-panel">
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

      <div class="panel description-panel">
        <div class="panel-header">
          <h3>DESCRIPTION</h3>
        </div>
        <div class="panel-content">
          <div class="description-list">
            <div
                v-for="desc in attackDescriptions"
                :key="desc.id"
                class="description-item"
            >
              {{ desc.text }}
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
    const selectedTarget = ref('192.168.1.10')
    const centerNode = ref('192.168.1.10')
    const centerNodeStatus = ref('compromised')
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
      { ip: '192.168.1.30', status: 'normal' },
      { ip: '192.168.1.40', status: 'warning' },
      { ip: '192.168.1.50', status: 'normal' },
      { ip: '192.168.1.60', status: 'normal' },
      { ip: '192.168.1.70', status: 'normal' },
      { ip: '192.168.1.80', status: 'normal' },
      { ip: '192.168.1.90', status: 'normal' }
    ])

    // 攻击日志
    const attackLogs = ref([
      { id: 1, time: '10:34:21', target: '192.168.1.10', description: 'SQL injection attempt' },
      { id: 2, time: '10:32:49', target: '192.168.1.300', description: 'Command injection attempt' },
      { id: 3, time: '10:30:15', target: '192.168.1.20', description: 'Brute force attack' },
      { id: 4, time: '10:27:58', target: '192.168.1.10', description: 'Vulnerability scan' }
    ])

    // 攻击描述
    const attackDescriptions = ref([
      { id: 1, text: 'SQL injection attempt' },
      { id: 2, text: 'Command injection attempt' },
      { id: 3, text: 'Brute force attack' },
      { id: 4, text: 'Vulnerability scan' }
    ])

    // 方法
    const selectTarget = (ip) => {
      selectedTarget.value = ip
    }

    const selectMethod = (method) => {
      console.log('Selected method:', method)
    }

    // 绘制漏洞扫描图表 - 蛛网图样式
    const drawScanChart = () => {
      const canvas = document.querySelector('.scan-panel canvas')
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      const maxRadius = 70

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const levels = 5
      for (let level = 1; level <= levels; level++) {
        const radius = (maxRadius / levels) * level
        ctx.beginPath()
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3 - Math.PI / 2
          const x = centerX + radius * Math.cos(angle)
          const y = centerY + radius * Math.sin(angle)
          if (i === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }
        ctx.closePath()
        ctx.strokeStyle = level === levels ? '#3b82f6' : '#334155'
        ctx.lineWidth = level === levels ? 2 : 1
        ctx.stroke()
      }

      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3 - Math.PI / 2
        const x = centerX + maxRadius * Math.cos(angle)
        const y = centerY + maxRadius * Math.sin(angle)
        ctx.beginPath()
        ctx.moveTo(centerX, centerY)
        ctx.lineTo(x, y)
        ctx.strokeStyle = '#334155'
        ctx.lineWidth = 1
        ctx.stroke()
      }

      const scores = [
        vulnerabilityScore.value,
        sigreScore.value,
        integrityScore.value,
        availabilityScore.value,
        vulnerabilityScore.value - 5,
        sigreScore.value - 3
      ]

      ctx.beginPath()
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3 - Math.PI / 2
        const score = scores[i] || 80
        const radius = (maxRadius * score) / 100
        const x = centerX + radius * Math.cos(angle)
        const y = centerY + radius * Math.sin(angle)
        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }
      ctx.closePath()

      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius)
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)')
      gradient.addColorStop(1, 'rgba(59, 130, 246, 0.1)')
      ctx.fillStyle = gradient
      ctx.fill()
      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 2
      ctx.stroke()

      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3 - Math.PI / 2
        const score = scores[i] || 80
        const radius = (maxRadius * score) / 100
        const x = centerX + radius * Math.cos(angle)
        const y = centerY + radius * Math.sin(angle)
        ctx.beginPath()
        ctx.arc(x, y, 3, 0, 2 * Math.PI)
        ctx.fillStyle = '#3b82f6'
        ctx.fill()
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 1
        ctx.stroke()
      }
    }

    // 绘制流量图表
    const drawTrafficChart = () => {
      const canvas = document.querySelector('.traffic-panel canvas')
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      const width = canvas.width
      const height = canvas.height
      ctx.clearRect(0, 0, width, height)

      const points = 50
      const data = []
      for (let i = 0; i < points; i++) {
        const baseValue = 100 + Math.sin(i * 0.1) * 50
        const noise = (Math.random() - 0.5) * 30
        data.push(Math.max(0, baseValue + noise))
      }

      ctx.beginPath()
      ctx.moveTo(0, height)
      data.forEach((value, index) => {
        const x = (index / (points - 1)) * width
        const y = height - (value / 200) * height
        ctx.lineTo(x, y)
      })
      ctx.lineTo(width, height)
      ctx.closePath()

      const gradient = ctx.createLinearGradient(0, 0, 0, height)
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.5)')
      gradient.addColorStop(1, 'rgba(59, 130, 246, 0.1)')
      ctx.fillStyle = gradient
      ctx.fill()

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
      attackLogs,
      attackDescriptions,
      selectTarget,
      selectMethod
    }
  }
}
</script>

<style scoped>
.cybersec-dashboard {
  display: grid;
  /* <-- HORIZONTAL RATIO CHANGED FOR BETTER LAYOUT --> */
  grid-template-columns: 0.8fr 1.5fr 0.9fr;
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
  flex: 1.5;
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
  background: #3b82f6;
  color: #fff;
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
  height: 100%;
  min-height: 350px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.center-node {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 70px;
  height: 70px;
  background: linear-gradient(135deg, #1e293b, #0f172a);
  border: 2px solid #ef4444;
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
  0%, 100% { box-shadow: 0 0 20px rgba(239, 68, 68, 0.5); border-color: #ef4444; }
  50% { box-shadow: 0 0 35px rgba(239, 68, 68, 0.8); border-color: #f87171;}
}

.network-node {
  position: absolute;
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #1e293b, #0f172a);
  border: 2px solid #3b82f6;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
}

.network-node.warning {
  border-color: #f59e0b;
  box-shadow: 0 0 10px rgba(245, 158, 11, 0.5);
}

.position-1 { top: 0; left: 50%; transform: translate(-50%, -50%); }
.position-2 { top: 15%; right: 15%; transform: translate(50%, -50%); }
.position-3 { top: 50%; right: 0; transform: translate(50%, -50%); }
.position-4 { bottom: 15%; right: 15%; transform: translate(50%, 50%); }
.position-5 { bottom: 0; left: 50%; transform: translate(-50%, 50%); }
.position-6 { bottom: 15%; left: 15%; transform: translate(-50%, 50%); }
.position-7 { top: 50%; left: 0; transform: translate(-50%, -50%); }
.position-8 { top: 15%; left: 15%; transform: translate(-50%, -50%); }

.node-icon {
  color: white;
  font-size: 24px;
}

.node-label {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10px;
  white-space: nowrap;
  margin-top: 8px;
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
  stroke-width: 1;
}

.connection-line.normal {
  stroke: #3b82f6;
  opacity: 0.5;
}

.connection-line.attack {
  stroke: #ef4444; /* Changed to red */
  stroke-width: 2;
  opacity: 1;
  animation: attackPulse 1.5s linear infinite;
}

@keyframes attackPulse {
  0% { opacity: 1; stroke-width: 2; }
  50% { opacity: 0.6; stroke-width: 3; }
  100% { opacity: 1; stroke-width: 2; }
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
  flex: 1.5;
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
  margin-bottom: 16px;
  height: 200px;
}

.chart-overlay {
  position: absolute;
  text-align: center;
}

.score-display {
  font-size: 24px;
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

/* 攻击描述面板 */
.description-panel {
  flex: 1.2;
}

.description-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.description-item {
  padding: 8px 12px;
  background: rgba(30, 41, 59, 0.6);
  border-radius: 4px;
  font-size: 12px;
  color: #94a3b8;
  border-left: 3px solid #3b82f6;
  transition: all 0.2s;
}

.description-item:hover {
  background: rgba(30, 41, 59, 0.8);
  color: #e2e8f0;
}

/* 响应式设计 */
@media (max-width: 1400px) {
  .cybersec-dashboard {
    grid-template-columns: 0.8fr 1.5fr 0.9fr;
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