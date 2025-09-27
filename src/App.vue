<!-- App.vue - 更新版本 -->
<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

#app {
  width: 100vw;
  height: 100vh;
  background: #0a1628;
  color: #e2e8f0;
}

/* 引入 Font Awesome 图标 */
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css');

/* 全局CSS变量 */
:root {
  --color-bg-primary: #0a1628;
  --color-bg-secondary: rgba(15, 23, 42, 0.9);
  --color-bg-tertiary: rgba(30, 41, 59, 0.8);

  --color-border: #334155;
  --color-border-light: #475569;

  --color-text-primary: #e2e8f0;
  --color-text-secondary: #94a3b8;
  --color-text-accent: #3b82f6;

  --color-danger: #ef4444;
  --color-warning: #f59e0b;
  --color-success: #22c55e;
  --color-info: #3b82f6;

  --border-radius-sm: 4px;
  --border-radius-md: 8px;
  --border-radius-lg: 12px;

  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;

  --transition-base: 0.2s ease;
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: var(--color-bg-primary);
}

::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 3px;
  transition: var(--transition-base);
}

::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-accent);
}

/* Firefox滚动条 */
* {
  scrollbar-width: thin;
  scrollbar-color: var(--color-border) var(--color-bg-primary);
}

/* 文本选择样式 */
::selection {
  background-color: var(--color-text-accent);
  color: var(--color-bg-primary);
}

/* 焦点样式 */
:focus-visible {
  outline: 2px solid var(--color-text-accent);
  outline-offset: 2px;
}

/* 按钮基础样式 */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  border: none;
  border-radius: var(--border-radius-md);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition-base);
  text-decoration: none;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--color-info);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-1px);
}

.btn-danger {
  background: var(--color-danger);
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
  transform: translateY(-1px);
}

.btn-secondary {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--color-border);
}

/* 输入框样式 */
.form-input {
  width: 100%;
  padding: 10px 12px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  color: var(--color-text-primary);
  font-size: 14px;
  transition: var(--transition-base);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-text-accent);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input::placeholder {
  color: var(--color-text-secondary);
}

/* 标签样式 */
.form-label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

/* 卡片样式 */
.card {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-md);
}

/* 警告框样式 */
.alert {
  padding: 12px 16px;
  border-radius: var(--border-radius-md);
  margin-bottom: 16px;
  border-left: 4px solid;
}

.alert-info {
  background: rgba(59, 130, 246, 0.1);
  border-left-color: var(--color-info);
  color: #bfdbfe;
}

.alert-warning {
  background: rgba(245, 158, 11, 0.1);
  border-left-color: var(--color-warning);
  color: #fde68a;
}

.alert-danger {
  background: rgba(239, 68, 68, 0.1);
  border-left-color: var(--color-danger);
  color: #fecaca;
}

.alert-success {
  background: rgba(34, 197, 94, 0.1);
  border-left-color: var(--color-success);
  color: #bbf7d0;
}

/* 加载动画 */
.loading {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid var(--color-border);
  border-radius: 50%;
  border-top-color: var(--color-text-accent);
  animation: spin 0.8s ease-in-out infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 工具类 */
.text-center { text-align: center; }
.text-left { text-align: left; }
.text-right { text-align: right; }

.d-flex { display: flex; }
.d-block { display: block; }
.d-none { display: none; }

.justify-center { justify-content: center; }
.justify-between { justify-content: space-between; }
.justify-end { justify-content: flex-end; }

.align-center { align-items: center; }
.align-start { align-items: flex-start; }
.align-end { align-items: flex-end; }

.flex-column { flex-direction: column; }
.flex-wrap { flex-wrap: wrap; }

.gap-sm { gap: var(--spacing-sm); }
.gap-md { gap: var(--spacing-md); }
.gap-lg { gap: var(--spacing-lg); }

.mt-sm { margin-top: var(--spacing-sm); }
.mt-md { margin-top: var(--spacing-md); }
.mt-lg { margin-top: var(--spacing-lg); }

.mb-sm { margin-bottom: var(--spacing-sm); }
.mb-md { margin-bottom: var(--spacing-md); }
.mb-lg { margin-bottom: var(--spacing-lg); }

.p-sm { padding: var(--spacing-sm); }
.p-md { padding: var(--spacing-md); }
.p-lg { padding: var(--spacing-lg); }

.text-primary { color: var(--color-text-primary); }
.text-secondary { color: var(--color-text-secondary); }
.text-accent { color: var(--color-text-accent); }
.text-danger { color: var(--color-danger); }
.text-warning { color: var(--color-warning); }
.text-success { color: var(--color-success); }

.bg-primary { background-color: var(--color-bg-primary); }
.bg-secondary { background-color: var(--color-bg-secondary); }
.bg-tertiary { background-color: var(--color-bg-tertiary); }

.border { border: 1px solid var(--color-border); }
.border-top { border-top: 1px solid var(--color-border); }
.border-bottom { border-bottom: 1px solid var(--color-border); }

.rounded { border-radius: var(--border-radius-md); }
.rounded-sm { border-radius: var(--border-radius-sm); }
.rounded-lg { border-radius: var(--border-radius-lg); }

.shadow { box-shadow: var(--shadow-md); }
.shadow-sm { box-shadow: var(--shadow-sm); }
.shadow-lg { box-shadow: var(--shadow-lg); }

/* 动画效果 */
.fade-enter-active, .fade-leave-active {
  transition: opacity var(--transition-base);
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.slide-enter-active, .slide-leave-active {
  transition: transform var(--transition-base);
}

.slide-enter-from {
  transform: translateX(-100%);
}

.slide-leave-to {
  transform: translateX(100%);
}

/* 响应式断点 */
@media (max-width: 1400px) {
  :root {
    --spacing-lg: 20px;
    --spacing-xl: 28px;
  }
}

@media (max-width: 1200px) {
  :root {
    --spacing-md: 14px;
    --spacing-lg: 18px;
    --spacing-xl: 24px;
  }
}

@media (max-width: 768px) {
  :root {
    --spacing-sm: 6px;
    --spacing-md: 12px;
    --spacing-lg: 16px;
    --spacing-xl: 20px;
  }

  .btn {
    padding: 10px 18px;
    font-size: 16px;
  }

  .form-input {
    padding: 12px 14px;
    font-size: 16px;
  }
}
</style>