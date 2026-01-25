<template>
  <div class="daily-mission">
    <!-- 任务管理页面 -->
    <div v-if="currentPage === 'tasks'" class="tasks-container">
      <!-- 导航栏 -->
      <div class="navigation">
        <div class="logo">
          <span>Daily Learn</span>
        </div>
        <!-- 桌面端显示完整导航列表 -->
        <ul v-if="!isMobile">
          <li><a href="#" @click="handlePageChange('words')" :class="{ active: currentPage === 'words' }">单词学习</a></li>
          <li><a href="#" @click="handlePageChange('sentence')" :class="{ active: currentPage === 'sentence' }">句子练习</a></li>
          <li><a href="#" @click="handlePageChange('record')" :class="{ active: currentPage === 'record' }">每日一记</a></li>
          <li><a href="#" @click="handlePageChange('browse')" :class="{ active: currentPage === 'browse' }">往日迹忆</a></li>
          <li><a href="#" @click="handlePageChange('tasks')" :class="{ active: currentPage === 'tasks' }">任务管理</a></li>
          <div class="li-box" :class="currentPage"></div>
        </ul>
      </div>

      <div class="schedule_box" ref="scheduleBoxRef" :class="{ expanded: isExpanded }" :style="{ maxHeight: scheduleBoxMaxHeight }">
        <div class="title">Daily You</div>
        <!-- 任务输入区域增加聚焦与失焦事件用于控制底部导航显示 -->
        <div class="add">
          <input
            type="text"
            v-model="taskInput"
            @keyup.enter="addTask"
            @focus="handleTaskInputFocus"
            @blur="handleTaskInputBlur"
            placeholder="添加任务..."
          >
          <button @click="addTask" class="add-btn btn-icon"><el-icon><CirclePlus /></el-icon></button>
        </div>
        <div class="element-count">
          <span 
            @click="activeFilter = 'all'" 
            :class="{ active: activeFilter === 'all' }"
            class="filter-tag"
          >
            <el-icon><Menu /></el-icon> 总任务: {{ taskList.length }}
          </span> | 
          <span 
            @click="activeFilter = 'completed'" 
            :class="{ active: activeFilter === 'completed' }"
            class="filter-tag"
          >
            <el-icon><Check /></el-icon> 已完成: {{ completedCount }}
          </span> | 
          <span 
            @click="activeFilter = 'incomplete'" 
            :class="{ active: activeFilter === 'incomplete' }"
            class="filter-tag"
          >
            <el-icon><CircleClose /></el-icon> 未完成: {{ incompleteCount }}
          </span>
        </div>
        <div
          v-for="item in filteredAndSortedList"
          :key="item._id"
          :class="['task-item', item.iscomplete ? 'completed' : 'item']"
          draggable="true"
          @dragstart="handleDragStart($event, item)"
          @dragover="handleDragOver"
          @drop="handleDrop($event, item)"
          @dragend="handleDragEnd"
        >
          <div class="task-content">
            <div class="drag-handle">⋮⋮</div>
            <input type="checkbox" v-model="item.iscomplete" @change="saveToStorage">
            <span :class="{ 'completed-text': item.iscomplete }">{{ item.name }}</span>
          </div>
          <div class="task-actions">
            <button @click="deleteTask(item._id)" class="btn-icon delete-btn">
              <el-icon><Delete /></el-icon>
            </button>
          </div>
        </div>
      </div>

      <!-- 展开/收起按钮 -->
      <div v-if="showExpandBtn" class="expand-toggle" @click="toggleExpand">
        <el-icon>
          <ArrowUp v-if="isExpanded" />
          <ArrowDown v-else />
        </el-icon>
      </div>
    </div>

    <!-- 每日一句页面 -->
    <DailySentence 
      v-if="currentPage === 'sentence'"
      :currentPage="currentPage" 
      @changePage="handlePageChange"
    />

    <!-- 单词学习页面 -->
    <DailyWords 
      v-if="currentPage === 'words'"
      :currentPage="currentPage" 
      @changePage="handlePageChange"
    />

    <!-- 日记页面 -->
    <DailyRecord 
      v-if="currentPage === 'record'"
      :currentPage="currentPage" 
      :editingRecord="editingRecord"
      @changePage="handlePageChange"
      @recordEdited="() => editingRecord = null"
      @openDiaryEntry="handleOpenDiaryEntry"
    />

    <!-- 日记编辑页面 -->
    <DiaryEntry
      v-if="currentPage === 'diaryEntry'"
      :recordData="diaryEntryData.recordData"
      :selectedDate="diaryEntryData.selectedDate"
      :sourceView="diaryEntryData.sourceView"
      @save="handleDiarySave"
      @back="handleDiaryBack"
      @changePage="handleDiaryDateChange"
    />

    <!-- 日记汇总页面 -->
    <DailyBrowse
      v-if="currentPage === 'browse'"
      :currentPage="currentPage"
      @changePage="handlePageChange"
      @editRecord="handleEditRecord"
    />

    <!-- 使用过渡动画包裹手机端底部导航栏，实现显示/隐藏的平滑过渡 -->
    <transition name="bottom-nav-fade">
      <!-- 手机端底部导航栏 -->
      <div v-if="isMobile && shouldShowNavigation" class="mobile-bottom-nav bottom-navigation">
        <div
          v-for="(item, index) in navigationItems"
          :key="item.name"
          class="nav-item"
          :class="{ active: currentPage === item.name }"
          @click="handlePageChange(item.name)"
        >
          <div class="nav-icon">
            <component :is="item.icon" />
          </div>
          <span class="nav-label">{{ item.label }}</span>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
// Vue核心API导入
import { ref, computed, onMounted, onUnmounted, watchEffect, markRaw } from 'vue'
// 导入 dayjs 用于处理日期
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
// Element Plus图标导入
import {
  CirclePlus,
  Delete,
  Menu,
  Check,
  CircleClose,
  ArrowDown,
  ArrowUp,
  // 底部导航图标
  Document,
  ChatDotRound,
  Notebook,
  Collection,
  List
} from '@element-plus/icons-vue'
// 导入初始数据
import initialData from '../data/tasks.json'
// 导入组件
import DailySentence from './DailySentence.vue'
import DailyWords from './DailyWords.vue'
import DailyRecord from './DailyRecord.vue'
import DailyBrowse from './DailyBrowse.vue'
import DiaryEntry from './DiaryEntry.vue'
// 导入 IndexedDB 存储 API
import { getAllTasks, saveAllTasks } from '@/utils/storage/tasks.js'
import { getAllDiaryRecords, saveDiaryRecord } from '@/utils/storage/diary.js'

// 设置 dayjs 中文本地化
dayjs.locale('zh-cn')


// 页面切换状态
const currentPage = ref('record') // 'tasks' 或 'sentence' 或 'words' 或 'record' 或 'browse' 或 'diaryEntry'
// 要编辑的记录
const editingRecord = ref(null)
// 日记编辑页面数据
const diaryEntryData = ref({
  recordData: null,
  selectedDate: null,
  sourceView: 'record'
})

// 任务输入框聚焦状态，用于在输入时隐藏移动端底部导航栏
const isTaskInputFocused = ref(false)

// 移动端检测
const isMobile = ref(false)

// 控制导航栏显示 - 在日记编辑页面及任务输入框聚焦时隐藏导航栏，避免软键盘遮挡
const shouldShowNavigation = computed(() => {
  // 在日记编辑页面时隐藏导航栏
  if (currentPage.value === 'diaryEntry') {
    return false
  }
  // 在任务管理页面且输入框处于聚焦状态时隐藏导航栏，提升输入体验
  if (currentPage.value === 'tasks' && isTaskInputFocused.value) {
    return false
  }
  // 其他页面保持导航栏正常显示
  return true
})

// 处理页面切换
const handlePageChange = (page) => {
  currentPage.value = page
  // 清除编辑记录状态
  if (page !== 'record') {
    editingRecord.value = null
  }
}

// 处理日记编辑
const handleEditRecord = (record) => {
  // 设置要编辑的记录
  editingRecord.value = record
  // 切换到日记编辑页面
  currentPage.value = 'record'
}

// 处理打开日记编辑器
const handleOpenDiaryEntry = (data) => {
  diaryEntryData.value = data
  currentPage.value = 'diaryEntry'
}

// 处理日记保存
const handleDiarySave = async (recordData) => {
  try {
    // 保存到 IndexedDB
    await saveDiaryRecord(recordData)
    console.log('日记保存成功:', recordData)
  } catch (error) {
    console.error('保存日记失败:', error)
  }
}

// 处理日记编辑器返回
const handleDiaryBack = (sourceView) => {
  if (sourceView === 'browse') {
    currentPage.value = 'browse'
  } else {
    currentPage.value = 'record'
  }
}

// 处理日记日期切换（左右滑动切换）
const handleDiaryDateChange = async (page, data) => {
  // 确保传入的是有效的 dayjs 对象
  const newDate = dayjs.isDayjs(data.date) ? data.date : dayjs(data.date)

  // 从 IndexedDB 获取对应日期的记录
  const existingRecords = await getAllDiaryRecords()
  const dateKey = newDate.format('YYYY-MM-DD')

  // 获取该日期的记录，如果不存在则创建新记录
  const recordData = existingRecords[dateKey] || {
    id: dateKey,
    date: newDate.toISOString(),
    mood: '',
    content: '',
    images: []
  }

  // 更新日记编辑页面数据
  diaryEntryData.value = {
    recordData: recordData,
    selectedDate: newDate,
    sourceView: data.sourceView || 'record'
  }
}

// 底部导航栏数据
const navigationItems = ref([
  { name: 'words', label: '单词', icon: markRaw(ChatDotRound) },
  { name: 'sentence', label: '句子', icon: markRaw(Notebook) },
  { name: 'record', label: '日记', icon: markRaw(Collection) },
  { name: 'browse', label: '迹忆', icon: markRaw(List) },
  { name: 'tasks', label: '任务', icon: markRaw(Document) }
])

// 任务管理相关状态
const taskList = ref([])
const taskInput = ref('')
const activeFilter = ref('all')
const isExpanded = ref(false)
const showExpandBtn = ref(false)
const scheduleBoxRef = ref(null)
const scheduleBoxMaxHeight = ref('auto')

// 常量定义
const MIN_ITEMS_TO_EXPAND = 4
const COLLAPSED_HEIGHT = 400

// 计算属性
const completedCount = computed(() => {
  return taskList.value.filter(item => item.iscomplete).length
})

const incompleteCount = computed(() => {
  return taskList.value.filter(item => !item.iscomplete).length
})

// 筛选并排序的任务列表
const filteredAndSortedList = computed(() => {
  let filtered = [...taskList.value]

  // 根据活跃筛选条件过滤任务
  if (activeFilter.value === 'completed') {
    filtered = filtered.filter(item => item.iscomplete)
  } else if (activeFilter.value === 'incomplete') {
    filtered = filtered.filter(item => !item.iscomplete)
  }

  return filtered.sort(sortTasks)
})

// 任务排序函数
const sortTasks = (a, b) => {
  // 首先按完成状态排序（未完成的在前）
  if (a.iscomplete !== b.iscomplete) {
    return a.iscomplete ? 1 : -1
  }
  // 然后按创建时间倒序排序（最新的在前）
  const timeA = new Date(a.createdAt).getTime()
  const timeB = new Date(b.createdAt).getTime()
  return timeB - timeA
}

// 任务管理方法
const addTask = async () => {
  if (taskInput.value.trim() === '') return

  const newTask = {
    _id: Date.now().toString(),
    name: taskInput.value.trim(),
    iscomplete: false,
    order: taskList.value.length,
    createdAt: new Date().toISOString()
  }

  taskList.value.push(newTask)
  taskInput.value = ''
  await saveToStorage()
}

// 任务输入框聚焦时的处理函数，隐藏底部导航栏以避免软键盘遮挡
const handleTaskInputFocus = () => {
  isTaskInputFocused.value = true
}

// 任务输入框失焦时的处理函数，恢复底部导航栏显示
const handleTaskInputBlur = () => {
  isTaskInputFocused.value = false
}

const deleteTask = async (id) => {
  const index = taskList.value.findIndex(item => item._id === id)
  if (index !== -1) {
    taskList.value.splice(index, 1)
    // 重新排序
    taskList.value.forEach((item, idx) => {
      item.order = idx
    })
    await saveToStorage()
  }
}

// 拖拽排序功能
let draggedItem = null
let draggedIndex = -1

const handleDragStart = (event, item) => {
  draggedItem = item
  draggedIndex = taskList.value.findIndex(task => task._id === item._id)
  event.dataTransfer.effectAllowed = 'move'
  event.target.style.opacity = '0.5'
}

const handleDragOver = (event) => {
  event.preventDefault()
  event.dataTransfer.dropEffect = 'move'
}

const handleDrop = async (event, targetItem) => {
  event.preventDefault()

  if (!draggedItem || draggedItem._id === targetItem._id) {
    return
  }

  const targetIndex = taskList.value.findIndex(task => task._id === targetItem._id)

  // 移除拖拽的项目
  taskList.value.splice(draggedIndex, 1)

  // 在目标位置插入项目
  const newTargetIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex
  taskList.value.splice(newTargetIndex, 0, draggedItem)

  // 重新设置order属性
  taskList.value.forEach((item, index) => {
    item.order = index
  })

  await saveToStorage()
}

const handleDragEnd = (event) => {
  event.target.style.opacity = '1'
  draggedItem = null
  draggedIndex = -1
}



// 展开/收起功能
const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
  updateMaxHeight()
}

const updateMaxHeight = () => {
  if (isExpanded.value) {
    scheduleBoxMaxHeight.value = 'none'
  } else {
    scheduleBoxMaxHeight.value = `${COLLAPSED_HEIGHT}px`
  }
}

const checkContentHeight = () => {
  // 简化逻辑：当任务数量大于4个时直接显示展开按钮
  showExpandBtn.value = filteredAndSortedList.value.length > MIN_ITEMS_TO_EXPAND
}

// IndexedDB 存储
const saveToStorage = async () => {
  try {
    await saveAllTasks(taskList.value)
  } catch (error) {
    console.error('保存任务列表失败:', error)
  }
}

const loadFromStorage = async () => {
  try {
    const tasks = await getAllTasks()
    if (tasks && tasks.length > 0) {
      taskList.value = tasks
    } else {
      // 转换初始数据格式
      taskList.value = initialData.data.map((item, index) => ({
        ...item,
        name: item.text || item.name,
        order: index
      }))
      // 保存初始数据到 IndexedDB
      await saveToStorage()
    }
  } catch (error) {
    console.error('加载任务列表失败:', error)
    // 转换初始数据格式
    taskList.value = initialData.data.map((item, index) => ({
      ...item,
      name: item.text || item.name,
      order: index
    }))
  }
}

// 移动端检测
const updateIsMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

// 监听任务列表变化以更新展开按钮状态
watchEffect(() => {
  checkContentHeight()
})

// 生命周期
onMounted(async () => {
  // 加载任务数据
  await loadFromStorage()

  // 移动端检测
  updateIsMobile()
  window.addEventListener('resize', updateIsMobile)

  // 初始化最大高度
  updateMaxHeight()

  // 检查展开按钮显示状态
  checkContentHeight()
})

onUnmounted(() => {
  window.removeEventListener('resize', updateIsMobile)
})
</script>

<style scoped>
/* 导航栏样式 - 引入外部样式 */
@import '@/assets/navigation.css';

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Roboto', 'Arial', sans-serif;
}

/* 应用容器样式 */
.daily-mission {
  min-height: 100vh;
  background: #F0F5FF; /* 主背景色 */
}

/* 任务管理容器样式 */
.tasks-container {
  min-height: 100vh;
  padding-top: 80px;
  padding-bottom: 40px;
}

.schedule_box {
  width: 90%;
  max-width: 600px;
  min-height: 530px;
  background-color: #ffffff; /* 内容区背景色 */
  margin: 20px auto;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05); /* 轻微阴影 */
  padding: 1.5rem;
  overflow: hidden;
  transition: max-height 0.3s ease;
  position: relative;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.schedule_box.expanded {
  overflow: visible;
}

.title {
  text-align: center;
  font-size: 20px; /* 页面主标题 */
  font-weight: 700;
  color: #333333; /* 文字主色 */
  margin-bottom: 2rem;
  padding-bottom: 0.8rem;
  border-bottom: 1px solid #e0e0e0;
}

.add {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 20px auto;
  width: 90%;
  max-width: 600px;
  position: relative;
}

.add input {
  flex: 1;
  padding: 12px;
  padding-right: 40px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px; /* 正文内容 */
  transition: all 0.3s ease;
  height: 48px;
  width: 100%;
  box-sizing: border-box;
}

.btn-icon {
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: #1E50B3; /* 导航高亮色 */
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.add-btn:hover {
  color: #143a85;
  transform: translateY(-50%) scale(1.1);
}

.add-btn:active {
  transform: translateY(-50%) scale(0.95);
}

.add input:focus {
  outline: none;
  border-color: #1E50B3;
  box-shadow: 0 0 0 2px rgba(30, 80, 179, 0.1);
}

.element-count {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-bottom: 1.5rem;
  font-size: 14px;
  color: #666666;
  flex-wrap: wrap;
}

.filter-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 20px;
  background: #f5f5f5;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.filter-tag:hover {
  background: #e8f4fd;
  color: #1E50B3;
}

.filter-tag.active {
  background: #1E50B3;
  color: white;
}

.task-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: 8px;
  border-radius: 8px;
  transition: all 0.2s ease;
  border: 1px solid #f0f0f0;
}

.task-item.item {
  background: #ffffff;
  border-left: 4px solid #1E50B3;
}

.task-item.completed {
  background: #f8f9fa;
  border-left: 4px solid #28a745;
  opacity: 0.8;
}

.task-content {
  display: flex;
  align-items: flex-start;
  flex: 1;
  min-width: 0;
}

.drag-handle {
  cursor: grab;
  color: #999;
  font-size: 16px;
  padding: 4px 6px 6px 4px;
  user-select: none;
  transition: color 0.2s ease;
  flex-shrink: 0;
}

.drag-handle:hover {
  color: #666;
}

.drag-handle:active {
  cursor: grabbing;
}

.task-item[draggable="true"]:hover {
  background: #f8f9fa;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}



.task-content input[type="checkbox"] {
  width: 18px;
  height: 18px;
  min-width: 18px;
  min-height: 18px;
  margin: auto 0;
  cursor: pointer;
  flex-shrink: 0;
  margin-right: 12px;
}

.task-content span {
  font-size: 14px;
  margin: auto 0;
  color: #333333;
  transition: all 0.2s ease;
  flex: 1;
  word-wrap: break-word;
  line-height: 1.4;
}

.completed-text {
  text-decoration: line-through;
  color: #999999 !important;
}

.task-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.task-actions button {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: #f8f9fa;
  color: #666666;
  font-size: 16px;
}

.task-actions button:hover {
  background: #e9ecef;
  color: #333333;
}

.task-actions button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.delete-btn {
  background: #fff5f5 !important;
  color: #dc3545 !important;
}

.delete-btn:hover {
  background: #f8d7da !important;
  color: #721c24 !important;
}

.expand-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  margin: 10px auto 20px;
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 36px;
  height: 36px;
  color: #666666;
  position: relative;
  z-index: 10;
}

.expand-toggle:hover {
  background: #e9ecef;
  color: #333333;
  transform: scale(1.05);
}

.expand-toggle .el-icon {
  font-size: 18px;
  transition: all 0.2s ease;
}

/* 手机端底部导航栏样式 */
.mobile-bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-around;
  padding: 8px 0;
  z-index: 1000;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
}

/* 底部导航显示隐藏时的淡入淡出过渡动画样式 */
.bottom-nav-fade-enter-active,
.bottom-nav-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

/* 底部导航进入初始状态与离开结束状态，使用轻微位移动画提升体验 */
.bottom-nav-fade-enter-from,
.bottom-nav-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 8px;
  min-width: 60px;
}

.nav-item:hover {
  background: white;
}

.nav-item.active {
  color: #1E50B3;
  background: #e8f4fd;
}

.nav-icon {
  font-size: 20px;
  margin-bottom: 4px;
}

.nav-label {
  font-size: 8px;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .tasks-container {
    padding-top: 60px;
    padding-bottom: 80px;
  }

  .schedule_box {
    width: 95%;
    margin: 10px auto;
    padding: 1rem;
  }

  .title {
    font-size: 18px;
    margin-bottom: 1.5rem;
  }

  .add {
    width: 100%;
    margin: 15px 0;
  }

  .element-count {
    font-size: 12px;
    gap: 4px;
  }

  .filter-tag {
    padding: 4px 8px;
    font-size: 12px;
  }

  .task-item {
    padding: 10px 12px;
    margin-bottom: 6px;
  }

  .task-content span {
    font-size: 13px;
  }

  .task-actions button {
    width: 28px;
    height: 28px;
    font-size: 14px;
  }
}

</style>
