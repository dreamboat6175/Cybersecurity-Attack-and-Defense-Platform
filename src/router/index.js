// router/index.js - 路由配置
import { createRouter, createWebHistory } from 'vue-router'

// 页面组件
const Login = () => import('@/views/Login.vue')
const CyberSecurityDashboard = () => import('@/views/CyberSecurityDashboard.vue')

// 路由配置
const routes = [
    {
        path: '/',
        name: 'Root',
        redirect: { name: 'Login' }
    },
    {
        path: '/login',
        name: 'Login',
        component: Login,
        meta: {
            title: '用户登录',
            requiresAuth: false
        }
    },
    {
        path: '/dashboard',
        name: 'Dashboard',
        component: CyberSecurityDashboard,
        meta: {
            title: '网络安全监控',
            requiresAuth: true
        }
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        redirect: { name: 'Login' }
    }
]

// 创建路由实例
const router = createRouter({
    history: createWebHistory(),
    routes
})

// 认证守卫
const checkAuth = () => {
    const token = localStorage.getItem('auth_token')
    return !!token
}

// 路由守卫
router.beforeEach((to, from, next) => {
    // 更新页面标题
    document.title = to.meta.title ? `${to.meta.title} - 网络安全攻防平台` : '网络安全攻防平台'

    // 检查是否需要认证
    if (to.meta.requiresAuth) {
        if (checkAuth()) {
            next()
        } else {
            // 保存原始路由，登录后跳转
            localStorage.setItem('redirect_after_login', to.fullPath)
            next({ name: 'Login' })
        }
    } else {
        // 如果已登录且访问登录页，重定向到仪表板
        if (to.name === 'Login' && checkAuth()) {
            const redirectPath = localStorage.getItem('redirect_after_login') || '/dashboard'
            localStorage.removeItem('redirect_after_login')
            next(redirectPath)
        } else {
            next()
        }
    }
})

// 路由错误处理
router.onError((error) => {
    console.error('路由错误:', error)

    // 处理代码分割加载失败
    if (error.message.includes('Loading chunk')) {
        window.location.reload()
    }
})

export default router

// 导出常量
export const ROUTE_NAMES = {
    ROOT: 'Root',
    LOGIN: 'Login',
    DASHBOARD: 'Dashboard',
    NOT_FOUND: 'NotFound'
}

export const ROUTE_PATHS = {
    ROOT: '/',
    LOGIN: '/login',
    DASHBOARD: '/dashboard'
}