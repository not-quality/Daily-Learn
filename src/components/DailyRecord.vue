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
    <div class="calendar-view">
      

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

      <!-- 为移动端增加触摸滑动支持的日历包裹容器 -->
      <div class="calendar-wrapper" ref="calendarWrapperRef">
        <div
          class="calendar-container"
          :style="calendarGridStyle"
          @touchstart="handleCalendarTouchStart"
          @touchmove="handleCalendarTouchMove"
          @touchend="handleCalendarTouchEnd"
          @touchcancel="handleCalendarTouchEnd"
        >
          <!-- 上个月日历 -->
          <div class="calendar-grid">
            <!-- 星期标题 -->
            <div class="weekdays">
              <div v-for="day in weekdays" :key="day" class="weekday">{{ day }}</div>
            </div>

            <!-- 日期网格 -->
            <div class="dates-grid">
              <!-- 上上个月的日期（灰色显示） -->
              <div
                v-for="date in prevCalendar.previousMonthDates"
                :key="`prevprev-${date}`"
                class="date-cell prev-month"
              >
                <span class="date-number">{{ date }}</span>
              </div>

              <!-- 上个月的日期 -->
              <div
                v-for="date in prevCalendar.currentMonthDates"
                :key="`prev-${date}`"
                class="date-cell current-month"
                :class="{
                  'disabled': true
                }"
              >
                <span class="date-number">{{ date }}</span>
                <!-- 上个月的emoji -->
                <div class="calendar-mood" v-if="getMoodForDateInMonth(date, prevCalendar.date)">
                  {{ getMoodForDateInMonth(date, prevCalendar.date) }}
                </div>
              </div>

              <!-- 本月开头的日期（灰色显示） -->
              <div
                v-for="date in prevCalendar.nextMonthDates"
                :key="`prevnext-${date}`"
                class="date-cell next-month"
              >
                <span class="date-number">{{ date }}</span>
              </div>
            </div>
          </div>

          <!-- 当前月日历 -->
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
                <!-- 当该日期存在日记内容时为日期数字添加高亮颜色提示 -->
                <span
                  class="date-number"
                  :class="{ 'date-number-has-content': hasContentForDate(date) }"
                >
                  {{ date }}
                </span>
                <!-- 在日历单元格中的emoji -->
                <div class="calendar-mood" v-if="getMoodForDate(date)">
                  {{ getMoodForDate(date) }}
                </div>
                <!-- 当该日期已有内容但未选择心情时，在日历单元格中显示问号提示 -->
                <div
                  class="calendar-mood calendar-mood-question"
                  v-else-if="hasContentWithoutMood(date)"
                  title="该日记未选择心情"
                >
                  ?
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

          <!-- 下个月日历 -->
          <div class="calendar-grid">
            <!-- 星期标题 -->
            <div class="weekdays">
              <div v-for="day in weekdays" :key="day" class="weekday">{{ day }}</div>
            </div>

            <!-- 日期网格 -->
            <div class="dates-grid">
              <!-- 本月末尾的日期（灰色显示） -->
              <div
                v-for="date in nextCalendar.previousMonthDates"
                :key="`nextprev-${date}`"
                class="date-cell prev-month"
              >
                <span class="date-number">{{ date }}</span>
              </div>

              <!-- 下个月的日期 -->
              <div
                v-for="date in nextCalendar.currentMonthDates"
                :key="`next-${date}`"
                class="date-cell current-month"
                :class="{
                  'disabled': true
                }"
              >
                <span class="date-number">{{ date }}</span>
                <!-- 下个月的emoji -->
                <div class="calendar-mood" v-if="getMoodForDateInMonth(date, nextCalendar.date)">
                  {{ getMoodForDateInMonth(date, nextCalendar.date) }}
                </div>
              </div>

              <!-- 下下个月的日期（灰色显示） -->
              <div
                v-for="date in nextCalendar.nextMonthDates"
                :key="`nextnext-${date}`"
                class="date-cell next-month"
              >
                <span class="date-number">{{ date }}</span>
              </div>
            </div>
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



    <!-- 手机端底部导航栏 - 在日记页面时隐藏 -->
    <div v-if="isMobile && shouldShowNavigation" class="mobile-bottom-nav bottom-navigation">
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
// 引入 Vue 核心方法：用于定义响应式状态、计算属性和生命周期
import { ref, computed, onMounted, onUnmounted, watch, markRaw, nextTick } from 'vue'
// 引入 dayjs 用于日期处理
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import {
  // 顶部与列表中的通用图标
  Grid, ArrowLeftBold, ArrowRightBold,
  // 底部导航图标
  ChatDotRound, Notebook, Collection, List, Document
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
const emit = defineEmits(['changePage', 'recordEdited', 'openDiaryEntry'])

// 移动端检测
const isMobile = ref(false)

// 控制导航栏显示 - 在日记页面时隐藏导航栏
const shouldShowNavigation = computed(() => {
  // 在日记页面时完全隐藏导航栏（无论是日历视图还是编辑器视图）
  return false
})

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
const currentDate = ref(dayjs())
const selectedDate = ref(dayjs())

// 获取心情的权重（用于排序）
const getMoodWeight = (mood) => {
  const moodOptions = ['😟', '😞', '😐', '😊', '😆']
  return moodOptions.indexOf(mood)
}

// 星期标题
const weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

// 日记数据存储
const records = ref({})

// 移动端日历滑动切换月份相关的状态，控制位移和动画效果
const calendarGridTranslateX = ref(0)
const calendarGridTransition = ref('')
const isCalendarSwiping = ref(false)
const calendarSwipeStartX = ref(0)
const calendarSwipeCurrentX = ref(0)
const isCalendarAnimating = ref(false)
// 常量：滑动触发阈值比例（占当前屏幕宽度的 20%），用于替代固定像素阈值，使在不同设备上滑动手感更一致
const CALENDAR_SWIPE_THRESHOLD = 0.2
const CALENDAR_SWIPE_DURATION = 300
// 记录触摸开始时的 Y 坐标，用于区分横向滑动与纵向滚动
const calendarSwipeStartY = ref(0)
// 记录触摸移动过程中的 Y 坐标，用于判断滑动方向
const calendarSwipeCurrentY = ref(0)
// 标记当前一次触摸手势是否已经锁定了滑动方向，避免在横向与纵向之间来回抖动
const isCalendarSwipeDirectionLocked = ref(false)
// 标记本次触摸是否被判定为横向滑动，便于在结束阶段做统一处理
const isCalendarHorizontalSwipe = ref(false)
// 记录上一次完成有效月份切换的时间，用于防止在短时间内连续快速滑动导致多次切换
const lastCalendarSwipeTime = ref(0)
// 常量：月份切换防抖时间，单位毫秒，避免连续误触
const CALENDAR_SWIPE_DEBOUNCE = 300
// 响应式的gap值，根据屏幕大小自动调整
const calendarGap = ref(20)
// 引用calendar-wrapper元素，用于获取实际宽度
const calendarWrapperRef = ref(null)

// 计算日历网格的内联样式，用于控制滑动位移与过渡动画
const calendarGridStyle = computed(() => {
  // 计算基础位移：一个日历的宽度(wrapper的100%) + 两个margin(各20px)
  // 由于使用了百分比宽度,需要结合wrapper的实际宽度计算
  const gap = calendarGap.value
  const offset = calendarGridTranslateX.value

  // 基础位移 = -100% - 2*gap (显示中间的日历)
  // -100% 表示一个日历的宽度,-2*gap是左margin+右margin
  return {
    transform: `translateX(calc(-33.333% - ${2 * gap}px + ${offset}px))`,
    transition: calendarGridTransition.value
  }
})


// 计算属性
const currentMonthText = computed(() => {
  return currentDate.value.format('M月 YYYY')
})

// 计算指定日期所在月份的完整日历数据的辅助函数
const getMonthCalendarData = (date) => {
  const targetDate = dayjs(date)
  const daysInMonth = targetDate.daysInMonth()

  // 当月的所有日期
  const currentMonthDates = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  // 上个月末尾需要显示的日期
  const startOfMonth = targetDate.startOf('month')
  const dayOfWeek = startOfMonth.day()
  const adjustedDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek
  const prevDaysToShow = adjustedDayOfWeek - 1

  const prevMonth = targetDate.subtract(1, 'month')
  const daysInPrevMonth = prevMonth.daysInMonth()
  const previousMonthDates = prevDaysToShow === 0 ? [] : Array.from(
    { length: prevDaysToShow },
    (_, i) => daysInPrevMonth - prevDaysToShow + i + 1
  )

  // 下个月开头需要显示的日期
  const endOfMonth = targetDate.endOf('month')
  const endDayOfWeek = endOfMonth.day()
  const adjustedEndDayOfWeek = endDayOfWeek === 0 ? 7 : endDayOfWeek
  let nextDaysToShow = 7 - adjustedEndDayOfWeek
  if (nextDaysToShow === 7) nextDaysToShow = 0

  // 计算当前总天数
  const totalDays = prevDaysToShow + daysInMonth + nextDaysToShow

  // 如果总天数小于42（6行），需要继续添加下个月的日期
  const CALENDAR_ROWS = 6
  const CALENDAR_TOTAL_CELLS = CALENDAR_ROWS * 7 // 42

  if (totalDays < CALENDAR_TOTAL_CELLS) {
    nextDaysToShow += (CALENDAR_TOTAL_CELLS - totalDays)
  }

  const nextMonthDates = nextDaysToShow === 0 ? [] : Array.from({ length: nextDaysToShow }, (_, i) => i + 1)

  return {
    date: targetDate,
    previousMonthDates,
    currentMonthDates,
    nextMonthDates
  }
}

// 三个日历的数据:上个月、当前月、下个月
const prevCalendar = computed(() => {
  return getMonthCalendarData(currentDate.value.subtract(1, 'month'))
})

const currentCalendar = computed(() => {
  return getMonthCalendarData(currentDate.value)
})

const nextCalendar = computed(() => {
  return getMonthCalendarData(currentDate.value.add(1, 'month'))
})

// 保持原有的计算属性以兼容其他代码
const currentMonthDates = computed(() => {
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
  let daysToShow = 7 - adjustedDayOfWeek
  if (daysToShow === 7) daysToShow = 0

  // 计算当前总天数
  const daysInMonth = currentDate.value.daysInMonth()
  const startOfMonth = currentDate.value.startOf('month')
  const startDayOfWeek = startOfMonth.day()
  const adjustedStartDayOfWeek = startDayOfWeek === 0 ? 7 : startDayOfWeek
  const prevDaysToShow = adjustedStartDayOfWeek - 1

  const totalDays = prevDaysToShow + daysInMonth + daysToShow

  // 如果总天数小于42（6行），需要继续添加下个月的日期
  const CALENDAR_TOTAL_CELLS = 42
  if (totalDays < CALENDAR_TOTAL_CELLS) {
    daysToShow += (CALENDAR_TOTAL_CELLS - totalDays)
  }

  if (daysToShow === 0) return []

  return Array.from({ length: daysToShow }, (_, i) => i + 1)
})

// 处理日历区域触摸开始事件，记录起始位置并重置动画状态
const handleCalendarTouchStart = (event) => {
  if (!isMobile.value || isCalendarAnimating.value) {
    return
  }
  const touch = event.touches && event.touches[0]
  if (!touch) return
  // 标记进入滑动状态，并记录本次触摸起点坐标
  isCalendarSwiping.value = true
  calendarSwipeStartX.value = touch.clientX
  calendarSwipeCurrentX.value = touch.clientX
  calendarSwipeStartY.value = touch.clientY
  calendarSwipeCurrentY.value = touch.clientY
  // 每次新的手势开始时重置方向锁定状态
  isCalendarSwipeDirectionLocked.value = false
  isCalendarHorizontalSwipe.value = false
  // 手势开始阶段取消过渡，使日历盒子紧跟手指移动
  calendarGridTransition.value = ''
}

// 处理日历区域触摸移动事件，根据滑动距离实时更新网格位移，实现跟随手指的滑动效果
const handleCalendarTouchMove = (event) => {
  if (!isMobile.value || !isCalendarSwiping.value || isCalendarAnimating.value) {
    return
  }
  const touch = event.touches && event.touches[0]
  if (!touch) return
  // 更新当前触摸位置，用于后续计算位移与方向
  calendarSwipeCurrentX.value = touch.clientX
  calendarSwipeCurrentY.value = touch.clientY

  // 若尚未锁定滑动方向，则依据 X/Y 位移大小判定当前手势类型
  if (!isCalendarSwipeDirectionLocked.value) {
    const diffX = calendarSwipeCurrentX.value - calendarSwipeStartX.value
    const diffY = calendarSwipeCurrentY.value - calendarSwipeStartY.value

    // 增加一个最小移动距离，避免轻微抖动就锁定方向
    const MIN_DETECT_DISTANCE = 10

    // 横向位移明显大于纵向位移且超过最小检测阈值时，判定为横向滑动
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > MIN_DETECT_DISTANCE) {
      isCalendarSwipeDirectionLocked.value = true
      isCalendarHorizontalSwipe.value = true
    } else if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > MIN_DETECT_DISTANCE) {
      // 纵向位移占优时，判定为纵向滚动，立即结束日历滑动，让页面保持正常滚动
      isCalendarSwipeDirectionLocked.value = true
      isCalendarHorizontalSwipe.value = false
      isCalendarSwiping.value = false
      return
    }
  }

  // 只有在当前手势被识别为横向滑动时才跟随手指移动日历，防止与页面滚动冲突
  if (!isCalendarHorizontalSwipe.value) {
    return
  }

  // 阻止默认滚动行为，避免横向滑动时页面垂直滚动
  event.preventDefault()

  const deltaX = calendarSwipeCurrentX.value - calendarSwipeStartX.value
  calendarGridTranslateX.value = deltaX
}

// 处理日历区域触摸结束与取消事件，根据滑动距离和方向决定是否切换月份，并添加防抖控制
const handleCalendarTouchEnd = () => {
  if (!isCalendarSwiping.value) return
  isCalendarSwiping.value = false

  const deltaX = calendarSwipeCurrentX.value - calendarSwipeStartX.value

  // 获取wrapper的实际宽度，用于准确计算滑动距离
  // 使用wrapper的实际宽度而不是window.innerWidth，因为calendar-view有max-width限制
  const wrapperWidth = calendarWrapperRef.value?.offsetWidth || window.innerWidth || 375
  const gap = calendarGap.value

  // 计算基于wrapper实际宽度的动态滑动阈值
  const dynamicThreshold = wrapperWidth * CALENDAR_SWIPE_THRESHOLD

  // 未达到阈值时仅平滑回到原位，不触发月份切换，避免误操作
  if (Math.abs(deltaX) < dynamicThreshold || !isMobile.value || !isCalendarHorizontalSwipe.value) {
    calendarGridTransition.value = 'transform 0.2s ease'
    calendarGridTranslateX.value = 0
    setTimeout(() => {
      calendarGridTransition.value = ''
    }, 200)
    return
  }

  // 防抖控制：若距离上次有效切换时间过短，则忽略当前滑动，防止连续快速切换
  const now = Date.now()
  if (now - lastCalendarSwipeTime.value < CALENDAR_SWIPE_DEBOUNCE) {
    calendarGridTransition.value = 'transform 0.2s ease'
    calendarGridTranslateX.value = 0
    setTimeout(() => {
      calendarGridTransition.value = ''
    }, 200)
    return
  }

  // 防抖控制：滑动切换动画未结束前不再次触发月份切换
  if (isCalendarAnimating.value) return
  isCalendarAnimating.value = true

  // 计算目标位移：一个日历单元的宽度 = wrapper实际宽度 + 2*gap
  // 移动端gap为0（无margin），桌面端有gap需要额外偏移
  const additionalOffset = gap > 0 ? 20 : 0
  const targetOffset = deltaX < 0
    ? -(wrapperWidth + 2 * gap - additionalOffset)  // 左滑：向左滑动到下一月
    : (wrapperWidth + 2 * gap - additionalOffset)   // 右滑：向右滑动到上一月

  // 应用过渡动画，让日历滑动到目标位置
  calendarGridTransition.value = `transform ${CALENDAR_SWIPE_DURATION}ms ease`
  calendarGridTranslateX.value = targetOffset

  // 等待动画完成后切换月份数据并重置位移
  setTimeout(() => {
    // 根据滑动方向切换月份：左滑切换到下一月，右滑切换到上一月
    if (deltaX < 0) {
      currentDate.value = currentDate.value.add(1, 'month')
    } else {
      currentDate.value = currentDate.value.subtract(1, 'month')
    }

    // 等待 Vue 完成 DOM 更新后再重置位移和过渡
    // 此时新日历已渲染，重置位移到默认居中位置（offset=0）不会有跳动
    nextTick(() => {
      // 关闭过渡动画并重置位移到初始位置，准备下一次滑动
      calendarGridTransition.value = ''
      calendarGridTranslateX.value = 0
      isCalendarAnimating.value = false

      // 记录本次完成切换的时间戳，用于后续滑动防抖判断
      lastCalendarSwipeTime.value = now
    })
  }, CALENDAR_SWIPE_DURATION)
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

// 方法
const previousMonth = () => {
  // 如果正在动画中,忽略点击
  if (isCalendarAnimating.value) return

  // 改变月份,触发日历数据更新
  currentDate.value = currentDate.value.subtract(1, 'month')

  // 重置位移
  calendarGridTranslateX.value = 0
}

const nextMonth = () => {
  // 如果正在动画中,忽略点击
  if (isCalendarAnimating.value) return

  // 改变月份,触发日历数据更新
  currentDate.value = currentDate.value.add(1, 'month')

  // 重置位移
  calendarGridTranslateX.value = 0
}

const selectDate = (date) => {
  const fullDate = currentDate.value.date(date)
  selectedDate.value = fullDate

  // 获取或创建该日期的记录
  const dateKey = fullDate.format('YYYY-MM-DD')
  let recordData = records.value[dateKey]
  if (!recordData) {
    recordData = {
      id: dateKey,
      date: fullDate.toISOString(),
      mood: '',
      content: '',
      images: []
    }
  }

  // 跳转到DiaryEntry组件
  emit('openDiaryEntry', {
    recordData: recordData,
    selectedDate: fullDate,
    sourceView: 'record'
  })
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

// 获取指定日期对应的心情表情，用于在日历单元格中展示emoji
const getMoodForDate = (date) => {
  const dateKey = currentDate.value.date(date).format('YYYY-MM-DD')
  return records.value[dateKey]?.mood || ''
}

// 获取指定月份中某个日期的心情
const getMoodForDateInMonth = (date, monthDate) => {
  const dateKey = dayjs(monthDate).date(date).format('YYYY-MM-DD')
  return records.value[dateKey]?.mood || ''
}

// 检测某个日期是否存在非空日记内容，用于在日历中高亮日期数字
const hasContentForDate = (date) => {
  const dateKey = currentDate.value.date(date).format('YYYY-MM-DD')
  const record = records.value[dateKey]
  // 仅在存在记录且内容非空时返回true，避免无效高亮
  return !!(record && record.content && record.content.trim())
}

// 检测某个日期是否存在内容但未选择心情，用于在日历上显示问号提示
const hasContentWithoutMood = (date) => {
  const dateKey = currentDate.value.date(date).format('YYYY-MM-DD')
  const record = records.value[dateKey]
  // 仅在存在记录、内容非空且心情为空时返回true，避免误提示
  return !!(record && record.content && record.content.trim() && !record.mood)
}

const formatRecordDate = (dateString) => {
  return dayjs(dateString).format('YYYY年M月D日')
}



const createNewRecord = () => {
  const today = dayjs()
  selectedDate.value = today

  const dateKey = today.format('YYYY-MM-DD')
  let recordData = records.value[dateKey]
  if (!recordData) {
    recordData = {
      id: dateKey,
      date: today.toISOString(),
      mood: '',
      content: '',
      images: []
    }
  }

  // 跳转到DiaryEntry组件
  emit('openDiaryEntry', {
    recordData: recordData,
    selectedDate: today,
    sourceView: 'record'
  })
}











const viewRecord = (record) => {
  const recordDate = dayjs(record.date)
  selectedDate.value = recordDate

  // 跳转到DiaryEntry组件
  emit('openDiaryEntry', {
    recordData: record,
    selectedDate: recordDate,
    sourceView: 'record'
  })
}



// 监听编辑记录的变化
watch(() => props.editingRecord, (newRecord) => {
  if (newRecord) {
    // 设置选中的日期
    const recordDate = dayjs(newRecord.date)
    selectedDate.value = recordDate

    // 跳转到DiaryEntry组件
    emit('openDiaryEntry', {
      recordData: newRecord,
      selectedDate: recordDate,
      sourceView: 'browse'
    })

    // 通知父组件记录已被处理
    emit('recordEdited')
  }
}, { immediate: true })

// 生命周期
onMounted(() => {
  // 移动端检测和gap值更新
  const updateIsMobile = () => {
    isMobile.value = window.innerWidth <= 768
    // 根据屏幕宽度更新gap值，移动端为0（因为已移除margin）
    calendarGap.value = window.innerWidth <= 768 ? 0 : 20
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



  // 清理事件监听器
  return () => {
    window.removeEventListener('resize', updateIsMobile)
  }
})

// 组件卸载时清理事件监听器
onUnmounted(() => {
  // 移除所有事件监听器
  window.removeEventListener('resize', () => {})
  window.removeEventListener('popstate', () => {})
  document.removeEventListener('backbutton', () => {}, false)
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
  margin-bottom: 20px; /* 增加间距 */
  padding: 0 10px;
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

/* 日历包裹容器,作为视口,只显示一个日历的宽度 */
.calendar-wrapper {
  overflow: hidden;
  width: 100%;
  margin-bottom: 20px;
}

/* 日历容器,包含三个日历,横向排列 */
.calendar-container {
  display: flex;
  width: 300%; /* 三个日历的总宽度 */
  margin-left: 0;
  /* transform 和 transition 由 JS 动态控制 */
  /* 提前声明 transform 参与合成,优化移动端滑动动画性能 */
  will-change: transform;
}

.calendar-grid {
  /* 每个日历占container的三分之一,即wrapper的100% */
  flex: 0 0 33.333%;
  width: 33.333%;
  background: white;
  border-radius: 20px;
  padding: 24px;
  margin: 0 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.025);
  overflow: hidden;
  box-sizing: border-box;
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

/* 有日记内容的日期数字高亮显示为蓝色，用于快速标识已记录日期 */
.date-number-has-content {
  color: #007AFF;
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
  min-height: 240px; /* 改为最小高度 */
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
  margin: 10px 0;
}

.mood-selector {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin: 10px 0;
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
  margin: 16px;
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

  /* 移动端wrapper不再需要padding，让日历宽度与往日重现盒子一致 */
  /* .calendar-wrapper {
    padding: 0 10px;
  } */

  /* 移动端container不再需要margin偏移 */
  /* .calendar-container {
    margin-left: -10px;
  } */

  /* 移动端移除日历margin，让日历宽度等于wrapper宽度，与往日重现盒子对齐 */
  .calendar-grid {
    margin: 0;
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
    min-height: 180px;
    padding: 15px;
  }

  .image-preview {
    width: 80px;
    height: 80px;
  }

  .image-preview-full {
    height: 160px;
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
    margin: 10px 0;
  }

  .mood-selector {
    gap: 20px;
    margin: 10px 0;
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

/* 日历中问号提示样式，与emoji位置保持一致，并通过透明度弱化提示强度 */
.calendar-mood-question {
  color: #999;
  font-weight: 600;
  opacity: 0;
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
