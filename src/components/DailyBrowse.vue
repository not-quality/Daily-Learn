<template>
  <div class="daily-browse">
    <!-- 导航栏 -->
    <div class="navigation">
      <div class="logo">
        <span>Daily Learn</span>
      </div>
      <!-- 桌面端显示完整导航列表 -->
      <ul v-if="!isMobile">
        <li><a href="#" @click="emit('changePage', 'words')" :class="{ active: props.currentPage === 'words' }">单词学习</a></li>
        <li><a href="#" @click="emit('changePage', 'sentence')" :class="{ active: props.currentPage === 'sentence' }">句子练习</a></li>
        <li><a href="#" @click="emit('changePage', 'record')" :class="{ active: props.currentPage === 'record' }">每日一记</a></li>
        <li><a href="#" @click="emit('changePage', 'browse')" :class="{ active: props.currentPage === 'browse' }">往日迹忆</a></li>
        <li><a href="#" @click="emit('changePage', 'tasks')" :class="{ active: props.currentPage === 'tasks' }">任务管理</a></li>
        <div class="li-box" :class="props.currentPage"></div>
      </ul>
    </div>

    <!-- 主内容区域 -->
    <div class="main-content">
      <!-- 页面标题和控制栏 -->
      <div class="header-section">
        <h1 class="page-title">往日迹忆</h1>
        <div class="control-bar">
          <!-- 排序控制 -->
          <div class="sort-controls">
            <el-icon
              class="sort-btn"
              :class="{ active: sortOrder === 'desc' }"
              @click="toggleSort"
            >
              <SortDown v-if="sortOrder === 'desc'" />
              <SortUp v-else />
            </el-icon>
          </div>

          <!-- 显示模式控制 -->
          <div class="view-controls">
            <el-icon
              class="view-btn"
              @click="toggleViewMode"
            >
              <Grid v-if="viewMode === 'list'" />
              <Memo v-else />
            </el-icon>
          </div>
        </div>
      </div>

      <!-- 日记统计标签 -->
      <div class="records-stats">
        <div class="stats-container">
          <span class="stat-item total">
            <el-icon><Collection /></el-icon> 总回忆: {{ totalRecords }}
          </span> |
          <span class="stat-item good">
            <el-icon><Check /></el-icon> 好心情: {{ goodMoodRecords }}
          </span> |
          <span class="stat-item bad">
            <el-icon><CircleClose /></el-icon> 差心情: {{ badMoodRecords }}
          </span>
        </div>
      </div>

      <!-- 日记列表 -->
      <div class="records-container" :class="{ 'grid-view': viewMode === 'grid', 'list-view': viewMode === 'list' }">
        <div 
          v-for="record in sortedRecords" 
          :key="record.id"
          class="record-card"
          @click="editRecord(record)"
        >
          <!-- 列表模式布局 -->
          <template v-if="viewMode === 'list'">
            <div class="record-date-mood">
              <div class="record-date">{{ formatDate(record.date) }}</div>
              <div class="record-mood">{{ record.mood }}</div>
            </div>
            <div class="record-content">
              <div class="content-preview" v-html="getContentPreview(record.content)"></div>
            </div>
          </template>

          <!-- 平铺模式布局 -->
          <template v-else>
            <div class="grid-card-header">
              <div class="grid-date">{{ formatDate(record.date) }}</div>
              <div class="grid-mood">{{ record.mood }}</div>
            </div>
            <div class="grid-content">
              <div class="content-preview" v-html="md.render(getContentPreview(record.content))"></div>
            </div>
          </template>
        </div>

        <!-- 空状态 -->
        <div v-if="sortedRecords.length === 0" class="empty-state">
          <div class="empty-icon">📝</div>
          <div class="empty-text">还没有日记记录</div>
          <div class="empty-subtext">开始记录你的生活吧</div>
        </div>
      </div>
    </div>

    <!-- 手机端底部导航栏 -->
    <div v-if="isMobile" class="mobile-bottom-nav bottom-navigation">
      <div 
        v-for="(item, index) in navigationItems" 
        :key="item.name"
        class="nav-item"
        :class="{ active: props.currentPage === item.name }"
        @click="emit('changePage', item.name)"
      >
        <div class="nav-icon">
          <component :is="item.icon" />
        </div>
        <span class="nav-label">{{ item.label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, markRaw } from 'vue'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import {
  SortDown, SortUp, Memo, Grid, Document, ChatDotRound, Notebook, Collection, List,
  Check, CircleClose
} from '@element-plus/icons-vue'
// 导入导航样式
import '@/assets/navigation.css'

// 定义props
const props = defineProps({
  currentPage: {
    type: String,
    default: 'browse',
    required: false
  }
})

// 定义emits
const emit = defineEmits(['changePage', 'editRecord'])

// 移动端检测
const isMobile = ref(false)

// 底部导航栏数据 - 使用markRaw避免组件被响应式化
const navigationItems = ref([
  { name: 'words', label: '单词', icon: markRaw(Document) },
  { name: 'sentence', label: '句子', icon: markRaw(ChatDotRound) },
  { name: 'record', label: '日记', icon: markRaw(Notebook) },
  { name: 'browse', label: '迹忆', icon: markRaw(Collection) },
  { name: 'tasks', label: '任务', icon: markRaw(List) },
])

// 设置中文本地化
dayjs.locale('zh-cn')

// 响应式数据
const records = ref({})
const sortOrder = ref('desc') // 'desc' 为最新在前，'asc' 为最旧在前
const viewMode = ref('list') // 'list' 或 'grid'

// Markdown解析函数（简化版）
const parseMarkdown = (text) => {
  if (!text) return ''
  
  let html = text
    // 处理标题
    .replace(/^#{1,6}\s+(.*?)$/gm, (match, content) => {
      const level = match.trim().split(' ')[0].length
      return `<h${level} class="md-heading">${content}</h${level}>`
    })
    // 处理加粗
    .replace(/\*\*(.*?)\*\*/g, '<strong class="md-bold">$1</strong>')
    // 处理斜体
    .replace(/\*(.*?)\*/g, '<em class="md-italic">$1</em>')
    // 处理删除线
    .replace(/~~(.*?)~~/g, '<del class="md-strike">$1</del>')
    // 处理链接
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a class="md-link" href="$2">$1</a>')
    // 处理列表项
    .replace(/^-\s+(.*?)$/gm, '<li class="md-list-item">$1</li>')
    // 处理引用
    .replace(/^>\s+(.*?)$/gm, '<blockquote class="md-quote">$1</blockquote>')
    .trim()

  return html
}

// 计算属性
const sortedRecords = computed(() => {
  // 过滤出有内容的记录
  const validRecords = Object.values(records.value)
    .filter(record => record.content.trim() && record.mood)
    .map(record => ({
      ...record,
      parsedDate: dayjs(record.date)
    }))

  // 按日期排序
  const sorted = validRecords.sort((a, b) => {
    if (sortOrder.value === 'desc') {
      return b.parsedDate.valueOf() - a.parsedDate.valueOf()
    } else {
      return a.parsedDate.valueOf() - b.parsedDate.valueOf()
    }
  })

  return sorted
})

// 统计计算
const totalRecords = computed(() => {
  return sortedRecords.value.length
})

const goodMoodRecords = computed(() => {
  // 好心情：😊 和 😆
  return sortedRecords.value.filter(record =>
    record.mood === '😊' || record.mood === '😆'
  ).length
})

const badMoodRecords = computed(() => {
  // 差心情：😟 和 😞
  return sortedRecords.value.filter(record =>
    record.mood === '😟' || record.mood === '😞'
  ).length
})

// 方法
const formatDate = (dateString) => {
  const date = dayjs(dateString)
  return date.format('YYYY年M月D日')
}

import MarkdownIt from 'markdown-it';
const md = new MarkdownIt();

// 假设 getContentPreview 函数返回 Markdown 内容
const getContentPreview = (content) => {
  return content; // 或者进行内容截取
};

const toggleSort = () => {
  sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc'
}

// 修改视图切换方法
const toggleViewMode = () => {
  viewMode.value = viewMode.value === 'list' ? 'grid' : 'list'
}

const editRecord = (record) => {
  // 发射事件给父组件，切换到编辑页面
  emit('editRecord', record)
}

// 加载日记数据
const loadRecords = () => {
  const savedRecords = localStorage.getItem('daily-records')
  if (savedRecords) {
    try {
      records.value = JSON.parse(savedRecords)
    } catch (error) {
      console.error('加载日记数据失败:', error)
      records.value = {}
    }
  } else {
    records.value = {}
  }
}

// 生命周期
onMounted(() => {
  loadRecords()
  
  const updateIsMobile = () => {
    isMobile.value = window.innerWidth <= 768
  }
  updateIsMobile()
  window.addEventListener('resize', updateIsMobile)
  
  return () => {
    window.removeEventListener('resize', updateIsMobile)
  }
})
</script>

<style scoped>
.daily-browse {
  width: 100%;
  min-height: 100vh;
  background-color: #F0F5FF;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* 手机端添加底部间距 */
@media (max-width: 768px) {
  .daily-browse {
    padding-bottom: 90px;
  }
}

.main-content {
  padding: 80px 20px 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 0 10px;
}

.records-stats {
  margin-bottom: 14px;
}

.stats-container {
  width: 50%;
  margin: auto;
  text-align: center;
  font-size: 14px;
  color: #666666;
  background: white;
  padding: 16px 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-item {
  cursor: pointer;
  padding: 0 8px;
  border-radius: 4px;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.stat-item .el-icon {
  vertical-align: middle;
  font-size: 14px;
}

.stat-item.total {
  color: #1E50B3;
}

.stat-item.good {
  color: #4CAF50;
}

.stat-item.bad {
  color: #FF5252;
}

.stat-item:hover {
  background: rgba(0, 0, 0, 0.05);
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: #333;
  margin: 0;
}

.control-bar {
  display: flex;
  gap: 20px;
  align-items: center;
}

.sort-controls, .view-controls {
  display: flex;
  gap: 10px;
  align-items: center;
}

.sort-btn, .view-btn {
  width: 48px;  /* 增加宽度 */
  height: 48px; /* 增加高度 */
  border-radius: 12px;
  background: white;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;  /* 增加图标大小 */
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.sort-btn:hover, .view-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.sort-btn.active, .view-btn.active {
  background: #007AFF;
  color: white;
  border-color: #007AFF;
}

.records-container {
  transition: all 0.3s ease;
}

/* 列表视图样式 */
.records-container.list-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.list-view .record-card {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.list-view .record-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border-color: #007AFF;
}

.list-view .record-date {
  font-size: 16px;
  font-weight: 600;
  color: #007AFF;
  white-space: nowrap;
  min-width: 80px;
}

.list-view .record-mood {
  font-size: 28px;
  margin-left: 30%;
}

.list-view .record-content {
  flex: 1;
  min-width: 0;
}

/* 平铺视图样式 */
.records-container.grid-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.grid-view .record-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
  height: 280px; /* 设置固定高度 */
  display: flex; /* 使用 flex 布局 */
  flex-direction: column; /* 垂直排列 */
}

.grid-view .record-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
  border-color: #007AFF;
}

.grid-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.grid-date {
  font-size: 16px;
  font-weight: 600;
  color: #007AFF;
}

.grid-mood {
  font-size: 24px;
}

.grid-content {
  line-height: 1.6;
  flex-grow: 1; /* 占据剩余空间 */
  overflow: hidden; /* 隐藏溢出内容 */
}

.content-preview {
  font-size: 16px;
  color: #333;
  line-height: 1.7;
  overflow: hidden;
  display: -webkit-box;
  line-clamp: 4;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
}

/* 空状态样式 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-text {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.empty-subtext {
  font-size: 16px;
  color: #666;
}

/* Markdown 样式 */
:deep(.md-heading) {
  font-weight: 600;
  margin: 0.5em 0;
  line-height: 1.4;
}

:deep(.md-bold) {
  font-weight: 600;
}

:deep(.md-italic) {
  font-style: italic;
}

:deep(.md-strike) {
  text-decoration: line-through;
  color: #666;
}

:deep(.md-link) {
  color: #007AFF;
  text-decoration: none;
}

:deep(.md-link:hover) {
  text-decoration: underline;
}

:deep(.md-list-item) {
  margin: 0.2em 0;
  padding-left: 1em;
}

:deep(.md-quote) {
  border-left: 3px solid #ddd;
  padding-left: 1em;
  margin: 0.5em 0;
  color: #666;
  font-style: italic;
}

/* 小屏手机端适配 */
@media (max-width: 480px) {
  .header-section {
    gap: 16px;
  }

  .page-title {
    font-size: 24px;
  }

  .sort-btn, .view-btn {
    width: 40px;  /* 手机端稍微小一点 */
    height: 40px;
    font-size: 20px;
  }

  .stats-container {
    width: 100%;
    font-size: 12px;
    padding: 8px 2px;
  }

  .stat-item {
    padding: 0 6px;
  }

  .stat-item .el-icon {
    font-size: 12px;
  }

  .list-view .record-card {
    padding: 16px;
  }

  .grid-view .record-card {
    padding: 12px;
  }

  .content-preview {
    font-size: 13px;
  }
}

/* 大屏幕优化 */
@media (min-width: 1200px) {
  .main-content {
    max-width: 1400px;
    padding: 100px 40px 40px;
  }

  .page-title {
    font-size: 36px;
  }

  .records-container.grid-view {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 24px;
  }

  .list-view .record-card {
    padding: 28px;
  }

  .grid-view .record-card {
    padding: 24px;
  }

  .content-preview {
    font-size: 17px;
  }
}

/* 手机端底部导航栏样式 */
.mobile-bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-around;
  padding: 8px 0 calc(8px + env(safe-area-inset-bottom));
  z-index: 1000;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.1);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 12px;
  position: relative;
  min-width: 50px;
  flex: 1;
  max-width: 70px;
}

.nav-item:active {
  transform: scale(0.95);
}

.nav-icon {
  font-size: 24px;
  color: #666;
  margin-bottom: 4px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  position: relative;
}

.nav-label {
  font-size: 10px;
  color: #666;
  font-weight: 500;
  text-align: center;
  transition: all 0.3s ease;
  line-height: 1.2;
}

/* 激活状态样式 */
.nav-item.active .nav-icon {
  color: #007AFF;
  background: rgba(0, 122, 255, 0.1);
  transform: scale(1.1);
}

.nav-item.active .nav-label {
  color: #007AFF;
  font-weight: 600;
}

/* 点击动画效果 */
.nav-item::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(0, 122, 255, 0.2);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: all 0.3s ease;
  z-index: -1;
}

.nav-item:active::before {
  width: 40px;
  height: 40px;
}

/* 适配不同屏幕尺寸 */
@media (max-width: 480px) {
  .mobile-bottom-nav {
    padding: 6px 0 calc(6px + env(safe-area-inset-bottom));
  }
  
  .nav-item {
    padding: 6px 8px;
    min-width: 45px;
    max-width: 60px;
  }
  
  .nav-icon {
    font-size: 22px;
    width: 26px;
    height: 26px;
  }
  
  .nav-label {
    font-size: 9px;
  }
}

/* 横屏模式适配 */
@media (orientation: landscape) and (max-height: 600px) {
  .mobile-bottom-nav {
    padding: 4px 0 calc(4px + env(safe-area-inset-bottom));
  }
  
  .nav-item {
    padding: 4px 6px;
  }
  
  .nav-icon {
    font-size: 20px;
    width: 24px;
    height: 24px;
    margin-bottom: 2px;
  }
  
  .nav-label {
    font-size: 8px;
  }
}

/* 为底部导航栏添加固定定位样式 */
.bottom-navigation {
  position: fixed; /* 固定定位 */
  bottom: 0; /* 固定在视口底部 */
  left: 0; /* 从左侧开始 */
  width: 100%; /* 宽度占满视口 */
  z-index: 1000; /* 设置层级，确保显示在其他内容上方 */
  /* 可按需添加其他样式，如背景色、高度等 */
  background-color: white;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  /* 防止软键盘推动导航栏 */
  transform: translateZ(0);
  -webkit-transform: translateZ(0);
}

/* 处理软键盘弹出时的视口变化 */
@media (max-height: 500px) and (max-width: 768px) {
  .mobile-bottom-nav,
  .bottom-navigation {
    /* 在小高度视口（通常是软键盘弹出时）保持固定位置 */
    position: fixed !important;
    bottom: 0 !important;
    transform: translateZ(0) !important;
    -webkit-transform: translateZ(0) !important;
  }
}

/* 支持环境变量的安全区域 */
@supports (padding: max(0px)) {
  .mobile-bottom-nav,
  .bottom-navigation {
    padding-bottom: max(8px, env(safe-area-inset-bottom));
  }
}

</style>
