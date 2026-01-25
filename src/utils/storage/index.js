/**
 * IndexedDB 存储服务核心模块
 * 提供数据库初始化、连接管理和通用 CRUD 操作
 */

const DB_NAME = 'VueDailyLearnDB'
const DB_VERSION = 2

// 数据库连接实例
let dbInstance = null

/**
 * 获取数据库连接
 * @returns {Promise<IDBDatabase>}
 */
export const getDB = () => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance)
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      console.error('IndexedDB 打开失败:', request.error)
      reject(request.error)
    }

    request.onsuccess = () => {
      dbInstance = request.result
      resolve(dbInstance)
    }

    request.onupgradeneeded = (event) => {
      const db = event.target.result

      // 创建 sentences store - 句子练习数据
      if (!db.objectStoreNames.contains('sentences')) {
        const sentencesStore = db.createObjectStore('sentences', { keyPath: 'number' })
        sentencesStore.createIndex('completed', 'completed', { unique: false })
      }

      // 创建 words store - 单词学习数据（复合键：level + word）
      if (!db.objectStoreNames.contains('words')) {
        const wordsStore = db.createObjectStore('words', { keyPath: ['level', 'word'] })
        wordsStore.createIndex('level', 'level', { unique: false })
        wordsStore.createIndex('correctCount', 'correctCount', { unique: false })
      }

      // 创建 tasks store - 任务列表
      if (!db.objectStoreNames.contains('tasks')) {
        const tasksStore = db.createObjectStore('tasks', { keyPath: '_id' })
        tasksStore.createIndex('iscomplete', 'iscomplete', { unique: false })
        tasksStore.createIndex('order', 'order', { unique: false })
      }

      // 创建 diaryRecords store - 日记记录
      if (!db.objectStoreNames.contains('diaryRecords')) {
        const diaryStore = db.createObjectStore('diaryRecords', { keyPath: 'id' })
        diaryStore.createIndex('date', 'date', { unique: false })
        diaryStore.createIndex('mood', 'mood', { unique: false })
      }

      // 创建 settings store - 所有设置项
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' })
      }

      // 创建 diaryTemplates store - 日记模板
      if (!db.objectStoreNames.contains('diaryTemplates')) {
        db.createObjectStore('diaryTemplates', { keyPath: 'id' })
      }
    }
  })
}

/**
 * 初始化数据库
 * @returns {Promise<IDBDatabase>}
 */
export const initDB = async () => {
  return getDB()
}

/**
 * 关闭数据库连接
 */
export const closeDB = () => {
  if (dbInstance) {
    dbInstance.close()
    dbInstance = null
  }
}

/**
 * 通用获取单条记录
 * @param {string} storeName - store 名称
 * @param {any} key - 主键值
 * @returns {Promise<any>}
 */
export const get = async (storeName, key) => {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)
    const request = store.get(key)

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/**
 * 通用获取所有记录
 * @param {string} storeName - store 名称
 * @returns {Promise<any[]>}
 */
export const getAll = async (storeName) => {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)
    const request = store.getAll()

    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(request.error)
  })
}

/**
 * 通用添加或更新记录
 * @param {string} storeName - store 名称
 * @param {any} data - 数据对象
 * @returns {Promise<any>}
 */
export const put = async (storeName, data) => {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    const request = store.put(data)

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/**
 * 批量添加或更新记录
 * @param {string} storeName - store 名称
 * @param {any[]} dataArray - 数据数组
 * @returns {Promise<void>}
 */
export const putAll = async (storeName, dataArray) => {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)

    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)

    dataArray.forEach(data => {
      store.put(data)
    })
  })
}

/**
 * 通用删除记录
 * @param {string} storeName - store 名称
 * @param {any} key - 主键值
 * @returns {Promise<void>}
 */
export const remove = async (storeName, key) => {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    const request = store.delete(key)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

/**
 * 清空 store 中的所有记录
 * @param {string} storeName - store 名称
 * @returns {Promise<void>}
 */
export const clear = async (storeName) => {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    const request = store.clear()

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

/**
 * 通过索引查询记录
 * @param {string} storeName - store 名称
 * @param {string} indexName - 索引名称
 * @param {any} value - 索引值
 * @returns {Promise<any[]>}
 */
export const getByIndex = async (storeName, indexName, value) => {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)
    const index = store.index(indexName)
    const request = index.getAll(value)

    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(request.error)
  })
}

/**
 * 获取记录数量
 * @param {string} storeName - store 名称
 * @returns {Promise<number>}
 */
export const count = async (storeName) => {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)
    const request = store.count()

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export default {
  initDB,
  closeDB,
  getDB,
  get,
  getAll,
  put,
  putAll,
  remove,
  clear,
  getByIndex,
  count
}
