<!-- src/components/layout/DashboardGrid.vue - 攻击界面专用布局 -->
<template>
  <div class="attack-dashboard-grid">
    <!-- 左侧面板区域 -->
    <div class="left-column">
      <!-- 攻击目标面板 -->
      <div class="grid-panel targets-area">
        <slot name="targets" />
      </div>

      <!-- 攻击方法面板 -->
      <div class="grid-panel methods-area">
        <slot name="methods" />
      </div>
    </div>

    <!-- 中间面板区域 -->
    <div class="center-column">
      <!-- 网络拓扑面板 -->
      <div class="grid-panel network-area">
        <slot name="network" />
      </div>

      <!-- 攻击日志面板 -->
      <div class="grid-panel logs-area">
        <slot name="logs" />
      </div>
    </div>

    <!-- 右侧面板区域 -->
    <div class="right-column">
      <!-- 漏洞扫描面板 -->
      <div class="grid-panel scan-area">
        <slot name="scan" />
      </div>

      <!-- 攻击流量面板 -->
      <div class="grid-panel traffic-area">
        <slot name="traffic" />
      </div>

      <!-- 描述面板 -->
      <div class="grid-panel description-area">
        <slot name="description" />
      </div>
    </div>
  </div>
</template>

<script setup>
// 该组件是纯展示型布局组件，不需要额外的逻辑
</script>

<style scoped>
/* 主网格布局 */
.attack-dashboard-grid {
  display: grid;
  grid-template-columns: 300px 1fr 300px;
  grid-template-rows: 1fr;
  height: 100vh;
  width: 100vw;
  gap: 10px;
  padding: 10px;
  background: #0a1628;
  box-sizing: border-box;
}

/* 列布局 */
.left-column,
.center-column,
.right-column {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
}

/* 左侧列 - 目标和方法 */
.left-column {
  grid-column: 1;
}

.targets-area {
  flex: 1;
  min-height: 300px;
}

.methods-area {
  flex: 1;
  min-height: 300px;
}

/* 中间列 - 网络拓扑和日志 */
.center-column {
  grid-column: 2;
}

.network-area {
  flex: 2;
  min-height: 400px;
}

.logs-area {
  flex: 1;
  min-height: 280px;
}

/* 右侧列 - 扫描、流量和描述 */
.right-column {
  grid-column: 3;
}

.scan-area {
  flex: 2;
  min-height: 300px;
}

.traffic-area {
  flex: 1;
  min-height: 200px;
}

.description-area {
  flex: 0 0 120px;
  min-height: 120px;
  max-height: 120px;
}

/* 面板通用样式 */
.grid-panel {
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid #334155;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
}

/* 响应式设计 */
@media (max-width: 1400px) {
  .attack-dashboard-grid {
    grid-template-columns: 280px 1fr 280px;
  }
}

@media (max-width: 1200px) {
  .attack-dashboard-grid {
    grid-template-columns: 250px 1fr 250px;
    gap: 8px;
    padding: 8px;
  }
}

@media (max-width: 1024px) {
  .attack-dashboard-grid {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
    height: auto;
    min-height: 100vh;
    gap: 15px;
  }

  .left-column,
  .center-column,
  .right-column {
    width: 100%;
  }

  .left-column {
    order: 1;
    flex-direction: row;
    gap: 15px;
  }

  .center-column {
    order: 2;
  }

  .right-column {
    order: 3;
    flex-direction: row;
    gap: 15px;
  }

  .targets-area,
  .methods-area {
    flex: 1;
    min-height: 250px;
  }

  .scan-area,
  .traffic-area {
    flex: 1;
    min-height: 200px;
  }

  .description-area {
    flex: 1;
    min-height: 120px;
    max-height: none;
  }
}

@media (max-width: 768px) {
  .left-column,
  .right-column {
    flex-direction: column;
  }

  .attack-dashboard-grid {
    gap: 10px;
    padding: 10px;
  }
}

/* 滚动条优化 */
.grid-panel::-webkit-scrollbar {
  width: 6px;
}

.grid-panel::-webkit-scrollbar-track {
  background: rgba(30, 41, 59, 0.3);
  border-radius: 3px;
}

.grid-panel::-webkit-scrollbar-thumb {
  background: rgba(71, 85, 105, 0.6);
  border-radius: 3px;
}

.grid-panel::-webkit-scrollbar-thumb:hover {
  background: rgba(71, 85, 105, 0.8);
}

/* 深色主题优化 */
.grid-panel {
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

/* 动画效果 */
.grid-panel {
  transition: all 0.3s ease;
}

.grid-panel:hover {
  border-color: #475569;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* 加载状态 */
.grid-panel.loading {
  opacity: 0.7;
  pointer-events: none;
}

/* 错误状态 */
.grid-panel.error {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

/* 成功状态 */
.grid-panel.success {
  border-color: #22c55e;
  background: rgba(34, 197, 94, 0.1);
}
</style>