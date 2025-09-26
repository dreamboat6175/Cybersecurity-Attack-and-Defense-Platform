<template>
  <div class="cybersecurity-dashboard">
    <div class="top-bar">
      <div class="system-status">
        <div class="status-item">
          <span class="status-dot active"></span>
          <span>SYSTEM ONLINE</span>
        </div>
        <div class="status-item">
          <span class="status-dot warning"></span>
          <span>{{ activeThreats }} ACTIVE THREATS</span>
        </div>
        <div class="status-item">
          <span class="status-dot success"></span>
          <span>{{ blockedAttacks }} BLOCKED</span>
        </div>
      </div>
      <div class="system-time">
        {{ currentTime }}
      </div>
    </div>
    <div class="main-content">
      <div class="left-sidebar">
        <div class="panel targets-panel">
          <div class="panel-header">
            <h3 class="panel-title">TARGETS</h3>
          </div>
          <div class="panel-content">
            <div
                v-for="target in targets"
                :key="target.ip"
                class="target-card"
                :class="{ active: selectedTarget === target.ip, [target.status]: true }"
                @click="selectTarget(target)"
            >
              <span class="target-ip">{{ target.ip }}</span>
            </div>
          </div>
        </div>
        <div class="panel methods-panel">
          <div class="panel-header">
            <h3 class="panel-title">ATTACK METHODS</h3>
          </div>
          <div class="panel-content">
            <div
                v-for="method in attackMethods"
                :key="method.id"
                class="method-item"
                :class="{ active: selectedMethod === method.id }"
                @click="selectMethod(method)"
            >
              {{ method.name }}
            </div>
          </div>
        </div>
      </div>
      <div class="center-area">
        <div class="panel network-panel">
          <div class="panel-header">
            <h3 class="panel-title">NETWORK MAP</h3>
          </div>
          <div class="panel-content network-content">
            <div class="network-visualization">
              <svg viewBox="0 0 800 500" class="network-svg">
                <defs>
                  <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                    <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(100, 116, 139, 0.1)" stroke-width="1"/>
                  </pattern>
                  <radialGradient id="nodeGradient" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" style="stop-color:#475569"/>
                    <stop offset="100%" style="stop-color:#334155"/>
                  </radialGradient>
                  <radialGradient id="dangerGradient" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" style="stop-color:#dc2626"/>
                    <stop offset="100%" style="stop-color:#991b1b"/>
                  </radialGradient>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
                <g class="connections">
                  <line
                      v-for="edge in networkEdges"
                      :key="edge.id"
                      :x1="edge.x1"
                      :y1="edge.y1"
                      :x2="edge.x2"
                      :y2="edge.y2"
                      stroke="#475569"
                      stroke-width="2"
                  />
                </g>
                <g class="nodes">
                  <g transform="translate(400,250)">
                    <circle r="30" fill="url(#dangerGradient)" stroke="#ef4444" stroke-width="2"/>
                    <rect x="-20" y="-10" width="40" height="20" fill="#7f1d1d" rx="2"/>
                    <text y="50" text-anchor="middle" class="node-ip">192.168.1.10</text>
                  </g>
                  <g
                      v-for="node in networkNodes"
                      :key="node.id"
                      :transform="`translate(${node.x},${node.y})`"
                  >
                    <circle
                        r="20"
                        :fill="node.status === 'danger' ? 'url(#dangerGradient)' : 'url(#nodeGradient)'"
                        :stroke="node.status === 'danger' ? '#ef4444' : '#94a3b8'"
                        stroke-width="1"
                    />
                    <rect x="-15" y="-7" width="30" height="14" :fill="node.status === 'danger' ? '#7f1d1d' : '#334155'" rx="2"/>
                    <text y="35" text-anchor="middle" class="node-ip">{{ node.ip }}</text>
                  </g>
                  <g transform="translate(650,250)">
                    <circle r="18" fill="#f59e0b" stroke="#fbbf24" stroke-width="1"/>
                    <polygon points="0,-8 -7,6 7,6" fill="#92400e"/>
                    <circle r="1" cy="9" fill="#92400e"/>
                  </g>
                </g>
                <g v-if="showAttackAnimation" class="attack-animation">
                  <circle r="4" fill="#ef4444" opacity="0.8">
                    <animateMotion dur="2s" repeatCount="indefinite">
                      <path d="M200,150 Q300,200 400,250"/>
                    </animateMotion>
                  </circle>
                </g>
              </svg>
            </div>
          </div>
        </div>
        <div class="panel logs-panel">
          <div class="panel-header">
            <h3 class="panel-title">ATTACK LOG</h3>
            <div class="log-controls">
              <select v-model="logFilter" class="filter-select">
                <option value="all">ALL</option>
                <option value="critical">CRITICAL</option>
                <option value="warning">WARNING</option>
                <option value="info">INFO</option>
              </select>
            </div>
          </div>
          <div class="panel-content logs-content">
            <div class="log-table-wrapper">
              <table class="log-table">
                <thead>
                <tr>
                  <th>TIME</th>
                  <th>TARGET</th>
                  <th>DESCRIPTION</th>
                </tr>
                </thead>
                <tbody>
                <tr
                    v-for="log in filteredLogs"
                    :key="log.id"
                    class="log-row"
                    :class="[log.severity, { 'log-row-active': log.id === selectedLogId }]"
                    @click="selectLog(log)"
                >
                  <td class="log-time">{{ log.time }}</td>
                  <td class="log-target">{{ log.target }}</td>
                  <td class="log-description">{{ log.description }}</td>
                </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <div class="right-sidebar">
        <div class="panel scan-panel">
          <div class="panel-header">
            <h3 class="panel-title">VULNERABILITY SCAN</h3>
          </div>
          <div class="panel-content scan-content">
            <div class="vulnerability-radar">
              <svg viewBox="0 0 200 200" class="radar-chart">
                <g transform="translate(100,100)">
                  <g stroke="#475569" stroke-width="1" fill="none">
                    <polygon points="0,-70 60,-35 60,35 0,70 -60,35 -60,-35" />
                    <polygon points="0,-50 43,-25 43,25 0,50 -43,25 -43,-25" />
                    <polygon points="0,-30 26,-15 26,15 0,30 -26,15 -26,-15" />
                  </g>
                  <g stroke="#475569" stroke-width="0.5">
                    <line x1="0" y1="-70" x2="0" y2="70" />
                    <line x1="-60" y1="-35" x2="60" y2="35" />
                    <line x1="-60" y1="35" x2="60" y2="-35" />
                  </g>
                  <polygon
                      :points="radarPoints"
                      fill="rgba(59, 130, 246, 0.3)"
                      stroke="#3b82f6"
                      stroke-width="2"
                  />
                  <text x="0" y="-80" text-anchor="middle" class="radar-label">CONFIDENTIALITY</text>
                  <text x="70" y="-30" text-anchor="middle" class="radar-label">SIGNATURE</text>
                  <text x="70" y="45" text-anchor="middle" class="radar-label">AVAILABILITY</text>
                  <text x="0" y="85" text-anchor="middle" class="radar-label">AUTHORIZATION</text>
                  <text x="-70" y="45" text-anchor="middle" class="radar-label">INTEGRITY</text>
                  <text x="-70" y="-30" text-anchor="middle" class="radar-label">AUTHENTICATION</text>
                </g>
              </svg>
              <div class="threat-score">
                <span class="score-value">{{ threatScore }}</span>
                <span class="score-label">THREAT LEVEL</span>
              </div>
            </div>
          </div>
        </div>
        <div class="panel traffic-panel">
          <div class="panel-header">
            <h3 class="panel-title">ATTACK TRAFFIC</h3>
            <span class="traffic-label">+OTC</span>
          </div>
          <div class="panel-content traffic-content">
            <div class="traffic-chart">
              <svg viewBox="0 0 280 120" class="chart-svg">
                <g stroke="#374151" stroke-width="0.5">
                  <line x1="0" y1="30" x2="280" y2="30" />
                  <line x1="0" y1="60" x2="280" y2="60" />
                  <line x1="0" y1="90" x2="280" y2="90" />
                </g>
                <polyline
                    fill="none"
                    stroke="#3b82f6"
                    stroke-width="2"
                    :points="trafficLinePoints"
                />
                <circle
                    v-for="(point, index) in trafficData"
                    :key="index"
                    :cx="index * 40 + 20"
                    :cy="100 - (point / 250) * 70"
                    r="3"
                    fill="#3b82f6"
                />
                <g class="axis-labels">
                  <text x="20" y="115" text-anchor="middle">6</text>
                  <text x="100" y="115" text-anchor="middle">4</text>
                  <text x="180" y="115" text-anchor="middle">2</text>
                  <text x="260" y="115" text-anchor="middle">0</text>
                </g>
              </svg>
              <div class="chart-labels">
                <span class="y-label">200K</span>
                <span class="y-label">100K</span>
                <span class="y-label">0</span>
                <div class="x-label">HOURS AGO</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const currentTime = ref('')
const selectedTarget = ref('192.168.1.10')
const selectedMethod = ref('')
const selectedLogId = ref(null)
const showAttackAnimation = ref(false)
const logFilter = ref('all')
const activeThreats = ref(7)
const blockedAttacks = ref(234)
const threatScore = ref(87)

const targets = ref([
  { ip: '192.168.1.10', status: 'danger' },
  { ip: '192.168.1.20', status: 'normal' },
  { ip: '192.168.1.30', status: 'normal' },
  { ip: '192.168.1.40', status: 'normal' },
  { ip: '192.168.1.50', status: 'normal' }
])
const attackMethods = ref([
  { id: 'vuln_scan', name: 'VULNERABILITY SCAN' },
  { id: 'brute_force', name: 'BRUTE FORCE' },
  { id: 'sql_injection', name: 'SQL INJECTION' },
  { id: 'cmd_injection', name: 'COMMAND INJECTION' },
  { id: 'dos', name: 'DENIAL OF SERVICE' },
  { id: 'mitm', name: 'MAN-IN-THE-MIDDLE' }
])
const networkNodes = ref([
  { id: 1, x: 200, y: 100, ip: '192.168.1.20', status: 'normal' },
  { id: 2, x: 600, y: 100, ip: '192.168.1.30', status: 'normal' },
  { id: 3, x: 150, y: 250, ip: '192.168.1.40', status: 'normal' },
  { id: 4, x: 200, y: 400, ip: '192.168.1.50', status: 'normal' },
  { id: 5, x: 600, y: 350, ip: '192.168.1.60', status: 'danger' }
])
const networkEdges = ref([
  { id: 1, x1: 400, y1: 250, x2: 200, y2: 100 },
  { id: 2, x1: 400, y1: 250, x2: 600, y2: 100 },
  { id: 3, x1: 400, y1: 250, x2: 150, y2: 250 },
  { id: 4, x1: 400, y1: 250, x2: 200, y2: 400 },
  { id: 5, x1: 400, y1: 250, x2: 600, y2: 350 },
  { id: 6, x1: 400, y1: 250, x2: 650, y2: 250 }
])

const attackLogs = ref([
  { id: 1, time: '10:34:21', target: '192.168.1.10', description: 'SQL injection attempt', severity: 'critical' },
  // FIX 4: 修正无效的IP地址
  { id: 2, time: '10:32:49', target: '192.168.1.200', description: 'Command injection attempt', severity: 'warning' },
  { id: 3, time: '10:30:15', target: '192.168.1.20', description: 'Brute force attack', severity: 'critical' },
  { id: 4, time: '10:27:58', target: '192.168.1.10', description: 'Vulnerability scan', severity: 'info' }
])

const radarData = ref([
  { x: 0, y: -59 },
  { x: 51, y: -25 },
  { x: 34, y: 25 },
  { x: 0, y: 42 },
  { x: -43, y: 20 },
  { x: -34, y: -25 }
])
const trafficData = ref([120, 95, 140, 110, 160, 130, 180])

const radarPoints = computed(() =>
    radarData.value.map(p => `${p.x},${p.y}`).join(' ')
)
const filteredLogs = computed(() => {
  if (logFilter.value === 'all') return attackLogs.value
  return attackLogs.value.filter(log => log.severity === logFilter.value)
})
const trafficLinePoints = computed(() => {
  return trafficData.value
      // FIX 2: 同步修改计算属性中的除数
      .map((value, index) => `${index * 40 + 20},${100 - (value / 250) * 70}`)
      .join(' ')
})

const formatTime = (date) => date.toLocaleTimeString('en-US', {
  hour12: false,
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
})
const updateTime = () => {
  currentTime.value = formatTime(new Date())
}
const selectTarget = (target) => {
  selectedTarget.value = target.ip
}
const selectMethod = (method) => {
  selectedMethod.value = method.id
}
const selectLog = (log) => {
  selectedLogId.value = log.id
}

// FIX 1: 为所有定时器创建引用
let timeInterval = null
let animationInterval = null

onMounted(() => {
  updateTime()
  timeInterval = setInterval(updateTime, 1000)

  // FIX 1: 保存动画定时器的ID
  animationInterval = setInterval(() => {
    showAttackAnimation.value = !showAttackAnimation.value
  }, 3000)

  console.log('🎯 Cybersecurity Dashboard Loaded')
})

onUnmounted(() => {
  // FIX 1: 在组件卸载时清除所有定时器
  if (timeInterval) {
    clearInterval(timeInterval)
  }
  if (animationInterval) {
    clearInterval(animationInterval)
  }
})
</script>

<style scoped>
/* (所有样式保持不变) */
/* 全局样式 */
.cybersecurity-dashboard {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
  color: #f8fafc;
  font-family: 'Inter', 'Segoe UI', sans-serif;
  overflow: hidden;
}

/* 顶部状态栏 */
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

.system-status {
  display: flex;
  gap: 24px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.active {
  background: #22c55e;
  box-shadow: 0 0 10px rgba(34, 197, 94, 0.5);
  animation: pulse 2s infinite;
}
.status-dot.warning {
  background: #f59e0b;
  box-shadow: 0 0 10px rgba(245, 158, 11, 0.5);
  animation: pulse 2s infinite;
}
.status-dot.success {
  background: #3b82f6;
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.system-time {
  font-family: 'Courier New', monospace;
  font-size: 16px;
  font-weight: 600;
  color: #64748b;
}

/* 主内容区域 */
.main-content {
  display: grid;
  grid-template-columns: 300px 1fr 300px;
  gap: 16px;
  padding: 16px;
  height: calc(100vh - 80px);
}

/* 面板基础样式 */
.panel {
  background: rgba(30, 41, 59, 0.4);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.panel:hover {
  border-color: rgba(59, 130, 246, 0.3);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  background: rgba(15, 23, 42, 0.5);
}

.panel-title {
  font-size: 14px;
  font-weight: 600;
  color: #f1f5f9;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.panel-content {
  padding: 16px;
  height: calc(100% - 60px);
  overflow-y: auto;
}

/* 侧边栏 */
.left-sidebar,
.right-sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 目标面板 */
.targets-panel {
  flex: 1;
}

.target-card {
  padding: 12px 16px;
  margin-bottom: 8px;
  background: rgba(51, 65, 85, 0.3);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  color: #e2e8f0;
}

.target-card:hover {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.3);
  transform: translateX(4px);
}

.target-card.active {
  background: rgba(59, 130, 246, 0.2);
  border-color: #3b82f6;
  color: #60a5fa;
}

.target-card.danger {
  border-left: 3px solid #ef4444;
}

.target-ip {
  font-weight: 600;
}

/* 攻击方法面板 */
.methods-panel {
  flex: 1;
}

.method-item {
  padding: 12px 16px;
  margin-bottom: 8px;
  color: #cbd5e1;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-left: 3px solid transparent;
}

.method-item:hover {
  color: #60a5fa;
  background: rgba(59, 130, 246, 0.1);
  border-left-color: #3b82f6;
  transform: translateX(4px);
}

.method-item.active {
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.1);
  border-left-color: #3b82f6;
}

/* 中央区域 */
.center-area {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 网络面板 */
.network-panel {
  flex: 2;
}

.network-content {
  padding: 0;
}

.network-visualization {
  height: 100%;
  width: 100%;
}

.network-svg {
  width: 100%;
  height: 100%;
  min-height: 400px;
}

.node-ip {
  fill: #94a3b8;
  font-size: 11px;
  font-family: 'Courier New', monospace;
  text-anchor: middle;
}

/* 日志面板 */
.logs-panel {
  flex: 1;
}

.logs-content {
  padding: 0;
}

.log-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-select {
  background: rgba(51, 65, 85, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 4px;
  color: #e2e8f0;
  padding: 4px 8px;
  font-size: 12px;
  text-transform: uppercase;
}

.log-table-wrapper {
  height: 100%;
  overflow-y: auto;
}

.log-table {
  width: 100%;
  border-collapse: collapse;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.log-table th {
  background: rgba(15, 23, 42, 0.7);
  color: #94a3b8;
  padding: 12px;
  text-align: left;
  font-weight: 600;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

.log-row {
  transition: all 0.3s ease;
  cursor: pointer;
}

.log-row:hover {
  background: rgba(59, 130, 246, 0.1);
}

.log-table td {
  padding: 10px 12px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.05);
  color: #e2e8f0;
}

.log-time {
  color: #94a3b8;
  font-size: 11px;
}

.log-target {
  color: #60a5fa;
  font-weight: 500;
}

.log-description {
  color: #cbd5e1;
}

.log-row.critical {
  border-left: 3px solid #ef4444;
}

.log-row.warning {
  border-left: 3px solid #f59e0b;
}

.log-row.info {
  border-left: 3px solid #3b82f6;
}

/* 扫描面板 */
.scan-panel {
  flex: 2;
}

.scan-content {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.vulnerability-radar {
  width: 100%;
  max-width: 200px;
  position: relative;
}

.radar-chart {
  width: 100%;
  height: 200px;
}

.radar-label {
  fill: #94a3b8;
  font-size: 8px;
  text-anchor: middle;
  font-family: 'Courier New', monospace;
  text-transform: uppercase;
}

.threat-score {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  background: rgba(15, 23, 42, 0.8);
  padding: 12px;
  border-radius: 50%;
  border: 2px solid rgba(59, 130, 246, 0.3);
  width: 80px;
  height: 80px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.score-value {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: #3b82f6;
  margin-bottom: 2px;
}

.score-label {
  font-size: 8px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 流量面板 */
.traffic-panel {
  flex: 1;
}

.traffic-label {
  font-size: 10px;
  color: #94a3b8;
  font-family: 'Courier New', monospace;
}

.traffic-content {
  padding: 12px;
  height: calc(100% - 60px);
}

.traffic-chart {
  width: 100%;
  height: 100%;
}

.chart-svg {
  width: 100%;
  height: 100px;
}

.axis-labels text {
  fill: #94a3b8;
  font-size: 10px;
  font-family: 'Courier New', monospace;
}

.chart-labels {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  font-size: 10px;
  color: #94a3b8;
  font-family: 'Courier New', monospace;
  position: relative;
}

.y-label {
  position: absolute;
}

.y-label:nth-child(1) { top: -90px; }
.y-label:nth-child(2) { top: -50px; }
.y-label:nth-child(3) { top: -10px; }

.x-label {
  text-align: center;
  margin-top: 4px;
  font-size: 9px;
  color: #64748b;
  width: 100%;
}

/* 攻击动画 */
.attack-animation circle {
  filter: drop-shadow(0 0 6px #ef4444);
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 4px;
}

::-webkit-scrollbar-track {
  background: rgba(51, 65, 85, 0.3);
}

::-webkit-scrollbar-thumb {
  background: rgba(59, 130, 246, 0.4);
  border-radius: 2px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(59, 130, 246, 0.6);
}

/* 响应式设计 */
@media (max-width: 1400px) {
  .main-content {
    grid-template-columns: 280px 1fr 280px;
  }
}

@media (max-width: 1200px) {
  .main-content {
    grid-template-columns: 260px 1fr 260px;
    gap: 12px;
  }
}

@media (max-width: 1024px) {
  .main-content {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
    height: auto;
    min-height: calc(100vh - 80px);
  }

  .left-sidebar,
  .right-sidebar {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 16px;
  }

  .center-area {
    order: -1;
  }
}

@media (max-width: 768px) {
  .cybersecurity-dashboard {
    overflow-y: auto;
  }

  .main-content {
    padding: 12px;
    gap: 12px;
  }

  .top-bar {
    padding: 12px 16px;
    flex-direction: column;
    gap: 12px;
  }

  .system-status {
    gap: 16px;
    justify-content: center;
  }

  .status-item {
    font-size: 12px;
  }

  .system-time {
    font-size: 14px;
  }
}
</style>