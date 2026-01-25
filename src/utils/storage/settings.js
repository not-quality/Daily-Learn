/**
 * 设置存储 API
 */

import { get, getAll, put, remove } from './index.js'

const STORE_NAME = 'settings'

// 设置键名常量
export const SETTINGS_KEYS = {
  WORDS_SETTINGS: 'words_settings',
  BROWSE_SETTINGS: 'browse_settings'
}

/**
 * 获取设置项
 * @param {string} key - 设置键名
 * @returns {Promise<any>}
 */
export const getSetting = async (key) => {
  try {
    const result = await get(STORE_NAME, key)
    return result ? result.value : null
  } catch (error) {
    console.error('获取设置失败:', error)
    return null
  }
}

/**
 * 保存设置项
 * @param {string} key - 设置键名
 * @param {any} value - 设置值
 * @returns {Promise<boolean>}
 */
export const saveSetting = async (key, value) => {
  try {
    await put(STORE_NAME, { key, value })
    return true
  } catch (error) {
    console.error('保存设置失败:', error)
    return false
  }
}

/**
 * 删除设置项
 * @param {string} key - 设置键名
 * @returns {Promise<boolean>}
 */
export const deleteSetting = async (key) => {
  try {
    await remove(STORE_NAME, key)
    return true
  } catch (error) {
    console.error('删除设置失败:', error)
    return false
  }
}

/**
 * 获取所有设置
 * @returns {Promise<Object>}
 */
export const getAllSettings = async () => {
  try {
    const settings = await getAll(STORE_NAME)
    const settingsMap = {}
    settings.forEach(item => {
      settingsMap[item.key] = item.value
    })
    return settingsMap
  } catch (error) {
    console.error('获取所有设置失败:', error)
    return {}
  }
}

// ==================== 单词设置 API ====================

/**
 * 获取单词设置
 * @returns {Promise<Object>}
 */
export const getWordsSettings = async () => {
  const settings = await getSetting(SETTINGS_KEYS.WORDS_SETTINGS)
  return settings || {
    currentLevel: 'CET4',
    dailyGoal: 20,
    reviewMode: 'spaced'
  }
}

/**
 * 保存单词设置
 * @param {Object} settings - 设置对象
 * @returns {Promise<boolean>}
 */
export const saveWordsSettings = async (settings) => {
  return saveSetting(SETTINGS_KEYS.WORDS_SETTINGS, settings)
}

// ==================== 浏览设置 API ====================

/**
 * 获取浏览设置
 * @returns {Promise<Object>}
 */
export const getBrowseSettings = async () => {
  const settings = await getSetting(SETTINGS_KEYS.BROWSE_SETTINGS)
  return settings || {
    sortOrder: 'desc',
    viewMode: 'list'
  }
}

/**
 * 保存浏览设置
 * @param {Object} settings - 设置对象
 * @returns {Promise<boolean>}
 */
export const saveBrowseSettings = async (settings) => {
  return saveSetting(SETTINGS_KEYS.BROWSE_SETTINGS, settings)
}

export default {
  SETTINGS_KEYS,
  getSetting,
  saveSetting,
  deleteSetting,
  getAllSettings,
  getWordsSettings,
  saveWordsSettings,
  getBrowseSettings,
  saveBrowseSettings
}
