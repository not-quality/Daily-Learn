import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
// 导入Element Plus及样式
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
// 导入所有Element Plus图标
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

const app = createApp(App)

app.use(createPinia())
// 使用Element Plus
app.use(ElementPlus)
// 注册所有图标组件
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.mount('#app')
