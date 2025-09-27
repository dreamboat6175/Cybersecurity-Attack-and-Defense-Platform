<!-- Login.vue - 更新版本 -->
<template>
  <div class="login-container">
    <!-- 背景动画 -->
    <div class="login-background">
      <div class="bg-animation">
        <div v-for="i in 15" :key="i" class="bg-particle"></div>
      </div>
      <div class="grid-overlay"></div>
    </div>

    <!-- 登录卡片 -->
    <div class="login-card">
      <div class="login-header">
        <div class="logo">
          <div class="logo-icon">
            <i class="fas fa-shield-alt"></i>
          </div>
          <div class="logo-text">
            <h1>网络安全攻防平台</h1>
            <p>Security Operation Center</p>
          </div>
        </div>
      </div>

      <!-- 登录表单 -->
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label class="form-label">
            <i class="fas fa-user"></i>
            用户名
          </label>
          <input
              v-model="loginForm.username"
              type="text"
              class="form-input"
              :class="{ error: errors.username }"
              placeholder="请输入用户名"
              required
          />
          <div v-if="errors.username" class="error-message">
            <i class="fas fa-exclamation-circle"></i>
            {{ errors.username }}
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">
            <i class="fas fa-lock"></i>
            密码
          </label>
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
              <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
            </button>
          </div>
          <div v-if="errors.password" class="error-message">
            <i class="fas fa-exclamation-circle"></i>
            {{ errors.password }}
          </div>
        </div>

        <div class="form-options">
          <label class="checkbox-wrapper">
            <input type="checkbox" v-model="rememberMe" />
            <span class="checkmark"></span>
            记住我
          </label>
          <a href="#" class="forgot-password">忘记密码？</a>
        </div>

        <button type="submit" class="login-btn" :disabled="isLoading">
          <i v-if="isLoading" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-sign-in-alt"></i>
          {{ isLoading ? '登录中...' : '登录系统' }}
        </button>

        <div class="login-footer">
          <p>安全提示：请使用授权账户登录</p>
        </div>
      </form>
    </div>

    <!-- 系统信息 -->
    <div class="system-info">
      <div class="info-item">
        <i class="fas fa-server"></i>
        <span>系统状态：正常</span>
      </div>
      <div class="info-item">
        <i class="fas fa-clock"></i>
        <span>{{ currentTime }}</span>
      </div>
      <div class="info-item">
        <i class="fas fa-shield-alt"></i>
        <span>安全级别：高</span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'Login',
  setup() {
    const router = useRouter()

    // 响应式数据
    const loginForm = reactive({
      username: '',
      password: ''
    })

    const errors = reactive({
      username: '',
      password: ''
    })

    const showPassword = ref(false)
    const rememberMe = ref(false)
    const isLoading = ref(false)
    const currentTime = ref('')

    let timeInterval = null

    // 更新时间
    const updateTime = () => {
      const now = new Date()
      currentTime.value = now.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }

    // 表单验证
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

    // 处理登录
    const handleLogin = async () => {
      if (!validateForm()) return

      isLoading.value = true

      try {
        // 模拟登录请求
        await new Promise(resolve => setTimeout(resolve, 2000))

        // 简单的登录验证
        if (loginForm.username === 'admin' && loginForm.password === 'admin123') {
          // 保存登录状态
          localStorage.setItem('auth_token', 'demo_token_' + Date.now())
          localStorage.setItem('user_info', JSON.stringify({
            username: loginForm.username,
            role: 'administrator',
            loginTime: new Date().toISOString()
          }))

          // 跳转到仪表板
          await router.push('/dashboard')
        } else {
          errors.password = '用户名或密码错误'
        }
      } catch (error) {
        console.error('登录失败:', error)
        errors.password = '登录失败，请重试'
      } finally {
        isLoading.value = false
      }
    }

    // 生命周期
    onMounted(() => {
      updateTime()
      timeInterval = setInterval(updateTime, 1000)

      // 检查是否已登录
      const token = localStorage.getItem('auth_token')
      if (token) {
        router.push('/dashboard')
      }
    })

    onUnmounted(() => {
      if (timeInterval) {
        clearInterval(timeInterval)
      }
    })

    return {
      loginForm,
      errors,
      showPassword,
      rememberMe,
      isLoading,
      currentTime,
      handleLogin
    }
  }
}
</script>

<style scoped>
.login-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  background: #0a1628;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* 背景动画 */
.login-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

.grid-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image:
      linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
      linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px);
  background-size: 50px 50px;
  opacity: 0.3;
}

.bg-animation {
  position: absolute;
  width: 100%;
  height: 100%;
}

.bg-particle {
  position: absolute;
  width: 2px;
  height: 2px;
  background: #3b82f6;
  border-radius: 50%;
  animation: float 6s ease-in-out infinite;
}

.bg-particle:nth-child(1) { top: 20%; left: 10%; animation-delay: 0s; }
.bg-particle:nth-child(2) { top: 40%; left: 20%; animation-delay: 1s; }
.bg-particle:nth-child(3) { top: 60%; left: 30%; animation-delay: 2s; }
.bg-particle:nth-child(4) { top: 80%; left: 40%; animation-delay: 3s; }
.bg-particle:nth-child(5) { top: 30%; left: 60%; animation-delay: 4s; }
.bg-particle:nth-child(6) { top: 70%; left: 70%; animation-delay: 5s; }
.bg-particle:nth-child(7) { top: 10%; left: 80%; animation-delay: 0.5s; }
.bg-particle:nth-child(8) { top: 50%; left: 90%; animation-delay: 1.5s; }
.bg-particle:nth-child(9) { top: 25%; left: 5%; animation-delay: 2.5s; }
.bg-particle:nth-child(10) { top: 65%; left: 15%; animation-delay: 3.5s; }
.bg-particle:nth-child(11) { top: 35%; left: 45%; animation-delay: 4.5s; }
.bg-particle:nth-child(12) { top: 75%; left: 55%; animation-delay: 5.5s; }
.bg-particle:nth-child(13) { top: 15%; left: 65%; animation-delay: 1.2s; }
.bg-particle:nth-child(14) { top: 55%; left: 75%; animation-delay: 2.2s; }
.bg-particle:nth-child(15) { top: 85%; left: 85%; animation-delay: 3.2s; }

@keyframes float {
  0%, 100% {
    transform: translateY(0px) scale(1);
    opacity: 0.7;
  }
  50% {
    transform: translateY(-20px) scale(1.2);
    opacity: 1;
  }
}

/* 登录卡片 */
.login-card {
  position: relative;
  z-index: 10;
  width: 420px;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 16px;
  padding: 40px;
  box-shadow:
      0 25px 50px -12px rgba(0, 0, 0, 0.25),
      0 0 0 1px rgba(59, 130, 246, 0.1);
}

/* 登录头部 */
.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.logo-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
}

.logo-text h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #e2e8f0;
  margin-bottom: 4px;
}

.logo-text p {
  margin: 0;
  font-size: 13px;
  color: #94a3b8;
  letter-spacing: 1px;
  text-transform: uppercase;
}

/* 表单样式 */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #94a3b8;
  margin-bottom: 0;
}

.form-label i {
  color: #3b82f6;
  width: 14px;
}

.form-input {
  width: 100%;
  padding: 14px 16px;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid #334155;
  border-radius: 8px;
  color: #e2e8f0;
  font-size: 14px;
  transition: all 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  background: rgba(30, 41, 59, 0.9);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input.error {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.form-input::placeholder {
  color: #64748b;
}

.password-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-toggle {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 4px;
  transition: color 0.2s;
}

.password-toggle:hover {
  color: #3b82f6;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #ef4444;
  font-size: 12px;
  margin-top: 4px;
}

.error-message i {
  font-size: 11px;
}

/* 表单选项 */
.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 8px 0;
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 13px;
  color: #94a3b8;
}

.checkbox-wrapper input[type="checkbox"] {
  position: relative;
  width: 16px;
  height: 16px;
  border: 1px solid #334155;
  border-radius: 3px;
  background: transparent;
  cursor: pointer;
  appearance: none;
}

.checkbox-wrapper input[type="checkbox"]:checked {
  background: #3b82f6;
  border-color: #3b82f6;
}

.checkbox-wrapper input[type="checkbox"]:checked::after {
  content: '✓';
  position: absolute;
  top: -2px;
  left: 2px;
  color: white;
  font-size: 11px;
  font-weight: bold;
}

.forgot-password {
  color: #3b82f6;
  text-decoration: none;
  font-size: 13px;
  transition: color 0.2s;
}

.forgot-password:hover {
  color: #2563eb;
}

/* 登录按钮 */
.login-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 12px;
}

.login-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  transform: translateY(-1px);
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.login-footer {
  text-align: center;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #334155;
}

.login-footer p {
  margin: 0;
  font-size: 12px;
  color: #64748b;
}

/* 系统信息 */
.system-info {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 30px;
  z-index: 10;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #64748b;
  font-size: 12px;
}

.info-item i {
  color: #3b82f6;
  width: 14px;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .login-card {
    width: 90%;
    padding: 30px 24px;
    margin: 20px;
  }

  .system-info {
    flex-direction: column;
    gap: 12px;
    align-items: center;
  }
}
</style>