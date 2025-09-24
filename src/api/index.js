// API 配置和拦截器
import axios from 'axios'
import { DEFAULT_CONFIG } from '@/utils/constants'

// 创建 axios 实例
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: DEFAULT_CONFIG.API_TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
    }
})

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
                    window.location.href = '/login'
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
            throw new Error(error.message || '未知错误')
        }
    }
)

// 重试机制
const retryRequest = async (requestFn, retries = DEFAULT_CONFIG.API_RETRY_TIMES) => {
    try {
        return await requestFn()
    } catch (error) {
        if (retries > 0 && shouldRetry(error)) {
            console.warn(`🔄 API请求失败，${retries}次重试机会剩余`)
            await sleep(1000) // 等待1秒后重试
            return retryRequest(requestFn, retries - 1)
        }
        throw error
    }
}

// 判断是否应该重试
const shouldRetry = (error) => {
    // 网络错误或5xx服务器错误才重试
    return !error.response || (error.response.status >= 500)
}

// 工具函数：等待
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// 请求方法封装
export const request = {
    // GET 请求
    get: (url, params = {}, config = {}) => {
        return retryRequest(() => api.get(url, { params, ...config }))
    },

    // POST 请求
    post: (url, data = {}, config = {}) => {
        return retryRequest(() => api.post(url, data, config))
    },

    // PUT 请求
    put: (url, data = {}, config = {}) => {
        return retryRequest(() => api.put(url, data, config))
    },

    // DELETE 请求
    delete: (url, config = {}) => {
        return retryRequest(() => api.delete(url, config))
    },

    // PATCH 请求
    patch: (url, data = {}, config = {}) => {
        return retryRequest(() => api.patch(url, data, config))
    }
}

// 导出 axios 实例（用于特殊需求）
export { api }
export default request