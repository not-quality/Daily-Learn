<template>
  <div class="daily-record">
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

    <!-- 日历视图 -->
    <div v-if="currentView === 'calendar'" class="calendar-view">
      

      <!-- 月份导航 -->
      <div class="month-navigation">
        <el-icon class="month-nav-arrow" @click="previousMonth">
          <ArrowLeftBold />
        </el-icon>
        <div class="month-info">
          <span class="month-text">{{ currentMonthText }}</span>
        </div>
        <el-icon class="month-nav-arrow" @click="nextMonth">
          <ArrowRightBold />
        </el-icon>
      </div>

      <!-- 日历网格 -->
      <div class="calendar-grid">
        <!-- 星期标题 -->
        <div class="weekdays">
          <div v-for="day in weekdays" :key="day" class="weekday">{{ day }}</div>
        </div>
        
        <!-- 日期网格 -->
        <div class="dates-grid">
          <!-- 上个月的日期（灰色显示） -->
          <div 
            v-for="date in previousMonthDates" 
            :key="`prev-${date}`" 
            class="date-cell prev-month"
          >
            <span class="date-number">{{ date }}</span>
          </div>
          
          <!-- 当前月的日期 -->
          <div 
            v-for="date in currentMonthDates" 
            :key="`current-${date}`" 
            class="date-cell current-month"
            :class="{ 
              'selected': isSelectedDate(date), 
              'today': isToday(date),
              'disabled': isFutureDate(date) || isBeforeStartDate(date)
            }"
            @click="!isFutureDate(date) && !isBeforeStartDate(date) && selectDate(date)"
          >
            <span class="date-number">{{ date }}</span>
            <!-- 在日历单元格中的emoji -->
            <div class="calendar-mood" v-if="getMoodForDate(date)">
              {{ getMoodForDate(date) }}
            </div>
          </div>
          
          <!-- 下个月的日期（灰色显示） -->
          <div 
            v-for="date in nextMonthDates" 
            :key="`next-${date}`" 
            class="date-cell next-month"
          >
            <span class="date-number">{{ date }}</span>
          </div>
        </div>
      </div>

      <!-- 往日重现部分 -->
      <div class="past-records">
        <div class="past-records-header">
          <h3>往日重现</h3>
          <el-icon class="grid-icon" @click="goToBrowse">
            <Grid />
          </el-icon>
        </div>
        
        <div class="record-list">
          <div 
            v-for="record in recentRecords" 
            :key="record.id" 
            class="record-item"
            @click="viewRecord(record)"
          >
            <div class="record-date">{{ formatRecordDate(record.date) }}</div>
            <div class="record-mood">{{ record.mood }}</div>
            <div class="record-preview" v-html="record.preview"></div>
          </div>
        </div>
      </div>

      <!-- 添加按钮 -->
      <div class="floating-buttons">
        <el-icon class="floating-btn add-btn" @click="createNewRecord">
          <Plus />
        </el-icon>
      </div>
    </div>

    <!-- 日记编写视图 -->
    <div v-if="currentView === 'editor'" class="editor-view">
      <!-- 顶部导航 -->
      <div class="editor-header">
        <el-icon class="back-btn" @click="backToCalendar">
          <ArrowLeft />
        </el-icon>
        <div class="editor-actions">
          <el-icon class="save-btn" @click="saveAndReturn">
            <Check />
          </el-icon>
        </div>
      </div>

      <!-- 图片上传区域 -->
      <div class="image-upload-area">
        <!-- 已上传的图片预览 - 覆盖整个区域 -->
        <div v-if="currentRecord.images && currentRecord.images.length > 0" class="uploaded-images-full">
          <div
            v-for="image in currentRecord.images"
            :key="image.id"
            class="image-preview-full"
            @click="viewImageFullscreen(image)"
          >
            <img :src="image.data" :alt="image.name" />
            <div class="image-actions">
              <el-icon class="delete-image-btn" @click.stop="removeImage(image.id)">
                <Delete />
              </el-icon>
            </div>
          </div>
        </div>

        <!-- 上传按钮 - 只在没有图片时显示 -->
        <div v-else class="upload-buttons">
          <!-- <el-icon class="upload-icon" @click="openCamera" title="拍照">
            <Camera />
          </el-icon> -->
          <el-icon class="upload-icon" @click="selectImage" title="选择图片">
            <Picture />
          </el-icon>
        </div>
      </div>

      <!-- 图片全屏查看模态框 -->
      <div v-if="fullscreenImage" class="fullscreen-modal" @click="closeFullscreen">
        <div class="fullscreen-content" @click.stop>
          <img :src="fullscreenImage.data" :alt="fullscreenImage.name" />
          <div class="fullscreen-actions">
            <el-icon class="close-btn" @click="closeFullscreen">
              <Close />
            </el-icon>
            <el-icon class="delete-btn" @click="removeImageFromFullscreen">
              <Delete />
            </el-icon>
          </div>
        </div>
      </div>

      <!-- 日期显示 -->
      <div class="date-display">
        {{ formatEditorDate(selectedDate) }}
      </div>

      <!-- 心情选择 -->
      <div class="mood-selector">
        <div 
          v-for="(mood, index) in moodOptions" 
          :key="index"
          class="mood-option"
          @click="selectMood(mood)"
          :class="{ 'selected': currentRecord.mood === mood }"
        >
          <span class="selector-mood">{{ mood }}</span>
          <div class="mood-circle" :class="{ 'selected': currentRecord.mood === mood }"></div>
        </div>
      </div>

      <!-- Markdown 工具栏 -->
      <div class="markdown-toolbar" style="display: flex; flex-wrap: nowrap; white-space: nowrap; overflow-x: auto; padding-bottom: 8px; -webkit-overflow-scrolling: touch; min-width: max-content;">
        <div class="heading-dropdown">
          <button 
            class="toolbar-btn" 
            :class="{ 'active': isHeadingExpanded }"
            @click="toggleHeadingMenu"
          >H</button>
          <div v-if="isHeadingExpanded" class="heading-options">
            <div 
              v-for="level in 6" 
              :key="level"
              class="heading-option"
              @click="insertHeading(level)"
            >
              H{{ level }}
            </div>
          </div>
        </div>
        <button class="toolbar-btn" @click="insertMarkdown('**', '**')">B</button>
        <button class="toolbar-btn" @click="insertMarkdown('*', '*')">I</button>
        <button class="toolbar-btn" @click="insertMarkdown('~~', '~~')">S</button>
        <button class="toolbar-btn" @click="insertMarkdown('[', '](url)')">🔗</button>
        <button class="toolbar-btn" @click="insertMarkdown('- ')">☰</button>
        <button class="toolbar-btn" @click="insertMarkdown('> ')">"</button>
      </div>

      <!-- 内容编辑区域 -->
      <div class="content-editor">
        <el-icon 
          class="content-edit-btn" 
          :class="{ 'is-editing': isEditing }"
          @click="toggleEditing"
        >
          <Edit />
        </el-icon>
        <el-icon class="template-btn-icon" @click="showTemplates = !showTemplates">
          <Document />
        </el-icon>
        <textarea 
          v-if="isEditing"
          ref="contentTextarea"
          v-model="currentRecord.content"
          class="content-input"
          :placeholder="placeholder"
          @input="updatePreview"
        ></textarea>
        <div 
          v-else
          class="content-preview"
          v-html="parseMarkdown(currentRecord.content)"
        ></div>
      </div>

      <!-- 模板选择弹窗 -->
      <div v-if="showTemplates" class="templates-modal" @click="showTemplates = false">
        <div class="templates-content" @click.stop>
          <div class="templates-header">
            <h3>选择模板</h3>
            <el-icon class="add-template-btn" @click="createNewTemplate">
              <Plus />
            </el-icon>
          </div>
          
          <div v-if="!isEditingTemplate" class="template-list">
            <div 
              v-for="template in templates" 
              :key="template.id"
              class="template-item"
            >
              <div class="template-content" @click="insertTemplate(template)">
                <div class="template-title">{{ template.title }}</div>
                <div class="template-preview">{{ template.preview }}</div>
              </div>
              <div class="template-actions">
                <el-icon class="template-edit-btn" @click.stop="startEditTemplate(template)">
                  <Edit />
                </el-icon>
                <el-icon class="template-delete-btn" @click.stop="deleteTemplate(template)">
                  <Delete />
                </el-icon>
              </div>
            </div>
          </div>

          <div v-else class="template-editor">
            <div class="template-form">
              <input 
                v-model="editingTemplate.title"
                class="template-input"
                placeholder="模版标题"
              />
              <input 
                v-model="editingTemplate.preview"
                class="template-input"
                placeholder="模版描述"
              />
              <textarea 
                v-model="editingTemplate.content"
                class="template-content-input"
                placeholder="模版内容"
              ></textarea>
            </div>
            <!-- 修改模版编辑界面的按钮 -->
            <div class="template-editor-actions">
              <el-icon class="template-btn cancel" @click="isEditingTemplate = false">
                <Close />
              </el-icon>
              <el-icon class="template-btn save" @click="saveTemplate">
                <CircleCheck />
              </el-icon>
            </div>
          </div>
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
import { ref, computed, onMounted, nextTick, watch, markRaw } from 'vue'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import { 
  Setting, ArrowLeft, ArrowRight, Picture, Grid, Camera, Plus, 
  Check, Document, Edit, Delete, Close, CircleCheck,
  DArrowLeft, DArrowRight, ArrowLeftBold, ArrowRightBold, // 添加所需图标
  // 底部导航图标
  ChatDotRound, Notebook, Collection, List
} from '@element-plus/icons-vue'
// 导入导航样式
import '@/assets/navigation.css'
// 导入手机端导航样式
import '@/assets/mobile-nav.css'

// 定义props
const props = defineProps({
  currentPage: {
    type: String,
    default: 'record',
    required: true
  },
  editingRecord: {
    type: Object,
    default: null,
    required: false
  }
})

// 定义emits
const emit = defineEmits(['changePage', 'recordEdited'])

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

// 记录来源页面
const sourceView = ref('record')

// 设置中文本地化
dayjs.locale('zh-cn')

// 响应式数据
const currentView = ref('calendar') // 'calendar' 或 'editor'
const currentDate = ref(dayjs())
const selectedDate = ref(dayjs())
const showSettings = ref(false)
const showTemplates = ref(false)
const contentTextarea = ref(null)

// 在script setup中添加编辑状态变量
const isEditing = ref(false)

// 全屏图片查看
const fullscreenImage = ref(null)

// 修改toggleEditing方法
const toggleEditing = () => {
  isEditing.value = !isEditing.value;
  if (isEditing.value) {
    // 切换到编辑状态时，等待DOM更新后调整高度
    nextTick(() => {
      if (contentTextarea.value) {
        // 先设置一个较大的高度以获取完整的scrollHeight
        contentTextarea.value.style.height = '1px';
        contentTextarea.value.style.height = contentTextarea.value.scrollHeight + 'px';
      }
    });
  }
}

// 当前编辑的记录
const currentRecord = ref({
  id: null,
  date: null,
  mood: '',
  content: '',
  images: []
})

// 心情选项
const moodOptions = ['😟', '😞', '😐', '😊', '😆']

// 获取心情的权重（用于排序）
const getMoodWeight = (mood) => {
  return moodOptions.indexOf(mood)
}

// 星期标题
const weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

// 日记数据存储
const records = ref({})

// 修改模版数据为响应式，并从localStorage加载
const templates = ref([])

// 添加模版相关的方法
const loadTemplates = () => {
  const savedTemplates = localStorage.getItem('daily-templates')
  if (savedTemplates) {
    try {
      templates.value = JSON.parse(savedTemplates)
    } catch (error) {
      console.error('加载模版数据失败:', error)
      // 使用默认模版
      useDefaultTemplates()
    }
  } else {
    // 使用默认模版
    useDefaultTemplates()
  }
}

const useDefaultTemplates = () => {
  templates.value = [
    {
      id: 1,
      title: '日常记录',
      preview: '今天做了什么...',
      content: '## 今天做了什么\n\n## 今天学到了什么\n\n## 明天的计划\n\n'
    },
    {
      id: 2,
      title: '心情日记',
      preview: '今天的心情...',
      content: '## 今天的心情\n\n## 发生了什么\n\n## 感想\n\n'
    },
    {
      id: 3,
      title: '工作总结',
      preview: '工作内容总结...',
      content: '## 今日工作内容\n\n## 遇到的问题\n\n## 解决方案\n\n## 明日计划\n\n'
    },
    {
      id: 4,
      title: '学习笔记',
      preview: '今天学习的内容...',
      content: '## 学习内容\n\n## 重点知识\n\n## 疑问点\n\n## 总结\n\n'
    }
  ]
  saveTemplates()
}

const saveTemplates = () => {
  localStorage.setItem('daily-templates', JSON.stringify(templates.value))
}

const editingTemplate = ref(null)
const isEditingTemplate = ref(false)

const startEditTemplate = (template) => {
  editingTemplate.value = { ...template }
  isEditingTemplate.value = true
}

const saveTemplate = () => {
  if (!editingTemplate.value) return
  
  if (editingTemplate.value.id) {
    // 更新现有模版
    const index = templates.value.findIndex(t => t.id === editingTemplate.value.id)
    if (index !== -1) {
      templates.value[index] = { ...editingTemplate.value }
    }
  } else {
    // 添加新模版
    const newId = Math.max(0, ...templates.value.map(t => t.id)) + 1
    templates.value.push({
      ...editingTemplate.value,
      id: newId
    })
  }
  
  saveTemplates()
  isEditingTemplate.value = false
  editingTemplate.value = null
}

const deleteTemplate = (template) => {
  const index = templates.value.findIndex(t => t.id === template.id)
  if (index !== -1) {
    templates.value.splice(index, 1)
    saveTemplates()
  }
}

const createNewTemplate = () => {
  editingTemplate.value = {
    id: null,
    title: '',
    preview: '',
    content: ''
  }
  isEditingTemplate.value = true
}

// 计算属性
const currentMonthText = computed(() => {
  return currentDate.value.format('M月 YYYY')
})

const currentMonthDates = computed(() => {
  const startOfMonth = currentDate.value.startOf('month')
  const daysInMonth = currentDate.value.daysInMonth()
  return Array.from({ length: daysInMonth }, (_, i) => i + 1)
})

const previousMonthDates = computed(() => {
  const startOfMonth = currentDate.value.startOf('month')
  const dayOfWeek = startOfMonth.day()
  const adjustedDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek
  const daysToShow = adjustedDayOfWeek - 1
  
  if (daysToShow === 0) return []
  
  const prevMonth = currentDate.value.subtract(1, 'month')
  const daysInPrevMonth = prevMonth.daysInMonth()
  
  return Array.from({ length: daysToShow }, (_, i) => 
    daysInPrevMonth - daysToShow + i + 1
  )
})

const nextMonthDates = computed(() => {
  const endOfMonth = currentDate.value.endOf('month')
  const dayOfWeek = endOfMonth.day()
  const adjustedDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek
  const daysToShow = 7 - adjustedDayOfWeek
  
  if (daysToShow === 7) return []
  
  return Array.from({ length: daysToShow }, (_, i) => i + 1)
})

// Markdown解析函数
const parseMarkdown = (text) => {
  if (!text) return ''
  
  let html = text
    // 处理标题 (## 标题)
    .replace(/^#{1,6}\s+(.*?)$/gm, (match, content) => {
      const level = match.trim().split(' ')[0].length
      return `<h${level} class="md-heading">${content}</h${level}>`
    })
    // 处理加粗 (**文字**)
    .replace(/\*\*(.*?)\*\*/g, '<strong class="md-bold">$1</strong>')
    // 处理斜体 (*文字*)
    .replace(/\*(.*?)\*/g, '<em class="md-italic">$1</em>')
    // 处理删除线 (~~文字~~)
    .replace(/~~(.*?)~~/g, '<del class="md-strike">$1</del>')
    // 处理链接 ([文字](url))
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a class="md-link" href="$2">$1</a>')
    // 处理列表项 (- 列表项)
    .replace(/^-\s+(.*?)$/gm, '<li class="md-list-item">$1</li>')
    // 处理引用 (> 引用)
    .replace(/^>\s+(.*?)$/gm, '<blockquote class="md-quote">$1</blockquote>')
    // 处理段落和换行
    .replace(/([^\n]+)(?:\n|$)/g, (match, content) => {
      if (content.trim() && !content.startsWith('<')) {
        return `<span class="md-paragraph">${content}</span>${match.endsWith('\n') ? '<br>' : ''}`
      }
      return match
    })
    .trim()

  return html
}

const recentRecords = computed(() => {
  const today = dayjs()
  
  // 过滤出有内容和心情的记录
  const allRecords = Object.values(records.value)
    .filter(record => record.content.trim() && record.mood)
    // 计算每条记录与今天的天数差
    .map(record => ({
      ...record,
      daysDiff: today.diff(dayjs(record.date), 'day'),
      moodWeight: getMoodWeight(record.mood)
    }))
    // 按心情权重降序和日期接近程度排序
    .sort((a, b) => {
      // 首先按心情权重排序（心情越好权重越大）
      if (b.moodWeight !== a.moodWeight) {
        return b.moodWeight - a.moodWeight
      }
      // 心情相同时按日期接近程度排序
      return a.daysDiff - b.daysDiff
    })
    // 取前三条记录
    .slice(0, 3)
  
  // 添加解析后的预览内容
  return allRecords.map(record => {
    // 先解析Markdown内容
    const parsedContent = parseMarkdown(record.content)
    // 移除HTML标签以获取纯文本
    const plainText = parsedContent.replace(/<[^>]+>/g, '')
    // 截取前50个字符
    return {
      ...record,
      preview: plainText.slice(0, 50) + (plainText.length > 50 ? '...' : '')
    }
  })
})

const placeholder = computed(() => {
  return "写点什么..."
})

// 方法
const previousMonth = () => {
  currentDate.value = currentDate.value.subtract(1, 'month')
}

const nextMonth = () => {
  currentDate.value = currentDate.value.add(1, 'month')
}

const selectDate = (date) => {
  const fullDate = currentDate.value.date(date)
  selectedDate.value = fullDate
  
  // 获取或创建该日期的记录
  const dateKey = fullDate.format('YYYY-MM-DD')
  if (!records.value[dateKey]) {
    records.value[dateKey] = {
      id: dateKey,
      date: fullDate.toISOString(),
      mood: '',
      content: '',
      images: []
    }
  }
  
  currentRecord.value = { ...records.value[dateKey] }
  currentView.value = 'editor'
}

const isSelectedDate = (date) => {
  return selectedDate.value.date() === date && 
         selectedDate.value.month() === currentDate.value.month()
}

const isToday = (date) => {
  const today = dayjs()
  const currentMonthDate = currentDate.value.date(date)
  return today.format('YYYY-MM-DD') === currentMonthDate.format('YYYY-MM-DD')
}

// 修改日期检查函数
const isFutureDate = (date) => {
  const today = dayjs()
  const currentMonthDate = currentDate.value.date(date)
  return currentMonthDate.isAfter(today, 'day')
}

// 添加起始日期检查函数
const isBeforeStartDate = (date) => {
  const startDate = dayjs('2020-01-01')
  const currentMonthDate = currentDate.value.date(date)
  return currentMonthDate.isBefore(startDate, 'day')
}

const getMoodForDate = (date) => {
  const dateKey = currentDate.value.date(date).format('YYYY-MM-DD')
  return records.value[dateKey]?.mood || ''
}

const formatRecordDate = (dateString) => {
  return dayjs(dateString).format('YYYY年M月D日')
}

const formatEditorDate = (date) => {
  return date.format('YYYY年M月D日dddd')
}

const selectMood = (mood) => {
  // 如果点击的是当前已选择的心情，则取消选择
  if (currentRecord.value.mood === mood) {
    currentRecord.value.mood = ''
  } else {
    currentRecord.value.mood = mood
  }
}

const backToCalendar = () => {
  if (sourceView.value === 'browse') {
    // 如果是从往日重现页面进入的，返回到往日重现页面
    emit('changePage', 'browse')
  } else {
    // 如果是从日历视图进入的，返回到日历视图
    currentView.value = 'calendar'
    // 重置编辑状态
    isEditing.value = false
  }
}

const saveAndReturn = () => {
  // 保存记录
  saveRecord()
  
  if (sourceView.value === 'browse') {
    // 如果是从往日重现页面进入的，返回到往日重现页面
    emit('changePage', 'browse')
  } else {
    // 如果是从日历视图进入的，返回到日历视图
    currentView.value = 'calendar'
    // 重置编辑状态
    isEditing.value = false
  }
}

const createNewRecord = () => {
  const today = dayjs()
  selectedDate.value = today
  
  const dateKey = today.format('YYYY-MM-DD')
  if (!records.value[dateKey]) {
    records.value[dateKey] = {
      id: dateKey,
      date: today.toISOString(),
      mood: '',
      content: '',
      images: []
    }
  }
  
  currentRecord.value = { ...records.value[dateKey] }
  currentView.value = 'editor'
  // 设置来源为record（日历视图）
  sourceView.value = 'record'
}

const saveRecord = () => {
  const dateKey = selectedDate.value.format('YYYY-MM-DD')
  records.value[dateKey] = { ...currentRecord.value }
  
  // 保存到 localStorage
  localStorage.setItem('daily-records', JSON.stringify(records.value))
}

const insertMarkdown = (before, after = '') => {
  const textarea = contentTextarea.value
  if (!textarea) return
  
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = currentRecord.value.content.substring(start, end)
  
  const newText = before + selectedText + after
  const newContent = 
    currentRecord.value.content.substring(0, start) + 
    newText + 
    currentRecord.value.content.substring(end)
  
  currentRecord.value.content = newContent
  
  nextTick(() => {
    textarea.focus()
    const newCursorPos = start + before.length + selectedText.length + after.length
    textarea.setSelectionRange(newCursorPos, newCursorPos)
  })
}

const insertTemplate = (template) => {
  currentRecord.value.content = template.content
  showTemplates.value = false
  
  nextTick(() => {
    if (contentTextarea.value) {
      contentTextarea.value.focus()
    }
  })
}

const updatePreview = () => {
  // 自动调整文本框高度
  if (contentTextarea.value) {
    contentTextarea.value.style.height = 'auto';
    contentTextarea.value.style.height = contentTextarea.value.scrollHeight + 'px';
  }
}

const openCamera = async () => {
  try {
    // 检查是否支持相机API
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('您的设备不支持相机功能')
      return
    }

    // 请求相机权限
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment' // 优先使用后置摄像头
      }
    })

    // 创建相机预览界面
    createCameraInterface(stream)
  } catch (error) {
    console.error('相机访问失败:', error)
    if (error.name === 'NotAllowedError') {
      alert('请允许访问相机权限')
    } else if (error.name === 'NotFoundError') {
      alert('未找到相机设备')
    } else {
      alert('相机功能暂时不可用')
    }
  }
}

// 创建相机界面
const createCameraInterface = (stream) => {
  // 创建相机模态框
  const modal = document.createElement('div')
  modal.className = 'camera-modal'
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.9);
    z-index: 9999;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  `

  // 创建视频预览
  const video = document.createElement('video')
  video.srcObject = stream
  video.autoplay = true
  video.playsInline = true
  video.style.cssText = `
    width: 90%;
    max-width: 400px;
    height: auto;
    border-radius: 12px;
    margin-bottom: 20px;
  `

  // 创建画布用于拍照
  const canvas = document.createElement('canvas')
  canvas.style.display = 'none'

  // 创建按钮容器
  const buttonContainer = document.createElement('div')
  buttonContainer.style.cssText = `
    display: flex;
    gap: 20px;
    margin-top: 20px;
  `

  // 拍照按钮
  const captureBtn = document.createElement('button')
  captureBtn.textContent = '拍照'
  captureBtn.style.cssText = `
    padding: 12px 24px;
    background: #007AFF;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    cursor: pointer;
  `

  // 取消按钮
  const cancelBtn = document.createElement('button')
  cancelBtn.textContent = '取消'
  cancelBtn.style.cssText = `
    padding: 12px 24px;
    background: #666;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    cursor: pointer;
  `

  // 拍照功能
  captureBtn.onclick = () => {
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0)

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' })
        handleImageFile(file)
      }
      closeCamera()
    }, 'image/jpeg', 0.8)
  }

  // 关闭相机
  const closeCamera = () => {
    stream.getTracks().forEach(track => track.stop())
    document.body.removeChild(modal)
  }

  cancelBtn.onclick = closeCamera

  // 组装界面
  buttonContainer.appendChild(captureBtn)
  buttonContainer.appendChild(cancelBtn)
  modal.appendChild(video)
  modal.appendChild(canvas)
  modal.appendChild(buttonContainer)
  document.body.appendChild(modal)
}

const selectImage = () => {
  // 创建文件输入元素
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.style.display = 'none'

  input.onchange = (event) => {
    const file = event.target.files[0]
    if (file) {
      handleImageFile(file)
    }
    document.body.removeChild(input)
  }

  document.body.appendChild(input)
  input.click()
}

// 处理图片文件
const handleImageFile = (file) => {
  // 检查文件大小（限制为5MB）
  if (file.size > 5 * 1024 * 1024) {
    alert('图片文件过大，请选择小于5MB的图片')
    return
  }

  // 检查文件类型
  if (!file.type.startsWith('image/')) {
    alert('请选择有效的图片文件')
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    const imageData = e.target.result

    // 将图片添加到当前记录
    if (!currentRecord.value.images) {
      currentRecord.value.images = []
    }

    const imageInfo = {
      id: Date.now().toString(),
      data: imageData,
      name: file.name,
      size: file.size,
      type: file.type,
      timestamp: new Date().toISOString()
    }

    currentRecord.value.images.push(imageInfo)

    // 自动保存
    saveRecord()
  }

  reader.onerror = () => {
    alert('图片读取失败，请重试')
  }

  reader.readAsDataURL(file)
}

// 删除图片
const removeImage = (imageId) => {
  if (confirm('确定要删除这张图片吗？')) {
    if (currentRecord.value.images) {
      currentRecord.value.images = currentRecord.value.images.filter(img => img.id !== imageId)
      // 自动保存
      saveRecord()
    }
  }
}

// 全屏查看图片
const viewImageFullscreen = (image) => {
  fullscreenImage.value = image
}

// 关闭全屏查看
const closeFullscreen = () => {
  fullscreenImage.value = null
}

// 从全屏模式删除图片
const removeImageFromFullscreen = () => {
  if (fullscreenImage.value && confirm('确定要删除这张图片吗？')) {
    const imageId = fullscreenImage.value.id
    if (currentRecord.value.images) {
      currentRecord.value.images = currentRecord.value.images.filter(img => img.id !== imageId)
      // 自动保存
      saveRecord()
      // 关闭全屏
      closeFullscreen()
    }
  }
}

const viewRecord = (record) => {
  selectedDate.value = dayjs(record.date)
  currentRecord.value = { ...record }
  currentView.value = 'editor'
  // 查看记录时也重置编辑状态
  isEditing.value = false
  // 设置来源为record（日历视图）
  sourceView.value = 'record'
}

// 在script中添加展开状态
const isHeadingExpanded = ref(false)

// 添加标题选择方法
const toggleHeadingMenu = () => {
  isHeadingExpanded.value = !isHeadingExpanded.value
}

const insertHeading = (level) => {
  insertMarkdown('#'.repeat(level) + ' ')
  isHeadingExpanded.value = false
}

// 监听编辑记录的变化
watch(() => props.editingRecord, (newRecord) => {
  if (newRecord) {
    // 设置选中的日期
    selectedDate.value = dayjs(newRecord.date)
    // 设置当前编辑的记录
    currentRecord.value = { ...newRecord }
    // 切换到编辑视图
    currentView.value = 'editor'
    // 设置为查看模式（非编辑模式）
    isEditing.value = false
    // 记录来源页面为browse
    sourceView.value = 'browse'
    // 通知父组件记录已被处理
    emit('recordEdited')
  }
}, { immediate: true })

// 生命周期
onMounted(() => {
  // 移动端检测
  const updateIsMobile = () => {
    isMobile.value = window.innerWidth <= 768
  }
  updateIsMobile()
  window.addEventListener('resize', updateIsMobile)
  
  // 从 localStorage 加载数据
  const savedRecords = localStorage.getItem('daily-records')
  if (savedRecords) {
    try {
      records.value = JSON.parse(savedRecords)
    } catch (error) {
      console.error('加载日记数据失败:', error)
    }
  } else {
    // 如果没有保存的数据，添加一些示例数据
    const today = dayjs()
    const sampleRecords = {
      [today.format('YYYY-MM-DD')]: {
        id: today.format('YYYY-MM-DD'),
        date: today.toISOString(),
        mood: '😊',
        content: '今天感觉有许多摸鱼偷懒的时间，仍有提高时间利用率的空间。\n\n昨晚睡晚了，早上又有早课，不想上课😭\n今天天冷，不想学习。',
        images: []
      },
      [today.subtract(1, 'day').format('YYYY-MM-DD')]: {
        id: today.subtract(1, 'day').format('YYYY-MM-DD'),
        date: today.subtract(1, 'day').toISOString(),
        mood: '😞',
        content: '今天有点累，工作压力比较大。不过也有一些小收获。\n\n## 今天学到的\n- 完成了项目的一个重要功能\n- 学习了新的技术栈\n\n## 明天的计划\n- 继续优化代码\n- 准备下周的演示',
        images: []
      },
      [today.subtract(2, 'day').format('YYYY-MM-DD')]: {
        id: today.subtract(2, 'day').format('YYYY-MM-DD'),
        date: today.subtract(2, 'day').toISOString(),
        mood: '😆',
        content: '今天心情特别好！和朋友一起出去玩了。\n\n**今天的亮点：**\n- 和朋友看了一场很棒的电影\n- 吃了美味的晚餐\n- 天气很好，心情也很棒\n\n希望每天都能这么开心！',
        images: []
      }
    }
    records.value = sampleRecords
    localStorage.setItem('daily-records', JSON.stringify(sampleRecords))
  }
  loadTemplates()
  
  // 清理事件监听器
  return () => {
    window.removeEventListener('resize', updateIsMobile)
  }
})

const goToBrowse = () => {
  emit('changePage', 'browse')
}
</script>

<style scoped>
.daily-record {
  min-height: 100vh;
  background-color: #F0F5FF;
}

/* 日历视图样式 */
.calendar-view {
  padding: 80px 20px 20px;
  max-width: 800px; /* 增加最大宽度 */
  margin: 0 auto;
}

.month-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px; /* 增加间距 */
  padding: 0 20px;
}

.nav-arrow {
  font-size: 20px;
  color: #666;
  cursor: pointer;
  padding: 8px;
}

.month-info {
  display: flex;
  align-items: center;
}

.month-text {
  font-size: 28px; /* 增加字体大小 */
  font-weight: 600;
  color: #333;
}

.calendar-grid {
  background: white;
  border-radius: 20px; /* 增加圆角 */
  padding: 30px; /* 增加内边距 */
  margin-bottom: 40px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); /* 增强阴影 */
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 12px; /* 增加间距 */
  margin-bottom: 20px;
}

.weekday {
  text-align: center;
  font-size: 16px; /* 增加字体大小 */
  font-weight: 500;
  color: #666;
  padding: 10px 0;
}

.dates-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 12px; /* 增加间距 */
}

.date-cell {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 16px; /* 增加圆角 */
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  font-size: 18px; /* 增加字体大小 */
}

.date-cell.current-month {
  background: #f8f9fa;
}

.date-cell.current-month:hover {
  background: #e9ecef;
}

.date-cell.today {
  background: #007AFF;
  color: white;
}

.date-cell.selected {
  background: #34C759;
  color: white;
}

.date-cell.prev-month,
.date-cell.next-month {
  color: #ccc;
}

.date-cell.disabled {
  opacity: 0.5;
  cursor: default;
  background: #f0f0f0;
}

.date-cell.disabled:hover {
  background: #f0f0f0;
}

.date-number {
  font-size: 16px;
  font-weight: 500;
}

.past-records {
  background: white;
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.past-records-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.past-records-header h3 {
  font-size: 24px; /* 增加字体大小 */
  font-weight: 600;
  color: #333;
  margin: 0;
}

.grid-icon {
  font-size: 18px;
  color: #666;
  cursor: pointer;
}

.record-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}

.record-item:last-child {
  border-bottom: none;
}

.record-date {
  font-size: 14px;
  color: #666;
  white-space: nowrap;
}

.record-mood {
  font-size: 20px; /* 增加字体大小 */
}

.record-preview {
  flex: 1;
  font-size: 16px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.6;
}

.floating-buttons {
  position: fixed;
  bottom: 30px;
  right: 30px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.floating-btn {
  width: 64px;  /* 增加宽度 */
  height: 64px; /* 增加高度 */
  border-radius: 50%;
  background: #007AFF;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;  /* 增加图标大小 */
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
  transition: all 0.2s ease;
}

.floating-btn:hover {
  transform: scale(1.1);
}

@media (max-width: 768px) {
  .floating-buttons {
    bottom: 90px;
    right: 20px;
  }
}

/* 编辑器视图样式 */
.editor-view {
  width: 100%;
  min-height: 100vh;
  background: #f5f5f5;
  max-width: 800px; /* 增加最大宽度 */
  margin: 0 auto;
  padding-top: 60px;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  background: #f5f5f5;
}

.back-btn, .save-btn {
  font-size: 28px; /* 增加图标大小 */
  cursor: pointer;
}

.back-btn {
  color: #666;
}

.save-btn {
  color: #007AFF;
}

.image-upload-area {
  background: #e9ecef;
  margin: 30px;
  border-radius: 20px;
  min-height: 160px; /* 改为最小高度 */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  gap: 20px;
}

.uploaded-images {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  width: 100%;
  justify-content: center;
}

.uploaded-images-full {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  width: 100%;
  height: 100%;
  justify-content: center;
  align-items: center;
}

.image-preview {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.image-preview-full {
  position: relative;
  width: 100%;
  max-width: 300px;
  height: 120px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s ease;
}

.image-preview-full:hover {
  transform: scale(1.02);
}

.image-preview img,
.image-preview-full img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-actions {
  position: absolute;
  top: 5px;
  right: 5px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-image-btn {
  color: white;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.delete-image-btn:hover {
  color: #ff4d4f;
  transform: scale(1.1);
}

/* 全屏图片查看模态框 */
.fullscreen-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(5px);
}

.fullscreen-content {
  position: relative;
  max-width: 90%;
  max-height: 90%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fullscreen-content img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.fullscreen-actions {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 10px;
}

.close-btn,
.fullscreen-actions .delete-btn {
  width: 40px;
  height: 40px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 20px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.8);
  transform: scale(1.1);
}

.fullscreen-actions .delete-btn:hover {
  background: rgba(220, 53, 69, 0.8);
  transform: scale(1.1);
}

.upload-buttons {
  display: flex;
  gap: 20px;
}

.upload-icon {
  width: 60px; /* 增加图标大小 */
  height: 60px;
  background: rgba(52, 73, 94, 0.8);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  cursor: pointer;
}

.date-display {
  text-align: center;
  font-size: 20px; /* 增加字体大小 */
  font-weight: 500;
  color: #333;
  margin: 30px 0;
}

.mood-selector {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin: 40px 0;
}

.mood-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  position: relative;
  width: 28px; /* 添加固定宽度 */
}

.mood-circle {
  width: 16px;
  height: 16px;
  border: 2px solid #ddd;
  border-radius: 50%;
  transition: all 0.2s ease;
  margin-top: 35px; /* 为emoji留出空间 */
}

.mood-circle.selected {
  background: #007AFF;
  border-color: #007AFF;
}

.markdown-toolbar {
  display: flex; /* 使用 flex 布局 */
  flex-wrap: nowrap; /* 禁止换行 */
  overflow-x: auto; /* 添加水平滚动条 */
  min-width: 0; /* 防止 flex 项目溢出 */
  justify-content: center;
  gap: 12px;
  margin: 30px;
  padding: 16px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.toolbar-btn {
  padding: 12px 20px;  /* 增加内边距 */
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  color: #333;
  font-size: 18px;  /* 增加字体大小 */
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 1; /* 允许按钮缩小 */
  white-space: nowrap; /* 防止按钮文字换行 */
}

.toolbar-btn:hover {
  background: #f8f9fa;
}

.template-btn-icon {
  position: absolute;
  top: 34px;
  right: 2px;
  font-size: 20px;
  cursor: pointer;
  color: #666;
  background: white;
  /* padding: 8px; */
  border-radius: 50%;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  z-index: 10;
  transition: all 0.3s ease;
}

.template-btn-icon:hover {
  transform: scale(1.1);
}

.template-btn-icon.is-editing {
  color: #007AFF;
  background: #E6F2FF;
}

.content-editor {
  margin: 20px auto;
  position: relative;
  height: auto;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
}

.content-edit-btn {
  position: absolute;
  top: 2px;
  right: 2px;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  background: white;
  /* padding: 8px; */
  border-radius: 50%;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  z-index: 10;
  transition: all 0.3s ease;
}

.content-edit-btn:hover {
  transform: scale(1.1);
}

.content-edit-btn.is-editing {
  color: #007AFF;
  background: #E6F2FF;
}

.content-input {
  width: 100%;
  height: auto;
  min-height: 200px;
  padding: 30px;
  border: none;
  border-radius: 16px;
  background: white;
  font-size: 18px;
  line-height: 1.8;
  resize: none;
  outline: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: height 0.3s ease;
}

.content-input::placeholder {
  color: #999;
}

/* 监听输入事件自动调整高度 */
.content-input:focus {
  height: auto;
}

.templates-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.templates-content {
  background: white;
  border-radius: 16px;
  padding: 24px;
  max-width: 320px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.templates-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.add-template-btn {
  font-size: 20px;
  color: #007AFF;
  cursor: pointer;
}

.template-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.template-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  margin-bottom: 12px;
  transition: all 0.2s ease;
}

.template-content {
  flex: 1;
  cursor: pointer;
}

.template-actions {
  display: flex;
  gap: 12px;
}

.template-edit-btn,
.template-delete-btn {
  font-size: 16px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.template-edit-btn {
  color: #007AFF;
}

.template-delete-btn {
  color: #ff4d4f;
}

.template-edit-btn:hover,
.template-delete-btn:hover {
  background: #f0f0f0;
}

.template-editor {
  padding: 16px;
}

.template-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.template-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
}

.template-content-input {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  min-height: 200px;
  resize: vertical;
}

.template-editor-actions {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  margin-top: 20px;
}

.template-btn {
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.template-btn:hover {
  transform: scale(1.1);
}

.template-btn.cancel {
  color: #666;
}

.template-btn.save {
  color: #007AFF;
}

.editor-actions {
  display: flex;
  gap: 16px;
}

.edit-btn {
  font-size: 25px;
  cursor: pointer;
  color: #666;
}

.content-preview {
  width: 100%;
  height: auto;
  min-height: 200px;
  padding: 30px;
  border: none;
  border-radius: 16px;
  background: white;
  font-size: 18px;
  line-height: 1.8;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: height 0.3s ease;
  white-space: pre-wrap;
  word-wrap: break-word;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .calendar-view,
  .editor-view {
    max-width: 100%;
    padding: 60px 16px 90px; /* 添加底部间距 */
  }

  .month-text {
    font-size: 20px;
  }

  .calendar-grid {
    padding: 16px;
    border-radius: 16px;
  }

  .weekday {
    font-size: 14px;
    padding: 8px 0;
  }

  .date-cell {
    font-size: 16px;
    border-radius: 12px;
  }

  .past-records {
    padding: 20px;
    border-radius: 16px;
  }

  .past-records-header h3 {
    font-size: 20px;
  }

  .record-mood {
    font-size: 18px;
  }

  .record-preview {
    font-size: 14px;
  }

  .editor-header {
    padding: 16px;
  }

  .back-btn, .save-btn {
    font-size: 24px;
  }

  .image-upload-area {
    margin: 16px;
    min-height: 120px;
    padding: 15px;
  }

  .image-preview {
    width: 80px;
    height: 80px;
  }

  .image-preview-full {
    height: 100px;
  }

  .uploaded-images,
  .uploaded-images-full {
    gap: 10px;
  }

  .fullscreen-actions {
    top: 5px;
    right: 5px;
    gap: 5px;
  }

  .close-btn,
  .fullscreen-actions .delete-btn {
    width: 35px;
    height: 35px;
    font-size: 18px;
  }

  .upload-icon {
    width: 48px;
    height: 48px;
    font-size: 24px;
  }

  .date-display {
    font-size: 16px;
    margin: 20px 0;
  }

  .mood-selector {
    gap: 20px;
    margin: 30px 0;
  }

  .markdown-toolbar {
    margin: 16px;
    padding: 12px;
    gap: 8px;
    flex-wrap: wrap; /* 允许换行 */
    justify-content: center; /* 换行后居中 */
  }

  .toolbar-btn {
    padding: 10px 16px;
    font-size: 16px;
  }

  .content-input, .content-preview {
    padding: 20px;
    font-size: 16px;
  }

  .floating-btn {
    width: 56px;  /* 手机端稍微小一点 */
    height: 56px;
    font-size: 24px;
  }
}

/* 小屏手机适配 */
@media (max-width: 480px) {
  .markdown-toolbar {
    gap: 6px;
    padding: 10px 2px;
    margin: auto;
  }

  .toolbar-btn {
    padding: 8px 12px;
    font-size: 14px;
  }

  .template-btn-icon {
    font-size: 24px;
    margin-top: 2px;
    margin-bottom: 4px;
  }
}

/* 手机端样式适配，保证按钮大小一致 */
@media (max-width: 768px) {
  .toolbar-btn {
    width: 2.5rem; /* 设置统一宽度 */
    height: 2.5rem; /* 设置统一高度 */
    min-width: 2.5rem; /* 设置最小宽度 */
    min-height: 2.5rem; /* 设置最小高度 */
    padding: 0; /* 统一内边距 */
    display: flex; /* 使用 flex 布局 */
    align-items: center; /* 垂直居中 */
    justify-content: center; /* 水平居中 */
    box-sizing: border-box; /* 包含边框和内边距 */
  }
}

/* 大屏幕优化 */
@media (min-width: 1200px) {
  .calendar-view,
  .editor-view {
    max-width: 1000px; /* 更大屏幕下的最大宽度 */
  }

  .calendar-grid {
    padding: 40px;
  }

  .date-cell {
    font-size: 20px;
  }

  .past-records {
    padding: 40px;
  }

  .content-input, .content-preview {
    padding: 40px;
    font-size: 20px;
  }
}

/* Markdown 样式 */
:deep(.md-heading) {
  font-weight: 600;
  margin: 1em 0 0.5em;
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
  margin: 0.5em 0;
  padding-left: 1em;
}

:deep(.md-quote) {
  border-left: 3px solid #ddd;
  padding-left: 1em;
  margin: 1em 0;
  color: #666;
  font-style: italic;
}

:deep(.md-paragraph) {
  margin: 0.5em 0;
  line-height: 1.8;
  display: inline;
}

.month-nav-arrow {
  font-size: 15px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s ease;
}

.month-nav-arrow:hover {
  color: #007AFF;
  transform: scale(1.1);
}

.heading-dropdown { 
position: relative; 
display: inline-block; 
flex-shrink: 1; /* 允许下拉菜单缩小 */ }

.heading-options {
  position: absolute;
  top: 100%;
  left: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  margin-top: 4px;
  overflow: hidden;
}

.heading-option {
  padding: 8px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  font-size: 14px;
}

.heading-option:hover {
  background: #f0f0f0;
}

.toolbar-btn.active {
  background: #e6f2ff;
  border-color: #007AFF;
  color: #007AFF;
}

/* 日历中的emoji样式 */
.calendar-mood {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 24px;
  z-index: 0;
}

/* 编辑器中的emoji选择器样式 */
.selector-mood {
  font-size: 32px;
  margin-bottom: 2px;
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
}

/* 往日记录中的emoji样式 */
.record-mood {
  font-size: 20px;
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
