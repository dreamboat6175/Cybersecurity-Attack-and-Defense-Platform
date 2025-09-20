<!-- src/views/NotFound.vue -->
<template>
  <div class="not-found">
    <div class="error-container">
      <div class="error-code">404</div>
      <div class="error-message">
        <h2>页面未找到</h2>
        <p>您访问的页面不存在或已被移动</p>
      </div>
      <div class="error-actions">
        <button @click="goBack" class="action-btn secondary">
          ← 返回上页
        </button>
        <button @click="goHome" class="action-btn primary">
          🏠 回到首页
        </button>
      </div>
    </div>

    <!-- 装饰性动画 -->
    <div class="floating-elements">
      <div class="floating-element" v-for="i in 6" :key="i"
           :style="{
             left: Math.random() * 100 + '%',
             animationDelay: Math.random() * 3 + 's',
             animationDuration: (3 + Math.random() * 2) + 's'
           }">
        💫
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function goBack() {
  if (window.history.length > 1) {
    router.go(-1)
  } else {
    goHome()
  }
}

function goHome() {
  router.push('/topology')
}
</script>

<style scoped>
.not-found {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0A192F 0%, #1A202C 100%);
  color: #E5E7EB;
  position: relative;
  overflow: hidden;
}

.error-container {
  text-align: center;
  z-index: 10;
  max-width: 600px;
  padding: 40px;
}

.error-code {
  font-size: 120px;
  font-weight: 900;
  color: #64FFDA;
  text-shadow: 0 0 30px rgba(100, 255, 218, 0.5);
  margin-bottom: 20px;
  line-height: 1;
}

.error-message h2 {
  font-size: 32px;
  margin-bottom: 16px;
  color: #E5E7EB;
}

.error-message p {
  font-size: 18px;
  color: #8892B0;
  margin-bottom: 40px;
  line-height: 1.6;
}

.error-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.action-btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  min-width: 140px;
}

.action-btn.primary {
  background: linear-gradient(135deg, #64FFDA 0%, #3B82F6 100%);
  color: #0A192F;
}

.action-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(100, 255, 218, 0.4);
}

.action-btn.secondary {
  background: rgba(100, 255, 218, 0.1);
  color: #64FFDA;
  border: 1px solid rgba(100, 255, 218, 0.3);
}

.action-btn.secondary:hover {
  background: rgba(100, 255, 218, 0.2);
  transform: translateY(-2px);
}

.floating-elements {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.floating-element {
  position: absolute;
  font-size: 24px;
  animation: float-up infinite linear;
  opacity: 0.6;
}

@keyframes float-up {
  0% {
    transform: translateY(100vh) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 0.6;
  }
  90% {
    opacity: 0.6;
  }
  100% {
    transform: translateY(-10vh) rotate(360deg);
    opacity: 0;
  }
}

@media (max-width: 768px) {
  .error-code {
    font-size: 80px;
  }

  .error-message h2 {
    font-size: 24px;
  }

  .error-message p {
    font-size: 16px;
  }

  .error-actions {
    flex-direction: column;
    align-items: center;
  }

  .action-btn {
    width: 100%;
    max-width: 280px;
  }
}
</style>