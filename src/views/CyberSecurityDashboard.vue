<!-- src/views/CyberSecurityDashboard.vue - 攻击界面完整重构 -->
<template>
  <div class="cybersecurity-dashboard">
    <!-- 左侧面板 -->
    <div class="left-panel">
      <!-- 攻击目标面板 -->
      <div class="panel targets-panel">
        <div class="panel-title">TARGETS</div>
        <div class="targets-list">
          <div
              v-for="target in targets"
              :key="target.ip"
              class="target-item"
              :class="{ active: selectedTarget === target.ip }"
              @click="selectTarget(target)"
          >
            {{ target.ip }}
          </div>
        </div>
      </div>

      <!-- 攻击方法面板 -->
      <div class="panel methods-panel">
        <div class="panel-title">ATTACK METHODS</div>
        <div class="methods-list">
          <div
              v-for="method in attackMethods"
              :key="method.id"
              class="method-item"
              @click="executeAttack(method)"
          >
            {{ method.name }}
          </div>
        </div>
      </div>
    </div>

    <!-- 中间面板 -->
    <div class="center-panel">
      <!-- 网络拓扑图 -->
      <div class="panel network-panel">
        <div class="panel-title">NETWORK MAP</div>
        <div class="traffic-indicator">+OTC</div>
        <div class="network-container">
          <svg class="network-svg" viewBox="0 0 600 400">
            <!-- 网络连接线 -->
            <line
                v-for="edge in networkEdges"
                :key="edge.id"
                class="network-link"
                :x1="edge.x1"
                :y1="edge.y1"
                :x2="edge.x2"
                :y2="edge.y2"
            />

            <!-- 网络节点 -->
            <g
                v-for="node in networkNodes"
                :key="node.id"
                class="node"
                :class="`node-${node.status}`"
                @click="selectTarget(node)"
            >
              <circle
                  :cx="node.x"
                  :cy="node.y"
                  :r="node.radius"
                  :class="`${node.status}-node`"
              />
              <rect
                  :x="node.x - 12"
                  :y="node.y - 8"
                  width="24"
                  height="16"
                  :class="`node-rect ${node.status}`"
                  rx="2"
              />
              <text
                  v-if="node.status === 'warning'"
                  :x="node.x"
                  :y="node.y + 2"
                  class="warning-icon"
              >⚠</text>
              <text
                  :x="node.x"
                  :y="node.y + 30"
                  class="node-label"
              >{{ node.ip }}</text>
            </g>
          </svg>
        </div>
      </div>

      <!-- 攻击日志面板 -->
      <div class="panel logs-panel">
        <div class="panel-title">ATTACK LOG</div>
        <table class="attack-log-table">
          <thead>
          <tr>
            <th>TIME</th>
            <th>TARGET</th>
            <th>DESCRIPTION</th>
          </tr>
          </thead>
          <tbody>
          <tr
              v-for="log in attackLogs"
              :key="log.id"
              class="log-row"
              @click="updateDescription(log.description)"
          >
            <td class="log-time">{{ log.time }}</td>
            <td class="log-target">{{ log.target }}</td>
            <td class="log-description">{{ log.description }}</td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 右侧面板 -->
    <div class="right-panel">
      <!-- 漏洞扫描面板 -->
      <div class="panel scan-panel">
        <div class="panel-title">VULNERABILITY SCAN</div>
        <div class="spider-chart-container">
          <svg class="spider-chart" viewBox="0 0 250 250">
            <!-- 蜘蛛图背景 -->
            <g transform="translate(125,125)">
              <!-- 同心圆 -->
              <circle v-for="r in [20, 40, 60, 80, 100]" :key="r" :r="r" class="spider-circle"/>

              <!-- 坐标轴 -->
              <line v-for="(axis, index) in spiderAxes" :key="index"
                    :x1="axis.x1" :y1="axis.y1" :x2="axis.x2" :y2="axis.y2"
                    class="spider-axis"/>

              <!-- 数据多边形 -->
              <polygon :points="spiderDataPoints" class="spider-polygon"/>

              <!-- 数据点 -->
              <circle v-for="(point, index) in spiderPoints" :key="index"
                      :cx="point.x" :cy="point.y" r="4" class="spider-point"/>

              <!-- 标签 -->
              <text v-for="(label, index) in spiderLabels" :key="index"
                    :x="label.x" :y="label.y" class="spider-label">{{ label.text }}</text>
            </g>
          </svg>
        </div>
      </div>

      <!-- 攻击流量面板 -->
      <div class="panel traffic-panel">
        <div class="panel-title">ATTACK TRAFFIC</div>
        <div class="traffic-indicator">+OTC</div>
        <div class="traffic-chart-container">
          <svg class="traffic-chart" viewBox="0 0 250 120">
            <!-- 网格线 -->
            <defs>
              <pattern id="grid" width="25" height="20" patternUnits="userSpaceOnUse">
                <path d="M 25 0 L 0 0 0 20" class="grid-line"/>
              </pattern>
            </defs>
            <rect width="250" height="120" fill="url(#grid)"/>

            <!-- Y轴标签 -->
            <text x="5" y="25" class="axis-label">200K</text>
            <text x="5" y="65" class="axis-label">100K</text>
            <text x="5" y="105" class="axis-label">0</text>

            <!-- X轴标签 -->
            <text x="210" y="115" class="axis-label">6</text>
            <text x="160" y="115" class="axis-label">4</text>
            <text x="110" y="115" class="axis-label">2</text>
            <text x="60" y="115" class="axis-label">0</text>
            <text x="90" y="125" class="axis-label">HOURS AGO</text>

            <!-- 流量线 -->
            <polyline :points="trafficLinePoints" class="traffic-line"/>
            <polygon :points="trafficAreaPoints" class="traffic-area"/>
          </svg>
        </div>
      </div>

      <!-- 描述面板 -->
      <div class="panel description-panel">
        <div class="panel-title">DESCRIPTION</div>
        <div class="description-content">
          {{ currentDescription }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useDashboardStore } from '@/stores/dashboard'

const dashboardStore = useDashboardStore()

// 响应式数据
const selectedTarget = ref('192.168.1.10')
const currentDescription = ref('SQL injection attempt detected on target 192.168.1.10. The attacker is trying to exploit database vulnerabilities through malformed input parameters. Security protocols have been activated and the attack is being monitored.')

// 从mock数据获取
const targets = computed(() => dashboardStore.targets)
const attackLogs = computed(() => dashboardStore.recentAttackLogs)

// 攻击方法配置
const attackMethods = ref([
  { id: 'vulnerability', name: 'VULNERABILITY SCAN' },
  { id: 'brute', name: 'BRUTE FORCE' },
  { id: 'sql', name: 'SQL INJECTION' },
  { id: 'command', name: 'COMMAND INJECTION' },
  { id: 'dos', name: 'DENIAL OF SERVICE' },
  { id: 'mitm', name: 'MAN-IN-THE-MIDDLE' }
])

// 网络拓扑数据
const networkNodes = ref([
  { id: 'central', ip: '192.168.1.10', x: 300, y: 200, radius: 25, status: 'compromised' },
  { id: 'node1', ip: '192.168.1.20', x: 150, y: 120, radius: 20, status: 'normal' },
  { id: 'node2', ip: '192.168.1.30', x: 300, y: 80, radius: 20, status: 'normal' },
  { id: 'node3', ip: '192.168.1.40', x: 450, y: 120, radius: 20, status: 'normal' },
  { id: 'node4', ip: '192.168.1.50', x: 150, y: 280, radius: 20, status: 'normal' },
  { id: 'node5', ip: '192.168.1.60', x: 300, y: 320, radius: 20, status: 'normal' },
  { id: 'node6', ip: '192.168.1.70', x: 450, y: 200, radius: 20, status: 'warning' },
  { id: 'node7', ip: '192.168.1.80', x: 450, y: 280, radius: 20, status: 'compromised' }
])

const networkEdges = ref([
  { id: 'e1', x1: 300, y1: 200, x2: 150, y2: 120 },
  { id: 'e2', x1: 300, y1: 200, x2: 300, y2: 80 },
  { id: 'e3', x1: 300, y1: 200, x2: 450, y2: 120 },
  { id: 'e4', x1: 300, y1: 200, x2: 150, y2: 280 },
  { id: 'e5', x1: 300, y1: 200, x2: 300, y2: 320 },
  { id: 'e6', x1: 300, y1: 200, x2: 450, y2: 200 },
  { id: 'e7', x1: 300, y1: 200, x2: 450, y2: 280 }
])

// 蜘蛛图数据
const spiderAxes = ref([
  { x1: 0, y1: -100, x2: 0, y2: 100 },
  { x1: -100, y1: 0, x2: 100, y2: 0 },
  { x1: -70.7, y1: -70.7, x2: 70.7, y2: 70.7 },
  { x1: -70.7, y1: 70.7, x2: 70.7, y2: -70.7 }
])

const spiderPoints = ref([
  { x: 0, y: -85 },
  { x: 73, y: -42 },
  { x: 45, y: 69 },
  { x: -45, y: 69 },
  { x: -73, y: -42 }
])

const spiderDataPoints = computed(() => {
  return spiderPoints.value.map(p => `${p.x},${p.y}`).join(' ')
})

const spiderLabels = ref([
  { x: 0, y: -110, text: 'SCORE' },
  { x: 85, y: -50, text: 'SIGRE' },
  { x: 55, y: 85, text: 'AVAILABILITY' },
  { x: -55, y: 85, text: 'INTEGRITY' },
  { x: -85, y: -50, text: 'SCORE' }
])

// 流量图数据
const trafficLinePoints = ref('30,90 50,80 70,85 90,75 110,70 130,65 150,55 170,45 190,35 210,25 230,20')
const trafficAreaPoints = computed(() => {
  return trafficLinePoints.value + ' 230,100 30,100'
})

// 攻击描述映射
const attackDescriptions = {
  'sql': 'SQL injection attempt detected. The attacker is trying to exploit database vulnerabilities through malformed input parameters. Security protocols have been activated.',
  'brute': 'Brute force attack in progress. Multiple failed login attempts detected from the same source. Account lockout mechanisms are active.',
  'command': 'Command injection vulnerability exploited. Unauthorized system commands are being executed. Immediate containment required.',
  'vulnerability': 'Comprehensive vulnerability scan completed. Multiple security weaknesses identified across network infrastructure.',
  'dos': 'Denial of Service attack detected. High volume of malicious requests overwhelming target resources. Traffic filtering enabled.',
  'mitm': 'Man-in-the-middle attack intercepted. Encrypted communications are being monitored and potentially manipulated.'
}

// 方法
const selectTarget = (target) => {
  selectedTarget.value = target.ip
  currentDescription.value = `Target ${target.ip} selected. Monitoring network traffic and security status. Ready for attack vector deployment.`

  // 更新UI中的活跃状态
  updateNetworkVisual(target.ip)
}

const executeAttack = (method) => {
  const now = new Date()
  const timeStr = now.toTimeString().substring(0, 8)

  // 添加到攻击日志
  const newLog = {
    id: `log_${Date.now()}`,
    time: timeStr,
    target: selectedTarget.value,
    description: getMethodDescription(method.id),
    timestamp: now.toISOString()
  }

  // 更新store中的攻击日志
  dashboardStore.addAttackLog(newLog)

  // 更新描述
  currentDescription.value = attackDescriptions[method.id] || 'Attack method executed successfully.'
}

const updateDescription = (description) => {
  currentDescription.value = description
}

const getMethodDescription = (methodId) => {
  const methodNames = {
    'vulnerability': 'Vulnerability scan',
    'brute': 'Brute force attack',
    'sql': 'SQL injection attempt',
    'command': 'Command injection attempt',
    'dos': 'DoS attack initiated',
    'mitm': 'MITM attack deployed'
  }

  return methodNames[methodId] || 'Unknown attack'
}

const updateNetworkVisual = (targetIp) => {
  // 更新网络可视化状态
  console.log('Selected target:', targetIp)
}

// 生命周期
onMounted(() => {
  // 初始化仪表盘数据
  dashboardStore.initializeDashboard()
})
</script>

<style scoped>
/* 主容器 */
.cybersecurity-dashboard {
  display: grid;
  grid-template-columns: 300px 1fr 300px;
  grid-template-rows: 1fr 300px;
  height: 100vh;
  gap: 10px;
  padding: 10px;
  background: #0a1628;
  color: #ffffff;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-size: 14px;
}

/* 面板通用样式 */
.panel {
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 20px;
  position: relative;
}

.panel-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 20px;
  color: #e2e8f0;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* 左侧面板 */
.left-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.targets-panel {
  flex: 1;
}

.target-item {
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid #475569;
  border-radius: 4px;
  padding: 12px 16px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: monospace;
}

.target-item:hover {
  background: rgba(59, 130, 246, 0.2);
  border-color: #3b82f6;
  transform: translateX(5px);
}

.target-item.active {
  background: rgba(239, 68, 68, 0.3);
  border-color: #ef4444;
}

.methods-panel {
  flex: 1;
}

.method-item {
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid #475569;
  border-radius: 4px;
  padding: 10px 16px;
  margin-bottom: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  font-size: 12px;
  letter-spacing: 0.5px;
}

.method-item:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: #ef4444;
}

/* 中间面板 */
.center-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.network-panel {
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
  background: radial-gradient(circle at center, rgba(15, 23, 42, 0.9), rgba(7, 11, 20, 0.9));
}

.traffic-indicator {
  position: absolute;
  top: 15px;
  right: 20px;
  background: rgba(34, 197, 94, 0.2);
  border: 1px solid #22c55e;
  border-radius: 4px;
  padding: 5px 10px;
  font-family: monospace;
  font-size: 12px;
  color: #22c55e;
}

.network-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.network-svg {
  width: 100%;
  height: 100%;
  max-height: 400px;
}

/* 网络图样式 */
.network-link {
  stroke: #3b82f6;
  stroke-width: 2;
  stroke-opacity: 0.6;
}

.normal-node {
  fill: #1e293b;
  stroke: #3b82f6;
  stroke-width: 2;
}

.compromised-node {
  fill: #ef4444;
  stroke: #dc2626;
  stroke-width: 3;
}

.warning-node {
  fill: #f59e0b;
  stroke: #d97706;
  stroke-width: 2;
}

.node-rect {
  fill: #0f172a;
  stroke-width: 1;
  rx: 2;
}

.node-rect.normal {
  stroke: #3b82f6;
}

.node-rect.compromised {
  stroke: #ef4444;
}

.node-rect.warning {
  stroke: #f59e0b;
}

.warning-icon {
  fill: #f59e0b;
  text-anchor: middle;
  font-size: 12px;
}

.node-label {
  fill: #e2e8f0;
  text-anchor: middle;
  font-family: monospace;
  font-size: 12px;
}

.node {
  cursor: pointer;
  transition: all 0.3s ease;
}

.node:hover {
  transform: scale(1.1);
}

/* 攻击日志 */
.logs-panel {
  height: 280px;
}

.attack-log-table {
  width: 100%;
  border-collapse: collapse;
  font-family: monospace;
}

.attack-log-table th {
  background: rgba(30, 41, 59, 0.8);
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #475569;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.attack-log-table td {
  padding: 10px 12px;
  border-bottom: 1px solid rgba(71, 85, 105, 0.3);
  font-size: 13px;
}

.log-row {
  cursor: pointer;
  transition: background-color 0.2s;
}

.log-row:hover {
  background: rgba(59, 130, 246, 0.1);
}

/* 右侧面板 */
.right-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.scan-panel {
  flex: 1;
}

.spider-chart-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.spider-chart {
  width: 250px;
  height: 250px;
}

.spider-circle {
  fill: none;
  stroke: #334155;
  stroke-width: 1;
  opacity: 0.3;
}

.spider-axis {
  stroke: #334155;
  stroke-width: 1;
  opacity: 0.3;
}

.spider-polygon {
  fill: rgba(59, 130, 246, 0.3);
  stroke: #3b82f6;
  stroke-width: 2;
}

.spider-point {
  fill: #3b82f6;
}

.spider-label {
  fill: #94a3b8;
  text-anchor: middle;
  font-size: 11px;
}

/* 流量面板 */
.traffic-panel {
  height: 200px;
  position: relative;
}

.traffic-chart-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.traffic-chart {
  width: 100%;
  height: 150px;
}

.grid-line {
  fill: none;
  stroke: #334155;
  stroke-width: 0.5;
  opacity: 0.3;
}

.axis-label {
  fill: #94a3b8;
  font-size: 10px;
  font-family: monospace;
}

.traffic-line {
  fill: none;
  stroke: #3b82f6;
  stroke-width: 2;
}

.traffic-area {
  fill: rgba(59, 130, 246, 0.2);
}

/* 描述面板 */
.description-panel {
  height: 100px;
}

.description-content {
  background: rgba(20, 30, 48, 0.6);
  border-radius: 4px;
  padding: 15px;
  font-family: monospace;
  font-size: 13px;
  line-height: 1.4;
  height: calc(100% - 40px);
  overflow-y: auto;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .cybersecurity-dashboard {
    grid-template-columns: 250px 1fr 250px;
  }
}

@media (max-width: 768px) {
  .cybersecurity-dashboard {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
    gap: 20px;
  }

  .left-panel,
  .right-panel {
    flex-direction: row;
  }
}
</style>