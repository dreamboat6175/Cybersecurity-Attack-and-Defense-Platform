<template>
  <div class="panel methods-panel">
    <div class="panel-header">
      <h3 class="panel-title">
        <span class="title-icon">⚡</span>
        攻击方法
      </h3>
      <div class="header-info">
        <span class="methods-count">{{ attackMethods.length }}</span>
      </div>
    </div>

    <div class="panel-content">
      <div class="methods-grid">
        <div
            v-for="method in attackMethods"
            :key="method.id"
            class="method-card"
            :class="[`risk-${method.risk}`, { active: selectedMethod === method.id }]"
            @click="selectMethod(method)"
        >
          <div class="method-header">
            <div class="method-icon">{{ method.icon }}</div>
            <div class="risk-badge" :class="`risk-${method.risk}`">
              {{ getRiskLabel(method.risk) }}
            </div>
          </div>

          <div class="method-info">
            <h4 class="method-name">{{ method.name }}</h4>
            <p class="method-description">{{ method.description }}</p>
          </div>

          <div class="method-stats">
            <div class="stat-item">
              <span class="stat-label">使用次数</span>
              <span class="stat-value">{{ getUsageCount(method.id) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">成功率</span>
              <span class="stat-value">{{ getSuccessRate(method.id) }}%</span>
            </div>
          </div>

          <div class="method-actions">
            <button
                class="action-btn simulate-btn"
                @click.stop="simulateAttack(method)"
                :disabled="!selectedTarget"
                :title="selectedTarget ? `对 ${selectedTarget.ip} 执行攻击` : '请先选择目标'"
            >
              <span class="btn-icon">🚀</span>
              模拟攻击
            </button>
          </div>
        </div>
      </div>

      <Transition name="slide-down">
        <div v-if="selectedMethodInfo" class="method-details">
          <div class="details-header">
            <h4>{{ selectedMethodInfo.name }} 详情</h4>
            <button class="close-details" @click="selectedMethod = null">×</button>
          </div>

          <div class="details-content">
            <div class="detail-section">
              <h5>攻击描述</h5>
              <p>{{ selectedMethodInfo.description }}</p>
            </div>

            <div class="detail-section">
              <h5>攻击步骤</h5>
              <ol class="attack-steps">
                <li v-for="step in getAttackSteps(selectedMethodInfo.id)" :key="step">
                  {{ step }}
                </li>
              </ol>
            </div>

            <div class="detail-section">
              <h5>防护建议</h5>
              <ul class="protection-tips">
                <li v-for="tip in getProtectionTips(selectedMethodInfo.id)" :key="tip">
                  {{ tip }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showAttackDialog" class="modal-overlay" @click="closeAttackDialog">
          <div class="modal-content attack-dialog" @click.stop>
            <div class="modal-header">
              <div class="dialog-icon">⚠️</div>
              <h4>确认攻击模拟</h4>
              <button class="modal-close" @click="closeAttackDialog">×</button>
            </div>

            <div class="dialog-content">
              <div class="attack-info">
                <div class="info-row">
                  <span class="label">攻击类型:</span>
                  <span class="value">{{ pendingAttack?.name }}</span>
                </div>
                <div class="info-row">
                  <span class="label">目标:</span>
                  <span class="value">{{ selectedTarget?.ip }} ({{ selectedTarget?.name }})</span>
                </div>
                <div class="info-row">
                  <span class="label">风险等级:</span>
                  <span class="value risk-badge" :class="`risk-${pendingAttack?.risk}`">
                    {{ getRiskLabel(pendingAttack?.risk) }}
                  </span>
                </div>
              </div>

              <div class="warning-message">
                <span class="warning-icon">⚠️</span>
                <p>此操作将模拟真实的网络攻击，仅用于安全测试目的。请确保您有权限对目标系统进行测试。</p>
              </div>
            </div>

            <div class="dialog-actions">
              <button class="btn-secondary" @click="closeAttackDialog">
                取消
              </button>
              <button
                  class="btn-danger"
                  @click="executeAttack"
                  :disabled="isExecuting"
              >
                <span v-if="isExecuting" class="loading-spinner small"></span>
                {{ isExecuting ? '执行中...' : '确认执行' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useDashboardStore } from '@/stores/dashboard'
import { SEVERITY_LABELS } from '@/utils/constants'

// Store
const dashboardStore = useDashboardStore()

// 响应式数据
const selectedMethod = ref(null)
const showAttackDialog = ref(false)
const pendingAttack = ref(null)
const isExecuting = ref(false)

// 计算属性
const attackMethods = computed(() => dashboardStore.attackMethods)
const selectedTarget = computed(() => dashboardStore.selectedTarget)
const attackLogs = computed(() => dashboardStore.attackLogs)

const selectedMethodInfo = computed(() => {
  return attackMethods.value.find(method => method.id === selectedMethod.value)
})

// 方法
const selectMethod = (method) => {
  selectedMethod.value = selectedMethod.value === method.id ? null : method.id
}

const getRiskLabel = (risk) => {
  return SEVERITY_LABELS[risk] || '未知'
}

const getUsageCount = (methodId) => {
  return attackLogs.value.filter(log => log.type === methodId).length
}

const getSuccessRate = (methodId) => {
  const logs = attackLogs.value.filter(log => log.type === methodId)
  if (logs.length === 0) return 0
  const successCount = logs.filter(log => !log.blocked).length
  return Math.round((successCount / logs.length) * 100)
}

const getAttackSteps = (methodId) => {
  const steps = {
    sql_injection: [
      '扫描目标应用程序的输入字段',
      '构造恶意SQL查询语句',
      '注入SQL代码到输入参数',
      '分析服务器响应获取数据库信息',
      '尝试提取敏感数据'
    ],
    xss: [
      '识别用户输入点和输出点',
      '构造恶意JavaScript代码',
      '将脚本注入到网页中',
      '触发脚本执行',
      '窃取用户会话或敏感信息'
    ],
    brute_force: [
      '收集目标系统的登录接口',
      '准备用户名和密码字典',
      '自动化尝试不同的用户名密码组合',
      '监控登录响应判断是否成功',
      '获得有效凭据后进行进一步渗透'
    ],
    dos: [
      '扫描目标系统的网络服务',
      '分析服务的处理能力和弱点',
      '生成大量请求或恶意数据包',
      '持续发送攻击流量',
      '监控目标服务状态直至瘫痪'
    ]
  }
  return steps[methodId] || ['攻击步骤信息暂未收录']
}

const getProtectionTips = (methodId) => {
  const tips = {
    sql_injection: [
      '使用参数化查询和预编译语句',
      '对所有用户输入进行严格验证',
      '实施最小权限原则配置数据库账户',
      '定期更新数据库软件和补丁',
      '部署Web应用防火墙(WAF)'
    ],
    xss: [
      '对所有用户输入进行HTML编码',
      '实施内容安全策略(CSP)',
      '使用HttpOnly标志保护Cookie',
      '验证和过滤用户输入',
      '定期进行安全代码审查'
    ],
    brute_force: [
      '实施账户锁定策略',
      '使用强密码策略',
      '启用多因素认证(MFA)',
      '监控异常登录行为',
      '使用CAPTCHA防止自动化攻击'
    ],
    dos: [
      '部署DDoS防护服务',
      '配置流量限制和负载均衡',
      '实施网络访问控制',
      '监控网络流量异常',
      '制定应急响应预案'
    ]
  }
  return tips[methodId] || ['防护建议信息暂未收录']
}

const simulateAttack = (method) => {
  if (!selectedTarget.value) return

  pendingAttack.value = method
  showAttackDialog.value = true
}

const executeAttack = async () => {
  try {
    isExecuting.value = true

    // 模拟攻击执行
    await new Promise(resolve => setTimeout(resolve, 2000))

    // 生成攻击日志
    const attackLog = {
      type: pendingAttack.value.id,
      target: selectedTarget.value.ip,
      targetName: selectedTarget.value.name,
      severity: pendingAttack.value.risk,
      description: `模拟${pendingAttack.value.name}攻击`,
      source: '192.168.1.100', // 模拟攻击源
      blocked: Math.random() > 0.3, // 70%概率被阻止
      details: {
        method: pendingAttack.value.name,
        automated: true
      }
    }

    // 添加到攻击日志
    dashboardStore.addAttackLog(attackLog)

    console.log('🚀 攻击模拟完成:', attackLog)
    closeAttackDialog()

  } catch (error) {
    console.error('❌ 攻击执行失败:', error)
  } finally {
    isExecuting.value = false
  }
}

const closeAttackDialog = () => {
  showAttackDialog.value = false
  pendingAttack.value = null
}
</script>

<style scoped>
.methods-panel {
  height: 100%;
}

.header-info {
  display: flex;
  align-items: center;
}

.methods-count {
  background-color: var(--color-info);
  color: white;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 600;
}

/* 方法网格 */
.methods-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.method-card {
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-md);
  cursor: pointer;
  transition: all var(--transition-base);
  position: relative;
}

.method-card:hover {
  border-color: var(--color-border-light);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.method-card.active {
  border-color: var(--color-text-accent);
  background-color: rgba(100, 255, 218, 0.05);
}

/* 风险等级边框 */
.method-card.risk-low { border-left: 4px solid var(--color-success); }
.method-card.risk-medium { border-left: 4px solid var(--color-warning); }
.method-card.risk-high { border-left: 4px solid #FF9800; }
.method-card.risk-critical { border-left: 4px solid var(--color-danger); }

/* 方法头部 */
.method-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.method-icon {
  font-size: var(--font-size-xl);
}

.risk-badge {
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 600;
}

.risk-badge.risk-low { background-color: rgba(0, 212, 170, 0.2); color: var(--color-success); }
.risk-badge.risk-medium { background-color: rgba(255, 193, 7, 0.2); color: var(--color-warning); }
.risk-badge.risk-high { background-color: rgba(255, 152, 0, 0.2); color: #FF9800; }
.risk-badge.risk-critical { background-color: rgba(244, 67, 54, 0.2); color: var(--color-danger); }

/* 方法信息 */
.method-info {
  margin-bottom: var(--spacing-md);
}

.method-name {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-xs);
}

.method-description {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.4;
}

/* 统计信息 */
.method-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--spacing-md);
  padding: var(--spacing-sm) 0;
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
}

.stat-item {
  text-align: center;
  flex: 1;
}

.stat-label {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xs);
}

.stat-value {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text-accent);
}

/* 方法操作 */
.method-actions {
  display: flex;
  justify-content: center;
}

.simulate-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  background: linear-gradient(135deg, var(--color-danger), #D32F2F);
  color: white;
  border: none;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  font-size: var(--font-size-sm);
  font-weight: 500;
  transition: all var(--transition-base);
}

.simulate-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #D32F2F, #B71C1C);
  transform: translateY(-1px);
}

.simulate-btn:disabled {
  background: var(--color-text-secondary);
  cursor: not-allowed;
  transform: none;
}

/* 方法详情 */
.method-details {
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  overflow: hidden;
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  background-color: var(--color-bg-tertiary);
  border-bottom: 1px solid var(--color-border);
}

.details-header h4 {
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

.attack-steps,
.protection-tips {
  margin: 0;
  padding-left: var(--spacing-lg);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.attack-steps li,
.protection-tips li {
  margin-bottom: var(--spacing-xs);
  line-height: 1.4;
}

/* 攻击对话框 */
.attack-dialog {
  max-width: 500px;
}

.dialog-icon {
  font-size: var(--font-size-xl);
  margin-right: var(--spacing-sm);
}

.dialog-content {
  padding: var(--spacing-lg);
}

.attack-info {
  margin-bottom: var(--spacing-lg);
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--color-border);
}

.info-row:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.info-row .label {
  font-weight: 500;
  color: var(--color-text-secondary);
}

.info-row .value {
  color: var(--color-text-primary);
  font-weight: 600;
}

.warning-message {
  display: flex;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background-color: rgba(255, 193, 7, 0.1);
  border: 1px solid var(--color-warning);
  border-radius: var(--border-radius-sm);
}

.warning-icon {
  font-size: var(--font-size-base);
  flex-shrink: 0;
}

.warning-message p {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: 1.4;
}

.dialog-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: flex-end;
  padding: var(--spacing-lg);
  border-top: 1px solid var(--color-border);
}

.btn-danger {
  background-color: var(--color-danger);
  color: white;
  border: none;
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  font-size: var(--font-size-sm);
  font-weight: 500;
  transition: all var(--transition-base);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.btn-danger:hover:not(:disabled) {
  background-color: #D32F2F;
}

.btn-danger:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

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

.modal-enter-active,
.modal-leave-active {
  transition: all var(--transition-base);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.9) translateY(-20px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .method-stats {
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .stat-item {
    display: flex;
    justify-content: space-between;
    text-align: left;
  }

  .stat-label {
    margin-bottom: 0;
  }
}
</style>