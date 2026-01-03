<template>
  <div id="app">
    <DailyMission />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
// 导入主要业务组件
import DailyMission from './components/DailyMission.vue'

// 全局返回键处理 - 防止应用被关闭
const handleGlobalBackButton = (event) => {
  // 检查当前的 history state
  // 如果是在 DiaryEntry 页面,则不处理(让 DiaryEntry 组件自己处理)
  if (event.state && event.state.page === 'diary-entry') {
    return
  }

  // 阻止默认的返回行为(关闭应用)
  event.preventDefault()

  // 保持应用在当前状态,不退出
  // 重新添加一个历史记录,使应用保持活跃
  window.history.pushState({ page: 'app' }, '', '')
}

onMounted(() => {
  // 初始化时添加一个历史记录,确保有可返回的状态
  window.history.pushState({ page: 'app' }, '', '')

  // 监听浏览器返回事件
  window.addEventListener('popstate', handleGlobalBackButton)

  // 监听 Cordova/Capacitor 的返回按钮事件(如果在移动端App中运行)
  document.addEventListener('backbutton', handleGlobalBackButton, false)
})

onUnmounted(() => {
  // 清理事件监听器
  window.removeEventListener('popstate', handleGlobalBackButton)
  document.removeEventListener('backbutton', handleGlobalBackButton, false)
})
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