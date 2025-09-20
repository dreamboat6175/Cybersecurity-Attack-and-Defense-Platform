<template>
  <div class="loading-spinner" :class="[`size-${size}`, `variant-${variant}`]">
    <!-- 环形加载器 -->
    <div v-if="variant === 'ring'" class="spinner-ring">
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>

    <!-- 点阵加载器 -->
    <div v-else-if="variant === 'dots'" class="spinner-dots">
      <div class="dot"></div>
      <div class="dot"></div>
      <div class="dot"></div>
    </div>

    <!-- 脉冲加载器 -->
    <div v-else-if="variant === 'pulse'" class="spinner-pulse">
      <div class="pulse-circle"></div>
      <div class="pulse-circle"></div>
    </div>

    <!-- 条纹加载器 -->
    <div v-else-if="variant === 'bars'" class="spinner-bars">
      <div class="bar"></div>
      <div class="bar"></div>
      <div class="bar"></div>
      <div class="bar"></div>
      <div class="bar"></div>
    </div>

    <!-- 网络主题加载器 -->
    <div v-else-if="variant === 'network'" class="spinner-network">
      <svg viewBox="0 0 100 100" class="network-svg">
        <!-- 中心节点 -->
        <circle cx="50" cy="50" r="4" class="center-node"/>

        <!-- 外围节点 -->
        <circle cx="50" cy="20" r="2" class="outer-node">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" begin="0s"/>
        </circle>
        <circle cx="73" cy="35" r="2" class="outer-node">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" begin="0.3s"/>
        </circle>
        <circle cx="73" cy="65" r="2" class="outer-node">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" begin="0.6s"/>
        </circle>
        <circle cx="50" cy="80" r="2" class="outer-node">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" begin="0.9s"/>
        </circle>
        <circle cx="27" cy="65" r="2" class="outer-node">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" begin="1.2s"/>
        </circle>
        <circle cx="27" cy="35" r="2" class="outer-node">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" begin="1.5s"/>
        </circle>

        <!-- 连接线 -->
        <line x1="50" y1="50" x2="50" y2="20" class="connection-line">
          <animate attributeName="stroke-opacity" values="0.2;0.8;0.2" dur="2s" repeatCount="indefinite" begin="0s"/>
        </line>
        <line x1="50" y1="50" x2="73" y2="35" class="connection-line">
          <animate attributeName="stroke-opacity" values="0.2;0.8;0.2" dur="2s" repeatCount="indefinite" begin="0.3s"/>
        </line>
        <line x1="50" y1="50" x2="73" y2="65" class="connection-line">
          <animate attributeName="stroke-opacity" values="0.2;0.8;0.2" dur="2s" repeatCount="indefinite" begin="0.6s"/>
        </line>
        <line x1="50" y1="50" x2="50" y2="80" class="connection-line">
          <animate attributeName="stroke-opacity" values="0.2;0.8;0.2" dur="2s" repeatCount="indefinite" begin="0.9s"/>
        </line>
        <line x1="50" y1="50" x2="27" y2="65" class="connection-line">
          <animate attributeName="stroke-opacity" values="0.2;0.8;0.2" dur="2s" repeatCount="indefinite" begin="1.2s"/>
        </line>
        <line x1="50" y1="50" x2="27" y2="35" class="connection-line">
          <animate attributeName="stroke-opacity" values="0.2;0.8;0.2" dur="2s" repeatCount="indefinite" begin="1.5s"/>
        </line>
      </svg>
    </div>

    <!-- 加载文本 -->
    <div v-if="showText && text" class="loading-text">
      {{ text }}
    </div>

    <!-- 进度指示器 -->
    <div v-if="showProgress && progress !== undefined" class="progress-container">
      <div class="progress-bar">
        <div
            class="progress-fill"
            :style="{ width: `${Math.max(0, Math.min(100, progress))}%` }"
        ></div>
      </div>
      <div class="progress-text">{{ Math.round(progress) }}%</div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'ring' | 'dots' | 'pulse' | 'bars' | 'network'
  size?: 'small' | 'medium' | 'large'
  text?: string
  showText?: boolean
  progress?: number
  showProgress?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'ring',
  size: 'medium',
  text: '加载中...',
  showText: false,
  showProgress: false
})
</script>

<style scoped>
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

/* 尺寸变体 */
.size-small {
  --spinner-size: 24px;
  --text-size: 12px;
}

.size-medium {
  --spinner-size: 40px;
  --text-size: 14px;
}

.size-large {
  --spinner-size: 60px;
  --text-size: 16px;
}

/* 环形加载器 */
.spinner-ring {
  display: inline-block;
  position: relative;
  width: var(--spinner-size);
  height: var(--spinner-size);
}

.spinner-ring div {
  box-sizing: border-box;
  display: block;
  position: absolute;
  width: 100%;
  height: 100%;
  border: 3px solid transparent;
  border-top-color: #64FFDA;
  border-radius: 50%;
  animation: ring-spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
}

.spinner-ring div:nth-child(1) { animation-delay: -0.45s; }
.spinner-ring div:nth-child(2) { animation-delay: -0.3s; }
.spinner-ring div:nth-child(3) { animation-delay: -0.15s; }

@keyframes ring-spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 点阵加载器 */
.spinner-dots {
  display: inline-block;
  position: relative;
  width: var(--spinner-size);
  height: calc(var(--spinner-size) / 4);
}

.spinner-dots .dot {
  position: absolute;
  top: 50%;
  width: calc(var(--spinner-size) / 6);
  height: calc(var(--spinner-size) / 6);
  border-radius: 50%;
  background: #64FFDA;
  animation: dots-bounce 1.4s ease-in-out infinite both;
  transform: translateY(-50%);
}

.spinner-dots .dot:nth-child(1) {
  left: 0;
  animation-delay: -0.32s;
}

.spinner-dots .dot:nth-child(2) {
  left: 50%;
  transform: translateX(-50%) translateY(-50%);
  animation-delay: -0.16s;
}

.spinner-dots .dot:nth-child(3) {
  right: 0;
  animation-delay: 0s;
}

@keyframes dots-bounce {
  0%, 80%, 100% {
    transform: translateY(-50%) scale(0);
  }
  40% {
    transform: translateY(-50%) scale(1);
  }
}

/* 脉冲加载器 */
.spinner-pulse {
  display: inline-block;
  width: var(--spinner-size);
  height: var(--spinner-size);
  position: relative;
}

.pulse-circle {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: rgba(100, 255, 218, 0.6);
  animation: pulse-scale 2s ease-in-out infinite;
}

.pulse-circle:nth-child(2) {
  animation-delay: -1s;
}

@keyframes pulse-scale {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
}

/* 条纹加载器 */
.spinner-bars {
  display: inline-block;
  width: var(--spinner-size);
  height: var(--spinner-size);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.spinner-bars .bar {
  width: calc(var(--spinner-size) / 8);
  height: 60%;
  background: #64FFDA;
  border-radius: 2px;
  animation: bars-stretch 1.2s ease-in-out infinite;
}

.spinner-bars .bar:nth-child(1) { animation-delay: -1.1s; }
.spinner-bars .bar:nth-child(2) { animation-delay: -1.0s; }
.spinner-bars .bar:nth-child(3) { animation-delay: -0.9s; }
.spinner-bars .bar:nth-child(4) { animation-delay: -0.8s; }
.spinner-bars .bar:nth-child(5) { animation-delay: -0.7s; }

@keyframes bars-stretch {
  0%, 40%, 100% {
    transform: scaleY(0.4);
  }
  20% {
    transform: scaleY(1);
  }
}

/* 网络主题加载器 */
.spinner-network {
  width: var(--spinner-size);
  height: var(--spinner-size);
}

.network-svg {
  width: 100%;
  height: 100%;
}

.center-node {
  fill: #64FFDA;
  opacity: 1;
}

.outer-node {
  fill: #3B82F6;
}

.connection-line {
  stroke: #64FFDA;
  stroke-width: 1;
}

/* 加载文本 */
.loading-text {
  color: #E5E7EB;
  font-size: var(--text-size);
  font-weight: 500;
  text-align: center;
  margin-top: 8px;
  animation: text-fade 2s ease-in-out infinite alternate;
}

@keyframes text-fade {
  0% {
    opacity: 0.6;
  }
  100% {
    opacity: 1;
  }
}

/* 进度指示器 */
.progress-container {
  width: 100%;
  max-width: 200px;
  margin-top: 8px;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: #374151;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #64FFDA, #3B82F6);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.progress-text {
  text-align: center;
  font-size: 12px;
  color: #9CA3AF;
  margin-top: 4px;
}

/* 变体特定样式 */
.variant-ring {
  /* 环形加载器已在上面定义 */
}

.variant-dots .spinner-dots .dot {
  background: #64FFDA;
}

.variant-pulse .pulse-circle {
  background: rgba(100, 255, 218, 0.4);
  border: 2px solid rgba(100, 255, 218, 0.8);
}

.variant-bars .spinner-bars .bar {
  background: linear-gradient(to top, #64FFDA, #3B82F6);
}

.variant-network {
  /* 网络主题样式已在上面定义 */
}

/* 深色主题适配 */
.variant-ring .spinner-ring div {
  border-top-color: #64FFDA;
  border-right-color: rgba(100, 255, 218, 0.3);
  border-bottom-color: rgba(100, 255, 218, 0.3);
  border-left-color: rgba(100, 255, 218, 0.3);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .size-large {
    --spinner-size: 50px;
    --text-size: 14px;
  }

  .size-medium {
    --spinner-size: 35px;
    --text-size: 13px;
  }

  .size-small {
    --spinner-size: 20px;
    --text-size: 11px;
  }
}

/* 无障碍支持 */
@media (prefers-reduced-motion: reduce) {
  .spinner-ring div,
  .spinner-dots .dot,
  .pulse-circle,
  .spinner-bars .bar,
  .loading-text {
    animation-duration: 3s;
  }
}
</style>