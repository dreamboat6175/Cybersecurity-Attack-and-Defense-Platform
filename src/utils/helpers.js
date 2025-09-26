// src/utils/helpers.js - 重构版本
// 统一的工具函数库，按功能分类组织

// ======================
// 函数式编程工具
// ======================

/**
 * 防抖函数 - 优化版本
 * @param {Function} func - 要防抖的函数
 * @param {number} delay - 延迟时间(ms)
 * @param {boolean} immediate - 是否立即执行
 * @returns {Function} 防抖后的函数
 */
export function debounce(func, delay = 300, immediate = false) {
    let timeoutId
    return function executedFunction(...args) {
        const context = this

        const later = () => {
            timeoutId = null
            if (!immediate) func.apply(context, args)
        }

        const callNow = immediate && !timeoutId
        clearTimeout(timeoutId)
        timeoutId = setTimeout(later, delay)

        if (callNow) func.apply(context, args)
    }
}

/**
 * 节流函数 - 优化版本
 * @param {Function} func - 要节流的函数
 * @param {number} limit - 时间间隔(ms)
 * @param {Object} options - 选项 {leading: boolean, trailing: boolean}
 * @returns {Function} 节流后的函数
 */
export function throttle(func, limit = 300, options = {}) {
    const { leading = true, trailing = true } = options
    let inThrottle, lastFunc, lastRan

    return function(...args) {
        const context = this

        if (!inThrottle) {
            if (leading) {
                func.apply(context, args)
                lastRan = Date.now()
            }
            inThrottle = true
        } else {
            if (trailing) {
                clearTimeout(lastFunc)
                lastFunc = setTimeout(() => {
                    if (Date.now() - lastRan >= limit) {
                        func.apply(context, args)
                        lastRan = Date.now()
                    }
                }, limit - (Date.now() - lastRan))
            }
        }
    }
}

// ======================
// 对象操作工具
// ======================

/**
 * 深拷贝对象 - 改进版本
 * @param {*} obj - 要拷贝的对象
 * @param {WeakMap} hash - 循环引用缓存
 * @returns {*} 拷贝后的对象
 */
export function deepClone(obj, hash = new WeakMap()) {
    // 处理null和undefined
    if (obj === null || typeof obj !== 'object') return obj

    // 处理循环引用
    if (hash.has(obj)) return hash.get(obj)

    // 处理日期对象
    if (obj instanceof Date) return new Date(obj.getTime())

    // 处理正则表达式
    if (obj instanceof RegExp) return new RegExp(obj)

    // 处理数组
    if (Array.isArray(obj)) {
        const clonedArr = []
        hash.set(obj, clonedArr)
        obj.forEach((item, index) => {
            clonedArr[index] = deepClone(item, hash)
        })
        return clonedArr
    }

    // 处理对象
    const clonedObj = {}
    hash.set(obj, clonedObj)
    Object.keys(obj).forEach(key => {
        clonedObj[key] = deepClone(obj[key], hash)
    })

    return clonedObj
}

/**
 * 安全地获取嵌套属性
 * @param {Object} obj - 源对象
 * @param {string} path - 属性路径，如 'user.profile.name'
 * @param {*} defaultValue - 默认值
 * @returns {*} 属性值
 */
export function get(obj, path, defaultValue = undefined) {
    if (!obj || typeof path !== 'string') return defaultValue

    const keys = path.split('.')
    let result = obj

    for (const key of keys) {
        if (result?.[key] === undefined) return defaultValue
        result = result[key]
    }

    return result
}

/**
 * 安全地设置嵌套属性
 * @param {Object} obj - 目标对象
 * @param {string} path - 属性路径
 * @param {*} value - 要设置的值
 */
export function set(obj, path, value) {
    if (!obj || typeof path !== 'string') return

    const keys = path.split('.')
    const lastKey = keys.pop()
    let current = obj

    for (const key of keys) {
        if (!(key in current) || typeof current[key] !== 'object') {
            current[key] = {}
        }
        current = current[key]
    }

    current[lastKey] = value
}

// ======================
// 数组操作工具
// ======================

/**
 * 数组去重 - 改进版本
 * @param {Array} array - 源数组
 * @param {string|Function} key - 对象数组的唯一键或比较函数
 * @returns {Array} 去重后的数组
 */
export function uniqueArray(array, key = null) {
    if (!Array.isArray(array)) return []

    if (!key) {
        return [...new Set(array)]
    }

    if (typeof key === 'function') {
        const seen = new Set()
        return array.filter(item => {
            const identifier = key(item)
            if (seen.has(identifier)) return false
            seen.add(identifier)
            return true
        })
    }

    const seen = new Set()
    return array.filter(item => {
        const value = get(item, key)
        if (seen.has(value)) return false
        seen.add(value)
        return true
    })
}

/**
 * 将数组按指定大小分块
 * @param {Array} array - 源数组
 * @param {number} size - 块大小
 * @returns {Array} 分块后的数组
 */
export function chunk(array, size = 1) {
    if (!Array.isArray(array) || size <= 0) return []

    const chunks = []
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size))
    }
    return chunks
}

/**
 * 数字范围生成器 - 改进版本
 * @param {number} start - 开始值
 * @param {number} end - 结束值
 * @param {number} step - 步长
 * @returns {Array} 数字数组
 */
export function range(start, end, step = 1) {
    if (step === 0) throw new Error('Step cannot be zero')

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

// ======================
// 字符串处理工具
// ======================

/**
 * 生成随机字符串 - 改进版本
 * @param {number} length - 字符串长度
 * @param {string} charset - 字符集
 * @returns {string} 随机字符串
 */
export function randomString(length = 8, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
    if (length <= 0) return ''

    let result = ''
    const charsetLength = charset.length

    for (let i = 0; i < length; i++) {
        result += charset.charAt(Math.floor(Math.random() * charsetLength))
    }

    return result
}

/**
 * 驼峰转短横线
 * @param {string} str - 驼峰字符串
 * @returns {string} 短横线字符串
 */
export function kebabCase(str) {
    return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)
}

/**
 * 短横线转驼峰
 * @param {string} str - 短横线字符串
 * @returns {string} 驼峰字符串
 */
export function camelCase(str) {
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase())
}

// ======================
// URL和查询参数工具
// ======================

/**
 * 对象转查询字符串 - 改进版本
 * @param {Object} obj - 参数对象
 * @param {boolean} encode - 是否编码
 * @returns {string} 查询字符串
 */
export function objectToQuery(obj, encode = true) {
    if (!obj || typeof obj !== 'object') return ''

    const params = []

    Object.keys(obj).forEach(key => {
        const value = obj[key]

        if (value === null || value === undefined || value === '') return

        if (Array.isArray(value)) {
            value.forEach(item => {
                if (item !== null && item !== undefined && item !== '') {
                    const encodedKey = encode ? encodeURIComponent(key) : key
                    const encodedValue = encode ? encodeURIComponent(item) : item
                    params.push(`${encodedKey}=${encodedValue}`)
                }
            })
        } else {
            const encodedKey = encode ? encodeURIComponent(key) : key
            const encodedValue = encode ? encodeURIComponent(value) : value
            params.push(`${encodedKey}=${encodedValue}`)
        }
    })

    return params.join('&')
}

/**
 * 查询字符串转对象 - 改进版本
 * @param {string} queryString - 查询字符串
 * @param {boolean} decode - 是否解码
 * @returns {Object} 参数对象
 */
export function queryToObject(queryString, decode = true) {
    if (!queryString || typeof queryString !== 'string') return {}

    const params = {}
    const urlParams = new URLSearchParams(queryString)

    for (const [key, value] of urlParams) {
        const decodedKey = decode ? decodeURIComponent(key) : key
        const decodedValue = decode ? decodeURIComponent(value) : value

        if (params[decodedKey]) {
            // 转换为数组
            if (Array.isArray(params[decodedKey])) {
                params[decodedKey].push(decodedValue)
            } else {
                params[decodedKey] = [params[decodedKey], decodedValue]
            }
        } else {
            params[decodedKey] = decodedValue
        }
    }

    return params
}

// ======================
// 验证工具
// ======================

/**
 * 验证器集合
 */
export const validators = {
    /**
     * 验证IP地址格式
     */
    ip: (ip) => {
        const ipv4Regex = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
        const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
        return ipv4Regex.test(ip) || ipv6Regex.test(ip)
    },

    /**
     * 验证邮箱格式
     */
    email: (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
    },

    /**
     * 验证URL格式
     */
    url: (url) => {
        try {
            new URL(url)
            return true
        } catch {
            return false
        }
    },

    /**
     * 验证端口号
     */
    port: (port) => {
        const num = parseInt(port, 10)
        return !isNaN(num) && num >= 1 && num <= 65535
    }
}

// ======================
// 异步工具
// ======================

/**
 * 延迟执行 - 改进版本
 * @param {number} ms - 延迟时间(ms)
 * @returns {Promise} Promise对象
 */
export function sleep(ms) {
    return new Promise(resolve => {
        if (ms <= 0) {
            resolve()
        } else {
            setTimeout(resolve, ms)
        }
    })
}

/**
 * 重试机制 - 改进版本
 * @param {Function} fn - 要执行的函数
 * @param {Object} options - 重试选项
 * @returns {Promise} Promise对象
 */
export async function retry(fn, options = {}) {
    const {
        retries = 3,
        delay = 1000,
        factor = 1,
        maxDelay = 10000,
        onRetry = null
    } = options

    let attempt = 0
    let currentDelay = delay

    while (attempt <= retries) {
        try {
            return await fn()
        } catch (error) {
            if (attempt === retries) throw error

            if (onRetry) onRetry(error, attempt + 1)

            await sleep(Math.min(currentDelay, maxDelay))
            currentDelay *= factor
            attempt++
        }
    }
}

/**
 * 并发控制 - 限制并发数
 * @param {Array} tasks - 任务数组
 * @param {number} limit - 并发限制
 * @returns {Promise} Promise对象
 */
export async function pLimit(tasks, limit = 3) {
    const results = []
    const executing = []

    for (const task of tasks) {
        const promise = Promise.resolve().then(task)
        results.push(promise)

        if (tasks.length >= limit) {
            const e = promise.then(() => executing.splice(executing.indexOf(e), 1))
            executing.push(e)
            if (executing.length >= limit) {
                await Promise.race(executing)
            }
        }
    }

    return Promise.all(results)
}

// ======================
// 类型检查工具
// ======================

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
 * 获取数据类型
 * @param {*} value - 要检查的值
 * @returns {string} 数据类型
 */
export function getType(value) {
    return Object.prototype.toString.call(value).slice(8, -1).toLowerCase()
}

/**
 * 类型检查器
 */
export const is = {
    string: (value) => typeof value === 'string',
    number: (value) => typeof value === 'number' && !isNaN(value),
    boolean: (value) => typeof value === 'boolean',
    array: (value) => Array.isArray(value),
    object: (value) => value !== null && typeof value === 'object' && !Array.isArray(value),
    function: (value) => typeof value === 'function',
    date: (value) => value instanceof Date && !isNaN(value),
    regexp: (value) => value instanceof RegExp,
    promise: (value) => value && typeof value.then === 'function'
}

// ======================
// JSON工具
// ======================

/**
 * 安全的JSON解析 - 改进版本
 * @param {string} str - JSON字符串
 * @param {*} fallback - 解析失败时的默认值
 * @returns {*} 解析结果
 */
export function safeJSONParse(str, fallback = null) {
    if (typeof str !== 'string') return fallback

    try {
        return JSON.parse(str)
    } catch {
        return fallback
    }
}

/**
 * 安全的JSON序列化
 * @param {*} obj - 要序列化的对象
 * @param {*} fallback - 序列化失败时的默认值
 * @returns {string} JSON字符串
 */
export function safeJSONStringify(obj, fallback = '{}') {
    try {
        return JSON.stringify(obj)
    } catch {
        return fallback
    }
}

// ======================
// 设备和浏览器检测
// ======================

/**
 * 检测设备类型 - 改进版本
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
 * 获取浏览器信息 - 改进版本
 * @returns {Object} 浏览器信息
 */
export function getBrowserInfo() {
    const userAgent = navigator.userAgent

    const browsers = [
        { name: 'Chrome', regex: /Chrome\/([0-9.]+)/ },
        { name: 'Firefox', regex: /Firefox\/([0-9.]+)/ },
        { name: 'Safari', regex: /Version\/([0-9.]+).*Safari/ },
        { name: 'Edge', regex: /Edg\/([0-9.]+)/ },
        { name: 'Opera', regex: /Opera\/([0-9.]+)/ }
    ]

    for (const browser of browsers) {
        const match = userAgent.match(browser.regex)
        if (match) {
            return {
                browser: browser.name,
                version: match[1],
                userAgent
            }
        }
    }

    return {
        browser: 'Unknown',
        version: 'Unknown',
        userAgent
    }
}

// ======================
// 默认导出
// ======================

export default {
    // 函数式编程
    debounce,
    throttle,

    // 对象操作
    deepClone,
    get,
    set,

    // 数组操作
    uniqueArray,
    chunk,
    range,

    // 字符串处理
    randomString,
    kebabCase,
    camelCase,

    // URL处理
    objectToQuery,
    queryToObject,

    // 验证
    validators,

    // 异步工具
    sleep,
    retry,
    pLimit,

    // 类型检查
    isEmpty,
    getType,
    is,

    // JSON工具
    safeJSONParse,
    safeJSONStringify,

    // 设备检测
    getDeviceType,
    getBrowserInfo
}