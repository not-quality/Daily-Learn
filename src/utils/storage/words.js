/**
 * 单词学习存储 API
 */

import { get, getAll, put, putAll, remove, clear, getByIndex } from './index.js'

const STORE_NAME = 'words'

/**
 * 获取指定级别的所有单词
 * @param {string} level - 级别 (CET4 或 CET6)
 * @returns {Promise<Array>}
 */
export const getWordsByLevel = async (level) => {
  try {
    return await getByIndex(STORE_NAME, 'level', level)
  } catch (error) {
    console.error('获取单词列表失败:', error)
    return []
  }
}

/**
 * 获取所有单词
 * @returns {Promise<Array>}
 */
export const getAllWords = async () => {
  try {
    return await getAll(STORE_NAME)
  } catch (error) {
    console.error('获取所有单词失败:', error)
    return []
  }
}

/**
 * 获取单个单词
 * @param {string} level - 级别
 * @param {string} word - 单词
 * @returns {Promise<Object|null>}
 */
export const getWord = async (level, word) => {
  try {
    return await get(STORE_NAME, [level, word])
  } catch (error) {
    console.error('获取单词失败:', error)
    return null
  }
}

/**
 * 保存单词
 * @param {Object} wordData - 单词对象（必须包含 level 和 word 字段）
 * @returns {Promise<boolean>}
 */
export const saveWord = async (wordData) => {
  try {
    await put(STORE_NAME, wordData)
    return true
  } catch (error) {
    console.error('保存单词失败:', error)
    return false
  }
}

/**
 * 批量保存单词
 * @param {Array} words - 单词数组
 * @returns {Promise<boolean>}
 */
export const saveAllWords = async (words) => {
  try {
    await putAll(STORE_NAME, words)
    return true
  } catch (error) {
    console.error('批量保存单词失败:', error)
    return false
  }
}

/**
 * 删除单词
 * @param {string} level - 级别
 * @param {string} word - 单词
 * @returns {Promise<boolean>}
 */
export const deleteWord = async (level, word) => {
  try {
    await remove(STORE_NAME, [level, word])
    return true
  } catch (error) {
    console.error('删除单词失败:', error)
    return false
  }
}

/**
 * 清空所有单词
 * @returns {Promise<boolean>}
 */
export const clearAllWords = async () => {
  try {
    await clear(STORE_NAME)
    return true
  } catch (error) {
    console.error('清空单词失败:', error)
    return false
  }
}

/**
 * 更新单词学习进度
 * @param {string} level - 级别
 * @param {string} word - 单词
 * @param {Object} progress - 进度数据 { correctCount, totalAttempts, lastStudied }
 * @returns {Promise<boolean>}
 */
export const updateWordProgress = async (level, word, progress) => {
  try {
    const wordData = await get(STORE_NAME, [level, word])
    if (wordData) {
      Object.assign(wordData, progress)
      await put(STORE_NAME, wordData)
      return true
    }
    return false
  } catch (error) {
    console.error('更新单词进度失败:', error)
    return false
  }
}

export default {
  getWordsByLevel,
  getAllWords,
  getWord,
  saveWord,
  saveAllWords,
  deleteWord,
  clearAllWords,
  updateWordProgress
}
