// src/router/index.js - 简化版本
// 基于现有组件的路由配置

import { createRouter, createWebHistory } from 'vue-router'
// src/router/index.js - 简化版本
// 基于现有组件的路由配置

import { createRouter, createWebHistory } from 'vue-router'

// ======================
// 路由组件定义 (懒加载)
// ======================

// 现有的页面组件
const CyberSecurityDashboard = () => import('@/views/CyberSecurityDashboard.vue')
const Login = () => import('@/views/Login.vue')

// ======================
// 路由配置
// ======================

/**
 * 路由定义
 */
const routes = [
    // 根路由 - 重定向到登录页
    {
        path: '/',
        name: 'Root',
        redirect: { name: 'Login' }
    },

    // 登录页
    {
        path: '/login',
        name: 'Login',
        component: Login,
        meta: {
            title: '用户登录',
            requiresAuth: false
        }
    },

    // 网络安全监控面板 - 主要功能页面
    {
        path: '/dashboard',
        name: 'Dashboard',
        component: CyberSecurityDashboard,
        meta: {
            title: '网络安全监控',
            requiresAuth: true
        }
    },

    // 网络安全监控面板 - 别名路由 (向后兼容)
    {
        path: '/cybersec',
        name: 'CyberSec',
        component: CyberSecurityDashboard,
        meta: {
            title: '网络安全监控',
            requiresAuth: true
        }
    },

    // 404页面 - 重定向到登录页
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        redirect: { name: 'Login' },
        meta: {
            title: '页面不存在',
            requiresAuth: false
        }
    }
]

// ======================
// 认证检查器
// ======================

/**
 * 简化的认证检查器
 */
class SimpleAuthGuard {
    /**
     * 检查是否已认证
     */
    isAuthenticated() {
        const token = localStorage.getItem('auth_token')
        return !!token
    }

    /**
     * 清除认证信息
     */
    clearAuth() {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user_info')
    }
}

// ======================
// 创建路由实例
// ======================

/**
 * 创建路由实例
 */
const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior(to, from, savedPosition) {
        if (savedPosition) {
            return savedPosition
        }
        return { top: 0, left: 0 }
    }
})

// ======================
// 设置路由守卫
// ======================

// 创建守卫实例
const authGuard = new SimpleAuthGuard()

/**
 * 全局前置守卫
 */
router.beforeEach(async (to, from, next) => {
    try {
        // 设置页面标题
        const baseTitle = '网络安全攻防平台'
        document.title = to.meta?.title ? `${to.meta.title} - ${baseTitle}` : baseTitle

        console.log(`🧭 路由导航: ${from.path || 'initial'} → ${to.path}`)

        // 检查认证状态
        if (to.meta?.requiresAuth) {
            if (!authGuard.isAuthenticated()) {
                console.log('❌ 未授权访问，跳转到登录页')

                // 保存原始路由，登录后跳转
                if (to.path !== '/login') {
                    localStorage.setItem('redirect_after_login', to.fullPath)
                }

                next({ name: 'Login' })
                return
            }
        }

        // 如果访问登录页但已登录，重定向到仪表板
        if (to.name === 'Login' && authGuard.isAuthenticated()) {
            const redirectPath = localStorage.getItem('redirect_after_login') || '/dashboard'
            localStorage.removeItem('redirect_after_login')
            console.log(`✅ 已登录，重定向到: ${redirectPath}`)
            next(redirectPath)
            return
        }

        next()

    } catch (error) {
        console.error('❌ 路由守卫错误:', error)
        next({ name: 'Login' })
    }
})

/**
 * 全局后置钩子
 */
router.afterEach((to, from, failure) => {
    // 处理导航失败
    if (failure) {
        console.error('❌ 路由导航失败:', failure)
    } else {
        console.log(`✅ 路由导航完成: ${to.path}`)
    }
})

/**
 * 路由错误处理
 */
router.onError((error) => {
    console.error('❌ 路由错误:', error)

    // 处理代码分割加载失败
    if (error.message.includes('Loading chunk')) {
        console.log('🔄 检测到代码分割加载失败，刷新页面')
        window.location.reload()
    }
})

// ======================
// 开发环境调试
// ======================

if (import.meta.env.DEV) {
    window.__ROUTER__ = router
    window.__AUTH_GUARD__ = authGuard
}

// ======================
// 导出
// ======================

export default router

export { routes, authGuard }

// ======================
// 路由组件定义 (懒加载)
// ======================

// 现有的页面组件
const CyberSecurityDashboard = () => import('@/views/CyberSecurityDashboard.vue')
const Login = () => import('@/views/Login.vue')

// ======================
// 路由配置
// ======================

/**
 * 路由定义
 */
const routes = [
    // 根路由 - 重定向到登录页
    {
        path: '/',
        name: 'Root',
        redirect: { name: 'Login' }
    },

    // 登录页
    {
        path: '/login',
        name: 'Login',
        component: Login,
        meta: {
            title: '用户登录',
            requiresAuth: false,
            hidden: true
        }
    },

    // 网络安全监控面板 - 主要功能页面
    {
        path: '/dashboard',
        name: 'Dashboard',
        component: CyberSecurityDashboard,
        meta: {
            title: '网络安全监控',
            requiresAuth: true,
            permissions: ['dashboard:view'],
            keepAlive: true,
            icon: 'shield'
        }
    },

    // 网络安全监控面板 - 别名路由 (向后兼容)
    {
        path: '/cybersec',
        name: 'CyberSec',
        component: CyberSecurityDashboard,
        meta: {
            title: '网络安全监控',
            requiresAuth: true,
            permissions: ['dashboard:view'],
            keepAlive: true,
            hidden: true // 在导航中隐藏别名路由
        }
    },

    // 404页面 - 重定向到登录页
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        redirect: { name: 'Login' },
        meta: {
            title: '页面不存在',
            requiresAuth: false,
            hidden: true
        }
    }
]

// ======================
// 认证检查器
// ======================

/**
 * 简化的认证检查器
 */
class SimpleAuthGuard {
    constructor() {
        this.whiteList = ['Login', 'NotFound'] // 白名单路由
    }

    /**
     * 检查是否已认证
     */
    isAuthenticated() {
        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
        return !!token
    }

    /**
     * 清除认证信息
     */
    clearAuth() {
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
        localStorage.removeItem(STORAGE_KEYS.USER_INFO)
    }

    /**
     * 检查路由访问权限
     */
    canAccess(to) {
        const { meta = {} } = to

        // 白名单路由直接通过
        if (this.whiteList.includes(to.name)) {
            return { allowed: true }
        }

        // 不需要认证的路由
        if (!meta.requiresAuth) {
            return { allowed: true }
        }

        // 检查认证状态
        if (!this.isAuthenticated()) {
            return {
                allowed: false,
                reason: 'NOT_AUTHENTICATED',
                redirect: { name: 'Login' }
            }
        }

        return { allowed: true }
    }
}

// ======================
// 页面标题管理器
// ======================

/**
 * 页面标题管理器
 */
class TitleManager {
    constructor() {
        this.baseTitle = '网络安全攻防平台'
        this.separator = ' - '
    }

    /**
     * 从路由更新标题
     */
    updateFromRoute(to) {
        const title = to.meta?.title
        if (title) {
            document.title = `${title}${this.separator}${this.baseTitle}`
        } else {
            document.title = this.baseTitle
        }
    }
}

// ======================
// 创建路由实例
// ======================

/**
 * 创建路由实例
 */
const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior(to, from, savedPosition) {
        if (savedPosition) {
            return savedPosition
        }
        if (to.hash) {
            return { el: to.hash, behavior: 'smooth' }
        }
        return { top: 0, left: 0 }
    }
})

// ======================
// 设置路由守卫
// ======================

// 创建守卫实例
const authGuard = new SimpleAuthGuard()
const titleManager = new TitleManager()

/**
 * 全局前置守卫
 */
router.beforeEach(async (to, from, next) => {
    try {
        console.log(`🧭 路由导航: ${from.path || 'initial'} → ${to.path}`)

        // 检查路由访问权限
        const accessCheck = authGuard.canAccess(to)

        if (!accessCheck.allowed) {
            console.log(`❌ 访问被拒绝: ${accessCheck.reason}`)

            // 处理认证失败
            if (accessCheck.reason === 'NOT_AUTHENTICATED' && to.path !== '/login') {
                // 保存原始路由，登录后跳转
                localStorage.setItem('redirect_after_login', to.fullPath)
            }

            next(accessCheck.redirect)
            return
        }

        // 如果访问登录页但已登录，重定向到仪表板
        if (to.name === 'Login' && authGuard.isAuthenticated()) {
            const redirectPath = localStorage.getItem('redirect_after_login') || '/dashboard'
            localStorage.removeItem('redirect_after_login')
            console.log(`✅ 已登录，重定向到: ${redirectPath}`)
            next(redirectPath)
            return
        }

        next()

    } catch (error) {
        console.error('❌ 路由守卫错误:', error)
        next({ name: 'Login' })
    }
})

/**
 * 全局后置钩子
 */
router.afterEach((to, from, failure) => {
    // 更新页面标题
    titleManager.updateFromRoute(to)

    // 处理导航失败
    if (failure) {
        console.error('❌ 路由导航失败:', failure)
    } else {
        console.log(`✅ 路由导航完成: ${to.path}`)
    }
})

/**
 * 路由错误处理
 */
router.onError((error) => {
    console.error('❌ 路由错误:', error)

    // 处理代码分割加载失败
    if (error.message.includes('Loading chunk')) {
        console.log('🔄 检测到代码分割加载失败，刷新页面')
        window.location.reload()
    }
})

// ======================
// 开发环境调试
// ======================

if (import.meta.env.DEV) {
    window.__ROUTER__ = router
    window.__AUTH_GUARD__ = authGuard
    window.__TITLE_MANAGER__ = titleManager
}

// ======================
// 导出
// ======================

export default router

export {
    routes,
    authGuard,
    titleManager
}

// 路由名称常量
export const ROUTE_NAMES = {
    ROOT: 'Root',
    LOGIN: 'Login',
    DASHBOARD: 'Dashboard',
    CYBER_SEC: 'CyberSec',
    NOT_FOUND: 'NotFound'
}

// 路由路径常量
export const ROUTE_PATHS = {
    ROOT: '/',
    LOGIN: '/login',
    DASHBOARD: '/dashboard',
    CYBER_SEC: '/cybersec'
}