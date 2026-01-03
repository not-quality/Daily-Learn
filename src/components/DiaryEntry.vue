<template>
  <div class="diary-entry">
    <!-- 顶部导航 -->
    <div class="editor-header">
      <el-icon class="back-btn" @click="handleBack">
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
        <el-icon class="upload-icon" @click="openCamera" title="拍照">
          <Camera />
        </el-icon>
        <el-icon class="upload-icon" @click="selectImage" title="选择图片">
          <Picture />
        </el-icon>
      </div>
    </div>

    <!-- 日期显示 -->
    <div class="date-display">
      {{ formatEditorDate(selectedDate) }}
    </div>

    <!-- 心情选择 -->
    <div class="mood-selector">
      <!-- 心情选项点击后支持二次点击取消选中，提升选择灵活性 -->
      <div
        v-for="mood in moodOptions"
        :key="mood"
        class="mood-option"
        @click="toggleMood(mood)"
      >
        <div class="mood-emoji">{{ mood }}</div>
        <div
          class="mood-indicator"
          :class="{ active: currentRecord.mood === mood }"
        ></div>
      </div>
    </div>

    <!-- Markdown 工具栏 -->
    <div class="markdown-toolbar">
      <button class="toolbar-btn" @click="insertMarkdownWithExample('## ', '', '标题')">H</button>
      <button class="toolbar-btn" @click="insertMarkdownWithExample('**', '**', '粗体')">B</button>
      <button class="toolbar-btn" @click="insertMarkdownWithExample('*', '*', '斜体')">I</button>
      <button class="toolbar-btn" @click="insertMarkdownWithExample('~~', '~~', '删除线')">S</button>
      <button class="toolbar-btn" @click="insertMarkdownWithExample('[', '](URL)', '链接')">🔗</button>
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
        <div class="templates-list">
          <div
            v-for="template in templates"
            :key="template.id"
            class="template-item"
            @click="insertTemplate(template)"
          >
            <div class="template-name">{{ template.name }}</div>
            <div class="template-preview">{{ template.content.substring(0, 50) }}...</div>
            <div class="template-actions-btn">
              <el-icon class="edit-template-btn" @click.stop="editTemplate(template)">
                <Edit />
              </el-icon>
              <el-icon class="delete-template-btn" @click.stop="deleteTemplate(template.id)">
                <Delete />
              </el-icon>
            </div>
          </div>
        </div>
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

    <!-- 新建模板弹窗 -->
    <div v-if="showNewTemplate" class="new-template-modal" @click="showNewTemplate = false">
      <div class="new-template-content" @click.stop>
        <h3>{{ isEditingTemplate ? '编辑模板' : '新建模板' }}</h3>
        <input 
          v-model="newTemplateName" 
          placeholder="模板名称" 
          class="template-input"
        />
        <textarea 
          v-model="newTemplateContent" 
          placeholder="模板内容" 
          class="template-content-input"
        ></textarea>
        <div class="template-actions">
          <button @click="saveNewTemplate" class="save-template-btn">保存</button>
          <button @click="showNewTemplate = false" class="cancel-template-btn">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import { 
  ArrowLeft, Check, Picture, Camera, Edit, Document, Plus, Delete, Close
} from '@element-plus/icons-vue'

// 设置中文本地化
dayjs.locale('zh-cn')

// 定义props
const props = defineProps({
  recordData: {
    type: Object,
    default: () => ({
      id: null,
      date: null,
      mood: '',
      content: '',
      images: []
    })
  },
  selectedDate: {
    type: Object,
    default: () => dayjs()
  },
  sourceView: {
    type: String,
    default: 'record'
  }
})

// 定义emits
const emit = defineEmits(['save', 'back', 'changePage'])

// 响应式数据
const isEditing = ref(false)
const showTemplates = ref(false)
const showNewTemplate = ref(false)
const contentTextarea = ref(null)
const fullscreenImage = ref(null)

// 当前记录
const currentRecord = ref({ ...props.recordData })

// 模板相关
const templates = ref([])
const newTemplateName = ref('')
const newTemplateContent = ref('')
const editingTemplate = ref(null)
const isEditingTemplate = ref(false)

// 心情选项
const moodOptions = ['😟', '😞', '😐', '😊', '😆']
// 切换心情选择：再次点击同一个心情图标时清空当前心情
const toggleMood = (mood) => {
  // 当当前选择与点击的心情相同时，取消选择；否则更新为新心情
  if (currentRecord.value.mood === mood) {
    currentRecord.value.mood = ''
  } else {
    currentRecord.value.mood = mood
  }
}

// 占位符文本
const placeholder = computed(() => {
  const today = dayjs()
  const isToday = props.selectedDate.isSame(today, 'day')

  if (isToday) {
    return '记录今天的点点滴滴...'
  } else {
    return `记录${props.selectedDate.format('M月D日')}的回忆...`
  }
})

// 格式化编辑器日期
const formatEditorDate = (date) => {
  return date.format('YYYY年M月D日')
}

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
    // 处理换行符
    .replace(/\n/g, '<br>')
    .trim()

  return html
}

// 编辑功能
const toggleEditing = () => {
  const wasEditing = isEditing.value
  isEditing.value = !isEditing.value

  if (isEditing.value) {
    // 切换到编辑状态时，等待DOM更新后调整高度
    nextTick(() => {
      if (contentTextarea.value) {
        // 先设置一个较大的高度以获取完整的scrollHeight
        contentTextarea.value.style.height = '1px'
        contentTextarea.value.style.height = contentTextarea.value.scrollHeight + 'px'
      }
    })
  } else if (wasEditing) {
    // 从编辑模式切换回查看模式时，自动保存
    saveRecord()
  }
}

const updatePreview = () => {
  // 自动调整文本框高度
  if (contentTextarea.value) {
    contentTextarea.value.style.height = 'auto'
    contentTextarea.value.style.height = contentTextarea.value.scrollHeight + 'px'
  }
}

// Markdown工具栏功能
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

// 带示例内容的Markdown插入函数
const insertMarkdownWithExample = (before, after = '', example = '') => {
  const textarea = contentTextarea.value
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = currentRecord.value.content.substring(start, end)

  // 如果有选中文本，使用选中文本；否则使用示例文本
  const contentText = selectedText || example
  const newText = before + contentText + after
  const newContent =
    currentRecord.value.content.substring(0, start) +
    newText +
    currentRecord.value.content.substring(end)

  currentRecord.value.content = newContent

  nextTick(() => {
    textarea.focus()
    if (selectedText) {
      // 如果有选中文本，光标放在插入内容的末尾
      const newCursorPos = start + before.length + selectedText.length + after.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    } else {
      // 如果没有选中文本，选中示例文本以便用户替换
      const exampleStart = start + before.length
      const exampleEnd = exampleStart + example.length
      textarea.setSelectionRange(exampleStart, exampleEnd)
    }
  })
}



// 图片处理功能
const openCamera = () => {
  // 创建文件输入元素，专门用于相机拍照
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.capture = 'environment' // 直接调用相机，优先后置摄像头
  input.style.display = 'none'

  input.onchange = (event) => {
    const file = event.target.files[0]
    if (file) {
      handleImageFile(file)
    }
    // 清理DOM元素
    document.body.removeChild(input)
  }

  // 添加到DOM并触发点击
  document.body.appendChild(input)
  input.click()
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

// 模板功能
const loadTemplates = () => {
  const savedTemplates = localStorage.getItem('diary-templates')
  if (savedTemplates) {
    try {
      templates.value = JSON.parse(savedTemplates)
    } catch (error) {
      console.error('加载模板失败:', error)
      templates.value = []
    }
  }
}

const saveTemplates = () => {
  localStorage.setItem('diary-templates', JSON.stringify(templates.value))
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

const createNewTemplate = () => {
  showNewTemplate.value = true
  newTemplateName.value = ''
  newTemplateContent.value = ''
  editingTemplate.value = null
  isEditingTemplate.value = false
}

const editTemplate = (template) => {
  showNewTemplate.value = true
  newTemplateName.value = template.name
  newTemplateContent.value = template.content
  editingTemplate.value = template
  isEditingTemplate.value = true
}

const saveNewTemplate = () => {
  if (!newTemplateName.value.trim() || !newTemplateContent.value.trim()) {
    alert('请填写模板名称和内容')
    return
  }

  if (isEditingTemplate.value && editingTemplate.value) {
    // 编辑模式：更新现有模板
    const templateIndex = templates.value.findIndex(t => t.id === editingTemplate.value.id)
    if (templateIndex !== -1) {
      templates.value[templateIndex] = {
        ...templates.value[templateIndex],
        name: newTemplateName.value.trim(),
        content: newTemplateContent.value.trim(),
        updatedAt: new Date().toISOString()
      }
    }
  } else {
    // 新建模式：创建新模板
    const newTemplate = {
      id: Date.now().toString(),
      name: newTemplateName.value.trim(),
      content: newTemplateContent.value.trim(),
      createdAt: new Date().toISOString()
    }
    templates.value.push(newTemplate)
  }

  saveTemplates()
  showNewTemplate.value = false
  editingTemplate.value = null
  isEditingTemplate.value = false
}

const deleteTemplate = (templateId) => {
  if (confirm('确定要删除这个模板吗？')) {
    templates.value = templates.value.filter(t => t.id !== templateId)
    saveTemplates()
  }
}

// 保存和返回功能
const saveRecord = () => {
  // 设置记录ID和日期
  if (!currentRecord.value.id) {
    currentRecord.value.id = props.selectedDate.format('YYYY-MM-DD')
  }
  if (!currentRecord.value.date) {
    currentRecord.value.date = props.selectedDate.toISOString()
  }

  // 发送保存事件
  emit('save', currentRecord.value)
}

const saveAndReturn = () => {
  saveRecord()
  handleBack()
}

const handleBack = () => {
  // 自动保存当前内容
  if (currentRecord.value.content.trim() || currentRecord.value.mood) {
    saveRecord()
  }

  // 发送返回事件
  emit('back', props.sourceView)
}

// 手机端返回键处理
const handleBackButton = (event) => {
  // 阻止默认的返回行为
  event.preventDefault()

  // 自动保存当前内容
  if (currentRecord.value.content.trim() || currentRecord.value.mood) {
    emit('save', currentRecord.value)
  }

  // 返回到上一个页面（通常是record页面）
  emit('back')
}

// 监听props变化
watch(() => props.recordData, (newData) => {
  currentRecord.value = { ...newData }
}, { deep: true })



// 生命周期
onMounted(() => {
  // 加载模板
  loadTemplates()

  // 添加history state，确保返回键能被拦截
  history.pushState({ page: 'diary-entry' }, '', '')

  // 添加返回键处理
  window.addEventListener('popstate', handleBackButton)
  document.addEventListener('backbutton', handleBackButton, false)
})

onUnmounted(() => {
  // 清理事件监听器
  window.removeEventListener('popstate', handleBackButton)
  document.removeEventListener('backbutton', handleBackButton, false)
})
</script>

<style scoped>
.diary-entry {
  min-height: 100vh;
  background-color: #F0F5FF;
  padding-bottom: 20px;
}

/* 编辑器头部 */
.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn, .save-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 20px;
  color: #333;
}

.back-btn:hover, .save-btn:hover {
  background: #e0e0e0;
  transform: scale(1.05);
}

.save-btn {
  background: #007AFF;
  color: white;
}

.save-btn:hover {
  background: #0056CC;
}

/* 图片上传区域 */
.image-upload-area {
  background: #e9ecef;
  margin: 16px;
  border-radius: 20px;
  min-height: 240px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  gap: 20px;
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

.image-preview-full {
  position: relative;
  width: 100%;
  max-width: 600px;
  height: 240px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s ease;
}

.image-preview-full:hover {
  transform: scale(1.02);
}

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

.upload-buttons {
  display: flex;
  gap: 20px;
  align-items: center;
  justify-content: center;
}

.upload-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 24px;
  color: #666;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.upload-icon:hover {
  background: #f0f0f0;
  transform: scale(1.05);
  color: #007AFF;
}

/* 日期显示 */
.date-display {
  text-align: center;
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 20px 0;
}

/* 心情选择 */
.mood-selector {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin: 20px 0;
  padding: 0 20px;
}

.mood-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mood-emoji {
  border-radius: 10%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  background: none;
  transition: all 0.2s ease;
}

.mood-option:hover .mood-emoji {
  transform: scale(1.1);
}

.mood-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #e0e0e0;
  transition: all 0.2s ease;
}

.mood-indicator.active {
  background: #007AFF;
  transform: scale(1.2);
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
}

/* Markdown工具栏 */
.markdown-toolbar {
  min-height: 60px;
  background: white;
  padding: 12px 20px;
  border-radius: 12px;
  margin: 0 16px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  gap: clamp(4px, 2vw, 8px);
  align-items: center;
  justify-content: center;
  flex-wrap: nowrap;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.markdown-toolbar::-webkit-scrollbar {
  display: none;
}

.toolbar-btn {
  width: clamp(40px, 8vw, 60px);
  height: clamp(40px, 8vw, 60px);
  min-width: 60px;
  min-height: 60px;
  max-width: 100px;
  max-height: 100px;
  border: none;
  border-radius: 8px;
  background: #f5f5f5;
  color: #333;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(12px, 3vw, 16px);
  flex-shrink: 0;
}

.toolbar-btn:hover {
  background: #e0e0e0;
  transform: scale(1.05);
}

.toolbar-btn.active {
  background: #007AFF;
  color: white;
}



/* 内容编辑器 */
.content-editor {
  background: white;
  margin: 0 16px;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
  min-height: 300px;
}

.content-edit-btn, .template-btn-icon {
  position: absolute;
  top: 16px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 16px;
  color: #666;
  z-index: 10;
}

.content-edit-btn {
  right: 16px;
  top: 16px;
}

.template-btn-icon {
  right: 16px;
  top: 56px;
}

.content-edit-btn:hover, .template-btn-icon:hover {
  background: #e0e0e0;
  transform: scale(1.05);
}

.content-edit-btn.is-editing {
  background: #007AFF;
  color: white;
}

.content-input {
  width: 100%;
  border: none;
  outline: none;
  font-size: 16px;
  line-height: 1.8;
  color: #333;
  resize: none;
  min-height: 200px;
  font-family: inherit;
  background: transparent;
}

.content-preview {
  font-size: 16px;
  line-height: 1.8;
  color: #333;
  min-height: 200px;
  word-wrap: break-word;
}

/* Markdown样式 */
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

/* 模板选择弹窗 */
.templates-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.templates-content {
  background: white;
  border-radius: 12px;
  padding: 32px;
  width: 90%;
  max-width: 600px;
  min-width: 400px;
  max-height: 85%;
  min-height: 500px;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.templates-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.templates-header h3 {
  margin: 0;
  color: #333;
}

.add-template-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #007AFF;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-template-btn:hover {
  background: #0056CC;
  transform: scale(1.05);
}

.templates-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 400px;
  overflow-y: auto;
}

.template-item {
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  min-height: 80px;
}

.template-item:hover {
  border-color: #007AFF;
  background: #f8f9ff;
}

.template-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  font-size: 16px;
}

.template-preview {
  color: #666;
  font-size: 14px;
  line-height: 1.5;
  margin-right: 80px;
}

.template-actions {
  top: 8px;
  right: 8px;
  display: flex;
  gap: 8px;
}

.template-actions-btn {
  position: absolute;
  top: 38%;
  right: 8px;
  display: flex;
  gap: 8px;
}

.edit-template-btn,
.delete-template-btn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 12px;
}

.edit-template-btn {
  background: #e3f2fd;
  color: #1976d2;
}

.edit-template-btn:hover {
  background: #1976d2;
  color: white;
  transform: scale(1.1);
}

.delete-template-btn {
  background: #ff4d4f;
  color: white;
}

.delete-template-btn:hover {
  background: #d32f2f;
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

/* 新建模板弹窗 */
.new-template-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.new-template-content {
  background: white;
  border-radius: 12px;
  padding: 24px;
  max-width: 90%;
  width: 400px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.new-template-content h3 {
  margin: 0 0 20px 0;
  color: #333;
}

.template-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 16px;
  outline: none;
  transition: border-color 0.2s ease;
}

.template-input:focus {
  border-color: #007AFF;
}

.template-content-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  min-height: 120px;
  resize: vertical;
  outline: none;
  transition: border-color 0.2s ease;
  font-family: inherit;
}

.template-content-input:focus {
  border-color: #007AFF;
}

.template-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
}

.save-template-btn,
.cancel-template-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.save-template-btn {
  background: #007AFF;
  color: white;
}

.save-template-btn:hover {
  background: #0056CC;
}

.cancel-template-btn {
  background: #f5f5f5;
  color: #333;
}

.cancel-template-btn:hover {
  background: #e0e0e0;
}

/* 平板端样式 */
@media (max-width: 1024px) and (min-width: 769px) {
  .markdown-toolbar {
    padding: 10px 16px;
    gap: 6px;
  }

  .toolbar-btn {
    width: 52px;
    height: 52px;
    min-width: 52px;
    min-height: 52px;
    font-size: 16px;
  }
}

/* 小屏平板样式 */
@media (max-width: 900px) and (min-width: 769px) {
  .markdown-toolbar {
    gap: 5px;
  }

  .toolbar-btn {
    width: 48px;
    height: 48px;
    min-width: 48px;
    min-height: 48px;
    font-size: 16px;
  }
}

/* 手机端适配 */
@media (max-width: 768px) {
  .editor-header {
    padding: 12px 16px;
  }

  .back-btn, .save-btn {
    width: 36px;
    height: 36px;
    font-size: 18px;
  }

  .image-upload-area {
    margin: 12px;
    min-height: 180px;
    padding: 15px;
  }

  .image-preview-full {
    height: 160px;
  }

  .upload-icon {
    width: 50px;
    height: 50px;
    font-size: 20px;
  }

  .date-display {
    font-size: 20px;
    margin: 16px 0;
  }

  .mood-selector {
    gap: 16px;
    margin: 16px 0;
    padding: 0 16px;
  }

  .mood-emoji {
    /* width: 44px;
    height: 44px; */
    font-size: 24px;
  }

  .mood-indicator {
    width: 6px;
    height: 6px;
  }

  .markdown-toolbar {
    margin: 0 12px 16px;
    padding: 8px 12px;
    gap: 4px;
    justify-content: center;
  }

  .toolbar-btn {
    width: 42px;
    height: 42px;
    min-width: 40px;
    min-height: 40px;
    font-size: 14px;
  }

  .content-editor {
    margin: 0 12px;
    padding: 16px;
    min-height: 250px;
  }

  .content-edit-btn, .template-btn-icon {
    width: 28px;
    height: 28px;
    font-size: 14px;
  }

  .content-edit-btn {
    right: 12px;
    top: 12px;
  }

  .template-btn-icon {
    right: 12px;
    top: 48px;
  }

  .content-input, .content-preview {
    font-size: 14px;
    min-height: 150px;
  }

  .templates-content {
    padding: 24px;
    width: 95%;
    max-width: none;
    min-width: 300px;
    min-height: 400px;
  }

  .new-template-content {
    max-width: 95%;
    padding: 20px;
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
}
</style>
