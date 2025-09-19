<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup lang="ts">
// 根组件，所有页面都会通过 router-view 渲染
</script>

<style>
#app {
  height: 100vh;
  background: #0f1419;
  color: #e5e7eb;
}
</style>