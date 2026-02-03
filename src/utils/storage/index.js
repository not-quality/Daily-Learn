/**
 * IndexedDB 存储服务核心模块
 * 提供数据库初始化、连接管理和通用 CRUD 操作
 * 包含 localStorage 降级机制
 */

const DB_NAME = 'VueDailyLearnDB'
const DB_VERSION = 2

// 数据库连接实例
let dbInstance = null
// 是否降级到 localStorage
let useLocalStorage = false

/**
 * 获取数据库连接
 * @returns {Promise<IDBDatabase>}
 */
export const getDB = () => {
  return new Promise((resolve, reject) => {
    // 如果已经确定需要降级，直接返回 null
    if (useLocalStorage) {
      resolve(null)
      return
    }

    if (dbInstance) {
      resolve(dbInstance)
      return
    }

    // 检查浏览器是否支持 IndexedDB
    if (!window.indexedDB) {
      console.warn('浏览器不支持 IndexedDB，将降级到 localStorage')
      useLocalStorage = true
      resolve(null)
      return
    }

    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = (event) => {
        console.error('IndexedDB 打开失败，尝试降级:', request.error)
        // 只有在完全无法打开时才降级
        useLocalStorage = true
        resolve(null)
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
    } catch (e) {
      console.error('IndexedDB 初始化异常，降级到 localStorage:', e)
      useLocalStorage = true
      resolve(null)
    }
  })
}

// ========== LocalStorage 辅助函数 ==========

const getLSKey = (storeName) => `${DB_NAME}_${storeName}`

const getLSData = (storeName) => {
  try {
    const raw = localStorage.getItem(getLSKey(storeName))
    return raw ? JSON.parse(raw) : []
  } catch (e) {
    console.error('LocalStorage 读取失败:', e)
    return []
  }
}

const saveLSData = (storeName, data) => {
  try {
    localStorage.setItem(getLSKey(storeName), JSON.stringify(data))
  } catch (e) {
    console.error('LocalStorage 写入失败:', e)
  }
}

// 获取对象的主键值
const getKeyVal = (data, keyPath) => {
  if (Array.isArray(keyPath)) {
    return keyPath.map(k => data[k]).join('_') // 简单组合键
  }
  return data[keyPath]
}

// 简单的 keyPath 映射（需要根据 schema 维护）
const STORE_KEY_PATHS = {
  sentences: 'number',
  words: ['level', 'word'],
  tasks: '_id',
  diaryRecords: 'id',
  settings: 'key',
  diaryTemplates: 'id'
}

// ========== 通用 CRUD 操作 ==========

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
  
  if (useLocalStorage) {
    const list = getLSData(storeName)
    const keyPath = STORE_KEY_PATHS[storeName]
    // 简单查找
    // 注意：如果是复合键，这里需要特殊处理查找逻辑
    // 为了简化，这里假设 key 已经是匹配格式，或者对于复合键我们简单比较
    if (Array.isArray(keyPath)) {
       // 对于复合键，传入的 key 可能是数组或对象，这里简化处理：
       // 如果传入的是数组，转字符串比较；如果是对象，提取属性比较
       // 这是一个简化的降级实现
       return Promise.resolve(list.find(item => {
         const itemKey = keyPath.map(k => item[k]).join(',')
         const targetKey = Array.isArray(key) ? key.join(',') : key
         return itemKey === targetKey
       }))
    }
    return Promise.resolve(list.find(item => item[keyPath] === key))
  }

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
  
  if (useLocalStorage) {
    return Promise.resolve(getLSData(storeName))
  }

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
  const plainData = JSON.parse(JSON.stringify(data))
  
  if (useLocalStorage) {
    const list = getLSData(storeName)
    const keyPath = STORE_KEY_PATHS[storeName]
    
    let index = -1
    if (Array.isArray(keyPath)) {
      const targetKey = keyPath.map(k => plainData[k]).join(',')
      index = list.findIndex(item => keyPath.map(k => item[k]).join(',') === targetKey)
    } else {
      index = list.findIndex(item => item[keyPath] === plainData[keyPath])
    }

    if (index >= 0) {
      list[index] = plainData
    } else {
      list.push(plainData)
    }
    saveLSData(storeName, list)
    return Promise.resolve(plainData) // 返回数据而非 ID，与 IDB 行为略有差异但通常够用
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    const request = store.put(plainData)

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
  
  if (useLocalStorage) {
    const list = getLSData(storeName)
    const keyPath = STORE_KEY_PATHS[storeName]
    
    dataArray.forEach(data => {
      const plainData = JSON.parse(JSON.stringify(data))
      let index = -1
      if (Array.isArray(keyPath)) {
        const targetKey = keyPath.map(k => plainData[k]).join(',')
        index = list.findIndex(item => keyPath.map(k => item[k]).join(',') === targetKey)
      } else {
        index = list.findIndex(item => item[keyPath] === plainData[keyPath])
      }

      if (index >= 0) {
        list[index] = plainData
      } else {
        list.push(plainData)
      }
    })
    saveLSData(storeName, list)
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)

    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)

    dataArray.forEach(data => {
      const plainData = JSON.parse(JSON.stringify(data))
      store.put(plainData)
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
  
  if (useLocalStorage) {
    const list = getLSData(storeName)
    const keyPath = STORE_KEY_PATHS[storeName]
    
    let newList = []
    if (Array.isArray(keyPath)) {
      // 简化处理，假设 key 是匹配的数组或正确格式
      const targetKey = Array.isArray(key) ? key.join(',') : key
      newList = list.filter(item => keyPath.map(k => item[k]).join(',') !== targetKey)
    } else {
      newList = list.filter(item => item[keyPath] !== key)
    }
    
    saveLSData(storeName, newList)
    return Promise.resolve()
  }

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
  
  if (useLocalStorage) {
    saveLSData(storeName, [])
    return Promise.resolve()
  }

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
  
  if (useLocalStorage) {
    const list = getLSData(storeName)
    // 简单的全表扫描模拟索引查询
    return Promise.resolve(list.filter(item => item[indexName] === value))
  }

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
  
  if (useLocalStorage) {
    return Promise.resolve(getLSData(storeName).length)
  }

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
