<template>
  <div id="app">
    <DailyMission />
  </div>
</template>

<script setup>
// 导入主要业务组件
import DailyMission from './components/DailyMission.vue'
</script>

<style>
/* 全局基础样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Roboto', 'Arial', sans-serif;
}

#app {
  min-height: 100vh;
  background: #F0F5FF;
}
</style>