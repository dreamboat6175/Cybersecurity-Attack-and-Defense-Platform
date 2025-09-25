// src/api/index.js - 修复版本，确保正确导出axios实例
import axios from 'axios'
import { DEFAULT_CONFIG } from '@/utils/constants'

// 创建 axios 实例
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '',
    timeout: DEFAULT_CONFIG?.API_TIMEOUT || 30000,
    headers: {
        'Content-Type': 'application/json',
    }
})

// 重试配置
const MAX_RETRY_ATTEMPTS = 3
const RETRY_DELAY = 1000

// 重试函数
async function retryRequest(config, attempt = 1) {
    try {
        const response = await api(config)
        return response
    } catch (error) {
        if (attempt < MAX_RETRY_ATTEMPTS && shouldRetry(error)) {
            console.log(`🔄 API请求失败，${MAX_RETRY_ATTEMPTS - attempt}次重试机会剩余`)
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt))
            return retryRequest(config, attempt + 1)
        }
        throw error
    }
}

// 判断是否应该重试
function shouldRetry(error) {
    // 不重试的情况：认证错误、客户端错误（4xx除404外）
    if (error.response) {
        const status = error.response.status
        return status >= 500 || status === 404 // 只重试服务器错误和404
    }
    // 网络错误或超时，可以重试
    return error.code === 'ECONNABORTED' || error.code === 'NETWORK_ERROR' || !error.response
}

// 请求拦截器
api.interceptors.request.use(
    (config) => {
        // 添加认证token（如果存在）
        const token = localStorage.getItem('auth_token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }

        // 添加请求ID用于追踪
        config.headers['X-Request-ID'] = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

        // 开发环境日志
        if (import.meta.env.DEV) {
            console.log('🚀 API Request:', {
                method: config.method?.toUpperCase(),
                url: config.url,
                data: config.data,
                params: config.params
            })
        }

        return config
    },
    (error) => {
        console.error('❌ Request Error:', error)
        return Promise.reject(error)
    }
)

// 响应拦截器
api.interceptors.response.use(
    (response) => {
        // 开发环境日志
        if (import.meta.env.DEV) {
            console.log('✅ API Response:', {
                status: response.status,
                url: response.config.url,
                data: response.data
            })
        }

        // 统一的响应数据格式处理
        if (response.data && typeof response.data === 'object') {
            // 如果后端返回标准格式: { code, data, message }
            if (response.data.code !== undefined) {
                if (response.data.code === 200 || response.data.code === 0) {
                    return response.data.data || response.data
                } else {
                    throw new Error(response.data.message || '请求失败')
                }
            }
        }

        return response.data
    },
    (error) => {
        console.error('❌ Response Error:', error)

        // 处理不同类型的错误
        if (error.response) {
            const { status, data } = error.response

            switch (status) {
                case 401:
                    // 未授权，清除token并跳转登录
                    localStorage.removeItem('auth_token')
                    if (window.location.pathname !== '/login') {
                        window.location.href = '/login'
                    }
                    break

                case 403:
                    throw new Error('没有权限访问该资源')

                case 404:
                    throw new Error('请求的资源不存在')

                case 500:
                    throw new Error('服务器内部错误')

                default:
                    throw new Error(data?.message || `请求失败 (${status})`)
            }
        } else if (error.request) {
            // 网络错误
            throw new Error('网络连接错误，请检查网络状态')
        } else {
            // 其他错误
            throw new Error(error.message || '请求处理错误')
        }

        return Promise.reject(error)
    }
)

// 导出带重试功能的请求方法
const request = {
    get: (url, config) => retryRequest({ ...config, method: 'get', url }),
    post: (url, data, config) => retryRequest({ ...config, method: 'post', url, data }),
    put: (url, data, config) => retryRequest({ ...config, method: 'put', url, data }),
    delete: (url, config) => retryRequest({ ...config, method: 'delete', url }),
    patch: (url, data, config) => retryRequest({ ...config, method: 'patch', url, data })
}

// 关键修复：确保正确导出axios实例供Mock使用
export { api as axios }  // 导出axios实例供Mock绑定
export default request   // 导出请求方法供应用使用