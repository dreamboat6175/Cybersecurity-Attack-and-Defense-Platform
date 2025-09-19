<template>
  <div class="dashboard">
    <!-- 头部导航 -->
    <a-layout>
      <a-layout-header class="header">
        <div class="header-left">
          <h2>🛡️ 安全态势感知</h2>
        </div>
        <div class="header-right">
          <a-space>
            <a-button type="text" @click="refresh">
              <template #icon><ReloadOutlined /></template>
              刷新
            </a-button>
            <a-dropdown>
              <a-button type="text">
                <UserOutlined />
                {{ authStore.user?.username }}
                <DownOutlined />
              </a-button>
              <template #overlay>
                <a-menu @click="handleMenuClick">
                  <a-menu-item key="logout">
                    <LogoutOutlined />
                    退出登录
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </a-space>
        </div>
      </a-layout-header>

      <!-- 主要内容区 -->
      <a-layout-content class="content">
        <div class="dashboard-grid">
          <!-- 关键指标卡片 -->
          <div class="metrics-row">
            <a-card class="metric-card" v-for="metric in metrics" :key="metric.key">
              <div class="metric-content">
                <div class="metric-icon" :style="{ color: metric.color }">
                  <component :is="metric.icon" />
                </div>
                <div class="metric-info">
                  <div class="metric-title">{{ metric.title }}</div>
                  <div class="metric-value">{{ metric.value }}</div>
                </div>
              </div>
            </a-card>
          </div>

          <!-- 网络状态概览 -->
          <a-row :gutter="[16, 16]">
            <a-col :span="12">
              <a-card title="网络拓扑" class="network-card">
                <div class="network-topology">
                  <div class="topology-placeholder">
                    <ApiOutlined style="font-size: 48px; color: #3b82f6;" />
                    <p>网络拓扑图</p>
                    <p class="topology-desc">展示网络结构和连接状态</p>
                  </div>
                </div>
              </a-card>
            </a-col>

            <a-col :span="12">
              <a-card title="实时威胁" class="threat-card">
                <div class="threat-feed">
                  <a-list
                      :data-source="threatEvents"
                      size="small"
                  >
                    <template #renderItem="{ item }">
                      <a-list-item>
                        <div class="threat-item">
                          <a-badge :color="item.color" />
                          <span class="threat-message">{{ item.message }}</span>
                          <span class="threat-time">{{ item.time }}</span>
                        </div>
                      </a-list-item>
                    </template>
                  </a-list>
                </div>
              </a-card>
            </a-col>
          </a-row>

          <!-- 快捷操作 -->
          <a-card title="快捷操作" class="actions-card">
            <a-row :gutter="[16, 16]">
              <a-col :span="6" v-for="action in quickActions" :key="action.key">
                <div class="action-item" @click="handleAction(action.key)">
                  <div class="action-icon" :style="{ color: action.color }">
                    <component :is="action.icon" />
                  </div>
                  <div class="action-title">{{ action.title }}</div>
                </div>
              </a-col>
            </a-row>
          </a-card>
        </div>
      </a-layout-content>
    </a-layout>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import {
  UserOutlined,
  DownOutlined,
  LogoutOutlined,
  ReloadOutlined,
  ShieldOutlined,
  BugOutlined,
  EyeOutlined,
  WarningOutlined,
  ApiOutlined,
  ScanOutlined,
  SettingOutlined,
  FileTextOutlined
} from '@ant-design/icons-vue'
import { useAuthStore } from '@/store'

const router = useRouter()
const authStore = useAuthStore()

// 关键指标数据
const metrics = reactive([
  {
    key: 'vulnerabilities',
    title: '发现漏洞',
    value: '23',
    icon: BugOutlined,
    color: '#ef4444'
  },
  {
    key: 'hosts',
    title: '在线主机',
    value: '156',
    icon: EyeOutlined,
    color: '#10b981'
  },
  {
    key: 'threats',
    title: '威胁告警',
    value: '7',
    icon: WarningOutlined,
    color: '#f59e0b'
  },
  {
    key: 'security',
    title: '安全评分',
    value: '85',
    icon: ShieldOutlined,
    color: '#3b82f6'
  }
])

// 威胁事件数据
const threatEvents = reactive([
  { message: '发现高危漏洞 CVE-2023-1234', time: '2分钟前', color: 'red' },
  { message: '检测到端口扫描行为', time: '5分钟前', color: 'orange' },
  { message: '新增目标主机 192.168.1.100', time: '10分钟前', color: 'blue' },
  { message: '扫描任务完成', time: '15分钟前', color: 'green' }
])

// 快捷操作
const quickActions = [
  { key: 'scan', title: '漏洞扫描', icon: ScanOutlined, color: '#3b82f6' },
  { key: 'exploit', title: '漏洞利用', icon: BugOutlined, color: '#ef4444' },
  { key: 'report', title: '生成报告', icon: FileTextOutlined, color: '#10b981' },
  { key: 'settings', title: '系统设置', icon: SettingOutlined, color: '#6b7280' }
]

// 处理菜单点击
const handleMenuClick = ({ key }: { key: string }) => {
  if (key === 'logout') {
    authStore.logout()
    message.success('已安全退出')
    router.push('/login')
  }
}

// 刷新数据
const refresh = () => {
  message.info('刷新数据中...')
  // 这里可以调用API刷新数据
}

// 处理快捷操作
const handleAction = (key: string) => {
  message.info(`执行操作: ${key}`)
  // 根据不同的操作跳转到对应页面
}

onMounted(() => {
  // 页面加载时获取数据
  console.log('Dashboard mounted')
})
</script>

<style scoped>
.dashboard {
  height: 100vh;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #1a202c;
  border-bottom: 1px solid #374151;
  padding: 0 24px;
}

.header-left h2 {
  color: #e5e7eb;
  margin: 0;
}

.content {
  padding: 24px;
  overflow-y: auto;
}

.dashboard-grid {
  max-width: 1200px;
  margin: 0 auto;
}

.metrics-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.metric-card {
  background: #1a202c;
  border-color: #374151;
}

.metric-content {
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

.network-card,
.threat-card,
.actions-card {
  background: #1a202c;
  border-color: #374151;
}

.topology-placeholder {
  text-align: center;
  padding: 40px;
  color: #9ca3af;
}

.topology-desc {
  font-size: 12px;
  margin-top: 8px;
}

.threat-feed {
  max-height: 300px;
  overflow-y: auto;
}

.threat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.threat-message {
  flex: 1;
  font-size: 13px;
}

.threat-time {
  font-size: 12px;
  color: #9ca3af;
}

.action-item {
  text-align: center;
  padding: 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid #374151;
}

.action-item:hover {
  background: #374151;
  border-color: #4b5563;
}

.action-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.action-title {
  font-size: 14px;
  color: #e5e7eb;
}
</style>