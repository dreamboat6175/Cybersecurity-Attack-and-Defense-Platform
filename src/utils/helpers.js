// src/utils/helpers.js

/**
 * 防抖函数
 * @param {Function} func - 要防抖的函数
 * @param {number} delay - 延迟时间(ms)
 * @returns {Function} 防抖后的函数
 */
export function debounce(func, delay = 300) {
    let timeoutId
    return function (...args) {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => func.apply(this, args), delay)
    }
}

/**
 * 节流函数
 * @param {Function} func - 要节流的函数
 * @param {number} limit - 时间间隔(ms)
 * @returns {Function} 节流后的函数
 */
export function throttle(func, limit = 300) {
    let inThrottle
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args)
            inThrottle = true
            setTimeout(() => inThrottle = false, limit)
        }
    }
}

/**
 * 深拷贝对象
 * @param {*} obj - 要拷贝的对象
 * @returns {*} 拷贝后的对象
 */
export function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj
    if (obj instanceof Date) return new Date(obj.getTime())
    if (obj instanceof Array) return obj.map(item => deepClone(item))

    if (typeof obj === 'object') {
        const clonedObj = {}
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = deepClone(obj[key])
            }
        }
        return clonedObj
    }

    return obj
}

/**
 * 验证IP地址格式
 * @param {string} ip - IP地址字符串
 * @returns {boolean} 是否有效
 */
export function isValidIP(ip) {
    const ipRegex = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    return ipRegex.test(ip)
}

/**
 * 验证邮箱格式
 * @param {string} email - 邮箱地址
 * @returns {boolean} 是否有效
 */
export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

/**
 * 生成随机字符串
 * @param {number} length - 字符串长度
 * @param {string} charset - 字符集
 * @returns {string} 随机字符串
 */
export function randomString(length = 8, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
    let result = ''
    for (let i = 0; i < length; i++) {
        result += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    return result
}

/**
 * 将数组按指定大小分块
 * @param {Array} array - 源数组
 * @param {number} size - 块大小
 * @returns {Array} 分块后的数组
 */
export function chunk(array, size) {
    const chunks = []
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size))
    }
    return chunks
}

/**
 * 对象转查询字符串
 * @param {Object} obj - 参数对象
 * @returns {string} 查询字符串
 */
export function objectToQuery(obj) {
    return Object.keys(obj)
        .filter(key => obj[key] !== undefined && obj[key] !== null && obj[key] !== '')
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
        .join('&')
}

/**
 * 查询字符串转对象
 * @param {string} queryString - 查询字符串
 * @returns {Object} 参数对象
 */
export function queryToObject(queryString) {
    const params = {}
    const urlParams = new URLSearchParams(queryString)
    for (const [key, value] of urlParams) {
        params[key] = value
    }
    return params
}

/**
 * 数组去重
 * @param {Array} array - 源数组
 * @param {string} key - 对象数组的唯一键
 * @returns {Array} 去重后的数组
 */
export function uniqueArray(array, key = null) {
    if (!key) {
        return [...new Set(array)]
    }

    const seen = new Set()
    return array.filter(item => {
        const value = item[key]
        if (seen.has(value)) {
            return false
        }
        seen.add(value)
        return true
    })
}

/**
 * 数字范围生成器
 * @param {number} start - 开始值
 * @param {number} end - 结束值
 * @param {number} step - 步长
 * @returns {Array} 数字数组
 */
export function range(start, end, step = 1) {
    const result = []
    if (step > 0) {
        for (let i = start; i < end; i += step) {
            result.push(i)
        }
    } else {
        for (let i = start; i > end; i += step) {
            result.push(i)
        }
    }
    return result
}

/**
 * 获取文件扩展名
 * @param {string} filename - 文件名
 * @returns {string} 扩展名
 */
export function getFileExtension(filename) {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2)
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @param {number} decimals - 小数位数
 * @returns {string} 格式化后的文件大小
 */
export function formatFileSize(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * 延迟执行
 * @param {number} ms - 延迟时间(ms)
 * @returns {Promise} Promise对象
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 重试机制
 * @param {Function} fn - 要执行的函数
 * @param {number} retries - 重试次数
 * @param {number} delay - 重试间隔
 * @returns {Promise} Promise对象
 */
export async function retry(fn, retries = 3, delay = 1000) {
    try {
        return await fn()
    } catch (error) {
        if (retries > 0) {
            await sleep(delay)
            return retry(fn, retries - 1, delay)
        }
        throw error
    }
}

/**
 * 检查值是否为空
 * @param {*} value - 要检查的值
 * @returns {boolean} 是否为空
 */
export function isEmpty(value) {
    if (value === null || value === undefined) return true
    if (typeof value === 'string' && value.trim() === '') return true
    if (Array.isArray(value) && value.length === 0) return true
    if (typeof value === 'object' && Object.keys(value).length === 0) return true
    return false
}

/**
 * 安全的JSON解析
 * @param {string} str - JSON字符串
 * @param {*} fallback - 解析失败时的默认值
 * @returns {*} 解析结果
 */
export function safeJSONParse(str, fallback = null) {
    try {
        return JSON.parse(str)
    } catch {
        return fallback
    }
}

/**
 * 检测设备类型
 * @returns {string} 设备类型
 */
export function getDeviceType() {
    const userAgent = navigator.userAgent.toLowerCase()

    if (/tablet|ipad|playbook|silk/.test(userAgent)) {
        return 'tablet'
    }

    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/.test(userAgent)) {
        return 'mobile'
    }

    return 'desktop'
}

/**
 * 获取浏览器信息
 * @returns {Object} 浏览器信息
 */
export function getBrowserInfo() {
    const userAgent = navigator.userAgent
    let browser = 'Unknown'
    let version = 'Unknown'

    if (userAgent.indexOf('Chrome') > -1) {
        browser = 'Chrome'
        version = userAgent.match(/Chrome\/([0-9.]+)/)?.[1] || 'Unknown'
    } else if (userAgent.indexOf('Firefox') > -1) {
        browser = 'Firefox'
        version = userAgent.match(/Firefox\/([0-9.]+)/)?.[1] || 'Unknown'
    } else if (userAgent.indexOf('Safari') > -1) {
        browser = 'Safari'
        version = userAgent.match(/Version\/([0-9.]+)/)?.[1] || 'Unknown'
    } else if (userAgent.indexOf('Edge') > -1) {
        browser = 'Edge'
        version = userAgent.match(/Edge\/([0-9.]+)/)?.[1] || 'Unknown'
    }

    return { browser, version }
}