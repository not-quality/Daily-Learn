/**
 * 日记和模板存储 API
 */

import { get, getAll, put, putAll, remove, clear } from './index.js'

const DIARY_STORE = 'diaryRecords'
const TEMPLATE_STORE = 'diaryTemplates'

// ==================== 日记记录 API ====================

/**
 * 获取所有日记记录
 * @returns {Promise<Object>} 以日期为键的日记对象
 */
export const getAllDiaryRecords = async () => {
  try {
    const records = await getAll(DIARY_STORE)
    // 转换为以 id (日期) 为键的对象格式，与原 localStorage 格式兼容
    const recordsMap = {}
    records.forEach(record => {
      recordsMap[record.id] = record
    })
    return recordsMap
  } catch (error) {
    console.error('获取日记列表失败:', error)
    return {}
  }
}

/**
 * 获取日记记录数组
 * @returns {Promise<Array>}
 */
export const getDiaryRecordsArray = async () => {
  try {
    return await getAll(DIARY_STORE)
  } catch (error) {
    console.error('获取日记列表失败:', error)
    return []
  }
}

/**
 * 获取单条日记
 * @param {string} dateId - 日期ID (YYYY-MM-DD 格式)
 * @returns {Promise<Object|null>}
 */
export const getDiaryRecord = async (dateId) => {
  try {
    return await get(DIARY_STORE, dateId)
  } catch (error) {
    console.error('获取日记失败:', error)
    return null
  }
}

/**
 * 保存日记
 * @param {Object} record - 日记对象
 * @returns {Promise<boolean>}
 */
export const saveDiaryRecord = async (record) => {
  try {
    await put(DIARY_STORE, record)
    return true
  } catch (error) {
    console.error('保存日记失败:', error)
    return false
  }
}

/**
 * 批量保存日记
 * @param {Array|Object} records - 日记数组或以日期为键的对象
 * @returns {Promise<boolean>}
 */
export const saveAllDiaryRecords = async (records) => {
  try {
    let recordsArray = records
    // 如果是对象格式，转换为数组
    if (!Array.isArray(records)) {
      recordsArray = Object.values(records)
    }
    await putAll(DIARY_STORE, recordsArray)
    return true
  } catch (error) {
    console.error('批量保存日记失败:', error)
    return false
  }
}

/**
 * 删除日记
 * @param {string} dateId - 日期ID
 * @returns {Promise<boolean>}
 */
export const deleteDiaryRecord = async (dateId) => {
  try {
    await remove(DIARY_STORE, dateId)
    return true
  } catch (error) {
    console.error('删除日记失败:', error)
    return false
  }
}

/**
 * 清空所有日记
 * @returns {Promise<boolean>}
 */
export const clearAllDiaryRecords = async () => {
  try {
    await clear(DIARY_STORE)
    return true
  } catch (error) {
    console.error('清空日记失败:', error)
    return false
  }
}

// ==================== 日记模板 API ====================

/**
 * 获取所有模板
 * @returns {Promise<Array>}
 */
export const getAllTemplates = async () => {
  try {
    return await getAll(TEMPLATE_STORE)
  } catch (error) {
    console.error('获取模板列表失败:', error)
    return []
  }
}

/**
 * 获取单个模板
 * @param {string} templateId - 模板ID
 * @returns {Promise<Object|null>}
 */
export const getTemplate = async (templateId) => {
  try {
    return await get(TEMPLATE_STORE, templateId)
  } catch (error) {
    console.error('获取模板失败:', error)
    return null
  }
}

/**
 * 保存模板
 * @param {Object} template - 模板对象
 * @returns {Promise<boolean>}
 */
export const saveTemplate = async (template) => {
  try {
    await put(TEMPLATE_STORE, template)
    return true
  } catch (error) {
    console.error('保存模板失败:', error)
    return false
  }
}

/**
 * 批量保存模板
 * @param {Array} templates - 模板数组
 * @returns {Promise<boolean>}
 */
export const saveAllTemplates = async (templates) => {
  try {
    await putAll(TEMPLATE_STORE, templates)
    return true
  } catch (error) {
    console.error('批量保存模板失败:', error)
    return false
  }
}

/**
 * 删除模板
 * @param {string} templateId - 模板ID
 * @returns {Promise<boolean>}
 */
export const deleteTemplate = async (templateId) => {
  try {
    await remove(TEMPLATE_STORE, templateId)
    return true
  } catch (error) {
    console.error('删除模板失败:', error)
    return false
  }
}

/**
 * 清空所有模板
 * @returns {Promise<boolean>}
 */
export const clearAllTemplates = async () => {
  try {
    await clear(TEMPLATE_STORE)
    return true
  } catch (error) {
    console.error('清空模板失败:', error)
    return false
  }
}

export default {
  // 日记记录
  getAllDiaryRecords,
  getDiaryRecordsArray,
  getDiaryRecord,
  saveDiaryRecord,
  saveAllDiaryRecords,
  deleteDiaryRecord,
  clearAllDiaryRecords,
  // 日记模板
  getAllTemplates,
  getTemplate,
  saveTemplate,
  saveAllTemplates,
  deleteTemplate,
  clearAllTemplates
}
