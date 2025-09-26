<!-- src/views/CyberSecurityDashboard.vue - 美观现代版本 -->
<template>
  <div class="cybersecurity-dashboard">
    <!-- 顶部状态栏 -->
    <div class="top-bar">
      <div class="system-status">
        <div class="status-item">
          <span class="status-dot active"></span>
          <span>系统在线</span>
        </div>
        <div class="status-item">
          <span class="status-dot warning"></span>
<span>{{ activeThreats }} 个活跃威胁</span>
        </div>
        <div class="status-item">
          <span class="status-dot success"></span>
<span>{{ blockedAttacks }} 次攻击已阻断</span>
        </div>
      </div>
      <div class="system-time">
        {{ currentTime }}
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="main-content">
      <!-- 左侧面板 -->
      <div class="left-sidebar">
        <!-- 攻击目标 -->
        <div class="panel targets-panel">
          <div class="panel-header">
            <h3 class="panel-title">
              <i class="icon">🎯</i>
攻击目标
        </h3>
            <span class="target-count">{{ targets.length }}</span>
          </div>
          <div class="panel-content">
            <div
v-for="target in targets"
        :key="target.ip"
class="target-card"
        :class="{ active: selectedTarget === target.ip, [target.status]: true }"
@click="selectTarget(target)"
        >
              <div class="target-info">
                <span class="target-ip">{{ target.ip }}</span>
                <span class="target-status">{{ getStatusText(target.status) }}</span>
              </div>
              <div class="target-indicator">
                <div class="pulse-dot" :class="target.status"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 攻击方法 -->
        <div class="panel methods-panel">
          <div class="panel-header">
            <h3 class="panel-title">
              <i class="icon">⚔️</i>
攻击方法
        </h3>
          </div>
          <div class="panel-content">
            <div
v-for="method in attackMethods"
        :key="method.id"
class="method-card"
@click="executeAttack(method)"
        >
              <div class="method-icon">{{ method.icon }}</div>
              <div class="method-info">
                <span class="method-name">{{ method.name }}</span>
                <span class="method-desc">{{ method.description }}</span>
              </div>
              <div class="method-action">
                <button class="action-btn">执行</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 中央区域 -->
      <div class="center-area">
        <!-- 网络拓扑图 -->
        <div class="panel network-panel">
          <div class="panel-header">
            <h3 class="panel-title">
              <i class="icon">🌐</i>
网络拓扑图
        </h3>
            <div class="network-controls">
              <button class="control-btn" :class="{ active: autoRefresh }" @click="toggleAutoRefresh">
                <i class="icon">🔄</i>
自动刷新
        </button>
            </div>
          </div>
          <div class="panel-content network-content">
            <div class="network-visualization">
              <svg class="network-svg" viewBox="0 0 800 500">
                <!-- 背景网格 -->
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" stroke="rgba(100, 116, 139, 0.1)" stroke-width="1"/>
                  </pattern>
                  <radialGradient id="nodeGradient" cx="50%" cy="30%">
                    <stop offset="0%" style="stop-color:#60a5fa;stop-opacity:0.8" />
                    <stop offset="100%" style="stop-color:#1e40af;stop-opacity:0.4" />
                  </radialGradient>
                  <radialGradient id="dangerGradient" cx="50%" cy="30%">
                    <stop offset="0%" style="stop-color:#f87171;stop-opacity:0.9" />
                    <stop offset="100%" style="stop-color:#dc2626;stop-opacity:0.6" />
                  </radialGradient>
                </defs>

                <rect width="800" height="500" fill="url(#grid)" opacity="0.3"/>

                <!-- 网络连接线 -->
                <g class="connections">
                  <line
v-for="edge in networkEdges"
        :key="edge.id"
        :x1="edge.x1" :y1="edge.y1"
        :x2="edge.x2" :y2="edge.y2"
class="connection-line"
        :class="edge.status"
        />
                </g>

                <!-- 中心节点 -->
                <g class="central-node" transform="translate(400,250)">
                  <circle r="40" fill="url(#dangerGradient)" class="central-circle"/>
                  <circle r="35" fill="none" stroke="#ef4444" stroke-width="3" opacity="0.8"/>
                  <text y="8" class="node-label central-label">🔥</text>
                  <text y="65" class="node-ip">{{ selectedTarget }}</text>
                </g>

                <!-- 网络节点 -->
                <g
v-for="node in networkNodes"
        :key="node.id"
class="network-node"
        :transform="`translate(${node.x},${node.y})`"
@click="selectNodeTarget(node)"
        >
                  <circle
r="25"
        :fill="node.status === 'danger' ? 'url(#dangerGradient)' : 'url(#nodeGradient)'"
class="node-circle"
        :class="node.status"
        />
                  <text y="6" class="node-label">{{ getNodeIcon(node.status) }}</text>
                  <text y="45" class="node-ip">{{ node.ip }}</text>
                </g>

                <!-- 攻击效果动画 -->
                <g v-if="showAttackAnimation" class="attack-animation">
                  <circle r="5" fill="#ef4444" opacity="0.8">
                    <animateMotion dur="2s" repeatCount="indefinite">
                      <path d="M100,100 Q400,50 700,400"/>
                    </animateMotion>
                  </circle>
                </g>
              </svg>
            </div>
          </div>
        </div>

        <!-- 攻击日志 -->
        <div class="panel logs-panel">
          <div class="panel-header">
            <h3 class="panel-title">
              <i class="icon">📋</i>
攻击日志
        </h3>
            <div class="log-controls">
              <select v-model="logFilter" class="filter-select">
                <option value="all">全部</option>
                <option value="critical">严重</option>
                <option value="warning">警告</option>
                <option value="info">信息</option>
              </select>
            </div>
          </div>
          <div class="panel-content logs-content">
            <div class="log-list">
              <div
v-for="log in filteredLogs"
        :key="log.id"
class="log-item"
        :class="log.severity"
@click="selectLog(log)"
        >
                <div class="log-indicator">
                  <span class="log-dot" :class="log.severity"></span>
                </div>
                <div class="log-content">
                  <div class="log-header">
                    <span class="log-time">{{ log.time }}</span>
                    <span class="log-target">{{ log.target }}</span>
                  </div>
                  <div class="log-description">{{ log.description }}</div>
                </div>
                <div class="log-action">
                  <i class="icon">📄</i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧面板 -->
      <div class="right-sidebar">
        <!-- 威胁扫描 -->
        <div class="panel scan-panel">
          <div class="panel-header">
            <h3 class="panel-title">
              <i class="icon">🔍</i>
威胁扫描
        </h3>
          </div>
          <div class="panel-content scan-content">
            <div class="threat-radar">
              <svg class="radar-chart" viewBox="0 0 300 300">
                <g transform="translate(150,150)">
                  <!-- 雷达背景 -->
                  <circle v-for="r in [30, 60, 90, 120]" :key="r" :r="r"
fill="none" stroke="rgba(100, 116, 139, 0.2)" stroke-width="1"/>

                  <!-- 坐标轴 -->
                  <line x1="-120" y1="0" x2="120" y2="0" stroke="rgba(100, 116, 139, 0.3)" stroke-width="1"/>
                  <line x1="0" y1="-120" x2="0" y2="120" stroke="rgba(100, 116, 139, 0.3)" stroke-width="1"/>
                  <line x1="-85" y1="-85" x2="85" y2="85" stroke="rgba(100, 116, 139, 0.3)" stroke-width="1"/>
                  <line x1="85" y1="-85" x2="-85" y2="85" stroke="rgba(100, 116, 139, 0.3)" stroke-width="1"/>

                  <!-- 数据区域 -->
                  <polygon :points="radarPoints"
fill="rgba(59, 130, 246, 0.2)"
stroke="#3b82f6"
stroke-width="2"/>

                  <!-- 数据点 -->
                  <circle v-for="(point, index) in radarData" :key="index"
        :cx="point.x" :cy="point.y" r="4"
fill="#60a5fa" stroke="#1e40af" stroke-width="2"/>

                  <!-- 标签 */
                  <text x="0" y="-135" text-anchor="middle" class="radar-label">威胁</text>
                  <text x="100" y="-70" text-anchor="middle" class="radar-label">完整性</text>
                  <text x="100" y="80" text-anchor="middle" class="radar-label">可用性</text>
                  <text x="-100" y="80" text-anchor="middle" class="radar-label">机密性</text>
                  <text x="-100" y="-70" text-anchor="middle" class="radar-label">风险</text>
                </g>
              </svg>
              <div class="threat-score">
                <span class="score-value">{{ threatScore }}</span>
                <span class="score-label">威胁指数</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 攻击流量 -->
        <div class="panel traffic-panel">
          <div class="panel-header">
            <h3 class="panel-title">
              <i class="icon">📊</i>
攻击流量
        </h3>
            <span class="traffic-indicator">实时</span>
          </div>
          <div class="panel-content traffic-content">
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
            <div class="traffic-chart">
              <svg viewBox="0 0 400 150">
                <defs>
                  <linearGradient id="trafficGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#60a5fa;stop-opacity:0.6" />
                    <stop offset="100%" style="stop-color:#60a5fa;stop-opacity:0.1" />
                  </linearGradient>
                </defs>

                <!-- 网格 -->
                <g class="grid">
                  <line v-for="i in 5" :key="'h'+i"
        :x1="0" :y1="i*30" :x2="400" :y2="i*30"
stroke="rgba(100, 116, 139, 0.1)" stroke-width="1"/>
                  <line v-for="i in 8" :key="'v'+i"
        :x1="i*50" :y1="0" :x2="i*50" :y2="150"
stroke="rgba(100, 116, 139, 0.1)" stroke-width="1"/>
                </g>

                <!-- 流量区域 -->
                <polygon :points="trafficAreaPoints" fill="url(#trafficGradient)"/>

                <!-- 流量线 -->
                <polyline :points="trafficLinePoints"
fill="none" stroke="#60a5fa" stroke-width="3"
stroke-linecap="round" stroke-linejoin="round"/>

                <!-- Y轴标签 -->
                <text x="10" y="20" class="axis-label">200K</text>
                <text x="10" y="80" class="axis-label">100K</text>
                <text x="10" y="140" class="axis-label">0</text>

                <!-- X轴标签 -->
                <text x="350" y="145" class="axis-label">现在</text>
                <text x="200" y="145" class="axis-label">30分钟前</text>
                <text x="50" y="145" class="axis-label">1小时前</text>
              </svg>
            </div>
          </div>
        </div>

        <!-- 系统信息 -->
        <div class="panel info-panel">
          <div class="panel-header">
            <h3 class="panel-title">
              <i class="icon">ℹ️</i>
系统信息
        </h3>
          </div>
          <div class="panel-content info-content">
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">CPU使用率</span>
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: cpuUsage + '%' }"></div>
                </div>
                <span class="info-value">{{ cpuUsage }}%</span>
              </div>
              <div class="info-item">
                <span class="info-label">内存使用率</span>
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: memoryUsage + '%' }"></div>
                </div>
                <span class="info-value">{{ memoryUsage }}%</span>
              </div>
              <div class="info-item">
                <span class="info-label">网络负载</span>
                <div class="progress-bar">
                  <div class="progress-fill warning" :style="{ width: networkLoad + '%' }"></div>
                </div>
                <span class="info-value">{{ networkLoad }}%</span>
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

// 响应式数据
        const selectedTarget = ref('192.168.1.10')
const activeThreats = ref(7)
const blockedAttacks = ref(234)
const currentTime = ref('')
const autoRefresh = ref(true)
const showAttackAnimation = ref(false)
const logFilter = ref('all')
const threatScore = ref(87)
const currentTraffic = ref('1.2K')
const peakTraffic = ref('5.8K')
const cpuUsage = ref(68)
const memoryUsage = ref(45)
const networkLoad = ref(82)

// 攻击目标数据
const targets = ref([
{ ip: '192.168.1.10', status: 'danger', name: '主服务器' },
        { ip: '192.168.1.20', status: 'normal', name: 'Web服务器' },
        { ip: '192.168.1.30', status: 'warning', name: '数据库服务器' },
        { ip: '192.168.1.40', status: 'normal', name: '文件服务器' },
        { ip: '192.168.1.50', status: 'normal', name: '邮件服务器' }
        ])

// 攻击方法数据
        const attackMethods = ref([
{ id: 'vuln_scan', name: '漏洞扫描', icon: '🔍', description: '检测系统漏洞' },
        { id: 'brute_force', name: '暴力破解', icon: '🔨', description: '密码暴力破解' },
        { id: 'sql_injection', name: 'SQL注入', icon: '💉', description: '数据库注入攻击' },
        { id: 'cmd_injection', name: '命令注入', icon: '⌨️', description: '系统命令注入' },
        { id: 'dos', name: '拒绝服务', icon: '🚫', description: 'DoS攻击' },
        { id: 'mitm', name: '中间人攻击', icon: '🎭', description: '流量劫持攻击' }
        ])

// 网络节点数据
        const networkNodes = ref([
{ id: 1, x: 200, y: 100, ip: '192.168.1.20', status: 'normal' },
        { id: 2, x: 600, y: 100, ip: '192.168.1.30', status: 'warning' },
        { id: 3, x: 150, y: 250, ip: '192.168.1.40', status: 'normal' },
        { id: 4, x: 650, y: 250, ip: '192.168.1.50', status: 'normal' },
        { id: 5, x: 200, y: 400, ip: '192.168.1.60', status: 'normal' },
        { id: 6, x: 600, y: 400, ip: '192.168.1.70', status: 'normal' }
        ])

// 网络连接数据
        const networkEdges = ref([
{ id: 1, x1: 400, y1: 250, x2: 200, y2: 100, status: 'normal' },
        { id: 2, x1: 400, y1: 250, x2: 600, y2: 100, status: 'warning' },
        { id: 3, x1: 400, y1: 250, x2: 150, y2: 250, status: 'normal' },
        { id: 4, x1: 400, y1: 250, x2: 650, y2: 250, status: 'normal' },
        { id: 5, x1: 400, y1: 250, x2: 200, y2: 400, status: 'normal' },
        { id: 6, x1: 400, y1: 250, x2: 600, y2: 400, status: 'normal' }
        ])

// 攻击日志数据
        const attackLogs = ref([
{
  id: 1,
          time: '10:34:21',
        target: '192.168.1.10',
        description: 'SQL注入攻击尝试被检测到',
        severity: 'critical'
},
        {
id: 2,
time: '10:32:49',
target: '192.168.1.30',
description: '命令注入攻击尝试',
severity: 'warning'
        },
        {
id: 3,
time: '10:30:15',
target: '192.168.1.20',
description: '暴力破解攻击已阻止',
severity: 'critical'
        },
        {
id: 4,
time: '10:27:58',
target: '192.168.1.10',
description: '系统漏洞扫描完成',
severity: 'info'
        },
        {
id: 5,
time: '10:25:33',
target: '192.168.1.40',
description: '异常网络流量检测',
severity: 'warning'
        }
        ])

// 雷达图数据
        const radarData = ref([
{ x: 0, y: -100 },    // 威胁
        { x: 80, y: -56 },    // 完整性
        { x: 72, y: 72 },     // 可用性
        { x: -64, y: 64 },    // 机密性
        { x: -88, y: -48 }    // 风险
        ])

// 计算属性
        const radarPoints = computed(() =>
        radarData.value.map(p => `${p.x},${p.y}`).join(' ')
)

        const filteredLogs = computed(() => {
        if (logFilter.value === 'all') return attackLogs.value
  return attackLogs.value.filter(log => log.severity === logFilter.value)
})

        const trafficLinePoints = computed(() =>
        '0,120 50,110 100,95 150,80 200,75 250,65 300,55 350,40 400,30'
        )

        const trafficAreaPoints = computed(() =>
trafficLinePoints.value + ' 400,150 0,150'
        )

// 方法
        const updateTime = () => {
        const now = new Date()
currentTime.value = now.toLocaleTimeString('zh-CN', {
  hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
})
        }

        const getStatusText = (status) => {
        const statusMap = {
normal: '正常',
warning: '警告',
danger: '危险',
offline: '离线'
        }
        return statusMap[status] || '未知'
        }

        const getNodeIcon = (status) => {
        const iconMap = {
normal: '💻',
warning: '⚠️',
danger: '🔥',
offline: '💤'
        }
        return iconMap[status] || '💻'
        }

        const selectTarget = (target) => {
selectedTarget.value = target.ip
  console.log('选择目标:', target.ip)
}

        const selectNodeTarget = (node) => {
selectedTarget.value = node.ip
  console.log('从网络图选择目标:', node.ip)
}

        const executeAttack = (method) => {
        console.log('执行攻击:', method.name)
showAttackAnimation.value = true
setTimeout(() => {
showAttackAnimation.value = false
        }, 2000)
        }

        const selectLog = (log) => {
        console.log('选择日志:', log)
}

        const toggleAutoRefresh = () => {
autoRefresh.value = !autoRefresh.value
  console.log('自动刷新:', autoRefresh.value)
}

// 生命周期
let timeInterval = null

onMounted(() => {
updateTime()
timeInterval = setInterval(updateTime, 1000)
  console.log('🎯 现代化网络安全监控面板已加载')
})

onUnmounted(() => {
        if (timeInterval) {
clearInterval(timeInterval)
  }
          })
</script>

<style scoped>
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
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.active { background: #22c55e; box-shadow: 0 0 10px rgba(34, 197, 94, 0.5); }
.status-dot.warning { background: #f59e0b; box-shadow: 0 0 10px rgba(245, 158, 11, 0.5); }
.status-dot.success { background: #3b82f6; box-shadow: 0 0 10px rgba(59, 130, 246, 0.5); }

.system-time {
  font-family: 'Courier New', monospace;
  font-size: 16px;
  font-weight: 600;
  color: #64748b;
}

/* 主内容区域 */
.main-content {
  display: grid;
  grid-template-columns: 320px 1fr 320px;
  gap: 20px;
  padding: 20px;
  height: calc(100vh - 80px);
}

/* 面板基础样式 */
.panel {
  background: rgba(30, 41, 59, 0.4);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.panel:hover {
  border-color: rgba(59, 130, 246, 0.3);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  background: rgba(15, 23, 42, 0.5);
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
  color: #f1f5f9;
  margin: 0;
}

.icon {
  font-size: 18px;
}

.panel-content {
  padding: 20px;
  height: calc(100% - 80px);
  overflow-y: auto;
}

/* 侧边栏 */
.left-sidebar,
        .right-sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 目标面板 */
.targets-panel {
  flex: 1;
}

.target-count {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.target-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  margin-bottom: 12px;
  background: rgba(51, 65, 85, 0.3);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.target-card:hover {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.3);
  transform: translateX(4px);
}

.target-card.active {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
}

.target-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.target-ip {
  font-family: 'Courier New', monospace;
  font-size: 14px;
  font-weight: 600;
  color: #f1f5f9;
}

.target-status {
  font-size: 12px;
  color: #94a3b8;
}

.target-indicator {
  display: flex;
  align-items: center;
}

.pulse-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  animation: pulse-glow 2s infinite;
}

.pulse-dot.normal { background: #22c55e; }
.pulse-dot.warning { background: #f59e0b; }
.pulse-dot.danger { background: #ef4444; }

@keyframes pulse-glow {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.7; }
}

/* 攻击方法面板 */
.methods-panel {
  flex: 1.2;
}

.method-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  margin-bottom: 12px;
  background: rgba(51, 65, 85, 0.3);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.method-card:hover {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.3);
  transform: translateX(4px);
}

.method-icon {
  font-size: 24px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 10px;
}

.method-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.method-name {
  font-size: 14px;
  font-weight: 600;
  color: #f1f5f9;
}

.method-desc {
  font-size: 12px;
  color: #94a3b8;
}

.action-btn {
  padding: 8px 16px;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn:hover {
  background: linear-gradient(135deg, #2563eb, #1e40af);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
}

/* 中央区域 */
.center-area {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.network-panel {
  flex: 2;
}

.logs-panel {
  flex: 1;
}

/* 网络控制 */
.network-controls {
  display: flex;
  gap: 12px;
}

.control-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: rgba(51, 65, 85, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 8px;
  color: #94a3b8;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.control-btn:hover,
        .control-btn.active {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.4);
  color: #60a5fa;
}

/* 网络可视化 */
.network-content {
  padding: 0;
}

.network-visualization {
  width: 100%;
  height: 100%;
  min-height: 400px;
}

.network-svg {
  width: 100%;
  height: 100%;
}

.connection-line {
  stroke: rgba(59, 130, 246, 0.4);
  stroke-width: 2;
  stroke-dasharray: 8, 4;
  animation: flow 3s linear infinite;
}

.connection-line.warning {
  stroke: rgba(245, 158, 11, 0.6);
}

.connection-line.danger {
  stroke: rgba(239, 68, 68, 0.6);
}

@keyframes flow {
  0% { stroke-dashoffset: 0; }
  100% { stroke-dashoffset: -12; }
}

.central-circle {
  animation: pulse-danger 2s infinite;
}

@keyframes pulse-danger {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.node-circle {
  cursor: pointer;
  transition: all 0.3s ease;
}

.network-node:hover .node-circle {
  transform: scale(1.2);
  filter: drop-shadow(0 0 20px rgba(59, 130, 246, 0.6));
}

.node-label {
  fill: #f1f5f9;
  text-anchor: middle;
  font-size: 18px;
  pointer-events: none;
}

.central-label {
  font-size: 24px;
}

.node-ip {
  fill: #94a3b8;
  text-anchor: middle;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  pointer-events: none;
}

/* 攻击动画 */
.attack-animation circle {
filter: drop-shadow(0 0 10px #ef4444);
}

        /* 日志控制 */
        .log-controls {
  display: flex;
  gap: 12px;
}

.filter-select {
  padding: 6px 12px;
  background: rgba(51, 65, 85, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 6px;
  color: #f1f5f9;
  font-size: 12px;
  cursor: pointer;
}

.filter-select:focus {
  outline: none;
  border-color: rgba(59, 130, 246, 0.4);
}

/* 日志列表 */
.logs-content {
  padding: 0;
}

.log-list {
  max-height: 100%;
  overflow-y: auto;
  padding: 20px;
}

.log-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  margin-bottom: 12px;
  background: rgba(51, 65, 85, 0.3);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.log-item:hover {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.3);
  transform: translateX(4px);
}

.log-item.critical {
  border-left: 4px solid #ef4444;
}

.log-item.warning {
  border-left: 4px solid #f59e0b;
}

.log-item.info {
  border-left: 4px solid #3b82f6;
}

.log-indicator {
  display: flex;
  align-items: center;
  margin-top: 2px;
}

.log-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.log-dot.critical { background: #ef4444; }
.log-dot.warning { background: #f59e0b; }
.log-dot.info { background: #3b82f6; }

.log-content {
  flex: 1;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.log-time {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #94a3b8;
}

.log-target {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #60a5fa;
  background: rgba(59, 130, 246, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
}

.log-description {
  font-size: 13px;
  color: #e2e8f0;
  line-height: 1.4;
}

.log-action {
  color: #94a3b8;
  font-size: 16px;
}

/* 威胁扫描面板 */
.scan-panel {
  flex: 1.5;
}

.scan-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.threat-radar {
  position: relative;
  width: 100%;
  max-width: 300px;
}

.radar-chart {
  width: 100%;
  height: 300px;
}

.radar-label {
  fill: #94a3b8;
  font-size: 12px;
  font-weight: 500;
}

.threat-score {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  background: rgba(15, 23, 42, 0.8);
  padding: 16px;
  border-radius: 12px;
  border: 2px solid rgba(59, 130, 246, 0.3);
}

.score-value {
  display: block;
  font-size: 28px;
  font-weight: 700;
  color: #ef4444;
  margin-bottom: 4px;
}

.score-label {
  font-size: 12px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* 攻击流量面板 */
.traffic-panel {
  flex: 1;
}

.traffic-indicator {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.traffic-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.traffic-stats {
  display: flex;
  gap: 20px;
}

.stat-item {
  flex: 1;
  text-align: center;
  padding: 16px;
  background: rgba(51, 65, 85, 0.3);
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.1);
}

.stat-value {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: #60a5fa;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #94a3b8;
}

.traffic-chart {
  flex: 1;
  min-height: 150px;
}

.axis-label {
  fill: #94a3b8;
  font-size: 10px;
  font-family: 'Courier New', monospace;
}

/* 系统信息面板 */
.info-panel {
  flex: 0.8;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-label {
  font-size: 12px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.progress-bar {
  height: 8px;
  background: rgba(51, 65, 85, 0.5);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-fill.warning {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.info-value {
  font-size: 14px;
  font-weight: 600;
  color: #60a5fa;
  text-align: right;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: rgba(51, 65, 85, 0.3);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: rgba(59, 130, 246, 0.4);
  border-radius: 3px;
  transition: background-color 0.3s ease;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(59, 130, 246, 0.6);
}

/* 响应式设计 */
@media (max-width: 1400px) {
  .main-content {
    grid-template-columns: 280px 1fr 280px;
    gap: 16px;
    padding: 16px;
  }
}

@media (max-width: 1200px) {
  .main-content {
    grid-template-columns: 260px 1fr 260px;
    gap: 12px;
    padding: 12px;
  }

  .panel-content {
    padding: 16px;
  }
}

@media (max-width: 1024px) {
  .main-content {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
    gap: 16px;
    height: auto;
  }

  .left-sidebar,
  .right-sidebar {
    flex-direction: row;
    gap: 16px;
  }

  .targets-panel,
  .methods-panel,
  .scan-panel,
  .traffic-panel,
  .info-panel {
    flex: 1;
    min-height: 300px;
  }

  .center-area {
    order: -1;
  }

  .top-bar {
    padding: 12px 16px;
  }

  .system-status {
    gap: 16px;
  }
}

@media (max-width: 768px) {
  .top-bar {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }

  .system-status {
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px;
  }

  .main-content {
    padding: 8px;
    gap: 12px;
  }

  .left-sidebar,
  .right-sidebar {
    flex-direction: column;
  }

  .panel-header {
    padding: 16px;
  }

  .panel-content {
    padding: 12px;
  }

  .traffic-stats {
    flex-direction: column;
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .main-content {
    padding: 5px;
    gap: 8px;
  }

  .panel-header {
    padding: 12px;
  }

  .panel-content {
    padding: 8px;
  }

  .target-card,
  .method-card,
  .log-item {
    padding: 12px;
  }

  .method-icon {
    width: 32px;
    height: 32px;
    font-size: 18px;
  }

  .threat-score {
    padding: 12px;
  }

  .score-value {
    font-size: 24px;
  }
}

/* 动画和性能优化 */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* 深色主题优化 */
@media (prefers-color-scheme: dark) {
  .cybersecurity-dashboard {
    background: linear-gradient(135deg, #0c0f1a 0%, #1a1f2e 50%, #0c0f1a 100%);
  }
}