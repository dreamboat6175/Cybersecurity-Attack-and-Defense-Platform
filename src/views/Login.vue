<template>
  <div class="login-container">
    <div class="login-background">
      <!-- 背景动画效果 -->
      <div class="bg-animation">
        <div v-for="i in 20" :key="i" class="bg-particle"></div>
      </div>
    </div>

    <div class="login-content">
      <!-- Logo和标题 -->
      <div class="login-header">
        <div class="logo">
          <span class="logo-icon">🛡️</span>
          <span class="logo-text">CyberSec</span>
        </div>
        <h1 class="login-title">网络安全攻防平台</h1>
        <p class="login-subtitle">保护您的数字世界</p>
      </div>

      <!-- 登录表单 -->
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <div class="input-wrapper">
            <span class="input-icon">👤</span>
            <input
                v-model="loginForm.username"
                type="text"
                placeholder="用户名"
                class="form-input"
                :class="{ error: errors.username }"
                required
            >
          </div>
          <div v-if="errors.username" class="error-message">
            {{ errors.username }}
          </div>
        </div>

        <div class="form-group">
          <div class="input-wrapper">
            <span class="input-icon">🔒</span>
            <input
                v-model="loginForm.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="密码"
                class="form-input"
                :class="{ error: errors.password }"
                required
            >
            <button
                type="button"
                class="toggle-password"
                @click="showPassword = !showPassword"
            >
              {{ showPassword ? '🙈' : '👁️' }}
            </button>
          </div>
          <div v-if="errors.password" class="error-message">
            {{ errors.password }}
          </div>
        </div>

        <div class="form-options">
          <label class="checkbox-wrapper">
            <input v-model="loginForm.remember" type="checkbox">
            <span class="checkmark"></span>
            记住我
          </label>
          <a href="#" class="forgot-link">忘记密码？</a>
        </div>

        <button
            type="submit"
            class="login-btn"
            :disabled="isLoading"
            :class="{ loading: isLoading }"
        >
          <span v-if="isLoading" class="loading-spinner"></span>
          {{ isLoading ? '登录中...' : '登录' }}
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
            <button
                type="button"
                class="demo-account"
                @click="fillDemoAccount('user')"
            >
              用户: user / user123
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
      console.log('✅ 登录成功')
      router.push('/dashboard')
    }
  } catch (error) {
    console.error('❌ 登录失败:', error)
  }
}

const fillDemoAccount = (type) => {
  if (type === 'admin') {
    loginForm.username = 'admin'
    loginForm.password = 'admin123'
  } else if (type === 'user') {
    loginForm.username = 'user'
    loginForm.password = 'user123'
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
  background: linear-gradient(135deg, var(--color-bg-primary) 0%, #1a2332 100%);
  overflow: hidden;
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
  background: var(--color-text-accent);
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

/* 为每个粒子设置随机位置 */
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
.bg-particle:nth-child(11) { top: 75%; left: 25%; }
.bg-particle:nth-child(12) { top: 35%; left: 35%; }
.bg-particle:nth-child(13) { top: 65%; left: 45%; }
.bg-particle:nth-child(14) { top: 15%; left: 55%; }
.bg-particle:nth-child(15) { top: 85%; left: 65%; }
.bg-particle:nth-child(16) { top: 45%; left: 75%; }
.bg-particle:nth-child(17) { top: 55%; left: 85%; }
.bg-particle:nth-child(18) { top: 95%; left: 95%; }
.bg-particle:nth-child(19) { top: 5%; left: 5%; }
.bg-particle:nth-child(20) { top: 85%; left: 15%; }

/* 登录内容 */
.login-content {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 400px;
  padding: var(--spacing-xl);
  background-color: rgba(17, 34, 64, 0.95);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-lg);
  backdrop-filter: blur(20px);
  box-shadow: var(--shadow-lg);
}

/* 登录头部 */
.login-header {
  text-align: center;
  margin-bottom: var(--spacing-xl);
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.logo-icon {
  font-size: 2.5rem;
  filter: drop-shadow(0 0 10px rgba(100, 255, 218, 0.3));
}

.logo-text {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--color-text-accent);
  font-family: var(--font-family-mono);
}

.login-title {
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
}

.login-subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0;
}

/* 表单样式 */
.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: var(--spacing-md);
  font-size: var(--font-size-base);
  opacity: 0.7;
  z-index: 1;
}

.form-input {
  width: 100%;
  padding: var(--spacing-md) var(--spacing-md) var(--spacing-md) calc(var(--spacing-md) + 24px);
  background-color: var(--color-bg-primary);
  border: 2px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  transition: all var(--transition-base);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-text-accent);
  box-shadow: 0 0 0 3px rgba(100, 255, 218, 0.1);
}

.form-input.error {
  border-color: var(--color-danger);
}

.toggle-password {
  position: absolute;
  right: var(--spacing-md);
  background: none;
  border: none;
  cursor: pointer;
  font-size: var(--font-size-base);
  opacity: 0.7;
  transition: opacity var(--transition-base);
}

.toggle-password:hover {
  opacity: 1;
}

.error-message {
  color: var(--color-danger);
  font-size: var(--font-size-xs);
  margin-top: var(--spacing-xs);
}

/* 表单选项 */
.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.checkbox-wrapper input {
  display: none;
}

.checkmark {
  width: 16px;
  height: 16px;
  border: 2px solid var(--color-border);
  border-radius: 3px;
  margin-right: var(--spacing-sm);
  position: relative;
  transition: all var(--transition-base);
}

.checkbox-wrapper input:checked + .checkmark {
  background-color: var(--color-text-accent);
  border-color: var(--color-text-accent);
}

.checkbox-wrapper input:checked + .checkmark::after {
  content: '✓';
  position: absolute;
  top: -2px;
  left: 1px;
  color: var(--color-bg-primary);
  font-size: 12px;
  font-weight: bold;
}

.forgot-link {
  color: var(--color-text-accent);
  font-size: var(--font-size-sm);
  text-decoration: none;
  transition: opacity var(--transition-base);
}

.forgot-link:hover {
  opacity: 0.8;
}

/* 登录按钮 */
.login-btn {
  width: 100%;
  padding: var(--spacing-md);
  background: linear-gradient(135deg, var(--color-text-accent), #4ECDC4);
  color: var(--color-bg-primary);
  border: none;
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-base);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-base);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(100, 255, 218, 0.3);
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.login-btn.loading {
  pointer-events: none;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid var(--color-bg-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* 错误提示 */
.login-error {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background-color: rgba(244, 67, 54, 0.1);
  border: 1px solid var(--color-danger);
  border-radius: var(--border-radius-sm);
  color: var(--color-danger);
  font-size: var(--font-size-sm);
}

.error-icon {
  flex-shrink: 0;
}

/* 演示信息 */
.demo-info {
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-border);
  text-align: center;
}

.demo-text {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-md);
}

.demo-accounts {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.demo-account {
  padding: var(--spacing-sm);
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
  font-family: var(--font-family-mono);
  cursor: pointer;
  transition: all var(--transition-base);
}

.demo-account:hover {
  border-color: var(--color-text-accent);
  color: var(--color-text-accent);
}

/* 动画 */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 响应式 */
@media (max-width: 480px) {
  .login-content {
    margin: var(--spacing-md);
    padding: var(--spacing-lg);
  }

  .login-title {
    font-size: var(--font-size-lg);
  }

  .form-options {
    flex-direction: column;
    gap: var(--spacing-sm);
    align-items: flex-start;
  }
}
</style>
