<template>
  <div class="login-container">
    <div class="login-background">
      <!-- 背景动画效果 -->
      <div class="bg-animation">
        <div class="circle" v-for="i in 6" :key="i" :style="getCircleStyle(i)"></div>
      </div>
    </div>

    <div class="login-content">
      <!-- Logo和标题 -->
      <div class="login-header">
        <div class="logo">
          <div class="logo-icon">🛡️</div>
          <h1 class="logo-text">{{ appTitle }}</h1>
        </div>
        <p class="login-subtitle">网络安全攻防演练平台</p>
      </div>

      <!-- 登录表单 -->
      <form class="login-form" @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="username" class="form-label">
            <span class="label-icon">👤</span>
            用户名
          </label>
          <input
              id="username"
              v-model="loginForm.username"
              type="text"
              class="form-input"
              placeholder="请输入用户名"
              autocomplete="username"
              :disabled="isLoading"
              required
          />
        </div>

        <div class="form-group">
          <label for="password" class="form-label">
            <span class="label-icon">🔒</span>
            密码
          </label>
          <div class="password-input-wrapper">
            <input
                id="password"
                v-model="loginForm.password"
                :type="showPassword ? 'text' : 'password'"
                class="form-input"
                placeholder="请输入密码"
                autocomplete="current-password"
                :disabled="isLoading"
                required
            />
            <button
                type="button"
                class="password-toggle"
                @click="showPassword = !showPassword"
                :disabled="isLoading"
            >
              {{ showPassword ? '🙈' : '👁️' }}
            </button>
          </div>
        </div>

        <!-- 记住我 -->
        <div class="form-group">
          <label class="checkbox-label">
            <input
                v-model="loginForm.remember"
                type="checkbox"
                class="checkbox-input"
                :disabled="isLoading"
            />
            <span class="checkbox-custom"></span>
            <span class="checkbox-text">记住登录状态</span>
          </label>
        </div>

        <!-- 错误提示 -->
        <Transition name="fade">
          <div v-if="errorMessage" class="error-message">
            <span class="error-icon">⚠️</span>
            {{ errorMessage }}
          </div>
        </Transition>

        <!-- 登录按钮 -->
        <button
            type="submit"
            class="login-button"
            :disabled="isLoading || !isFormValid"
            :class="{ loading: isLoading }"
        >
          <span v-if="isLoading" class="loading-spinner"></span>
          <span v-else class="button-icon">🚀</span>
          {{ isLoading ? '登录中...' : '登录系统' }}
        </button>
      </form>

      <!-- 开发提示 -->
      <div v-if="isDev" class="dev-hint">
        <p class="hint-title">开发模式提示</p>
        <p class="hint-text">用户名: admin, 密码: admin123</p>
      </div>
    </div>

    <!-- 底部信息 -->
    <div class="login-footer">
      <p>&copy; 2025 网络安全攻防平台. All rights reserved.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// 路由和store
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// 响应式数据
const loginForm = ref({
  username: '',
  password: '',
  remember: false
})

const showPassword = ref(false)
const errorMessage = ref('')
const isLoading = ref(false)

// 计算属性
const appTitle = computed(() =>
    import.meta.env.VITE_APP_TITLE || '网络安全攻防平台'
)

const isDev = computed(() => import.meta.env.DEV)

const isFormValid = computed(() => {
  return loginForm.value.username.trim().length > 0 &&
      loginForm.value.password.length > 0
})

// 方法
const handleLogin = async () => {
  if (!isFormValid.value || isLoading.value) return

  try {
    isLoading.value = true
    errorMessage.value = ''

    console.log('🔐 尝试登录:', loginForm.value.username)

    const result = await authStore.login({
      username: loginForm.value.username.trim(),
      password: loginForm.value.password
    })

    if (result.success) {
      console.log('✅ 登录成功')

      // 获取重定向地址
      const redirectPath = route.query.redirect || '/dashboard'

      // 跳转到目标页面
      await router.push(redirectPath)
    } else {
      errorMessage.value = result.message || '登录失败'
    }

  } catch (error) {
    console.error('❌ 登录异常:', error)
    errorMessage.value = error.message || '登录过程中发生错误'
  } finally {
    isLoading.value = false
  }
}

// 背景动画样式
const getCircleStyle = (index) => {
  const size = 100 + (index * 50)
  const delay = index * 0.5

  return {
    width: `${size}px`,
    height: `${size}px`,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    animationDelay: `${delay}s`
  }
}

// 生命周期
onMounted(() => {
  // 如果已经登录，直接重定向
  if (authStore.isAuthenticated) {
    router.push('/dashboard')
  }

  // 开发环境自动填充
  if (isDev.value) {
    loginForm.value.username = 'admin'
    loginForm.value.password = 'admin123'
  }
})
</script>

<style scoped>
.login-container {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-bg-primary);
  padding: var(--spacing-lg);
}

/* 背景效果 */
.login-background {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  z-index: 1;
}

.bg-animation {
  position: relative;
  width: 100%;
  height: 100%;
}

.circle {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(45deg,
  rgba(100, 255, 218, 0.1),
  rgba(100, 255, 218, 0.05)
  );
  animation: float 10s infinite ease-in-out;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
    opacity: 0.3;
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
    opacity: 0.1;
  }
}

/* 登录内容 */
.login-content {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 400px;
  background-color: var(--color-bg-secondary);
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}

/* 登录头部 */
.login-header {
  padding: var(--spacing-2xl) var(--spacing-lg) var(--spacing-lg);
  text-align: center;
  border-bottom: 1px solid var(--color-border);
  background: linear-gradient(135deg,
  var(--color-bg-secondary),
  var(--color-bg-tertiary)
  );
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.logo-icon {
  font-size: 3rem;
  filter: drop-shadow(0 2px 4px rgba(100, 255, 218, 0.3));
}

.logo-text {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--color-text-accent);
  margin: 0;
}

.login-subtitle {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  margin: 0;
}

/* 表单样式 */
.login-form {
  padding: var(--spacing-lg);
}

.form-group {
  margin-bottom: var(--spacing-lg);
}

.form-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-text-primary);
}

.label-icon {
  font-size: var(--font-size-base);
}

.form-input {
  width: 100%;
  padding: var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  transition: all var(--transition-base);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-text-accent);
  box-shadow: 0 0 0 2px rgba(100, 255, 218, 0.2);
}

.form-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 密码输入框 */
.password-input-wrapper {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: var(--spacing-md);
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: var(--font-size-base);
  padding: var(--spacing-xs);
  border-radius: var(--border-radius-sm);
  transition: color var(--transition-base);
}

.password-toggle:hover {
  color: var(--color-text-accent);
}

.password-toggle:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 复选框样式 */
.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.checkbox-input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
}

.checkbox-custom {
  width: 16px;
  height: 16px;
  border: 1px solid var(--color-border);
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-base);
}

.checkbox-input:checked + .checkbox-custom {
  background-color: var(--color-text-accent);
  border-color: var(--color-text-accent);
}

.checkbox-input:checked + .checkbox-custom::after {
  content: '✓';
  color: var(--color-bg-primary);
  font-size: 12px;
  font-weight: bold;
}

/* 错误消息 */
.error-message {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background-color: rgba(244, 67, 54, 0.1);
  border: 1px solid var(--color-danger);
  border-radius: var(--border-radius-sm);
  color: var(--color-danger);
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-lg);
}

.error-icon {
  font-size: var(--font-size-base);
}

/* 登录按钮 */
.login-button {
  width: 100%;
  padding: var(--spacing-md) var(--spacing-lg);
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
  position: relative;
  overflow: hidden;
}

.login-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.login-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.login-button.loading {
  pointer-events: none;
}

.button-icon {
  font-size: var(--font-size-base);
}

/* 开发提示 */
.dev-hint {
  margin-top: var(--spacing-lg);
  padding: var(--spacing-md);
  background-color: rgba(255, 193, 7, 0.1);
  border: 1px solid var(--color-warning);
  border-radius: var(--border-radius-sm);
  text-align: center;
}

.hint-title {
  font-weight: 600;
  color: var(--color-warning);
  margin: 0 0 var(--spacing-xs);
  font-size: var(--font-size-sm);
}

.hint-text {
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
  font-family: var(--font-family-mono);
  margin: 0;
}

/* 页脚 */
.login-footer {
  position: absolute;
  bottom: var(--spacing-lg);
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
  text-align: center;
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
}

/* 动画 */
.fade-enter-active,
.fade-leave-active {
  transition: all var(--transition-base);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 响应式设计 */
@media (max-width: 480px) {
  .login-container {
    padding: var(--spacing-md);
  }

  .login-content {
    max-width: 100%;
  }

  .login-header {
    padding: var(--spacing-lg);
  }

  .logo {
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .logo-text {
    font-size: var(--font-size-xl);
  }
}
</style>