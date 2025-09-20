<template>
  <div class="login-container">
    <div class="login-card">
      <h1>🔐 网络安全攻防平台</h1>
      <p>Security Attack & Defense Platform</p>

      <div class="login-form">
        <div class="form-item">
          <label>用户名:</label>
          <input
              v-model="form.username"
              type="text"
              placeholder="请输入用户名"
              class="form-input"
          />
        </div>

        <div class="form-item">
          <label>密码:</label>
          <input
              v-model="form.password"
              type="password"
              placeholder="请输入密码"
              class="form-input"
          />
        </div>

        <button @click="handleLogin" class="login-btn" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </div>

      <div class="login-tips">
        <p>演示账号: admin / admin123</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)
const form = reactive({
  username: '',
  password: ''
})

const handleLogin = async () => {
  console.log('尝试登录:', form)

  if (!form.username || !form.password) {
    alert('请输入用户名和密码')
    return
  }

  loading.value = true

  try {
    // 简单的模拟登录
    if (form.username === 'admin' && form.password === 'admin123') {
      localStorage.setItem('token', 'mock-token-123')
      alert('登录成功')
      router.push('/dashboard')
    } else {
      alert('用户名或密码错误')
    }
  } catch (error) {
    console.error('登录错误:', error)
    alert('登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f1419 0%, #1a202c 100%);
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: #1a202c;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  border: 1px solid #374151;
  text-align: center;
}

.login-card h1 {
  color: #e5e7eb;
  margin-bottom: 8px;
  font-size: 24px;
}

.login-card p {
  color: #9ca3af;
  font-size: 14px;
  margin-bottom: 32px;
}

.login-form {
  margin-bottom: 24px;
}

.form-item {
  margin-bottom: 20px;
  text-align: left;
}

.form-item label {
  display: block;
  color: #e5e7eb;
  margin-bottom: 8px;
  font-size: 14px;
}

.form-input {
  width: 100%;
  padding: 12px;
  background: #374151;
  border: 1px solid #4b5563;
  border-radius: 6px;
  color: #e5e7eb;
  font-size: 14px;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.login-btn {
  width: 100%;
  padding: 12px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.3s;
}

.login-btn:hover:not(:disabled) {
  background: #2563eb;
}

.login-btn:disabled {
  background: #6b7280;
  cursor: not-allowed;
}

.login-tips {
  color: #9ca3af;
  font-size: 12px;
}
</style>