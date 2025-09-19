import axios from 'axios'

// 创建 axios 实例
const api = axios.create({
    baseURL: '/api',
    timeout: 10000,
})

// 请求拦截器
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => Promise.reject(error)
)

// 响应拦截器
api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        console.error('API Error:', error)
        return Promise.reject(error)
    }
)

// API 方法
export const authAPI = {
    login: (data: { username: string; password: string }) =>
        api.post('/auth/login', data),

    getUserInfo: () =>
        api.get('/auth/me'),
}

export const dashboardAPI = {
    getOverview: () =>
        api.get('/dashboard/overview'),

    getNetworkStatus: () =>
        api.get('/dashboard/network'),
}

export default api