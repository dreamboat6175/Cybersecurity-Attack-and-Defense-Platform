<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1>🔐 网络安全攻防平台</h1>
        <p>Security Attack & Defense Platform</p>
      </div>

      <a-form
          :model="form"
          @finish="handleLogin"
          layout="vertical"
          class="login-form"
      >
        <a-form-item
            label="用户名"
            name="username"
            :rules="[{ required: true, message: '请输入用户名' }]"
        >
          <a-input
              v-model:value="form.username"
              placeholder="请输入用户名"
              size="large"
          >
            <template #prefix>
              <UserOutlined />
            </template>
          </a-input>
        </a-form-item>

        <a-form-item
            label="密码"
            name="password"
            :rules="[{ required: true, message: '请输入密码' }]"
        >
          <a-input-password
              v-model:value="form.password"
              placeholder="请输入密码"
              size="large"
          >
            <template #prefix>
              <LockOutlined />
            </template>
          </a-input-password>
        </a-form-item>

        <a-form-item>
          <a-button
              type="primary"
              html-type="submit"
              size="large"
              :loading="loading"
              block
          >
            登录
          </a-button>
        </a-form-item>
      </a-form>

      <div class="login-tips">
        <a-alert
            message="演示账号"
            description="用户名: admin, 密码: admin123"
            type="info"
            show-icon
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { UserOutlined, LockOutlined } from '@ant-design/icons-vue'
import { useAuthStore } from '@/store'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const form = reactive({
  username: '',
  password: ''
})

const handleLogin = async () => {
  loading.value = true
  try {
    await authStore.login(form.username, form.password)
    message.success('登录成功')
    router.push('/dashboard')
  } catch (error: any) {
    message.error(error.message || '登录失败')
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
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-header h1 {
  color: #e5e7eb;
  margin-bottom: 8px;
  font-size: 24px;
}

.login-header p {
  color: #9ca3af;
  font-size: 14px;
}

.login-form {
  margin-bottom: 24px;
}

.login-tips {
  margin-top: 20px;
}
</style>