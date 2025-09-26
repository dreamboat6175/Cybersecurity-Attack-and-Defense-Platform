// src/api/index.js - 修复版本
import axios from 'axios'

// ======================
// 基础配置
// ======================

const API_CONFIG = {
    BASE_URL: import.meta.env.VITE_API_BASE_URL || 'api',
    TIMEOUT: 10000,
    RETRY_COUNT: 3,
    RETRY_DELAY: 1000
}

// ======================
// 创建axios实例
// ======================

const axiosInstance = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    withCredentials: false,
    headers: {
        'Content-Type': 'application/json'
    }
})

// ======================
// 请求拦截器
// ======================

axiosInstance.interceptors.request.use(
    (config) => {
        // 添加认证token
        const token = localStorage.getItem('auth_token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }

        // 添加请求ID用于日志追踪
        config.metadata = {
            requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            startTime: Date.now()
        }

        // 开发环境日志
        if (import.meta.env.DEV) {
            console.log(`📤 API Request [${config.metadata.requestId}]:`, `${config.method?.toUpperCase()} ${config.url}`)
        }

        return config
    },
    (error) => {
        console.error('❌ 请求配置错误:', error)
        return Promise.reject(error)
    }
)

// ======================
// 响应拦截器
// ======================

axiosInstance.interceptors.response.use(
    (response) => {
        const { config } = response
        const responseTime = config.metadata ? Date.now() - config.metadata.startTime : 0

        // 开发环境日志
        if (import.meta.env.DEV) {
            const requestId = config.metadata?.requestId
            console.log(`📥 API Response [${requestId}]:`, `${response.status} (${responseTime}ms)`)
        }

        // 统一响应格式
        if (response.data && typeof response.data === 'object') {
            return {
                ...response.data,
                _meta: {
                    status: response.status,
                    responseTime,
                    requestId: config.metadata?.requestId
                }
            }
        }

        return response.data
    },
    (error) => {
        console.error('🚨 API Error')
        console.error(' Error:', error.response?.data || error.message)
        console.error(' Details:', error.response?.status)
        console.error(' Config:', error.config?.url)

        // 处理不同类型的错误
        if (error.response) {
            // 服务器响应错误
            const { status, data } = error.response

            if (status === 401) {
                // 清除过期的认证信息
                localStorage.removeItem('auth_token')
                localStorage.removeItem('user_info')
                // 可以在这里触发重新登录
                window.location.href = '/login'
                return Promise.reject(new Error('认证已过期，请重新登录'))
            }

            if (status === 403) {
                return Promise.reject(new Error('权限不足'))
            }

            if (status >= 500) {
                return Promise.reject(new Error('服务器错误'))
            }

            return Promise.reject(new Error(data?.message || '请求失败'))
        } else if (error.request) {
            // 网络错误
            return Promise.reject(new Error('网络连接失败'))
        } else {
            // 其他错误
            return Promise.reject(new Error(error.message || '未知错误'))
        }
    }
)

// ======================
// API方法封装
// ======================

const api = {
    // GET请求
    get(url, params = {}, config = {}) {
        return axiosInstance.get(url, { params, ...config })
    },

    // POST请求
    post(url, data = {}, config = {}) {
        return axiosInstance.post(url, data, config)
    },

    // PUT请求
    put(url, data = {}, config = {}) {
        return axiosInstance.put(url, data, config)
    },

    // DELETE请求
    delete(url, config = {}) {
        return axiosInstance.delete(url, config)
    },

    // 上传文件
    upload(url, formData, config = {}) {
        return axiosInstance.post(url, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            ...config
        })
    },

    // 下载文件
    download(url, config = {}) {
        return axiosInstance.get(url, {
            responseType: 'blob',
            ...config
        })
    }
}

// ======================
// 导出
// ======================

export default api
export { axiosInstance as axios }