<template>
  <div class="dashboard">
    <div class="header">
      <div class="header-left">
        <h2>🛡️ 安全态势感知</h2>
      </div>
      <div class="header-right">
        <button @click="refresh" class="btn">刷新</button>
        <button @click="handleLogout" class="btn logout-btn">退出登录</button>
      </div>
    </div>

    <div class="content">
      <div class="welcome">
        <h3>欢迎使用网络安全攻防平台</h3>
        <p>当前时间: {{ currentTime }}</p>
      </div>

      <div class="metrics-grid">
        <div class="metric-card" v-for="metric in metrics" :key="metric.key">
          <div class="metric-icon">{{ metric.icon }}</div>
          <div class="metric-info">
            <div class="metric-title">{{ metric.title }}</div>
            <div class="metric-value">{{ metric.value }}</div>
          </div>
        </div>
      </div>

      <div class="status-section">
        <h4>系统状态</h4>
        <div class="status-list">
          <div class="status-item">
            <span class="status-dot green"></span>
            <span>网络连接正常</span>
          </div>
          <div class="status-item">
            <span class="status-dot yellow"></span>
            <span>发现 3 个中危漏洞</span>
          </div>
          <div class="status-item">
            <span class="status-dot red"></span>
            <span>1 个高危告警待处理</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const currentTime = ref('')

// 模拟指标数据
const metrics = reactive([
  { key: 'vulnerabilities', title: '发现漏洞', value: '23', icon: '🐛' },
  { key: 'hosts', title: '在线主机', value: '156', icon: '👁️' },
  { key: 'threats', title: '威胁告警', value: '7', icon: '⚠️' },
  { key: 'security', title: '安全评分', value: '85', icon: '🛡️' }
])

let timeInterval: NodeJS.Timeout

const updateTime = () => {
  currentTime.value = new Date().toLocaleString('zh-CN')
}

const refresh = () => {
  console.log('刷新数据...')
  alert('数据已刷新')
}

const handleLogout = () => {
  localStorage.removeItem('token')
  alert('已安全退出')
  router.push('/login')
}

onMounted(() => {
  console.log('Dashboard mounted')
  updateTime()
  timeInterval = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: #0f1419;
  color: #e5e7eb;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #1a202c;
  border-bottom: 1px solid #374151;
  padding: 16px 24px;
}

.header-left h2 {
  color: #e5e7eb;
  margin: 0;
}

.header-right {
  display: flex;
  gap: 12px;
}

.btn {
  padding: 8px 16px;
  background: #374151;
  color: #e5e7eb;
  border: 1px solid #4b5563;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.btn:hover {
  background: #4b5563;
}

.logout-btn {
  background: #dc2626;
  border-color: #dc2626;
}

.logout-btn:hover {
  background: #b91c1c;
}

.content {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.welcome {
  text-align: center;
  margin-bottom: 32px;
}

.welcome h3 {
  color: #e5e7eb;
  margin-bottom: 8px;
}

.welcome p {
  color: #9ca3af;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.metric-card {
  background: #1a202c;
  border: 1px solid #374151;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.metric-icon {
  font-size: 32px;
}

.metric-info {
  flex: 1;
}

.metric-title {
  color: #9ca3af;
  font-size: 14px;
  margin-bottom: 4px;
}

.metric-value {
  color: #e5e7eb;
  font-size: 24px;
  font-weight: bold;
}

.status-section {
  background: #1a202c;
  border: 1px solid #374151;
  border-radius: 8px;
  padding: 24px;
}

.status-section h4 {
  color: #e5e7eb;
  margin-bottom: 16px;
}

.status-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.green {
  background: #10b981;
}

.status-dot.yellow {
  background: #f59e0b;
}

.status-dot.red {
  background: #ef4444;
}
</style>