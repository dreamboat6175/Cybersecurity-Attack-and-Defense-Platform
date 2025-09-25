<!-- src/App.vue -->
<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import wsManager from '@/api/websocket'

const authStore = useAuthStore()

onMounted(async () => {
  // 检查本地存储的认证状态
  await authStore.checkAuthStatus()

  // 如果用户已认证，连接WebSocket
  if (authStore.isAuthenticated) {
    wsManager.connect()
  }
})
</script>

<style>
/* 引入全局样式 */
@import '@/styles/variables.css';

/* 重置样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  height: 100%;
  font-family: var(--font-family-base);
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
}

#app {
  overflow: hidden;
}
</style>