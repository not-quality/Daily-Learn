import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
// 导入Element Plus及样式
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
// 导入所有Element Plus图标
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
// 导入 IndexedDB 初始化和数据迁移
import { initDB } from './utils/storage/index.js'
import { runMigration } from './utils/migration.js'

// 初始化应用
const initApp = async () => {
  try {
    // 初始化 IndexedDB
    await initDB()
    console.log('IndexedDB 初始化成功')

    // 执行数据迁移（如需要）
    await runMigration()
  } catch (error) {
    console.error('存储初始化失败:', error)
    // 即使初始化失败也继续挂载应用，组件会回退到 localStorage
  }

  const app = createApp(App)

  app.use(createPinia())
  // 使用Element Plus
  app.use(ElementPlus)
  // 注册所有图标组件
  for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
  }

  app.mount('#app')
}

// 启动应用
initApp()
