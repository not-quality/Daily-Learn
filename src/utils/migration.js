/**
 * 数据迁移服务
 * 将 localStorage 数据迁移到 IndexedDB
 */

import { initDB } from './storage/index.js'
import { saveAllSentences } from './storage/sentences.js'
import { saveAllWords } from './storage/words.js'
import { saveAllTasks } from './storage/tasks.js'
import { saveAllDiaryRecords, saveAllTemplates } from './storage/diary.js'
import { saveWordsSettings, saveBrowseSettings } from './storage/settings.js'

const MIGRATION_FLAG = 'idb_migration_completed'

/**
 * 检查是否需要迁移
 * @returns {boolean}
 */
export const needsMigration = () => {
  return localStorage.getItem(MIGRATION_FLAG) !== 'true'
}

/**
 * 标记迁移完成
 */
const markMigrationComplete = () => {
  localStorage.setItem(MIGRATION_FLAG, 'true')
}

/**
 * 安全解析 JSON
 * @param {string} jsonString - JSON 字符串
 * @param {any} defaultValue - 默认值
 * @returns {any}
 */
const safeParseJSON = (jsonString, defaultValue = null) => {
  if (!jsonString) return defaultValue
  try {
    return JSON.parse(jsonString)
  } catch (error) {
    console.error('JSON 解析失败:', error)
    return defaultValue
  }
}

/**
 * 迁移句子数据
 */
const migrateSentences = async () => {
  const data = safeParseJSON(localStorage.getItem('vue_daily_sentences'), [])
  if (data && data.length > 0) {
    await saveAllSentences(data)
    console.log(`迁移句子数据: ${data.length} 条`)
  }
}

/**
 * 迁移单词数据
 */
const migrateWords = async () => {
  // 迁移 CET4 单词
  const cet4Data = safeParseJSON(localStorage.getItem('vue_daily_words_CET4'), [])
  if (cet4Data && cet4Data.length > 0) {
    // 确保每个单词都有 level 字段
    const cet4Words = cet4Data.map(word => ({
      ...word,
      level: 'CET4'
    }))
    await saveAllWords(cet4Words)
    console.log(`迁移 CET4 单词数据: ${cet4Words.length} 条`)
  }

  // 迁移 CET6 单词
  const cet6Data = safeParseJSON(localStorage.getItem('vue_daily_words_CET6'), [])
  if (cet6Data && cet6Data.length > 0) {
    // 确保每个单词都有 level 字段
    const cet6Words = cet6Data.map(word => ({
      ...word,
      level: 'CET6'
    }))
    await saveAllWords(cet6Words)
    console.log(`迁移 CET6 单词数据: ${cet6Words.length} 条`)
  }
}

/**
 * 迁移单词设置
 */
const migrateWordsSettings = async () => {
  const data = safeParseJSON(localStorage.getItem('vue_daily_words_settings'))
  if (data) {
    await saveWordsSettings(data)
    console.log('迁移单词设置完成')
  }
}

/**
 * 迁移任务数据
 */
const migrateTasks = async () => {
  const data = safeParseJSON(localStorage.getItem('taskList'), [])
  if (data && data.length > 0) {
    // 确保每个任务都有 _id 字段
    const tasks = data.map((task, index) => ({
      ...task,
      _id: task._id || Date.now().toString() + index,
      order: task.order !== undefined ? task.order : index
    }))
    await saveAllTasks(tasks)
    console.log(`迁移任务数据: ${tasks.length} 条`)
  }
}

/**
 * 迁移日记数据
 */
const migrateDiaryRecords = async () => {
  const data = safeParseJSON(localStorage.getItem('daily-records'), {})
  if (data && Object.keys(data).length > 0) {
    await saveAllDiaryRecords(data)
    console.log(`迁移日记数据: ${Object.keys(data).length} 条`)
  }
}

/**
 * 迁移日记模板
 */
const migrateDiaryTemplates = async () => {
  const data = safeParseJSON(localStorage.getItem('diary-templates'), [])
  if (data && data.length > 0) {
    await saveAllTemplates(data)
    console.log(`迁移日记模板: ${data.length} 条`)
  }
}

/**
 * 迁移浏览设置
 */
const migrateBrowseSettings = async () => {
  const data = safeParseJSON(localStorage.getItem('daily_browse_settings'))
  if (data) {
    await saveBrowseSettings(data)
    console.log('迁移浏览设置完成')
  }
}

/**
 * 执行完整迁移
 * @returns {Promise<boolean>}
 */
export const runMigration = async () => {
  if (!needsMigration()) {
    console.log('数据已迁移，跳过迁移步骤')
    return true
  }

  console.log('开始数据迁移: localStorage → IndexedDB')

  try {
    // 初始化数据库
    await initDB()

    // 执行各模块迁移
    await migrateSentences()
    await migrateWords()
    await migrateWordsSettings()
    await migrateTasks()
    await migrateDiaryRecords()
    await migrateDiaryTemplates()
    await migrateBrowseSettings()

    // 标记迁移完成
    markMigrationComplete()

    console.log('数据迁移完成!')
    return true
  } catch (error) {
    console.error('数据迁移失败:', error)
    return false
  }
}

/**
 * 重置迁移状态（用于调试）
 */
export const resetMigration = () => {
  localStorage.removeItem(MIGRATION_FLAG)
  console.log('迁移状态已重置')
}

export default {
  needsMigration,
  runMigration,
  resetMigration
}
