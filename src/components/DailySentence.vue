<template>
  <div class="daily-sentence">
    <!-- 导航栏 -->
    <div class="navigation">
      <div class="logo">
        <span>Daily Learn</span>
      </div>
      <!-- 桌面端显示完整导航列表，手机端通过CSS隐藏 -->
      <ul>
        <li><a href="#" @click="$emit('changePage', 'words')" :class="{ active: props.currentPage === 'words' }">单词学习</a></li>
        <li><a href="#" @click="switchToSentence" :class="{ active: props.currentPage === 'sentence' }">句子练习</a></li>
        <li><a href="#" @click="$emit('changePage', 'record')" :class="{ active: props.currentPage === 'record' }">每日一记</a></li>
        <li><a href="#" @click="$emit('changePage', 'browse')" :class="{ active: props.currentPage === 'browse' }">往日迹忆</a></li>
        <li><a href="#" @click="switchToTasks" :class="{ active: props.currentPage === 'tasks' }">任务管理</a></li>
        <div class="li-box" :class="props.currentPage"></div>
      </ul>
    </div>

    <!-- 句子练习主要内容区域 -->
    <div v-if="props.currentPage === 'sentence'" class="content-container">
      <div class="box">
        <div 
          v-for="(item, index) in sentences" 
          :key="item.number"
          class="question-section"
          :class="{ 'sentence-completed': item.completed }"
        >
          <div class="issue" :class="{ 'chinese-wrapped': item.chineseWrapped }">
            <span>{{ item.number }} {{ item.chinese }}</span>
            <div class="action-buttons">
              <button @click="toggleComplete(item.number)" class="complete-btn" :class="{ 'completed': item.completed }">
                <el-icon><Check /></el-icon>
              </button>
              <button @click="deleteSentence(item.number)" class="delete-btn">
                <el-icon><Delete /></el-icon>
              </button>
            </div>
          </div>
          <!-- 根据单词数量固定输入框整体对齐方式，避免运行时布局跳动 -->
          <div
            class="box-input"
            :class="item.alignCenter ? 'box-input-center' : 'box-input-left'"
            ref="inputContainer"
          >
            <div v-for="(word, wordIndex) in item.inputs" :key="wordIndex">
              <input 
                v-model="item.inputs[wordIndex]" 
                class="auswer" 
                type="text" 
                :style="getInputStyle(item.inputs[wordIndex])"
                @keydown="handleKeydown($event, index, wordIndex)"
              >
            </div>
          </div>
          <div>
            <button class="btn" :class="{ 'show-answer': item.showAnswer, 'button-wrapped': item.buttonWrapped }" @click="toggleAnswer(index)">
              {{ item.showAnswer ? item.english : '查看答案' }}
            </button>
          </div>
          <br>
        </div>
      </div>
      
      <!-- 管理控制区域 - 移动到最底部 -->
      <div class="management-section">
        <button @click="showAddForm = !showAddForm" class="manage-btn add-sentence-btn">
          <p><el-icon><CirclePlus /></el-icon></p>
          {{ showAddForm ? '取消添加' : '添加句子' }}
        </button>
        
        <!-- 添加句子表单 -->
        <div v-if="showAddForm" class="add-form">
          <div class="form-group">
            <label>句子编号：<span class="required">*</span></label>
            <input 
              v-model="numberInput" 
              type="text"
              placeholder="请输入句子编号（如：1-1, 2-3）..."
              class="form-input"
              :class="{ 'error': isNumberExists }"
            >
            <div v-if="isNumberExists" class="error-message">
              该编号已存在，请使用其他编号
            </div>
            <div class="help-text">
              建议格式：章节-题号（如：1-1, 2-3）
            </div>
          </div>
          <div class="form-group">
            <label>中文句子：<span class="required">*</span></label>
            <textarea 
              v-model="chineseInput" 
              placeholder="请输入中文句子..."
              rows="2"
              class="form-input"
            ></textarea>
          </div>
          <div class="form-group">
            <label>英文句子：<span class="required">*</span></label>
            <textarea 
              v-model="englishInput" 
              placeholder="请输入英文句子..."
              rows="2"
              class="form-input"
            ></textarea>
          </div>
          <div class="form-actions">
            <button @click="addSentence" class="submit-btn" :disabled="!canSubmit || isSubmitting">
              <div class="btn-icon">
                <el-icon><CirclePlus /></el-icon>
              </div>
              {{ isSubmitting ? '添加中...' : '添加句子' }}
            </button>
            <button @click="cancelAddForm" class="cancel-btn" :disabled="isSubmitting">取消</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
// Element Plus图标导入
import { CirclePlus, Delete, Check } from '@element-plus/icons-vue'
// 引入导航栏样式
import '@/assets/navigation.css'

// 定义props和emits
const props = defineProps({
  currentPage: {
    type: String,
    default: 'sentence',
    required: true
  }
})

const emit = defineEmits(['changePage'])

// 页面切换函数
const switchToTasks = () => {
  emit('changePage', 'tasks')
}

const switchToSentence = () => {
  emit('changePage', 'sentence')
}

// localStorage键名
const STORAGE_KEY = 'vue_daily_sentences'

// 计算英文句子中的单词数量
const countWordsInEnglish = (englishSentence) => {
  // 移除标点符号，按空格分割，过滤空字符串
  return englishSentence
    .replace(/[^\w\s]/g, ' ') // 将标点符号替换为空格
    .split(/\s+/) // 按空格分割
    .filter(word => word.trim() !== '') // 过滤空字符串
    .length
}

// 初始数据
const initialSentences = [
  {
    number: '1-1',
    chinese: '中国的短视频平台发展势头强劲，深刻改变了人们获取信息和娱乐的方式。',
    english: "China's short video platforms have a strong trend of development.They have profoundly changed the ways that people get information and have fun.",
    showAnswer: false,
    chineseWrapped: false,
    buttonWrapped: false,
    completed: false
  },
  {
    number: '1-2',
    chinese: '用户可以在平台上轻松创作、分享短视频，内容涵盖生活记录、知识科普、才艺展示等各个领域。',
    english: "User can easily create and share short videos on the platforms.The content includes life records,knowledge popularization, talent shows and other fields.",
    showAnswer: false,
    chineseWrapped: false,
    buttonWrapped: false,
    completed: false
  },
  {
    number: '1-3',
    chinese: '短视频以其碎片化、趣味性的特点，吸引了海量用户，日活跃用户数以亿计。',
    english: "The feature of short video are fragmented and interesting. They have attracted numerous users, with hundreds of millions of daily active users.",
    showAnswer: false,
    chineseWrapped: false,
    buttonWrapped: false,
    completed: false
  },
  {
    number: '1-4',
    chinese: '这些平台不仅为普通人提供了展示自我的机会，还催生了新的商业模式，带动了网红经济等相关产业的发展，成为互联网时代的重要文化现象。',
    english: "These platforms not only have provided opportunities for ordinary people to showcase themselves, but also have created new commercial models, have driven development of related industries, such as influencers' economy, and has become an important cultural phenomenon of the Internet era.",
    showAnswer: false,
    chineseWrapped: false,
    buttonWrapped: false,
    completed: false
  },
]

// 本地数据管理器
const localSentenceManager = {
  // 获取所有句子
  getSentences() {
    try {
      const storedData = localStorage.getItem(STORAGE_KEY)
      if (storedData) {
        const parsedData = JSON.parse(storedData)
        const data = parsedData.data || []
        // 确保所有句子都有必要的属性
        data.forEach(sentence => {
          if (!sentence.hasOwnProperty('showAnswer')) {
            sentence.showAnswer = false
          }
          if (!sentence.hasOwnProperty('chineseWrapped')) {
            sentence.chineseWrapped = false
          }
          if (!sentence.hasOwnProperty('buttonWrapped')) {
            sentence.buttonWrapped = false
          }
          if (!sentence.hasOwnProperty('completed')) {
            sentence.completed = false
          }
        })
        return {
          success: true,
          data: data
        }
      } else {
        // 如果localStorage中没有数据，使用初始数据并保存
        this.saveSentences(initialSentences)
        return {
          success: true,
          data: initialSentences
        }
      }
    } catch (error) {
      console.error('获取句子失败:', error)
      return {
        success: false,
        message: '获取句子失败',
        error: error.message
      }
    }
  },

  // 保存句子到localStorage
  saveSentences(sentences) {
    try {
      const dataToSave = {
        success: true,
        data: sentences
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave))
      return { success: true }
    } catch (error) {
      console.error('保存句子失败:', error)
      return {
        success: false,
        message: '保存句子失败',
        error: error.message
      }
    }
  },

  // 添加新句子
  addSentence(number, chinese, english) {
    try {
      const currentData = this.getSentences()
      if (!currentData.success) {
        return currentData
      }

      // 检查编号是否已存在
      const numberExists = currentData.data.some(sentence => sentence.number === number)
      if (numberExists) {
        return {
          success: false,
          message: '该编号已存在，请使用其他编号'
        }
      }

      const newSentence = {
        number: number,
        chinese: chinese,
        english: english,
        showAnswer: false,
        chineseWrapped: false,
        buttonWrapped: false,
        completed: false,
        createdAt: new Date().toISOString()
      }

      const updatedSentences = [...currentData.data, newSentence]
      const saveResult = this.saveSentences(updatedSentences)
      
      if (saveResult.success) {
        return {
          success: true,
          data: newSentence
        }
      } else {
        return saveResult
      }
    } catch (error) {
      console.error('添加句子失败:', error)
      return {
        success: false,
        message: '添加句子失败',
        error: error.message
      }
    }
  },

  // 删除句子
  deleteSentence(number) {
    try {
      const currentData = this.getSentences()
      if (!currentData.success) {
        return currentData
      }

      const sentenceExists = currentData.data.some(sentence => sentence.number === number)
      if (!sentenceExists) {
        return {
          success: false,
          message: '未找到指定句子'
        }
      }

      const updatedSentences = currentData.data.filter(sentence => sentence.number !== number)
      const saveResult = this.saveSentences(updatedSentences)
      
      if (saveResult.success) {
        return {
          success: true,
          message: '句子删除成功',
          data: { number }
        }
      } else {
        return saveResult
      }
    } catch (error) {
      console.error('删除句子失败:', error)
      return {
        success: false,
        message: '删除句子失败',
        error: error.message
      }
    }
  },

  // 切换句子完成状态
  toggleComplete(number) {
    try {
      const currentData = this.getSentences()
      if (!currentData.success) {
        return currentData
      }

      const sentenceIndex = currentData.data.findIndex(sentence => sentence.number === number)
      if (sentenceIndex === -1) {
        return {
          success: false,
          message: '未找到指定句子'
        }
      }

      const updatedSentences = [...currentData.data]
      updatedSentences[sentenceIndex] = {
        ...updatedSentences[sentenceIndex],
        completed: !updatedSentences[sentenceIndex].completed,
        updatedAt: new Date().toISOString()
      }

      const saveResult = this.saveSentences(updatedSentences)
      
      if (saveResult.success) {
        return {
          success: true,
          data: updatedSentences[sentenceIndex]
        }
      } else {
        return saveResult
      }
    } catch (error) {
      console.error('切换句子完成状态失败:', error)
      return {
        success: false,
        message: '切换句子完成状态失败',
        error: error.message
      }
    }
  }
}

// 题目数据
const sentences = reactive([])

// 添加句子相关的响应式数据
const numberInput = ref('')
const chineseInput = ref('')
const englishInput = ref('')
const showAddForm = ref(false)
const isSubmitting = ref(false)

// 检查编号是否已存在
const isNumberExists = computed(() => {
  if (!numberInput.value.trim()) return false
  return sentences.some(sentence => sentence.number === numberInput.value.trim())
})

// 验证表单是否可以提交
const canSubmit = computed(() => {
  return numberInput.value.trim() && 
         chineseInput.value.trim() && 
         englishInput.value.trim() && 
         !isNumberExists.value
})

// 初始化句子输入框数组和布局状态，避免运行期频繁计算和抖动
const initializeSentence = (sentence) => {
  // 根据英文句子单词数初始化输入框数量，并预先确定对齐方式
  const wordCount = countWordsInEnglish(sentence.english)
  sentence.inputs = new Array(wordCount).fill('')
  sentence.alignCenter = wordCount < 5
  sentence.chineseWrapped = false
  sentence.buttonWrapped = false
  if (!sentence.hasOwnProperty('completed')) {
    sentence.completed = false
  }
}

// 获取句子列表数据
const fetchSentences = () => {
  const result = localSentenceManager.getSentences()
  if (result.success) {
    sentences.splice(0, sentences.length, ...result.data)
    sentences.forEach(initializeSentence)
    
    // 重新加载数据后在DOM稳定时统一检测布局状态，避免后期频繁重排
    nextTick(() => {
      // 短延迟后检测中文是否换行以及答案按钮内容长度
      setTimeout(() => {
        sentences.forEach((_, index) => {
          checkIfWrapped(index)
        })
        preCheckButtonWrapped()
      }, 30)
    })
  } else {
    console.error('获取句子失败:', result.message)
  }
}

// 添加新句子
const addSentence = async () => {
  if (!canSubmit.value) {
    alert('请填写所有必填项，并确保编号唯一')
    return
  }

  isSubmitting.value = true
  
  try {
    const result = localSentenceManager.addSentence(
      numberInput.value.trim(), 
      chineseInput.value.trim(), 
      englishInput.value.trim()
    )
    
    if (result.success) {
      // 直接在当前数组中添加新句子，不重新加载整个数据
      const newSentence = result.data
      initializeSentence(newSentence)
      sentences.push(newSentence)
      
      // 只检测新添加的句子，避免影响其他句子
      const newSentenceIndex = sentences.length - 1
      checkSpecificButtonWrapped(newSentenceIndex)
      
      // 重置表单
      numberInput.value = ''
      chineseInput.value = ''
      englishInput.value = ''
      showAddForm.value = false
    } else {
      console.error('添加句子失败:', result.message)
      alert('添加句子失败: ' + result.message)
    }
  } catch (error) {
    console.error('添加句子时发生错误:', error)
    alert('添加句子时发生错误，请重试')
  } finally {
    isSubmitting.value = false
  }
}

// 取消添加表单
const cancelAddForm = () => {
  numberInput.value = ''
  chineseInput.value = ''
  englishInput.value = ''
  showAddForm.value = false
}

// 删除句子
const deleteSentence = (number) => {
  if (confirm('确定要删除这个句子吗？')) {
    const result = localSentenceManager.deleteSentence(number)
    if (result.success) {
      // 只从当前数组中移除句子，不重新加载整个数据
      const sentenceIndex = sentences.findIndex(sentence => sentence.number === number)
      if (sentenceIndex !== -1) {
        sentences.splice(sentenceIndex, 1)
      }
    } else {
      console.error('删除句子失败:', result.message)
      alert('删除句子失败: ' + result.message)
    }
  }
}

// 切换句子完成状态
const toggleComplete = (number) => {
  const result = localSentenceManager.toggleComplete(number)
  if (result.success) {
    // 只更新特定句子的状态，不重新加载整个数据
    const sentenceIndex = sentences.findIndex(sentence => sentence.number === number)
    if (sentenceIndex !== -1) {
      sentences[sentenceIndex].completed = !sentences[sentenceIndex].completed
    }
  } else {
    console.error('切换句子完成状态失败:', result.message)
    alert('切换句子完成状态失败: ' + result.message)
  }
}

// 预先检测按钮内容是否为单行（短内容）
const preCheckButtonWrapped = () => {
  setTimeout(() => {
    nextTick(() => {
      // 获取实际的内容容器来计算准确的按钮宽度
      const contentContainer = document.querySelector('.content-container')
      if (!contentContainer) return
      
      const containerWidth = contentContainer.getBoundingClientRect().width
      const buttonMaxWidth = Math.min(containerWidth * 0.9, containerWidth - 80) // 90% 宽度减去边距
      
      // 创建一个临时测量容器来模拟按钮样式
      const tempContainer = document.createElement('div')
      tempContainer.style.cssText = `
        position: absolute;
        top: -9999px;
        left: -9999px;
        visibility: hidden;
        font-size: 16px;
        font-weight: 500;
        line-height: 1.6;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        padding: 12px 24px;
        border: 2px solid #dc3545;
        border-radius: 8px;
        word-wrap: break-word;
        overflow-wrap: break-word;
        white-space: normal;
        box-sizing: border-box;
        width: ${buttonMaxWidth}px;
      `
      document.body.appendChild(tempContainer)
      
      // 创建单行高度测量元素
      const singleLineElement = document.createElement('span')
      singleLineElement.style.cssText = `
        position: absolute;
        top: -9999px;
        left: -9999px;
        white-space: nowrap;
        font-size: 16px;
        font-weight: 500;
        line-height: 1.6;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        padding: 12px 24px;
        border: 2px solid #dc3545;
        box-sizing: border-box;
        visibility: hidden;
      `
      singleLineElement.textContent = '测试按钮单行高度'
      document.body.appendChild(singleLineElement)
      
      const singleLineHeight = singleLineElement.getBoundingClientRect().height
      
      // 检测每个句子的英文内容长度
      sentences.forEach((sentence, index) => {
        if (sentence.english) {
          tempContainer.textContent = sentence.english
          const contentHeight = tempContainer.getBoundingClientRect().height
          
          // 如果内容高度不超过单行高度，则认为是短内容（需要居中对齐）
          const isShortContent = contentHeight <= singleLineHeight + 5
          sentence.buttonWrapped = isShortContent
        }
      })
      
      // 清理临时元素
      document.body.removeChild(tempContainer)
      document.body.removeChild(singleLineElement)
    })
  }, 200)
}

// 检测特定句子的按钮内容是否为单行（短内容）
const checkSpecificButtonWrapped = (sentenceIndex) => {
  setTimeout(() => {
    nextTick(() => {
      if (sentenceIndex >= sentences.length) return
      
      const sentence = sentences[sentenceIndex]
      if (!sentence.english) return
      
      // 获取实际的内容容器来计算准确的按钮宽度
      const contentContainer = document.querySelector('.content-container')
      if (!contentContainer) return
      
      const containerWidth = contentContainer.getBoundingClientRect().width
      const buttonMaxWidth = Math.min(containerWidth * 0.9, containerWidth - 80) // 90% 宽度减去边距
      
      // 创建一个临时测量容器来模拟按钮样式
      const tempContainer = document.createElement('div')
      tempContainer.style.cssText = `
        position: absolute;
        top: -9999px;
        left: -9999px;
        visibility: hidden;
        font-size: 16px;
        font-weight: 500;
        line-height: 1.6;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        padding: 12px 24px;
        border: 2px solid #dc3545;
        border-radius: 8px;
        word-wrap: break-word;
        overflow-wrap: break-word;
        white-space: normal;
        box-sizing: border-box;
        width: ${buttonMaxWidth}px;
      `
      document.body.appendChild(tempContainer)
      
      // 创建单行高度测量元素
      const singleLineElement = document.createElement('span')
      singleLineElement.style.cssText = `
        position: absolute;
        top: -9999px;
        left: -9999px;
        white-space: nowrap;
        font-size: 16px;
        font-weight: 500;
        line-height: 1.6;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        padding: 12px 24px;
        border: 2px solid #dc3545;
        box-sizing: border-box;
        visibility: hidden;
      `
      singleLineElement.textContent = '测试按钮单行高度'
      document.body.appendChild(singleLineElement)
      
      const singleLineHeight = singleLineElement.getBoundingClientRect().height
      
      // 检测特定句子的英文内容长度
      tempContainer.textContent = sentence.english
      const contentHeight = tempContainer.getBoundingClientRect().height
      
      // 如果内容高度不超过单行高度，则认为是短内容（需要居中对齐）
      const isShortContent = contentHeight <= singleLineHeight + 5
      sentence.buttonWrapped = isShortContent
      
      // 清理临时元素
      document.body.removeChild(tempContainer)
      document.body.removeChild(singleLineElement)
    })
  }, 100)
}

// 切换答案显示
const toggleAnswer = (index) => {
  sentences[index].showAnswer = !sentences[index].showAnswer
      // 按钮内容长度在页面加载时已经预先计算过，无需在每次切换时重新检测，减少不必要计算
}

// 获取所有输入框
const getAllInputs = () => {
  return document.querySelectorAll('.auswer')
}

const getInputStyle = (value) => {
  const length = (value || '').length
  const minChars = 3
  const maxChars = 20
  const widthChars = Math.min(Math.max(length + 1, minChars), maxChars)
  return {
    width: `${widthChars}ch`,
    minWidth: `${minChars}ch`
  }
}

// 辅助函数：根据全局输入框索引获取句子索引和句子内索引
const getInputPosition = (globalIndex) => {
  const inputs = Array.from(getAllInputs())
  let currentIndex = 0
  
  for (let sentenceIndex = 0; sentenceIndex < sentences.length; sentenceIndex++) {
    const sentenceInputCount = sentences[sentenceIndex].inputs.length
    if (globalIndex >= currentIndex && globalIndex < currentIndex + sentenceInputCount) {
      return {
        sentenceIndex,
        wordIndex: globalIndex - currentIndex,
        sentenceInputCount
      }
    }
    currentIndex += sentenceInputCount
  }
  
  return null
}

// 辅助函数：获取当前句子内的所有输入框
const getCurrentSentenceInputs = (globalIndex) => {
  const inputs = Array.from(getAllInputs())
  const position = getInputPosition(globalIndex)
  
  if (!position) return { inputs: [], startIndex: 0 }
  
  let startIndex = 0
  for (let i = 0; i < position.sentenceIndex; i++) {
    startIndex += sentences[i].inputs.length
  }
  
  const endIndex = startIndex + position.sentenceInputCount
  return {
    inputs: inputs.slice(startIndex, endIndex),
    startIndex,
    sentenceInputs: sentences[position.sentenceIndex].inputs
  }
}

// 处理键盘事件
const handleKeydown = (e, sentenceIndex, wordIndex) => {
  if (e.key === 'Enter' || e.key === 'ArrowRight') {
    e.preventDefault()
    const inputs = Array.from(getAllInputs())
    const currentIndex = inputs.indexOf(e.target)
    const nextElement = inputs[currentIndex + 1]
    if (nextElement) {
      nextElement.focus()
    }
  } else if (e.key === ' ') {
    // 空格键逻辑 - 只在当前句子内操作
    e.preventDefault()
    const inputs = Array.from(getAllInputs())
    const currentIndex = inputs.indexOf(e.target)
    const position = getInputPosition(currentIndex)
    
    if (!position) return
    
    const { sentenceIndex, wordIndex, sentenceInputCount } = position
    const { inputs: sentenceInputs, startIndex, sentenceInputs: sentenceData } = getCurrentSentenceInputs(currentIndex)
    
    const nextWordIndex = wordIndex + 1
    
    // 如果下一个输入框不存在于当前句子中，直接聚焦按钮
    if (nextWordIndex >= sentenceInputCount) {
      const nextElement = document.querySelector('.btn')
      if (nextElement) nextElement.focus()
      return
    }

    // 检查当前句子后续输入框是否有内容
    const hasContent = sentenceData.slice(nextWordIndex).some(input => input.trim() !== '')
    
    if (hasContent) {
      // 如果有内容，从最后一个输入框向前移动值，但不再触发宽度重算，保持布局稳定
      for (let i = sentenceInputCount - 1; i > nextWordIndex; i--) {
        sentenceData[i] = sentenceData[i - 1]
      }
      // 清空下一个输入框的值
      sentenceData[nextWordIndex] = ''
    }

    // 聚焦到下一个输入框（当前句子内）
    const nextGlobalIndex = startIndex + nextWordIndex
    if (inputs[nextGlobalIndex]) {
      inputs[nextGlobalIndex].focus()
    }
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault()
    const inputs = Array.from(getAllInputs())
    const currentIndex = inputs.indexOf(e.target)
    const prevElement = inputs[currentIndex - 1]
    if (prevElement) {
      prevElement.focus()
    }
  } else if (e.key === 'Backspace') {
    // Backspace键逻辑 - 只在当前句子内操作
    const currentInput = e.target
    const isValueEmpty = currentInput.value === ''
    const isCursorAtStart = currentInput.selectionStart === 0
    
    const inputs = Array.from(getAllInputs())
    const currentIndex = inputs.indexOf(currentInput)
    const position = getInputPosition(currentIndex)
    
    if (!position) return
    
    const { sentenceIndex, wordIndex, sentenceInputCount } = position
    const { inputs: sentenceInputs, startIndex, sentenceInputs: sentenceData } = getCurrentSentenceInputs(currentIndex)
    
    if (isValueEmpty && isCursorAtStart) {
      // 当输入框为空且光标在开头时
      e.preventDefault()
      // 阻止默认删除行为

      // 检查当前句子后续输入框是否有内容
      const hasNextContent = sentenceData.slice(wordIndex + 1).some(input => input.trim() !== '')

      //若当前句子后续输入框有内容时执行
      if (hasNextContent) {
        // 后续内容整体前移，但不再调整输入框宽度，避免触发布局抖动
        for (let i = wordIndex; i < sentenceInputCount - 1; i++) {
          sentenceData[i] = sentenceData[i + 1]
        }
        // 清空当前句子最后一个输入框
        sentenceData[sentenceInputCount - 1] = ''
        
        // 跳转到当前句子的前一个输入框
        if (wordIndex > 0) {
          const prevGlobalIndex = startIndex + wordIndex - 1
          if (inputs[prevGlobalIndex]) {
            inputs[prevGlobalIndex].focus()
          }
        }
      } else {
        //若当前句子后续输入框没有内容时执行
        if (wordIndex > 0) {
          const prevGlobalIndex = startIndex + wordIndex - 1
          const prevInput = inputs[prevGlobalIndex]
          if (prevInput) {
            prevInput.focus()
            
            // 自动删除上一个输入框的最后一个字符
            setTimeout(() => {
              const currentValue = sentenceData[wordIndex - 1]
              sentenceData[wordIndex - 1] = currentValue.slice(0, -1)
              
              // 等待Vue更新DOM后仅更新光标位置，不再动态调整宽度
              nextTick(() => {
                prevInput.setSelectionRange(prevInput.value.length, prevInput.value.length)
              })
            }, 0)
          }
        }
      }
    } else if (!isValueEmpty && isCursorAtStart) {
      // 当输入框有内容且光标在最前面时，跳转到前一个输入框的末尾
      e.preventDefault()
      
      // 只在当前句子内跳转
      if (wordIndex > 0) {
        const prevGlobalIndex = startIndex + wordIndex - 1
        const prevElement = inputs[prevGlobalIndex]
        
        if (prevElement) {
          prevElement.focus()
          // 将光标定位到前一个输入框的末尾
          setTimeout(() => {
            prevElement.setSelectionRange(prevElement.value.length, prevElement.value.length)
          }, 0)
        }
      }
    }
  } else if (e.key === 'Delete') {
    // Delete键逻辑 - 只在当前句子内操作
    const currentInput = e.target
    const isValueEmpty = currentInput.value === ''
    
    const inputs = Array.from(getAllInputs())
    const currentIndex = inputs.indexOf(currentInput)
    const position = getInputPosition(currentIndex)
    
    if (!position) return
    
    const { sentenceIndex, wordIndex, sentenceInputCount } = position
    const { inputs: sentenceInputs, startIndex, sentenceInputs: sentenceData } = getCurrentSentenceInputs(currentIndex)
    
    if (isValueEmpty) {
      // 当输入框为空时
      e.preventDefault()
      // 阻止默认删除行为

      // 检查当前句子后续输入框是否有内容
      const hasNextContent = sentenceData.slice(wordIndex + 1).some(input => input.trim() !== '')

      //若当前句子后续输入框有内容时执行
      if (hasNextContent) {
        // 后续内容整体前移，删除当前空输入框，但不触发宽度重算
        for (let i = wordIndex; i < sentenceInputCount - 1; i++) {
          sentenceData[i] = sentenceData[i + 1]
        }
        // 清空当前句子最后一个输入框
        sentenceData[sentenceInputCount - 1] = ''
        
        // 保持当前位置的聚焦，并将光标定位到内容最前面
        setTimeout(() => {
          currentInput.focus()
          // 等待Vue更新DOM后仅设置光标位置，不再调整输入框宽度
          nextTick(() => {
            currentInput.setSelectionRange(0, 0)
          })
        }, 0)
      }
      // 如果当前句子后续没有内容，不做任何操作（保持当前空输入框）
    } else {
      // 当输入框不为空时，检查光标是否在内容末尾
      const isCursorAtEnd = currentInput.selectionStart === currentInput.value.length
      
      if (isCursorAtEnd) {
        // 光标在内容末尾时，跳转到下一个输入框的开头（只在当前句子内）
        e.preventDefault()
        const nextWordIndex = wordIndex + 1
        
        if (nextWordIndex < sentenceInputCount) {
          const nextGlobalIndex = startIndex + nextWordIndex
          const nextElement = inputs[nextGlobalIndex]
          
          if (nextElement) {
            nextElement.focus()
            // 将光标定位到下一个输入框内容的最前面
            setTimeout(() => {
              nextElement.setSelectionRange(0, 0)
            }, 0)
          }
        }
      }
      // 如果光标不在末尾，执行默认的字符删除行为
    }
  }
  // 其他键保持默认行为
}

// 检测中文内容是否换行，用于控制题干对齐方式，去除输入框换行检测以提升布局稳定性
const checkIfWrapped = (sentenceIndex) => {
  setTimeout(() => {
    nextTick(() => {
      if (sentenceIndex >= sentences.length) return

      // 检测中文内容是否换行
      const issueElements = document.querySelectorAll('.issue')
      const issueElement = issueElements[sentenceIndex]
      
      if (issueElement) {
        const issueSpan = issueElement.querySelector('span')
        
        if (issueSpan) {
          // 创建一个临时测量元素来测量单行高度
          const tempElement = document.createElement('span')
          const issueStyle = window.getComputedStyle(issueSpan)
          tempElement.style.cssText = `
            position: absolute;
            top: -9999px;
            left: -9999px;
            white-space: nowrap;
            font-size: ${issueStyle.fontSize};
            font-weight: ${issueStyle.fontWeight};
            line-height: ${issueStyle.lineHeight};
            font-family: ${issueStyle.fontFamily};
            visibility: hidden;
          `
          tempElement.textContent = '测试中文换行检测'
          document.body.appendChild(tempElement)
          
          const singleLineHeight = tempElement.getBoundingClientRect().height
          document.body.removeChild(tempElement)
          
          // 获取span元素的实际高度
          const spanRect = issueSpan.getBoundingClientRect()
          
          // 如果实际高度超过单行高度，则认为发生了换行
          const chineseWrapped = spanRect.height > singleLineHeight + 5
          sentences[sentenceIndex].chineseWrapped = chineseWrapped
        }
      }
    })
  }, 50)
}

// 监听窗口大小变化，重新检测换行状态和按钮内容长度
const handleResize = () => {
  setTimeout(() => {
    sentences.forEach((_, index) => {
      checkIfWrapped(index)
    })
    // 重新计算所有按钮内容长度
    preCheckButtonWrapped()
  }, 200)
}

onMounted(() => {
  // 获取数据
  fetchSentences()

  // 添加窗口大小变化监听器
  window.addEventListener('resize', handleResize)
})

// 组件卸载时清理监听器
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.daily-sentence {
  margin: 0;
  padding: 0;
  min-height: 100vh;
  padding-bottom: 40px;
  background: #f8f9fa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #F0F5FF;
}

/* 手机端添加底部间距 */
@media (max-width: 768px) {
  .daily-sentence {
    padding-bottom: 90px;
  }
}

/* 内容样式 */
.content-container {
  padding: 84px 20px 40px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

/* 平板端响应式设计 */
@media (max-width: 1024px) {
  .content-container {
    padding: 74px 15px 40px;
  }
}

/* 手机端响应式设计 */
@media (max-width: 768px) {
  .content-container {
    padding: 64px 15px 40px;
  }
}

/* 小屏手机端响应式设计 */
@media (max-width: 480px) {
  .content-container {
    padding: 58px 10px 30px;
  }
}

.box {
  margin: 20px 0;
}

.question-section {
  margin-bottom: 3rem;
  padding: 2rem;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

/* 手机适配 - 问题区域 */
@media (max-width: 768px) {
  .question-section {
    margin-bottom: 2rem;
    padding: 1.5rem;
  }
}

.question-section.sentence-completed {
  background-color: #f0f7f0;
  border: 1px solid #d4ebd4;
  opacity: 0.7;
}

.question-section.sentence-completed .issue span {
  text-decoration: line-through;
}

/* 管理控制区域样式 */
.management-section {
  margin-top: 2rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  width: 100%;
  box-sizing: border-box;
}

.manage-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.8rem 1.5rem;
  border: 2px solid #007bff;
  background: transparent;
  color: #007bff;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.manage-btn p {
  margin: 0;
  display: flex;
  align-items: center;
}

.manage-btn .el-icon {
  font-size: 20px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.manage-btn:hover {
  background: rgba(0, 123, 255, 0.05);
  transform: translateY(-1px);
}

.add-form {
  margin-top: 1.5rem;
  padding: 1.5rem;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  background: #f8f9fa;
  width: 100%;
  align-self: stretch;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #495057;
}

.required {
  color: #dc3545;
  font-weight: bold;
}

.form-input {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 14px;
  resize: none;
  transition: border-color 0.2s ease;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.form-input.error {
  border-color: #dc3545;
}

.form-input.error:focus {
  border-color: #dc3545;
  box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1);
}

.error-message {
  color: #dc3545;
  font-size: 12px;
  margin-top: 0.25rem;
}

.help-text {
  color: #6c757d;
  font-size: 12px;
  margin-top: 0.25rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
  justify-content: flex-end;
}

.submit-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.8rem 1.5rem;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.submit-btn .el-icon {
  font-size: 20px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.submit-btn:hover:not(:disabled) {
  background: #218838;
  transform: translateY(-1px);
}

.submit-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
  transform: none;
}

.cancel-btn {
  padding: 0.8rem 1.5rem;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.cancel-btn:hover:not(:disabled) {
  background: #545b62;
  transform: translateY(-1px);
}

.cancel-btn:disabled {
  background: #adb5bd;
  cursor: not-allowed;
  transform: none;
}

/* 中文问题样式 */
.issue {
  font-size: 20px;
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #2c3e50;
  font-weight: 500;
  line-height: 1.6;
}

.issue span {
  flex: 1;
  text-align: center;
}

/* 中文换行时左对齐 */
.issue.chinese-wrapped {
  align-items: flex-start;
}

.issue.chinese-wrapped span {
  text-align: left;
}

/* 手机适配 - 句子标题区域 */
@media (max-width: 768px) {
  .issue {
    font-size: 18px;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .issue span {
    text-align: left;
  }
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

/* 手机适配 - 按钮纵向排列 */
@media (max-width: 768px) {
  .action-buttons {
    flex-direction: column;
    gap: 0.3rem;
  }

  .btn-icon {
    margin-left: 35%;
  }

  .complete-btn,
  .delete-btn {
    width: 40px;  /* 手机端稍微小一点 */
    height: 40px;
    border-width: 2px;
  }
  
  .complete-btn .el-icon,
  .delete-btn .el-icon {
    font-size: 20px;
    width: 20px;
    height: 20px;
  }
}

.complete-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;  /* 增加宽度 */
  height: 44px; /* 增加高度 */
  border: 2px solid #28a745;
  background: transparent;
  color: #28a745;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.complete-btn .el-icon {
  font-size: 24px;  /* 增加图标大小 */
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.complete-btn:hover {
  background: rgba(40, 167, 69, 0.05);
  transform: scale(1.05);
}

.complete-btn.completed {
  background: #28a745;
  color: white;
}

.complete-btn.completed:hover {
  background: #218838;
}

.delete-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;  /* 增加宽度 */
  height: 44px; /* 增加高度 */
  border: 2px solid #dc3545;
  background: transparent;
  color: #dc3545;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.delete-btn .el-icon {
  font-size: 24px;  /* 增加图标大小 */
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-btn:hover {
  background: rgba(220, 53, 69, 0.05);
  transform: scale(1.05);
}

/* 输入部分-弹性布局 */
.box-input {
  width: 100%;
  margin: 1.5rem 0;
  display: flex;
  flex-wrap: wrap;
  flex-direction: row;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 8px;
}

/* 单词数较少时整体居中显示输入框，避免内容过少时显得分散 */
.box-input-center {
  justify-content: center;
}

/* 单词数较多时保持左对齐，符合英文阅读习惯 */
.box-input-left {
  justify-content: flex-start;
}

/* 输入框样式 */
.auswer {
  height: 36px;
  border: none;
  border-bottom: 2px solid #a7acb0;
  border-radius: 0;
  padding: 8px 4px 4px;
  /* 固定输入框宽度，避免随内容变化导致整体布局抖动 */
  width: 80px;
  min-width: 80px;
  outline: none;
  text-align: center;
  font-size: 20px;
  background-color: transparent;
  color: #495057;
  /* 仅保留颜色相关过渡，减少不必要的重排 */
  transition: border-bottom-color 0.3s ease, background-color 0.3s ease;
  /* 防止初始加载时的尺寸计算误差 */
  box-sizing: border-box;
}

.auswer:focus {
  border-bottom-color: #007bff;
  background-color: rgba(0, 123, 255, 0.02);
}

/* 手机适配 - 输入框 */
@media (max-width: 768px) {
  .auswer {
    font-size: 18px;
    height: 32px;
    /* 中小屏下略微减小固定宽度，兼顾可见字符数与换行风险 */
    width: 65px;
    min-width: 65px;
  }
}

/* 答案按钮样式 */
.btn {
  color: #007bff;
  background: transparent;
  border: 2px solid #007bff;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  margin: 1.5rem auto 0;
  display: block;
  min-height: auto;
  max-width: 90%;
  word-wrap: break-word;
  overflow-wrap: break-word;
  white-space: normal;
  text-align: center;
}

.btn:hover {
  background: rgba(0, 123, 255, 0.05);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
}

/* 显示答案时的样式 - 默认左对齐（避免内容跳动） */
.btn.show-answer {
  color: #3b3b3b;
  border-color: #3b3b3b;
  background: transparent;
  margin: 1.5rem 0 0 5%;
  text-align: left;
}

.btn.show-answer:hover {
  background: rgba(59, 59, 59, 0.05);
}

/* 按钮内容过短时居中对齐 */
.btn.show-answer.button-wrapped {
  margin: 1.5rem auto 0;
  text-align: center;
}

/* 手机适配 - 答案按钮 */
@media (max-width: 768px) {
  .btn {
    font-size: 14px;
    padding: 10px 20px;
    margin: 1rem auto 0;
    max-width: 95%;
  }
  
  .btn.show-answer {
    margin: 1rem 0 0 0;
  }
  
  .btn.show-answer.button-wrapped {
    margin: 1rem auto 0;
  }
}

/* 小屏手机端响应式设计 */
@media (max-width: 480px) {
  .question-section {
    margin-bottom: 1.5rem;
    padding: 1rem;
  }
  
  .issue {
    font-size: 16px;
    gap: 0.8rem;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 0.2rem;
  }
  
  .complete-btn,
  .delete-btn {
    width: 35px;
    height: 35px;
    border-width: 1px;
  }
  
  .complete-btn .el-icon,
  .delete-btn .el-icon {
    font-size: 18px;
    width: 18px;
    height: 18px;
  }
  
  .management-section {
    margin-top: 1.5rem;
    margin-bottom: 1.5rem;
    padding: 1rem;
  }
  
  .manage-btn {
    padding: 0.6rem 1rem;
    font-size: 14px;
  }
  
  .add-form {
    margin-top: 1rem;
    padding: 1rem;
  }
  
  .form-actions {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .submit-btn,
  .cancel-btn {
    width: 100%;
    padding: 0.8rem;
    font-size: 14px;
  }
  
  .auswer {
    font-size: 16px;
    height: 30px;
    /* 小屏进一步减小固定宽度，保证整体排版紧凑 */
    width: 55px;
    min-width: 55px;
  }
  
  .btn {
    font-size: 13px;
    padding: 8px 16px;
    margin: 0.8rem auto 0;
    max-width: 98%;
  }
  
  .btn.show-answer {
    margin: 0.8rem 0 0 0;
  }
  
  .btn.show-answer.button-wrapped {
    margin: 0.8rem auto 0;
  }
}

/* 触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
  .manage-btn:hover,
  .complete-btn:hover,
  .delete-btn:hover,
  .submit-btn:hover,
  .cancel-btn:hover,
  .btn:hover {
    transform: none;
    box-shadow: none;
  }
  
  .manage-btn:active,
  .complete-btn:active,
  .delete-btn:active,
  .submit-btn:active,
  .cancel-btn:active,
  .btn:active {
    transform: scale(0.95);
  }
}

/* 横屏适配 */
@media (orientation: landscape) and (max-height: 600px) {
  .content-container {
    padding: 50px 15px 30px;
  }
  
  .question-section {
    margin-bottom: 1.5rem;
    padding: 1rem;
  }
  
  .issue {
    font-size: 18px;
    margin-bottom: 1rem;
  }
  
  .box-input {
    margin: 1rem 0;
  }
  
  .btn {
    margin: 1rem auto 0;
  }
  
  .btn.show-answer {
    margin: 1rem 0 0 0;
  }
  
  .btn.show-answer.button-wrapped {
    margin: 1rem auto 0;
  }
  
  .management-section {
    margin-top: 1rem;
    margin-bottom: 1rem;
    padding: 1rem;
  }
}
</style>
