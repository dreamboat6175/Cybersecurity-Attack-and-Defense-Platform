<!-- src/views/Login.vue - 添加界面选择 -->
<template>
  <div class="login-container">
    <!-- 背景动画 -->
    <div class="login-background">
      <div class="bg-animation">
        <div v-for="i in 20" :key="i" class="bg-particle"></div>
      </div>
    </div>

    <!-- 登录表单 -->
    <div class="login-card">
      <div class="login-header">
        <div class="logo">
          <span class="logo-icon">🛡️</span>
          <span class="logo-text">网络安全攻防平台</span>
        </div>
        <p class="login-subtitle">Security Operation Center</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <!-- 用户名输入 -->
        <div class="form-group">
          <label class="form-label">用户名</label>
          <input
              v-model="loginForm.username"
              type="text"
              class="form-input"
              :class="{ error: errors.username }"
              placeholder="请输入用户名"
              required
          />
          <div v-if="errors.username" class="error-message">{{ errors.username }}</div>
        </div>

        <!-- 密码输入 -->
        <div class="form-group">
          <label class="form-label">密码</label>
          <div class="password-wrapper">
            <input
                v-model="loginForm.password"
                :type="showPassword ? 'text' : 'password'"
                class="form-input"
                :class="{ error: errors.password }"
                placeholder="请输入密码"
                required
            />
            <button
                type="button"
                class="password-toggle"
                @click="showPassword = !showPassword"
            >
              {{ showPassword ? '🙈' : '👁️' }}
            </button>
          </div>
          <div v-if="errors.password" class="error-message">{{ errors.password }}</div>
        </div>

        <!-- 界面选择 -->
        <div class="form-group">
          <label class="form-label">选择界面</label>
          <div class="dashboard-options">
            <label class="radio-option">
              <input
                  v-model="selectedDashboard"
                  type="radio"
                  value="cybersec"
              />
              <span class="radio-label">
                <span class="radio-icon">⚡</span>
                <span class="radio-text">网络安全监控面板</span>
                <span class="radio-desc">专业安全监控界面</span>
              </span>
            </label>
            <label class="radio-option">
              <input
                  v-model="selectedDashboard"
                  type="radio"
                  value="dashboard"
              />
              <span class="radio-label">
                <span class="radio-icon">📊</span>
                <span class="radio-text">标准仪表盘</span>
                <span class="radio-desc">基础数据展示界面</span>
              </span>
            </label>
          </div>
        </div>

        <!-- 记住登录 -->
        <div class="form-group">
          <label class="checkbox-wrapper">
            <input
                v-model="loginForm.remember"
                type="checkbox"
                class="form-checkbox"
            />
            <span class="checkbox-label">记住登录状态</span>
          </label>
        </div>

        <!-- 登录按钮 -->
        <button
            type="submit"
            class="login-button"
            :disabled="isLoading"
            :class="{ loading: isLoading }"
        >
          <span v-if="!isLoading" class="btn-text">登录</span>
          <span v-else class="btn-text">
            <span class="loading-spinner">🔄</span>
            登录中...
          </span>
        </button>

        <!-- 错误提示 -->
        <Transition name="fade">
          <div v-if="loginError" class="login-error">
            <span class="error-icon">⚠️</span>
            {{ loginError }}
          </div>
        </Transition>

        <!-- 演示账号提示 -->
        <div class="demo-info">
          <p class="demo-text">演示账号</p>
          <div class="demo-accounts">
            <button
                type="button"
                class="demo-account"
                @click="fillDemoAccount('admin')"
            >
              管理员: admin / admin123
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// 响应式数据
const showPassword = ref(false)
const selectedDashboard = ref('cybersec') // 默认选择网络安全监控面板
const loginForm = reactive({
  username: '',
  password: '',
  remember: false
})
const errors = reactive({
  username: '',
  password: ''
})

// 计算属性
const isLoading = computed(() => authStore.isLoading)
const loginError = computed(() => authStore.error)

// 方法
const validateForm = () => {
  errors.username = ''
  errors.password = ''

  if (!loginForm.username.trim()) {
    errors.username = '请输入用户名'
    return false
  }

  if (loginForm.username.length < 3) {
    errors.username = '用户名至少3个字符'
    return false
  }

  if (!loginForm.password) {
    errors.password = '请输入密码'
    return false
  }

  if (loginForm.password.length < 6) {
    errors.password = '密码至少6个字符'
    return false
  }

  return true
}

const handleLogin = async () => {
  if (!validateForm()) return

  try {
    const result = await authStore.login({
      username: loginForm.username,
      password: loginForm.password,
      remember: loginForm.remember
    })

    if (result.success) {
      console.log('✅ 登录成功，跳转到:', selectedDashboard.value)

      // 根据选择的界面跳转
      if (selectedDashboard.value === 'cybersec') {
        router.push('/cybersec')
      } else {
        router.push('/dashboard')
      }
    }
  } catch (error) {
    console.error('❌ 登录失败:', error)
  }
}

const fillDemoAccount = (type) => {
  if (type === 'admin') {
    loginForm.username = 'admin'
    loginForm.password = 'admin123'
  }
}

// 清除错误信息
const clearErrors = () => {
  errors.username = ''
  errors.password = ''
  authStore.clearError()
}

// 监听输入变化清除错误
import { watch } from 'vue'
watch(() => loginForm.username, clearErrors)
watch(() => loginForm.password, clearErrors)
</script>

<style scoped>
.login-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #0a1520 0%, #1a2b42 100%);
  overflow: hidden;
  padding: 20px;
}

/* 背景动画 */
.login-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

.bg-animation {
  position: relative;
  width: 100%;
  height: 100%;
}

.bg-particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: #4080ff;
  border-radius: 50%;
  opacity: 0.1;
  animation: float 6s ease-in-out infinite;
}

.bg-particle:nth-child(odd) {
  animation-duration: 8s;
  animation-delay: -2s;
}

.bg-particle:nth-child(even) {
  animation-duration: 10s;
  animation-delay: -4s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
    opacity: 0.1;
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
    opacity: 0.3;
  }
}

/* 设置粒子随机位置 */
.bg-particle:nth-child(1) { top: 20%; left: 10%; }
.bg-particle:nth-child(2) { top: 80%; left: 20%; }
.bg-particle:nth-child(3) { top: 40%; left: 30%; }
.bg-particle:nth-child(4) { top: 60%; left: 40%; }
.bg-particle:nth-child(5) { top: 30%; left: 50%; }
.bg-particle:nth-child(6) { top: 70%; left: 60%; }
.bg-particle:nth-child(7) { top: 90%; left: 70%; }
.bg-particle:nth-child(8) { top: 10%; left: 80%; }
.bg-particle:nth-child(9) { top: 50%; left: 90%; }
.bg-particle:nth-child(10) { top: 25%; left: 15%; }

/* 登录卡片 */
.login-card {
  position: relative;
  width: 100%;
  max-width: 420px;
  background: rgba(17, 34, 64, 0.95);
  border: 1px solid rgba(64, 128, 255, 0.3);
  border-radius: 16px;
  padding: 40px;
  backdrop-filter: blur(20px);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 8px;
}

.logo-icon {
  font-size: 2.5rem;
}

.logo-text {
  font-size: 1.5rem;
  font-weight: 600;
  color: #ffffff;
}

.login-subtitle {
  color: #8899aa;
  font-size: 0.9rem;
}

/* 表单样式 */
.form-group {
  margin-bottom: 24px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  color: #ffffff;
  font-weight: 500;
  font-size: 0.9rem;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #ffffff;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: #4080ff;
  box-shadow: 0 0 0 3px rgba(64, 128, 255, 0.1);
  background: rgba(255, 255, 255, 0.08);
}

.form-input.error {
  border-color: #ff4444;
}

.password-wrapper {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #8899aa;
  cursor: pointer;
  font-size: 1rem;
  padding: 4px;
  transition: color 0.3s ease;
}

.password-toggle:hover {
  color: #4080ff;
}

/* 界面选择 */
.dashboard-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.radio-option {
  display: block;
  cursor: pointer;
}

.radio-option input[type="radio"] {
  position: absolute;
  opacity: 0;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.radio-option input[type="radio"]:checked + .radio-label {
  background: rgba(64, 128, 255, 0.1);
  border-color: #4080ff;
}

.radio-label:hover {
  background: rgba(255, 255, 255, 0.08);
}

.radio-icon {
  font-size: 1.5rem;
  min-width: 24px;
}

.radio-text {
  font-weight: 500;
  color: #ffffff;
}

.radio-desc {
  font-size: 0.8rem;
  color: #8899aa;
  margin-left: auto;
}

/* 复选框 */
.checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.form-checkbox {
  width: 18px;
  height: 18px;
  accent-color: #4080ff;
}

.checkbox-label {
  color: #8899aa;
  font-size: 0.9rem;
}

/* 登录按钮 */
.login-button {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #4080ff, #6099ff);
  border: none;
  border-radius: 8px;
  color: #ffffff;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 20px;
}

.login-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #3066cc, #5088ee);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(64, 128, 255, 0.3);
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.loading-spinner {
  display: inline-block;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 错误提示 */
.error-message {
  color: #ff4444;
  font-size: 0.8rem;
  margin-top: 4px;
}

.login-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: rgba(255, 68, 68, 0.1);
  border: 1px solid rgba(255, 68, 68, 0.3);
  border-radius: 8px;
  color: #ff6666;
  font-size: 0.9rem;
  margin-bottom: 16px;
}

/* 演示账号 */
.demo-info {
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.demo-text {
  color: #8899aa;
  margin-bottom: 12px;
  font-size: 0.9rem;
}

.demo-account {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: #8899aa;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.3s ease;
}

.demo-account:hover {
  background: rgba(64, 128, 255, 0.1);
  border-color: #4080ff;
  color: #4080ff;
}

/* 过渡动画 */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .login-card {
    margin: 10px;
    padding: 30px 20px;
  }

  .logo-text {
    font-size: 1.2rem;
  }

  .dashboard-options {
    gap: 8px;
  }

  .radio-label {
    padding: 12px;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .radio-desc {
    margin-left: 0;
  }
}
</style>