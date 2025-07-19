<template>
  <div class="app-container">
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
		<div class="add">
			<input type="text" v-model="taskInput" @keyup.enter="addTask" placeholder="添加任务...">
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
		<div v-for="item in filteredAndSortedList" :key="item._id" :class="['task-item', item.iscomplete ? 'completed' : 'item']">
			<div>
				<input v-model="item.iscomplete" @click="updateTaskStatus(item._id)" type="checkbox">
				<span>{{ item.text }}</span>
			</div>
			<div @click="deleteTask(item._id)" class="del btn-icon"><el-icon><Delete /></el-icon></div>
		</div>
	</div>
  <div v-if="showExpandBtn" class="expand-btn" @click="isExpanded = !isExpanded">
    <el-icon v-if="isExpanded"><ArrowUp /></el-icon>
    <el-icon v-else><ArrowDown /></el-icon>
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
    />

    <!-- 日记汇总页面 -->
    <DailyBrowse 
      v-if="currentPage === 'browse'"
      :currentPage="currentPage" 
      @changePage="handlePageChange"
      @editRecord="handleEditRecord"
    />

    <!-- 手机端底部导航栏 -->
    <div v-if="isMobile" class="mobile-bottom-nav bottom-navigation">
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
  </div>
</template>

<script setup>
// Vue核心API导入
import { ref, computed, onMounted, nextTick, watchEffect, markRaw } from 'vue';
// Element Plus图标导入
import { 
  CirclePlus, 
  Delete, 
  ArrowUp, 
  ArrowDown, 
  Menu, 
  Check, 
  CircleClose,
  // 底部导航图标
  Document,
  ChatDotRound,
  Notebook,
  Collection,
  List
} from '@element-plus/icons-vue';
// 导入初始数据
import initialData from './data/tasks.json';
// 导入每日一句组件
import DailySentence from './components/DailySentence.vue';
// 导入单词学习组件
import DailyWords from './components/DailyWords.vue';
// 导入日记组件
import DailyRecord from './components/DailyRecord.vue';
// 导入日记汇总组件
import DailyBrowse from './components/DailyBrowse.vue';
// 引入导航栏样式
import '@/assets/navigation.css'

// 页面切换状态
const currentPage = ref('record') // 'tasks' 或 'sentence' 或 'words' 或 'record'
// 要编辑的记录
const editingRecord = ref(null)

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

const taskInput = ref('') // 任务输入框的值
const taskList = ref([]) // 任务列表数据

const isExpanded = ref(false);
const showExpandBtn = ref(false);
const scheduleBoxRef = ref(null);

// 常量定义 - 任务容器最大高度(px)
const MAX_HEIGHT = 530;
// 常量定义 - 显示展开按钮的最小任务数量
const MIN_ITEMS_TO_EXPAND = 4;

// localStorage键名
const STORAGE_KEY = 'vue_daily_tasks';

// 生成唯一ID的函数
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// 本地数据管理函数
const localDataManager = {
  // 获取所有任务
  getTasks() {
    try {
      const storedData = localStorage.getItem(STORAGE_KEY);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        return {
          success: true,
          count: parsedData.data?.length || 0,
          data: parsedData.data || []
        };
      } else {
        // 如果localStorage中没有数据，使用初始数据并保存
        this.saveTasks(initialData.data);
        return {
          success: true,
          count: initialData.data.length,
          data: initialData.data
        };
      }
    } catch (error) {
      console.error('获取任务失败:', error);
      return {
        success: false,
        message: '获取任务失败',
        error: error.message
      };
    }
  },

  // 保存任务到localStorage
  saveTasks(tasks) {
    try {
      const dataToSave = {
        success: true,
        count: tasks.length,
        data: tasks
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      return { success: true };
    } catch (error) {
      console.error('保存任务失败:', error);
      return {
        success: false,
        message: '保存任务失败',
        error: error.message
      };
    }
  },

  // 添加新任务
  addTask(text) {
    try {
      const currentData = this.getTasks();
      if (!currentData.success) {
        return currentData;
      }

      const newTask = {
        _id: generateId(),
        text: text,
        iscomplete: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        __v: 0
      };

      const updatedTasks = [...currentData.data, newTask];
      const saveResult = this.saveTasks(updatedTasks);
      
      if (saveResult.success) {
        return {
          success: true,
          data: newTask
        };
      } else {
        return saveResult;
      }
    } catch (error) {
      console.error('添加任务失败:', error);
      return {
        success: false,
        message: '添加任务失败',
        error: error.message
      };
    }
  },

  // 更新任务状态
  updateTask(id) {
    try {
      const currentData = this.getTasks();
      if (!currentData.success) {
        return currentData;
      }

      const taskIndex = currentData.data.findIndex(task => task._id === id);
      if (taskIndex === -1) {
        return {
          success: false,
          message: '未找到指定任务'
        };
      }

      const updatedTasks = [...currentData.data];
      updatedTasks[taskIndex] = {
        ...updatedTasks[taskIndex],
        iscomplete: !updatedTasks[taskIndex].iscomplete,
        updatedAt: new Date().toISOString()
      };

      const saveResult = this.saveTasks(updatedTasks);
      
      if (saveResult.success) {
        return {
          success: true,
          data: updatedTasks[taskIndex]
        };
      } else {
        return saveResult;
      }
    } catch (error) {
      console.error('更新任务失败:', error);
      return {
        success: false,
        message: '更新任务失败',
        error: error.message
      };
    }
  },

  // 删除任务
  deleteTask(id) {
    try {
      const currentData = this.getTasks();
      if (!currentData.success) {
        return currentData;
      }

      const taskExists = currentData.data.some(task => task._id === id);
      if (!taskExists) {
        return {
          success: false,
          message: '未找到指定任务'
        };
      }

      const updatedTasks = currentData.data.filter(task => task._id !== id);
      const saveResult = this.saveTasks(updatedTasks);
      
      if (saveResult.success) {
        return {
          success: true,
          message: '任务删除成功',
          data: { id }
        };
      } else {
        return saveResult;
      }
    } catch (error) {
      console.error('删除任务失败:', error);
      return {
        success: false,
        message: '删除任务失败',
        error: error.message
      };
    }
  }
};

// 任务排序函数 - 未完成在前，按ID倒序
const sortTasks = (a, b) => {
  if (a.iscomplete !== b.iscomplete) {
    return a.iscomplete - b.iscomplete; // 未完成任务排在前面
  }
  return b._id.localeCompare(a._id); // 相同状态按ID降序排列
};

const completedCount = computed(() => {
  return taskList.value.filter(item => item.iscomplete).length;
});

const incompleteCount = computed(() => {
  return taskList.value.filter(item => !item.iscomplete).length;
});

// 获取任务列表数据
function fetchTasks() {
  const result = localDataManager.getTasks();
  if (result.success) {
    taskList.value = result.data || [];
  } else {
    console.error('获取任务失败:', result.message);
    taskList.value = [];
  }
  checkContentHeight(); // 数据更新后显式调用高度检查
}

// 添加新任务
function addTask() {
  if (!taskInput.value.trim()) {
    console.warn('任务内容不能为空');
    return;
  }

  const result = localDataManager.addTask(taskInput.value.trim());
  if (result.success) {
    fetchTasks();
    taskInput.value = '';
  } else {
    console.error('添加任务失败:', result.message);
  }
}

// 更新任务完成状态
function updateTaskStatus(id) {
  const result = localDataManager.updateTask(id);
  if (result.success) {
    fetchTasks();
  } else {
    console.error('更新任务失败:', result.message);
  }
}

// 删除任务
function deleteTask(id) {
  const result = localDataManager.deleteTask(id);
  if (result.success) {
    fetchTasks();
  } else {
    console.error('删除任务失败:', result.message);
  }
}

// 初始化数据
onMounted(() => {
  fetchTasks();
});

const activeFilter = ref('all');

// 筛选并排序的任务列表(根据当前筛选条件)
const filteredAndSortedList = computed(() => {
  let filtered = [...taskList.value];
  
  // 根据活跃筛选条件过滤任务
  if (activeFilter.value === 'completed') {
    filtered = filtered.filter(item => item.iscomplete);
  } else if (activeFilter.value === 'incomplete') {
    filtered = filtered.filter(item => !item.iscomplete);
  }
  
  return filtered.sort(sortTasks);
});

const checkContentHeight = () => {
  showExpandBtn.value = filteredAndSortedList.value.length > MIN_ITEMS_TO_EXPAND; // 使用常量判断是否显示展开按钮
};

// 监听任务列表变化以更新展开按钮状态
watchEffect(() => {
  nextTick(checkContentHeight);
});
onMounted(() => checkContentHeight());

// 动态计算任务容器最大高度
const scheduleBoxMaxHeight = computed(() => {
  // 展开状态时不限制高度，收起状态时根据任务数量决定
  return isExpanded.value ? 'none' : (shouldApplyMaxHeight.value ? `${MAX_HEIGHT}px` : 'none');
});

const shouldApplyMaxHeight = computed(() => {
  return filteredAndSortedList.value.length > MIN_ITEMS_TO_EXPAND; // 使用筛选后的列表长度判断是否应用最大高度限制
});

// 移动端检测
const isMobile = ref(false);

onMounted(() => {
  const updateIsMobile = () => {
    isMobile.value = window.innerWidth <= 768; // 768px及以下为移动端
  };
  updateIsMobile(); // 设置初始值
  window.addEventListener('resize', updateIsMobile);
  
  // 组件卸载时清理监听器
  return () => {
    window.removeEventListener('resize', updateIsMobile);
  };
});

// 底部导航栏数据 - 使用markRaw避免组件被响应式化
const navigationItems = ref([
  { name: 'words', label: '单词', icon: markRaw(Document) },
  { name: 'sentence', label: '句子', icon: markRaw(ChatDotRound) },
  { name: 'record', label: '日记', icon: markRaw(Notebook) },
  { name: 'browse', label: '迹忆', icon: markRaw(Collection) },
  { name: 'tasks', label: '任务', icon: markRaw(List) },
]);
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Roboto', 'Arial', sans-serif;
}

/* 应用容器样式 */
.app-container {
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
  box-shadow: 0 0 0 3px rgba(30, 80, 179, 0.2);
}

.task-item {
  width: 100%;
  margin: 0 auto 0.8rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-radius: 8px;
  transition: all 0.3s ease;
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  border-left-width: 4px;
}

.item {
  border-left-color: #666666; /* 辅助文字色 */
}

.item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transform: translateX(4px);
}

.completed {
  text-decoration: line-through;
  opacity: 0.7;
  border-left-color: #4CAF50; /* 事件标签色-绿色 */
}

.item input[type="checkbox"],
.completed input[type="checkbox"] {
  width: 1.2rem;
  height: 1.2rem;
  margin-right: 0.8rem;
  cursor: pointer;
}

.item span,
.completed span {
  flex: 1;
  font-size: 14px; /* 正文内容 */
  color: #333333; /* 文字主色 */
}

.del {
  padding: 3px 6px;
  color: #FF5252; /* 事件标签色-红色 */
  border: 1px solid #FF5252;
  border-radius: 4px;
  font-size: 18px;
  transition: all 0.3s ease;
  background: transparent;
}

.del:hover {
  background-color: #ffeeee;
  transform: scale(1.05);
}
.schedule_box.expanded {
  max-height: none;
}

.expand-btn {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 10px auto;
  color: #1E50B3;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 30px;
}

.expand-btn:focus {
  color: #143a85;
  outline: none;
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.expand-btn:hover {
  color: #143a85;
}

.element-count {
  text-align: center;
  margin: 0px 0;
  font-size: 12px; /* 辅助文字 */
  color: #666666; /* 辅助文字色 */
}

.filter-tag {
  cursor: pointer;
  padding: 0 8px;
  border-radius: 4px;
  transition: all 0.2s;
}

.filter-tag.active {
  color: #1E50B3; /* 导航高亮色 */
  font-weight: bold;
}

.filter-tag .el-icon {
  vertical-align: middle;
  margin-right: 4px;
  font-size: 14px;
}

/* 平板端响应式设计 */
@media (max-width: 1024px) {
  .tasks-container {
    padding-top: 70px;
  }
  
  .schedule_box {
    width: 95%;
    margin: 15px auto;
    padding: 1.25rem;
  }
  
  .title {
    font-size: 1.75rem;
  }
}

/* 手机端响应式设计 */
@media (max-width: 768px) {
  .tasks-container {
    padding-top: 60px;
  }
  
  .schedule_box {
    width: 95%;
    margin: 10px auto;
    padding: 1rem;
    min-height: 400px;
  }
  
  .title {
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
  }
  
  .add {
    margin-bottom: 1.5rem;
  }
  
  .add input {
    padding: 0.6rem 1rem;
    padding-right: 35px;
    font-size: 0.9rem;
  }
  
  .add-btn {
    width: 25px;
    height: 25px;
    right: 4px;
  }
  
  .item,
  .completed,
  .task-item {
    padding: 0.8rem;
    margin-bottom: 0.6rem;
  }
  
  .item span,
  .completed span {
    font-size: 0.95rem;
  }
  
  .del {
    padding: 2px 5px;
    font-size: 16px;
  }
  
  .element-count {
    font-size: 13px;
  }
  
  .expand-btn {
    font-size: 25px;
  }
}

/* 小屏手机端响应式设计 */
@media (max-width: 480px) {
  .tasks-container {
    padding-top: 55px;
  }
  
  .schedule_box {
    width: 98%;
    margin: 8px auto;
    padding: 0.8rem;
    min-height: 350px;
  }
  
  .title {
    font-size: 1.3rem;
    margin-bottom: 1.2rem;
  }
  
  .add {
    margin-bottom: 1.2rem;
  }
  
  .add input {
    padding: 0.5rem 0.8rem;
    padding-right: 30px;
    font-size: 0.85rem;
  }
  
  .add-btn {
    width: 22px;
    height: 22px;
    right: 3px;
  }
  
  .item,
  .completed,
  .task-item {
    padding: 0.6rem;
    margin-bottom: 0.5rem;
  }
  
  .item span,
  .completed span {
    font-size: 0.9rem;
  }
  
  .del {
    padding: 1px 4px;
    font-size: 14px;
  }
  
  .element-count {
    font-size: 12px;
  }
  
  .expand-btn {
    font-size: 20px;
  }
}

/* 触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
  .add-btn:hover,
  .item:hover,
  .del:hover,
  .expand-btn:hover {
    transform: none;
    box-shadow: none;
  }
  
  .add-btn:active,
  .del:active,
  .expand-btn:active {
    transform: scale(0.95);
  }
  
  .item:active {
    transform: translateX(2px);
  }
}

/* 横屏适配 */
@media (orientation: landscape) and (max-height: 600px) {
  .tasks-container {
    padding-top: 50px;
  }
  
  .schedule_box {
    margin: 5px auto;
    padding: 1rem;
    min-height: 300px;
  }
  
  .title {
    font-size: 1.2rem;
    margin-bottom: 1rem;
  }
  
  .add {
    margin-bottom: 1rem;
  }
}

/* 手机端适配 */
@media (max-width: 768px) {
  .add {
    margin: 15px auto;
    width: 95%;
  }

  .add input {
    padding: 10px;
    padding-right: 35px;
    font-size: 14px;
  }

  .add-btn {
    right: 6px;
    padding: 3px;
  }

  .add-btn:hover {
    transform: translateY(-50%);
  }

  .add-btn:active {
    transform: translateY(-50%) scale(0.95);
  }
}

/* 小屏手机端适配 */
@media (max-width: 480px) {
  .add {
    margin: 12px auto;
    width: 98%;
  }

  .add input {
    padding: 8px;
    padding-right: 30px;
    font-size: 13px;
  }

  .add-btn {
    right: 5px;
    padding: 2px;
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
  /* 防止软键盘推动导航栏 */
  transform: translateZ(0);
  -webkit-transform: translateZ(0);
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
  color: #1E50B3; /* 导航高亮色 */
  background: rgba(30, 80, 179, 0.1);
  transform: scale(1.1);
}

.nav-item.active .nav-label {
  color: #1E50B3; /* 导航高亮色 */
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
  background: rgba(30, 80, 179, 0.2);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: all 0.3s ease;
  z-index: -1;
}

.nav-item:active::before {
  width: 40px;
  height: 40px;
}

/* 给主要内容区域添加底部间距 */
@media (max-width: 768px) {
  .tasks-container,
  .daily-sentence,
  .daily-words-container,
  .daily-record,
  .daily-browse {
    padding-bottom: 90px !important;
  }
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
