<template>
  <div class="dashboard-grid">
    <!-- 目标列表 -->
    <div class="grid-item targets">
      <slot name="targets" />
    </div>

    <!-- 攻击方法 -->
    <div class="grid-item methods">
      <slot name="methods" />
    </div>

    <!-- 攻击日志 -->
    <div class="grid-item logs">
      <slot name="logs" />
    </div>

    <!-- 网络拓扑图 -->
    <div class="grid-item network">
      <slot name="network" />
    </div>

    <!-- 漏洞扫描 -->
    <div class="grid-item scan">
      <slot name="scan" />
    </div>

    <!-- 攻击流量 -->
    <div class="grid-item traffic">
      <slot name="traffic" />
    </div>
  </div>
</template>

<script setup>
// 这个组件是纯布局组件，不需要任何逻辑
</script>

<style scoped>
.dashboard-grid {
  display: grid;
  grid-template-columns: 280px 1fr 320px;
  grid-template-rows: 300px 1fr;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  grid-template-areas:
    "targets network scan"
    "methods network traffic"
    "logs    network traffic";
}

/* 网格项目定位 */
.grid-item {
  position: relative;
  overflow: hidden;
  border-radius: var(--border-radius-md);
  transition: transform var(--transition-base);
}

.grid-item:hover {
  transform: translateY(-2px);
}

.targets {
  grid-area: targets;
}

.methods {
  grid-area: methods;
}

.logs {
  grid-area: logs;
}

.network {
  grid-area: network;
}

.scan {
  grid-area: scan;
}

.traffic {
  grid-area: traffic;
}

/* 响应式布局 */
@media (max-width: 1400px) {
  .dashboard-grid {
    grid-template-columns: 260px 1fr 300px;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm);
  }
}

@media (max-width: 1200px) {
  .dashboard-grid {
    grid-template-columns: 240px 1fr 280px;
    grid-template-rows: 250px 1fr;
  }
}

@media (max-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: repeat(3, 1fr);
    grid-template-areas:
      "targets methods"
      "network network"
      "scan traffic"
      "logs logs";
  }
}

@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
    grid-template-rows: repeat(6, auto);
    gap: var(--spacing-sm);
    padding: var(--spacing-sm);
    height: auto;
    min-height: 100vh;
    grid-template-areas:
      "targets"
      "methods"
      "network"
      "scan"
      "traffic"
      "logs";
  }

  .grid-item {
    min-height: 300px;
  }

  .network {
    min-height: 400px;
  }
}

@media (max-width: 480px) {
  .dashboard-grid {
    padding: var(--spacing-xs);
    gap: var(--spacing-xs);
  }

  .grid-item {
    min-height: 250px;
  }
}