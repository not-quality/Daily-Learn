/**
 * 句子练习存储 API
 */

import { get, getAll, put, putAll, remove, clear } from './index.js'

const STORE_NAME = 'sentences'

/**
 * 获取所有句子
 * @returns {Promise<Array>}
 */
export const getAllSentences = async () => {
  try {
    return await getAll(STORE_NAME)
  } catch (error) {
    console.error('获取句子列表失败:', error)
    return []
  }
}

/**
 * 获取单个句子
 * @param {string} number - 句子编号
 * @returns {Promise<Object|null>}
 */
export const getSentence = async (number) => {
  try {
    return await get(STORE_NAME, number)
  } catch (error) {
    console.error('获取句子失败:', error)
    return null
  }
}

/**
 * 保存句子
 * @param {Object} sentence - 句子对象
 * @returns {Promise<boolean>}
 */
export const saveSentence = async (sentence) => {
  try {
    await put(STORE_NAME, sentence)
    return true
  } catch (error) {
    console.error('保存句子失败:', error)
    return false
  }
}

/**
 * 批量保存句子
 * @param {Array} sentences - 句子数组
 * @returns {Promise<boolean>}
 */
export const saveAllSentences = async (sentences) => {
  try {
    await putAll(STORE_NAME, sentences)
    return true
  } catch (error) {
    console.error('批量保存句子失败:', error)
    return false
  }
}

/**
 * 删除句子
 * @param {string} number - 句子编号
 * @returns {Promise<boolean>}
 */
export const deleteSentence = async (number) => {
  try {
    await remove(STORE_NAME, number)
    return true
  } catch (error) {
    console.error('删除句子失败:', error)
    return false
  }
}

/**
 * 清空所有句子
 * @returns {Promise<boolean>}
 */
export const clearAllSentences = async () => {
  try {
    await clear(STORE_NAME)
    return true
  } catch (error) {
    console.error('清空句子失败:', error)
    return false
  }
}

/**
 * 切换句子完成状态
 * @param {string} number - 句子编号
 * @returns {Promise<Object|null>}
 */
export const toggleSentenceComplete = async (number) => {
  try {
    const sentence = await get(STORE_NAME, number)
    if (sentence) {
      sentence.completed = !sentence.completed
      sentence.updatedAt = new Date().toISOString()
      await put(STORE_NAME, sentence)
      return sentence
    }
    return null
  } catch (error) {
    console.error('切换句子完成状态失败:', error)
    return null
  }
}

export default {
  getAllSentences,
  getSentence,
  saveSentence,
  saveAllSentences,
  deleteSentence,
  clearAllSentences,
  toggleSentenceComplete
}
