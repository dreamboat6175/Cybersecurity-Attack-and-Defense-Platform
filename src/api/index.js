// API请求封装
// 网络安全攻防平台 - 统一API请求管理

import axios from 'axios'
import { API_CONFIG, ERROR_CODES, ERROR_MESSAGES, STORAGE_KEYS } from '@/utils/constants'

// 创建axios实例
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
})

// 请求队列管理（用于防重复请求）
const pendingRequests = new Map()

/**
 * 生成请求的唯一标识
 * @param {Object} config - axios请求配置
 * @returns {string} 请求唯一标识
 */
function generateRequestKey(config) {
    const { method, url, params, data } = config
    return `${method}:${url}:${JSON.stringify(params)}:${JSON.stringify(data)}`
}

/**
 * 取消重复请求
 * @param {Object} config - axios请求配置
 */
function removePendingRequest(config) {
    const requestKey = generateRequestKey(config)
    if (pendingRequests.has(requestKey)) {
        const cancelToken = pendingRequests.get(requestKey)
        cancelToken('重复请求被取消')
        pendingRequests.delete(requestKey)
    }
}

/**
 * 添加请求到队列
 * @param {Object} config - axios请求配置
 */
function addPendingRequest(config) {
    const requestKey = generateRequestKey(config)
    config.cancelToken = new axios.CancelToken((cancel) => {
        if (!pendingRequests.has(requestKey)) {
            pendingRequests.set(requestKey, cancel)
        }
    })
}

// 请求拦截器
api.interceptors.request.use(
    (config) => {
        // 记录请求日志
        console.log(`🚀 API请求: ${config.method?.toUpperCase()} ${config.url}`, {
            params: config.params,
            data: config.data
        })

        // 添加认证token
        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }

        // 添加请求ID用于追踪
        config.headers['X-Request-ID'] = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

        // 添加时间戳防止缓存
        if (config.method === 'get') {
            config.params = {
                ...config.params,
                _t: Date.now()
            }
        }

        // 处理重复请求（GET请求除外）
        if (config.method !== 'get') {
            removePendingRequest(config)
            addPendingRequest(config)
        }

        return config
    },
    (error) => {
        console.error('❌ API请求拦截器错误:', error)
        return Promise.reject(error)
    }
)

// 响应拦截器
api.interceptors.response.use(
    (response) => {
        // 移除已完成的请求
        removePendingRequest(response.config)

        // 记录响应日志
        console.log(`✅ API响应: ${response.config.url}`, {
            status: response.status,
            data: response.data
        })

        // 统一响应数据格式处理
        const { data } = response

        // 如果响应包含success字段，检查业务状态
        if (data && typeof data === 'object' && 'success' in data) {
            if (!data.success) {
                const error = new Error(data.message || '业务处理失败')
                error.code = data.code || ERROR_CODES.SERVER_ERROR
                error.response = response
                throw error
            }
            // 返回业务数据部分
            return data.data !== undefined ? data.data : data
        }

        // 直接返回响应数据
        return data
    },
    (error) => {
        // 移除失败的请求
        if (error.config) {
            removePendingRequest(error.config)
        }

        // 处理取消的请求
        if (axios.isCancel(error)) {
            console.log('📋 请求被取消:', error.message)
            return Promise.reject(error)
        }

        // 统一错误处理
        const errorInfo = handleApiError(error)
        console.error('❌ API响应错误:', errorInfo)

        // 抛出标准化错误
        return Promise.reject(errorInfo)
    }
)

/**
 * 统一错误处理
 * @param {Error} error - 原始错误对象
 * @returns {Object} 标准化错误信息
 */
function handleApiError(error) {
    let errorCode = ERROR_CODES.SERVER_ERROR
    let errorMessage = ERROR_MESSAGES.SERVER_ERROR
    let statusCode = 500

    if (error.response) {
        // 服务器响应了错误状态码
        const { status, data } = error.response
        statusCode = status

        switch (status) {
            case 400:
                errorCode = ERROR_CODES.VALIDATION_ERROR
                errorMessage = data?.message || ERROR_MESSAGES.VALIDATION_ERROR
                break
            case 401:
                errorCode = ERROR_CODES.AUTH_FAILED
                errorMessage = ERROR_MESSAGES.AUTH_FAILED
                // 清除本地认证信息
                localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
                localStorage.removeItem(STORAGE_KEYS.USER_INFO)
                // 跳转到登录页面（如果不在登录页面）
                if (!window.location.pathname.includes('/login')) {
                    window.location.href = '/login'
                }
                break
            case 403:
                errorCode = ERROR_CODES.PERMISSION_DENIED
                errorMessage = ERROR_MESSAGES.PERMISSION_DENIED
                break
            case 404:
                errorCode = ERROR_CODES.RESOURCE_NOT_FOUND
                errorMessage = ERROR_MESSAGES.RESOURCE_NOT_FOUND
                break
            case 408:
                errorCode = ERROR_CODES.TIMEOUT_ERROR
                errorMessage = ERROR_MESSAGES.TIMEOUT_ERROR
                break
            case 500:
            default:
                errorCode = ERROR_CODES.SERVER_ERROR
                errorMessage = data?.message || ERROR_MESSAGES.SERVER_ERROR
                break
        }
    } else if (error.request) {
        // 请求发出但没有收到响应
        errorCode = ERROR_CODES.NETWORK_ERROR
        errorMessage = ERROR_MESSAGES.NETWORK_ERROR
    } else {
        // 其他错误
        errorMessage = error.message || ERROR_MESSAGES.SERVER_ERROR
    }

    return {
        code: errorCode,
        message: errorMessage,
        statusCode,
        originalError: error
    }
}

/**
 * 重试请求
 * @param {Function} requestFn - 请求函数
 * @param {number} retries - 重试次数
 * @param {number} delay - 重试延迟（毫秒）
 * @returns {Promise} 请求结果
 */
export async function retryRequest(requestFn, retries = API_CONFIG.RETRY_COUNT, delay = API_CONFIG.RETRY_DELAY) {
    try {
        return await requestFn()
    } catch (error) {
        if (retries > 0 && shouldRetry(error)) {
            console.log(`🔄 请求失败，${delay}ms后重试，剩余重试次数: ${retries}`)
            await new Promise(resolve => setTimeout(resolve, delay))
            return retryRequest(requestFn, retries - 1, delay * 2) // 指数退避
        }
        throw error
    }
}

/**
 * 判断是否应该重试请求
 * @param {Error} error - 错误对象
 * @returns {boolean} 是否应该重试
 */
function shouldRetry(error) {
    // 网络错误可以重试
    if (!error.response) return true

    const { status } = error.response
    // 服务器错误（5xx）可以重试
    return status >= 500
}

/**
 * 批量请求
 * @param {Array} requests - 请求数组
 * @param {Object} options - 选项
 * @returns {Promise} 批量请求结果
 */
export async function batchRequest(requests, options = {}) {
    const {
        concurrent = 5, // 并发数
        failFast = false // 是否快速失败
    } = options

    const results = []
    const errors = []

    // 分批处理请求
    for (let i = 0; i < requests.length; i += concurrent) {
        const batch = requests.slice(i, i + concurrent)

        try {
            if (failFast) {
                // 快速失败模式：一个失败就全部失败
                const batchResults = await Promise.all(batch.map(req => req()))
                results.push(...batchResults)
            } else {
                // 容错模式：收集所有结果和错误
                const batchResults = await Promise.allSettled(batch.map(req => req()))
                batchResults.forEach((result, index) => {
                    if (result.status === 'fulfilled') {
                        results[i + index] = result.value
                    } else {
                        errors[i + index] = result.reason
                    }
                })
            }
        } catch (error) {
            if (failFast) {
                throw error
            } else {
                // 在容错模式下记录批次错误
                console.error('批量请求批次失败:', error)
            }
        }
    }

    return { results, errors }
}

/**
 * 创建取消令牌
 * @returns {Object} 取消令牌对象
 */
export function createCancelToken() {
    return axios.CancelToken.source()
}

/**
 * 检查是否为取消错误
 * @param {Error} error - 错误对象
 * @returns {boolean} 是否为取消错误
 */
export function isCancel(error) {
    return axios.isCancel(error)
}

/**
 * 上传文件
 * @param {string} url - 上传URL
 * @param {FormData} formData - 表单数据
 * @param {Function} onProgress - 进度回调
 * @returns {Promise} 上传结果
 */
export async function uploadFile(url, formData, onProgress) {
    return api.post(url, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
            if (onProgress) {
                const percentCompleted = Math.round(
                    (progressEvent.loaded * 100) / progressEvent.total
                )
                onProgress(percentCompleted)
            }
        }
    })
}

/**
 * 下载文件
 * @param {string} url - 下载URL
 * @param {string} filename - 文件名
 * @param {Function} onProgress - 进度回调
 * @returns {Promise} 下载结果
 */
export async function downloadFile(url, filename, onProgress) {
    const response = await api.get(url, {
        responseType: 'blob',
        onDownloadProgress: (progressEvent) => {
            if (onProgress) {
                const percentCompleted = Math.round(
                    (progressEvent.loaded * 100) / progressEvent.total
                )
                onProgress(percentCompleted)
            }
        }
    })

    // 创建下载链接
    const downloadUrl = window.URL.createObjectURL(new Blob([response]))
    const link = document.createElement('a')
    link.href = downloadUrl
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(downloadUrl)

    return response
}

// 导出axios实例供Mock使用
export const axios = api

// 导出axios实例作为默认导出
export default api