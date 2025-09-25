<template>
  <div class="dashboard-grid">
    <div class="grid-item targets">
      <slot name="targets" />
    </div>
    <div class="grid-item methods">
      <slot name="methods" />
    </div>
    <div class="grid-item logs">
      <slot name="logs" />
    </div>
    <div class="grid-item network">
      <slot name="network" />
    </div>
    <div class="grid-item scan">
      <slot name="scan" />
    </div>
    <div class="grid-item traffic">
      <slot name="traffic" />
    </div>
  </div>
</template>

<style scoped>
.dashboard-grid {
  display: grid;
  grid-template-columns: 280px 1fr 320px;
  grid-template-rows: 300px 1fr;
  gap: 16px;
  padding: 16px;
  height: 100vh;
  width: 100vw;
  background-color: var(--color-bg-primary);
  grid-template-areas:
    "targets network scan"
    "methods network traffic"
    "logs    network traffic";
}

.grid-item {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  overflow: hidden;
}

.targets { grid-area: targets; }
.methods { grid-area: methods; }
.logs { grid-area: logs; }
.network { grid-area: network; }
.scan { grid-area: scan; }
.traffic { grid-area: traffic; }
</style>