/**
 * 任务列表存储 API
 */

import { get, getAll, put, putAll, remove, clear } from './index.js'

const STORE_NAME = 'tasks'

/**
 * 获取所有任务
 * @returns {Promise<Array>}
 */
export const getAllTasks = async () => {
  try {
    const tasks = await getAll(STORE_NAME)
    // 按 order 排序
    return tasks.sort((a, b) => (a.order || 0) - (b.order || 0))
  } catch (error) {
    console.error('获取任务列表失败:', error)
    return []
  }
}

/**
 * 获取单个任务
 * @param {string} taskId - 任务ID
 * @returns {Promise<Object|null>}
 */
export const getTask = async (taskId) => {
  try {
    return await get(STORE_NAME, taskId)
  } catch (error) {
    console.error('获取任务失败:', error)
    return null
  }
}

/**
 * 保存任务
 * @param {Object} task - 任务对象
 * @returns {Promise<boolean>}
 */
export const saveTask = async (task) => {
  try {
    await put(STORE_NAME, task)
    return true
  } catch (error) {
    console.error('保存任务失败:', error)
    return false
  }
}

/**
 * 批量保存任务
 * @param {Array} tasks - 任务数组
 * @returns {Promise<boolean>}
 */
export const saveAllTasks = async (tasks) => {
  try {
    await putAll(STORE_NAME, tasks)
    return true
  } catch (error) {
    console.error('批量保存任务失败:', error)
    return false
  }
}

/**
 * 删除任务
 * @param {string} taskId - 任务ID
 * @returns {Promise<boolean>}
 */
export const deleteTask = async (taskId) => {
  try {
    await remove(STORE_NAME, taskId)
    return true
  } catch (error) {
    console.error('删除任务失败:', error)
    return false
  }
}

/**
 * 清空所有任务
 * @returns {Promise<boolean>}
 */
export const clearAllTasks = async () => {
  try {
    await clear(STORE_NAME)
    return true
  } catch (error) {
    console.error('清空任务失败:', error)
    return false
  }
}

/**
 * 切换任务完成状态
 * @param {string} taskId - 任务ID
 * @returns {Promise<Object|null>}
 */
export const toggleTaskComplete = async (taskId) => {
  try {
    const task = await get(STORE_NAME, taskId)
    if (task) {
      task.iscomplete = !task.iscomplete
      task.updatedAt = new Date().toISOString()
      await put(STORE_NAME, task)
      return task
    }
    return null
  } catch (error) {
    console.error('切换任务完成状态失败:', error)
    return null
  }
}

/**
 * 添加新任务
 * @param {Object} taskData - 任务数据
 * @returns {Promise<Object|null>}
 */
export const addTask = async (taskData) => {
  try {
    const tasks = await getAllTasks()
    const maxOrder = tasks.reduce((max, t) => Math.max(max, t.order || 0), 0)

    const newTask = {
      _id: Date.now().toString(),
      ...taskData,
      order: maxOrder + 1,
      iscomplete: false,
      createdAt: new Date().toISOString()
    }

    await put(STORE_NAME, newTask)
    return newTask
  } catch (error) {
    console.error('添加任务失败:', error)
    return null
  }
}

export default {
  getAllTasks,
  getTask,
  saveTask,
  saveAllTasks,
  deleteTask,
  clearAllTasks,
  toggleTaskComplete,
  addTask
}
