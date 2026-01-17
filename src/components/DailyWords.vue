<template>
  <div class="daily-words-container">
    <!-- 导航栏 -->
    <div class="navigation">
      <div class="logo">
        <span>Daily Learn</span>
      </div>
      <!-- 桌面端显示完整导航列表，手机端通过CSS隐藏 -->
      <ul>
        <li><a href="#" @click="$emit('changePage', 'words')" :class="{ active: props.currentPage === 'words' }">单词学习</a></li>
        <li><a href="#" @click="$emit('changePage', 'sentence')" :class="{ active: props.currentPage === 'sentence' }">句子练习</a></li>
        <li><a href="#" @click="$emit('changePage', 'record')" :class="{ active: props.currentPage === 'record' }">每日一记</a></li>
        <li><a href="#" @click="$emit('changePage', 'browse')" :class="{ active: props.currentPage === 'browse' }">往日迹忆</a></li>
        <li><a href="#" @click="$emit('changePage', 'tasks')" :class="{ active: props.currentPage === 'tasks' }">任务管理</a></li>
        <div class="li-box" :class="props.currentPage"></div>
      </ul>
    </div>

    <!-- 单词学习主内容 -->
    <div class="words-content">
      <!-- 学习内容容器 -->
      <div class="learning-container" v-if="currentWord && !showCompletion">
        <!-- 学习进度 -->
        <div class="progress-info">
          <div class="progress-text">
            完成单词：{{ completedWordsCount }} / {{ totalWordsCount }}
            <button 
              @click="showSettings = true" 
              class="settings-btn-inline"
              title="设置单词数量"
            >
              <el-icon><Setting /></el-icon>
            </button>
          </div>
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ width: totalWordsCount > 0 ? (completedWordsCount / totalWordsCount) * 100 + '%' : '0%' }"
            ></div>
          </div>
        </div>

        <!-- 单词卡片 -->
        <div class="word-card">
        <!-- 级别切换按钮 -->
        <div class="level-switch">
          <button 
            @click="toggleLevel" 
            class="level-toggle-btn"
          >
            <span class="current-level">{{ currentLevel === 'CET4' ? '四' : '六' }}</span>
          </button>
        </div>
        <!-- 单词标题 -->
        <div class="word-header">
          <h1 class="word-title">{{ currentWord.word }}</h1>
          <!-- 正确次数指示器 -->
          <div class="progress-dots">
            <div 
              v-for="i in 3" 
              :key="i"
              class="progress-dot"
              :class="{ active: currentWord.correctCount >= (4 - i) }"
            ></div>
          </div>
        </div>

        <!-- 选择题 -->
        <div class="options-container">
          <div 
            v-for="(option, index) in currentOptions" 
            :key="index"
            class="option-item"
            :class="{ 
              selected: selectedOption === index,
              correct: showAnswer && index === correctAnswer,
              wrong: showAnswer && selectedOption === index && index !== correctAnswer
            }"
            @click="selectOption(index)"
          >
            <div class="option-label">{{ String.fromCharCode(65 + index) }}.</div>
            <div class="option-text">{{ option }}</div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <button 
            class="answer-btn" 
            @click="toggleAnswer"
          >
            {{ showAnswer ? '下一题' : '看答案' }}
          </button>
        </div>

      </div>
      </div>

      <!-- 学习完成界面 -->
      <div class="completion-card" v-if="showCompletion">
        <!-- 级别切换按钮 -->
        <div class="level-switch">
          <button 
            @click="toggleLevel" 
            class="level-toggle-btn"
          >
            <span class="current-level">{{ currentLevel === 'CET4' ? '四' : '六' }}</span>
          </button>
        </div>
        <div class="completion-content">
          <h2>🎉 恭喜完成本轮学习！</h2>
          <div class="completion-stats">
            <div class="stat-item">
              <span>本轮学习单词：{{ totalWordsCount }} 个</span>
            </div>
            <div class="stat-item">
              <span>已掌握单词：{{ completedWordsCount }} 个</span>
              <button 
                @click="showSettings = true" 
                class="settings-btn-inline"
                title="设置单词数量"
              >
                <el-icon><Setting /></el-icon>
              </button>
            </div>
            <div class="stat-item">
              <span>总答题次数：{{ totalAnswered }} 次</span>
            </div>
            <div class="stat-item">
              <span>正确率：{{ Math.round(correctRate * 100) }}%</span>
            </div>
          </div>
          
          <!-- 已完成单词列表 -->
          <div class="completed-words-section" v-if="completedWordsList.length > 0">
            <h3>本轮完成的单词</h3>
            <div class="completed-words-list">
              <div 
                v-for="(completedWord, index) in completedWordsList" 
                :key="index"
                class="completed-word-item"
              >
                <span class="completed-word">{{ completedWord.word }}</span>
                <span class="completed-meaning">{{ completedWord.meaning }}</span>
              </div>
            </div>
          </div>
          
          <button class="restart-btn" @click="startNewRound">开始新一轮学习</button>
        </div>
      </div>
    </div>
    
    <!-- 设置界面 -->
    <div class="settings-modal" v-if="showSettings" @click="showSettings = false">
      <div class="settings-content" @click.stop>
        <div class="settings-header">
          <h3>学习设置</h3>
          <button class="close-btn" @click="showSettings = false">×</button>
        </div>
        
        <div class="settings-body">
          <div class="setting-item">
            <label for="words-count">每组单词数量：</label>
            <select 
              id="words-count" 
              v-model="wordsPerGroup" 
              class="words-count-select"
            >
              <option :value="5">5个</option>
              <option :value="10">10个</option>
              <option :value="15">15个</option>
              <option :value="20">20个</option>
              <option :value="25">25个</option>
              <option :value="30">30个</option>
            </select>
          </div>
          
          <div class="setting-description">
            <p>当前设置：每组学习 <strong>{{ wordsPerGroup }}</strong> 个单词</p>
            <p class="tip">💡 修改后将在下次开始新学习时生效</p>
          </div>
        </div>
        
        <div class="settings-footer">
          <button class="apply-btn" @click="applySettings">应用并重新开始</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { Setting } from '@element-plus/icons-vue'
import CET4Data from '@/data/CET4.json'
import CET6Data from '@/data/CET6.json'
// 引入导航栏样式
import '@/assets/navigation.css'

// 组件props
const props = defineProps({
  currentPage: {
    type: String,
    default: 'words',
    required: true
  }
})

// 组件events
const emit = defineEmits(['changePage'])

// 响应式数据
const currentLevel = ref('CET4')
const currentWords = ref([])
const currentWordIndex = ref(0)
const currentOptions = ref([])
const selectedOption = ref(null)
const showAnswer = ref(false)
const correctAnswer = ref(0)
const showCompletion = ref(false)
const totalCorrect = ref(0)
const totalAnswered = ref(0)
const completedWordsCount = ref(0)
const totalWordsCount = ref(0)
const completedWordsList = ref([])
const wordsPerGroup = ref(10) // 每组单词数量，默认10个
const showSettings = ref(false) // 是否显示设置界面

// 本地存储key
const STORAGE_KEY_PREFIX = 'vue_daily_words_'
const SETTINGS_KEY = 'vue_daily_words_settings'

// 当前单词
const currentWord = computed(() => {
  return currentWords.value[currentWordIndex.value] || null
})

// 已掌握单词
const masteredWords = computed(() => {
  return currentWords.value.filter(word => word.correctCount >= 3)
})

// 正确率
const correctRate = computed(() => {
  return totalAnswered.value > 0 ? totalCorrect.value / totalAnswered.value : 0
})

// 获取本地存储的单词数据
const getStoredWords = (level) => {
  const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${level}`)
  return stored ? JSON.parse(stored) : null
}

// 保存单词数据到本地存储
const saveWordsToStorage = (level, words) => {
  localStorage.setItem(`${STORAGE_KEY_PREFIX}${level}`, JSON.stringify(words))
}

// 获取设置
const getSettings = () => {
  const stored = localStorage.getItem(SETTINGS_KEY)
  return stored ? JSON.parse(stored) : { wordsPerGroup: 10 }
}

// 保存设置
const saveSettings = () => {
  const settings = {
    wordsPerGroup: wordsPerGroup.value
  }
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

// 加载设置
const loadSettings = () => {
  const settings = getSettings()
  wordsPerGroup.value = Number(settings.wordsPerGroup) || 10
}

// 解析单词数据
const parseWordData = (data, level) => {
  const words = []
  const prefix = level === 'CET4' ? 'CET46:CET4_' : 'CET46:CET6_'
  
  // 获取单词总数
  const infoKey = level === 'CET4' ? 'CET46:CET4_info' : 'CET46:CET6_info'
  const totalCount = parseInt(data[infoKey].TEXT[0])
  
  // 获取存储的单词数据
  const storedWords = getStoredWords(level)
  const storedWordMap = new Map()
  
  if (storedWords) {
    storedWords.forEach(word => {
      storedWordMap.set(word.word, word)
    })
  }
  
  // 解析所有单词
  for (let i = 0; i < totalCount; i++) {
    const key = `${prefix}${i}`
    if (data[key]) {
      const wordData = data[key].TEXT
      const word = wordData[0]
      const meanings = wordData.slice(1)
      
      // 检查是否有存储的数据
      const stored = storedWordMap.get(word)
      
      words.push({
        word,
        meanings,
        correctCount: stored ? stored.correctCount : 0,
        totalAttempts: stored ? stored.totalAttempts : 0,
        lastStudied: stored ? stored.lastStudied : null
      })
    }
  }
  
  return words
}



// 按学习优先级排序单词
const sortWordsByPriority = (words) => {
  return words.sort((a, b) => {
    // 优先级：correctCount越小越优先，相同则按lastStudied排序
    if (a.correctCount !== b.correctCount) {
      return a.correctCount - b.correctCount
    }
    
    // 没有学习过的优先
    if (!a.lastStudied && b.lastStudied) return -1
    if (a.lastStudied && !b.lastStudied) return 1
    if (!a.lastStudied && !b.lastStudied) return 0
    
    // 按上次学习时间排序，越早学习的越优先
    return new Date(a.lastStudied) - new Date(b.lastStudied)
  })
}

// 随机选择单词
const selectRandomWords = (words, count = 10) => {
  const sortedWords = sortWordsByPriority(words)
  const priorityWords = sortedWords.filter(word => word.correctCount < 3)
  
  if (priorityWords.length === 0) {
    // 如果所有单词都已掌握，从所有单词中随机选择
    return words.sort(() => 0.5 - Math.random()).slice(0, count)
  }
  
  // 从优先级高的单词中选择
  return priorityWords.slice(0, Math.min(count, priorityWords.length))
}

// 生成选择题选项
const generateOptions = (correctMeaning, allWords) => {
  const options = [correctMeaning]
  const usedMeanings = new Set([correctMeaning])
  
  // 随机选择3个错误选项
  const shuffledWords = [...allWords].sort(() => 0.5 - Math.random())
  
  for (const word of shuffledWords) {
    if (options.length >= 4) break
    
    for (const meaning of word.meanings) {
      if (options.length >= 4) break
      if (!usedMeanings.has(meaning)) {
        options.push(meaning)
        usedMeanings.add(meaning)
      }
    }
  }
  
  // 确保有4个选项
  while (options.length < 4) {
    options.push('暂无释义')
  }
  
  // 随机打乱选项顺序
  const shuffledOptions = [...options].sort(() => 0.5 - Math.random())
  const correctIndex = shuffledOptions.indexOf(correctMeaning)
  
  return { options: shuffledOptions, correctIndex }
}

// 切换级别
const toggleLevel = () => {
  currentLevel.value = currentLevel.value === 'CET4' ? 'CET6' : 'CET4'
  initializeWords()
}

// 初始化单词
const initializeWords = () => {
  const data = currentLevel.value === 'CET4' ? CET4Data : CET6Data
  const allWords = parseWordData(data, currentLevel.value)
  
  // 选择指定数量的单词进行学习
  currentWords.value = selectRandomWords(allWords, Number(wordsPerGroup.value))
  
  currentWordIndex.value = 0
  showCompletion.value = false
  totalCorrect.value = 0
  totalAnswered.value = 0
  completedWordsCount.value = 0
  totalWordsCount.value = currentWords.value.length
  completedWordsList.value = []
  
  if (currentWords.value.length > 0) {
    generateCurrentOptions()
  }
}

// 生成当前单词的选项
const generateCurrentOptions = () => {
  if (!currentWord.value) return
  
  const data = currentLevel.value === 'CET4' ? CET4Data : CET6Data
  const allWords = parseWordData(data, currentLevel.value)
  
  const correctMeaning = currentWord.value.meanings[0]
  const { options, correctIndex } = generateOptions(correctMeaning, allWords)
  
  currentOptions.value = options
  correctAnswer.value = correctIndex
  selectedOption.value = null
  showAnswer.value = false
}

// 选择选项
const selectOption = (index) => {
  if (showAnswer.value) return
  selectedOption.value = index
  
  // 直接显示答案和结果
  showAnswer.value = true
  
  // 记录答题结果
  const isCorrect = selectedOption.value === correctAnswer.value
  totalAnswered.value++
  if (isCorrect) {
    totalCorrect.value++
    currentWord.value.correctCount++
  }
  
  // 更新单词数据
  currentWord.value.totalAttempts++
  currentWord.value.lastStudied = new Date().toISOString()
  
  // 保存到本地存储
  saveCurrentWordData()
  
  // 检查单词是否已完成（答对3次）
  if (isCorrect && currentWord.value.correctCount >= 3) {
    // 单词完成，增加完成计数
    completedWordsCount.value++
    
    // 将完成的单词添加到列表中
    completedWordsList.value.push({
      word: currentWord.value.word,
      meaning: currentWord.value.meanings[0],
      completedAt: new Date().toISOString()
    })
    
    // 注意：不在这里移除单词，等用户点击"下一题"时再移除
  }
}

// 切换答案显示
const toggleAnswer = () => {
  if (!showAnswer.value) {
    // 用户点击"看答案"，没有选择选项，判定为错误
    showAnswer.value = true
    
    // 如果没有选择选项，设置为null表示放弃答题
    if (selectedOption.value === null) {
      // 记录答题结果为错误
      totalAnswered.value++
      // 不增加正确计数
      
      // 更新单词数据
      currentWord.value.totalAttempts++
      currentWord.value.lastStudied = new Date().toISOString()
      
      // 保存到本地存储
      saveCurrentWordData()
    }
    
  } else {
    // 下一题
    // 检查当前单词是否已完成（答对3次），如果是则从列表中移除
    if (currentWord.value && currentWord.value.correctCount >= 3) {
      // 从当前学习列表中移除该单词
      currentWords.value.splice(currentWordIndex.value, 1)
      
      // 移除后检查是否还有单词
      if (currentWords.value.length === 0) {
        // 所有单词都已完成
        showCompletion.value = true
        return
      }
      
      // 调整当前索引，如果移除的是最后一个单词，索引需要回退
      if (currentWordIndex.value >= currentWords.value.length) {
        currentWordIndex.value = 0 // 重新从第一个开始
      }
      
      // 移除单词后直接生成当前单词的选项
      generateCurrentOptions()
    } else {
      // 当前单词未完成，正常跳转到下一个单词
      if (currentWordIndex.value < currentWords.value.length - 1) {
        currentWordIndex.value++
        generateCurrentOptions()
      } else {
        // 当前是最后一个单词，重新开始循环
        currentWordIndex.value = 0
        generateCurrentOptions()
      }
    }
  }
}

// 保存当前单词数据到本地存储
const saveCurrentWordData = () => {
  const data = currentLevel.value === 'CET4' ? CET4Data : CET6Data
  const allWords = parseWordData(data, currentLevel.value)
  
  // 更新对应单词的数据
  const wordToUpdate = allWords.find(w => w.word === currentWord.value.word)
  if (wordToUpdate) {
    Object.assign(wordToUpdate, currentWord.value)
  }
  
  // 保存到本地存储
  saveWordsToStorage(currentLevel.value, allWords)
}

// 开始新一轮学习
const startNewRound = () => {
  completedWordsList.value = []
  initializeWords()
}

// 应用设置并重新开始
const applySettings = () => {
  saveSettings()
  showSettings.value = false
  completedWordsList.value = []
  initializeWords()
}

// 监听单词变化
watch(() => currentWordIndex.value, () => {
  if (currentWord.value) {
    generateCurrentOptions()
  }
})

// 监听当前单词列表变化，检查是否全部完成
watch(() => currentWords.value.length, (newLength) => {
  if (newLength === 0 && totalWordsCount.value > 0) {
    // 所有单词都已完成
    showCompletion.value = true
  }
})

// 组件挂载
onMounted(() => {
  loadSettings() // 先加载设置
  initializeWords()
})
</script>

<style scoped>
/* 基础样式 */
.daily-words-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #F0F5FF 0%, #F0F5FF 100%);
  padding-top: 60px;
  /* padding-bottom: 40px; */
  background-color: #F0F5FF;
}

/* 手机端添加底部间距 */
@media (max-width: 768px) {
  .daily-words-container {
    padding-bottom: 90px;
  }
}

.words-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  width: 100%;
  box-sizing: border-box;
}

/* 级别切换按钮区域 */
.level-switch {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 10;
}

.level-toggle-btn {
  padding: 1px 6px;
  border: 3px solid #3498db;
  background: white;
  color: #3498db;
  border-radius: 8px;
  cursor: pointer;
  font-size: 20px;
  font-weight: 600;
  transition: all 0.3s ease;
  touch-action: manipulation;
  min-width: auto;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.level-toggle-btn:hover {
  background: #3498db;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
}

.level-toggle-btn:active {
  transform: translateY(0);
}

.current-level {
  font-weight: 600;
}

/* 行内设置按钮 */
.settings-btn-inline {
  margin-left: 8px;
  padding: 2px 2px 6px 2px;
  border: none;
  background: transparent;
  color: #7f8c8d;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s ease;
  touch-action: manipulation;
  vertical-align: middle;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.settings-btn-inline:hover {
  background: rgba(127, 140, 141, 0.5);
  color: white;
  transform: translateY(-1px);
}

.settings-btn-inline:active {
  transform: translateY(0);
}

/* 学习内容容器 */
.learning-container {
  display: flex;
  flex-direction: column;
  width: 100%;
}

/* 进度信息 */
.progress-info {
  text-align: center;
  margin-bottom: 10px;
}

.progress-text {
  font-size: 16px;
  color: #666;
  margin-bottom: 10px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin: 0 auto;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3498db, #2ecc71);
  transition: width 0.3s ease;
}

/* 单词卡片 */
.word-card {
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  margin-bottom: 0;
  position: relative;
  min-height: 620px; /* 设置最小高度，避免选项内容换行时卡片跳动 */
  display: flex; /* 使用flex布局 */
  flex-direction: column; /* 垂直方向布局 */
}

.word-header {
  text-align: center;
  margin-bottom: 30px;
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.word-title {
  font-size: clamp(2rem, 5vw, 3rem);
  color: #2c3e50;
  margin-bottom: 0;
  font-weight: 700;
  word-break: break-word;
}

/* 正确次数指示器 */
.progress-dots {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 2px;
}

.progress-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #e0e0e0;
  transition: all 0.3s ease;
  border: 1px solid #d0d0d0;
}

.progress-dot.active {
  background-color: #2ecc71;
  border-color: #27ae60;
  box-shadow: 0 0 8px rgba(46, 204, 113, 0.4);
}





/* 选项容器 */
.options-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 20px; /* 减小底部间距 */
}

.option-item {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  background: #f8f9fa;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 60px;
  touch-action: manipulation;
}

.option-item:hover {
  background: #e3f2fd;
  border-color: #3498db;
}

.option-item.selected {
  background: #e3f2fd;
  border-color: #3498db;
}

.option-item.correct {
  background: #d4edda;
  border-color: #2ecc71;
}

.option-item.wrong {
  background: #f8d7da;
  border-color: #e74c3c;
}

.option-label {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  margin-right: 15px;
  min-width: 25px;
  flex-shrink: 0;
}

.option-text {
  font-size: 16px;
  color: #2c3e50;
  line-height: 1.5;
  flex: 1;
  word-break: break-word;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  justify-content: center;
  margin-top: auto; /* 自动向底部对齐 */
}

.answer-btn {
  padding: 14px 35px;  /* 增加内边距 */
  background: #3498db;
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 18px;  /* 增加字体大小 */
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 140px;  /* 增加最小宽度 */
  touch-action: manipulation;
}

.answer-btn:hover {
  background: #2980b9;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
}

.answer-btn:active {
  transform: translateY(0);
}

.answer-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}



/* 完成界面 */
.completion-card {
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  text-align: center;
  margin-bottom: 10px;
  position: relative;
}

.completion-content h2 {
  font-size: clamp(2rem, 5vw, 2.5rem);
  color: #2c3e50;
  margin-bottom: 30px;
}

.completion-stats {
  margin-bottom: 30px;
}

.completion-stats .stat-item {
  font-size: 18px;
  margin-bottom: 10px;
  color: #2c3e50;
}

/* 已完成单词列表样式 */
.completed-words-section {
  margin-top: 25px;
  margin-bottom: 25px;
  text-align: left;
}

.completed-words-section h3 {
  font-size: 18px;
  color: #2c3e50;
  margin-bottom: 15px;
  text-align: center;
  font-weight: 600;
}

.completed-words-list {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  max-height: 200px;
  overflow-y: auto;
  padding-right: 10px;
  background: #f8f9fa;
  border-radius: 12px;
  padding: 15px;
  border: 1px solid #e9ecef;
}

.completed-word-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
  font-size: 15px;
  color: #555;
}

.completed-word-item:last-child {
  border-bottom: none;
}

.completed-word {
  font-weight: 600;
  color: #3498db;
  flex-shrink: 0;
  margin-right: 15px;
}

.completed-meaning {
  font-style: italic;
  color: #777;
  text-align: right;
  flex: 1;
}

/* 滚动条样式 */
.completed-words-list::-webkit-scrollbar {
  width: 6px;
}

.completed-words-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.completed-words-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.completed-words-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 设置界面样式 */
.settings-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.settings-content {
  background: white;
  border-radius: 16px;
  padding: 0;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  max-width: 400px;
  width: 90vw;
  max-height: 80vh;
  overflow: hidden;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  border-bottom: 1px solid #eee;
  background: #f8f9fa;
}

.settings-header h3 {
  margin: 0;
  font-size: 18px;
  color: #2c3e50;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #7f8c8d;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: #e74c3c;
  color: white;
}

.settings-body {
  padding: 25px;
}

.setting-item {
  margin-bottom: 20px;
}

.setting-item label {
  display: block;
  font-size: 16px;
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 8px;
}

.words-count-select {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 16px;
  background: white;
  cursor: pointer;
  transition: border-color 0.3s ease;
}

.words-count-select:focus {
  outline: none;
  border-color: #3498db;
}

.setting-description {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid #3498db;
}

.setting-description p {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #2c3e50;
}

.setting-description p:last-child {
  margin-bottom: 0;
}

.setting-description .tip {
  color: #7f8c8d;
  font-style: italic;
}

.settings-footer {
  padding: 20px 25px;
  border-top: 1px solid #eee;
  background: #f8f9fa;
  text-align: center;
}

.apply-btn {
  padding: 12px 30px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 160px;
}

.apply-btn:hover {
  background: #2980b9;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
}

.apply-btn:active {
  transform: translateY(0);
}

.restart-btn {
  padding: 16px 45px;  /* 增加内边距 */
  background: #2ecc71;
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 20px;  /* 增加字体大小 */
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 180px;  /* 增加最小宽度 */
  touch-action: manipulation;
}

.restart-btn:hover {
  background: #27ae60;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(46, 204, 113, 0.3);
}

.restart-btn:active {
  transform: translateY(0);
}

/* 平板端响应式设计 */
@media (max-width: 1024px) {
  .daily-words-container {
    padding-top: 70px;
  }
  
  .words-content {
    padding: 15px;
  }
  
  .word-header {
    margin-bottom: 35px;
  }
  
  .word-card {
    padding: 35px 25px;
    margin: 0;
    min-height: 580px; /* 平板端最小高度 */
  }
  
  .completion-card {
    padding: 35px 25px;
  }
  
  .completed-words-section h3 {
    font-size: 17px;
  }
  
  .completed-word-item {
    font-size: 14px;
  }
}

/* 手机端响应式设计 */
@media (max-width: 768px) {
  .daily-words-container {
    padding-top: 60px;
    display: flex;
    flex-direction: column;
    justify-content: flex-start; /* 修改为顶部对齐 */
  }
  
  .words-content {
    padding: 15px;
    display: flex;
    flex-direction: column;
    justify-content: flex-start; /* 修改为顶部对齐 */
    min-height: calc(100vh - 150px); /* 调整高度以适应上下边距 (60+90) */
    padding-top: 4vh; /* 增加顶部间距 */
  }
  
  .level-switch {
    top: 12px;
    right: 12px;
  }
  
  .level-toggle-btn {
    padding: 6px 10px;
    font-size: 13px;
    border-width: 2px;
  }
  
  .settings-btn-inline {
    margin-left: 6px;
    padding: 2px 0 5px 0px;
    font-size: 16px;
  }
  
  .progress-info {
    margin-bottom: 30px;
  }
  
  .progress-text {
    font-size: 14px;
  }
  
  .learning-container {
    margin: auto 0;
  }
  
  .word-card {
    padding: 30px 20px;
    margin: 0;
    min-height: 550px; /* 手机端最小高度 */
  }
  
  .word-header {
    margin-bottom: 40px;
    gap: 15px;
  }
  
  .progress-dots {
    gap: 4px;
    margin-top: 2px;
  }
  
  .progress-dot {
    width: 5px;
    height: 5px;
  }
  

  
  .options-container {
    gap: 12px;
    margin-bottom: 25px;
  }
  
  .option-item {
    padding: 12px 15px;
    min-height: 50px;
  }
  
  .option-label {
    font-size: 16px;
    margin-right: 12px;
  }
  
  .option-text {
    font-size: 14px;
  }
  
  .answer-btn {
    padding: 12px 30px;
    font-size: 16px;
    min-width: 120px;
  }
  
  .completion-card {
    padding: 30px 20px;
    margin: auto 0;
  }
  
  .completion-stats .stat-item {
    font-size: 16px;
  }
  
  .restart-btn {
    padding: 14px 35px;
    font-size: 18px;
    min-width: 160px;
  }
  
  .completed-words-section {
    margin-top: 20px;
    margin-bottom: 20px;
  }
  
  .completed-words-section h3 {
    font-size: 16px;
    margin-bottom: 12px;
  }
  
  .completed-words-list {
    max-height: 150px;
    padding: 12px;
  }
  
  .completed-word-item {
    font-size: 13px;
    padding: 6px 0;
  }
  
  .completed-word {
    margin-right: 10px;
  }
}

/* 小屏手机端响应式设计 */
@media (max-width: 480px) {
  .daily-words-container {
    padding-top: 55px;
    display: flex;
    flex-direction: column;
    justify-content: flex-start; /* 修改为顶部对齐 */
  }
  
  .words-content {
    padding: 10px;
    display: flex;
    flex-direction: column;
    justify-content: flex-start; /* 修改为顶部对齐 */
    min-height: calc(100vh - 145px); /* 调整高度 (55+90) */
    padding-top: 3vh; /* 增加顶部间距 */
  }
  
  .level-switch {
    top: 8px;
    right: 8px;
  }
  
  .level-toggle-btn {
    padding: 5px 8px;
    font-size: 12px;
    border-width: 1px;
  }
  
  .settings-btn-inline {
    margin-left: 5px;
    padding: 1px 0 4px 0;
    font-size: 14px;
  }
  
  .progress-info {
    margin-bottom: 25px;
  }
  
  .progress-text {
    font-size: 13px;
  }
  
  .learning-container {
    margin: auto 0;
  }
  
  .word-card {
    padding: 25px 15px;
    margin: 0;
    min-height: 520px; /* 小屏手机端最小高度 */
  }
  
  .word-header {
    margin-bottom: 50px;
    gap: 12px;
  }
  
  .progress-dots {
    gap: 3px;
    margin-top: 2px;
  }
  
  .progress-dot {
    width: 4px;
    height: 4px;
  }
  

  
  .options-container {
    gap: 10px;
    margin-bottom: 20px;
  }
  
  .option-item {
    padding: 10px 12px;
    min-height: 45px;
  }
  
  .option-label {
    font-size: 15px;
    margin-right: 10px;
  }
  
  .option-text {
    font-size: 13px;
  }
  
  .answer-btn {
    padding: 8px 20px;
    font-size: 13px;
    min-width: 90px;
  }
  
  .completion-card {
    padding: 25px 15px;
    margin: auto 0;
  }
  
  .completion-stats .stat-item {
    font-size: 14px;
  }
  
  .restart-btn {
    padding: 10px 25px;
    font-size: 14px;
    min-width: 120px;
  }
  
  .completed-words-section {
    margin-top: 15px;
    margin-bottom: 15px;
  }
  
  .completed-words-section h3 {
    font-size: 15px;
    margin-bottom: 10px;
  }
  
  .completed-words-list {
    max-height: 120px;
    padding: 10px;
  }
  
  .completed-word-item {
    font-size: 12px;
    padding: 5px 0;
  }
  
  .completed-word {
    margin-right: 8px;
  }
}

/* 超小屏设备处理 */
@media (max-width: 360px) {
  .daily-words-container {
    display: flex;
    flex-direction: column;
    justify-content: flex-start; /* 修改为顶部对齐 */
  }
  
  .words-content {
    display: flex;
    flex-direction: column;
    justify-content: flex-start; /* 修改为顶部对齐 */
    min-height: calc(100vh - 145px); /* 继承 480px 的边距 */
    padding-top: 2vh; /* 增加顶部间距 */
  }
  
  .learning-container {
    margin: auto 0;
  }
  
  .word-header {
    gap: 10px;
    margin-bottom: 60px;
  }
  
  .word-title {
    font-size: clamp(1.5rem, 8vw, 2rem);
  }
  
  .progress-dots {
    gap: 2px;
    margin-top: 2px;
  }
  
  .progress-dot {
    width: 3px;
    height: 3px;
  }
  
  .completed-words-section h3 {
    font-size: 14px;
  }
  
  .completed-word-item {
    font-size: 11px;
    flex-direction: column;
    align-items: flex-start;
    padding: 4px 0;
  }
  
  .completed-word {
    margin-bottom: 2px;
    margin-right: 0;
  }
  
  .completed-meaning {
    text-align: left;
  }
}

/* 设置界面响应式设计 */
@media (max-width: 768px) {
  .settings-content {
    width: 95vw;
    max-width: none;
  }
  
  .settings-header {
    padding: 15px 20px;
  }
  
  .settings-header h3 {
    font-size: 16px;
  }
  
  .settings-body {
    padding: 20px;
  }
  
  .setting-item label {
    font-size: 15px;
  }
  
  .words-count-select {
    font-size: 15px;
    padding: 8px 10px;
  }
  
  .setting-description p {
    font-size: 13px;
  }
  
  .settings-footer {
    padding: 15px 20px;
  }
  
  .apply-btn {
    padding: 10px 25px;
    font-size: 15px;
    min-width: 140px;
  }
}

/* 触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
  .level-toggle-btn:hover,
  .settings-btn-inline:hover,
  .option-item:hover,
  .answer-btn:hover,
  .restart-btn:hover,
  .apply-btn:hover {
    transform: none;
    box-shadow: none;
  }
  
  .level-toggle-btn:active,
  .settings-btn-inline:active,
  .option-item:active,
  .answer-btn:active,
  .restart-btn:active,
  .apply-btn:active {
    transform: scale(0.98);
  }
}

/* 横屏适配 */
@media (orientation: landscape) and (max-height: 600px) {
  .daily-words-container {
    padding-top: 50px;
  }
  
  .word-card {
    padding: 20px;
  }
  
  .word-header {
    margin-bottom: 10px;
  }
  
  .options-container {
    margin-bottom: 20px;
  }
  
  .completion-card {
    padding: 20px;
  }
}
</style>
