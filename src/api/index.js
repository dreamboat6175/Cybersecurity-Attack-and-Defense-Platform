// src/api/index.js - 重构版本
// 统一的API请求管理层

import axios from 'axios'
import { API_CONFIG, ERROR_CODES, ERROR_MESSAGES, STORAGE_KEYS } from '@/utils/constants'
import { debounce, safeJSONParse } from '@/utils/helpers'

// ======================
// 配置管理
// ======================

/**
 * 获取API配置
 */
function getApiConfig() {
    return {
        baseURL: import.meta.env.VITE_API_BASE_URL || API_CONFIG.BASE_URL,
        timeout: API_CONFIG.TIMEOUT,
        withCredentials: false,
        ...API_CONFIG
    }
}

/**
 * 创建axios实例
 */
function createApiInstance() {
    const config = getApiConfig()

    const instance = axios.create({
        baseURL: config.baseURL,
        timeout: config.timeout,
        withCredentials: config.withCredentials
    })

    return instance
}

// ======================
// 请求管理
// ======================

/**
 * 请求管理器
 */
class RequestManager {
    constructor() {
        this.pendingRequests = new Map()
        this.requestCount = 0
        this.retryConfig = {
            maxRetries: 3,
            retryDelay: 1000,
            retryCondition: this.shouldRetry.bind(this)
        }
    }

    /**
     * 生成请求标识
     */
    generateRequestId(config) {
        const { method = 'get', url = '', params = {}, data = {} } = config
        const key = `${method.toLowerCase()}_${url}_${JSON.stringify(params)}_${JSON.stringify(data)}`
        return btoa(key).replace(/[/+=]/g, '') // 安全的base64编码
    }

    /**
     * 添加待处理请求
     */
    addPendingRequest(config) {
        const requestId = this.generateRequestId(config)

        // 对于GET请求，检查是否已存在相同请求
        if (config.method?.toLowerCase() === 'get' && this.pendingRequests.has(requestId)) {
            const existingController = this.pendingRequests.get(requestId)
            return existingController // 返回现有请求的控制器
        }

        const controller = new AbortController()
        config.signal = controller.signal

        this.pendingRequests.set(requestId, controller)
        return controller
    }

    /**
     * 移除待处理请求
     */
    removePendingRequest(config) {
        const requestId = this.generateRequestId(config)

        if (this.pendingRequests.has(requestId)) {
            this.pendingRequests.delete(requestId)
        }
    }

    /**
     * 取消所有待处理请求
     */
    cancelAllRequests(reason = 'Request cancelled') {
        this.pendingRequests.forEach((controller) => {
            controller.abort(reason)
        })
        this.pendingRequests.clear()
    }

    /**
     * 判断是否应该重试
     */
    shouldRetry(error) {
        if (!error.response) return true // 网络错误重试

        const status = error.response.status

        // 服务器错误或临时不可用时重试
        return status >= 500 || status === 408 || status === 429
    }

    /**
     * 执行重试请求
     */
    async executeWithRetry(requestFn, config = {}) {
        const { maxRetries, retryDelay } = { ...this.retryConfig, ...config }

        let attempt = 0

        while (attempt <= maxRetries) {
            try {
                return await requestFn()
            } catch (error) {
                if (attempt === maxRetries || !this.retryConfig.retryCondition(error)) {
                    throw error
                }

                const delay = retryDelay * Math.pow(2, attempt) // 指数退避
                await new Promise(resolve => setTimeout(resolve, delay))
                attempt++
            }
        }
    }
}

// ======================
// 错误处理
// ======================

/**
 * 标准化错误对象
 */
class ApiError extends Error {
    constructor(message, code, status, response) {
        super(message)
        this.name = 'ApiError'
        this.code = code
        this.status = status
        this.response = response
        this.timestamp = new Date()
    }

    toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            status: this.status,
            timestamp: this.timestamp
        }
    }
}

/**
 * 错误处理器
 */
class ErrorHandler {
    constructor() {
        this.errorCount = 0
        this.lastError = null
        this.errorCallbacks = new Set()
    }

    /**
     * 注册错误回调
     */
    onError(callback) {
        this.errorCallbacks.add(callback)
        return () => this.errorCallbacks.delete(callback)
    }

    /**
     * 触发错误回调
     */
    triggerErrorCallbacks(error) {
        this.errorCallbacks.forEach(callback => {
            try {
                callback(error)
            } catch (err) {
                console.error('Error in error callback:', err)
            }
        })
    }

    /**
     * 处理API错误
     */
    handle(error) {
        this.errorCount++
        this.lastError = error

        let apiError

        if (axios.isCancel(error)) {
            // 请求被取消
            apiError = new ApiError('请求已取消', 'REQUEST_CANCELLED', 0, null)
        } else if (error.response) {
            // 服务器响应错误
            const { status, data } = error.response
            const message = this.getErrorMessage(status, data)
            const code = this.getErrorCode(status)

            apiError = new ApiError(message, code, status, error.response)

            // 处理特殊状态码
            this.handleSpecialStatusCode(status)

        } else if (error.request) {
            // 网络错误
            apiError = new ApiError(
                ERROR_MESSAGES[ERROR_CODES.NETWORK_ERROR],
                ERROR_CODES.NETWORK_ERROR,
                0,
                null
            )
        } else {
            // 其他错误
            apiError = new ApiError(
                error.message || '未知错误',
                ERROR_CODES.SERVER_ERROR,
                0,
                null
            )
        }

        // 记录错误
        this.logError(apiError)

        // 触发错误回调
        this.triggerErrorCallbacks(apiError)

        return apiError
    }

    /**
     * 获取错误消息
     */
    getErrorMessage(status, data) {
        // 优先使用服务器返回的错误消息
        if (data?.message) return data.message
        if (data?.error) return data.error

        // 使用状态码对应的默认消息
        const code = this.getErrorCode(status)
        return ERROR_MESSAGES[code] || '未知错误'
    }

    /**
     * 获取错误代码
     */
    getErrorCode(status) {
        switch (status) {
            case 400: return ERROR_CODES.VALIDATION_ERROR
            case 401: return ERROR_CODES.AUTH_FAILED
            case 403: return ERROR_CODES.PERMISSION_DENIED
            case 404: return ERROR_CODES.RESOURCE_NOT_FOUND
            case 408: return ERROR_CODES.TIMEOUT_ERROR
            case 429: return ERROR_CODES.TIMEOUT_ERROR
            case 500:
            case 502:
            case 503:
            case 504: return ERROR_CODES.SERVER_ERROR
            default: return ERROR_CODES.SERVER_ERROR
        }
    }

    /**
     * 处理特殊状态码
     */
    handleSpecialStatusCode(status) {
        switch (status) {
            case 401:
                // 认证失败，清除本地token
                this.clearAuthToken()
                this.redirectToLogin()
                break
            case 403:
                // 权限不足，可以显示提示
                console.warn('权限不足')
                break
        }
    }

    /**
     * 清除认证token
     */
    clearAuthToken() {
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
        localStorage.removeItem(STORAGE_KEYS.USER_INFO)
    }

    /**
     * 跳转到登录页
     */
    redirectToLogin = debounce(() => {
        if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login'
        }
    }, 1000)

    /**
     * 记录错误
     */
    logError(error) {
        if (import.meta.env.DEV) {
            console.group('🚨 API Error')
            console.error('Error:', error)
            console.error('Details:', error.response?.data)
            console.error('Config:', error.response?.config)
            console.groupEnd()
        }
    }

    /**
     * 获取错误统计
     */
    getStats() {
        return {
            errorCount: this.errorCount,
            lastError: this.lastError
        }
    }

    /**
     * 重置统计
     */
    resetStats() {
        this.errorCount = 0
        this.lastError = null
    }
}

// ======================
// API类
// ======================

/**
 * API客户端类
 */
class ApiClient {
    constructor() {
        this.instance = createApiInstance()
        this.requestManager = new RequestManager()
        this.errorHandler = new ErrorHandler()

        this.setupInterceptors()
    }

    /**
     * 设置拦截器
     */
    setupInterceptors() {
        // 请求拦截器
        this.instance.interceptors.request.use(
            (config) => {
                // 添加认证头
                this.addAuthHeader(config)

                // 添加请求ID和时间戳
                config.metadata = {
                    requestId: this.generateRequestId(),
                    startTime: Date.now()
                }

                // 管理请求重复
                this.requestManager.addPendingRequest(config)

                // 记录请求日志
                this.logRequest(config)

                return config
            },
            (error) => {
                return Promise.reject(this.errorHandler.handle(error))
            }
        )

        // 响应拦截器
        this.instance.interceptors.response.use(
            (response) => {
                // 移除待处理请求
                this.requestManager.removePendingRequest(response.config)

                // 记录响应日志
                this.logResponse(response)

                // 标准化响应数据
                return this.normalizeResponse(response)
            },
            (error) => {
                // 移除待处理请求
                if (error.config) {
                    this.requestManager.removePendingRequest(error.config)
                }

                // 处理错误
                const apiError = this.errorHandler.handle(error)
                return Promise.reject(apiError)
            }
        )
    }

    /**
     * 添加认证头
     */
    addAuthHeader(config) {
        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
        if (token) {
            config.headers = {
                ...config.headers,
                'Authorization': `Bearer ${token}`
            }
        }
    }

    /**
     * 生成请求ID
     */
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    /**
     * 标准化响应数据
     */
    normalizeResponse(response) {
        const { data, status, statusText, config } = response

        // 计算响应时间
        const responseTime = config.metadata ?
            Date.now() - config.metadata.startTime : 0

        // 如果是标准的API响应格式
        if (data && typeof data === 'object') {
            if (data.success !== undefined) {
                return {
                    ...data,
                    _meta: {
                        status,
                        statusText,
                        responseTime,
                        requestId: config.metadata?.requestId
                    }
                }
            }
        }

        // 返回原始数据
        return {
            data,
            success: true,
            _meta: {
                status,
                statusText,
                responseTime,
                requestId: config.metadata?.requestId
            }
        }
    }

    /**
     * 记录请求日志
     */
    logRequest(config) {
        if (import.meta.env.DEV) {
            console.log(
                `📤 API Request [${config.metadata.requestId}]:`,
                `${config.method?.toUpperCase()} ${config.url}`,
                config.params || config.data || ''
            )
        }
    }

    /**
     * 记录响应日志
     */
    logResponse(response) {
        if (import.meta.env.DEV) {
            const requestId = response.config.metadata?.requestId
            const responseTime = response.config.metadata ?
                Date.now() - response.config.metadata.startTime : 0

            console.log(
                `📥 API Response [${requestId}]:`,
                `${response.status} (${responseTime}ms)`,
                response.data
            )
        }
    }

    /**
     * 通用请求方法
     */
    async request(config) {
        return this.requestManager.executeWithRetry(() => {
            return this.instance(config)
        })
    }

    /**
     * GET请求
     */
    async get(url, config = {}) {
        return this.request({
            method: 'get',
            url,
            ...config
        })
    }

    /**
     * POST请求
     */
    async post(url, data = {}, config = {}) {
        return this.request({
            method: 'post',
            url,
            data,
            ...config
        })
    }

    /**
     * PUT请求
     */
    async put(url, data = {}, config = {}) {
        return this.request({
            method: 'put',
            url,
            data,
            ...config
        })
    }

    /**
     * PATCH请求
     */
    async patch(url, data = {}, config = {}) {
        return this.request({
            method: 'patch',
            url,
            data,
            ...config
        })
    }

    /**
     * DELETE请求
     */
    async delete(url, config = {}) {
        return this.request({
            method: 'delete',
            url,
            ...config
        })
    }

    /**
     * 上传文件
     */
    async upload(url, file, config = {}) {
        const formData = new FormData()
        formData.append('file', file)

        return this.request({
            method: 'post',
            url,
            data: formData,
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            ...config
        })
    }

    /**
     * 下载文件
     */
    async download(url, config = {}) {
        return this.request({
            method: 'get',
            url,
            responseType: 'blob',
            ...config
        })
    }

    /**
     * 取消请求
     */
    cancelRequests(reason) {
        this.requestManager.cancelAllRequests(reason)
    }

    /**
     * 注册错误处理器
     */
    onError(callback) {
        return this.errorHandler.onError(callback)
    }

    /**
     * 获取统计信息
     */
    getStats() {
        return {
            requests: this.requestManager.requestCount,
            errors: this.errorHandler.getStats(),
            pendingRequests: this.requestManager.pendingRequests.size
        }
    }

    /**
     * 重置统计信息
     */
    resetStats() {
        this.requestManager.requestCount = 0
        this.errorHandler.resetStats()
    }
}

// ======================
// 导出
// ======================

// 创建默认实例
const api = new ApiClient()

// 开发环境下暴露到全局
if (import.meta.env.DEV) {
    window.__API__ = api
}

export default api
export { ApiClient, ApiError }