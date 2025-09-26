// src/router/index.js - 更新路由配置
import { createRouter, createWebHistory } from 'vue-router'

// 路由组件（懒加载）
const Dashboard = () => import('@/views/Dashboard.vue')
const CyberSecurityDashboard = () => import('@/views/CyberSecurityDashboard.vue')
const Login = () => import('@/views/Login.vue')

// 路由定义
const routes = [
    {
        path: '/',
        name: 'root',
        redirect: '/login'
    },
    {
        path: '/dashboard',
        name: 'dashboard',
        component: Dashboard,
        meta: {
            title: '仪表盘',
            requiresAuth: true
        }
    },
    {
        path: '/cybersec',
        name: 'cybersec',
        component: CyberSecurityDashboard,
        meta: {
            title: '网络安全监控',
            requiresAuth: true
        }
    },
    {
        path: '/login',
        name: 'login',
        component: Login,
        meta: {
            title: '登录'
        }
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'notFound',
        redirect: '/login'
    }
]

// 创建路由实例
const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior(to, from, savedPosition) {
        if (savedPosition) {
            return savedPosition
        } else {
            return { top: 0 }
        }
    }
})

// 路由守卫
router.beforeEach((to, from, next) => {
    // 设置页面标题
    const baseTitle = '网络安全攻防平台'
    document.title = to.meta.title ? `${to.meta.title} - ${baseTitle}` : baseTitle

    console.log(`🧭 路由导航: ${from.path} -> ${to.path}`)

    // 简化的认证检查
    if (to.meta.requiresAuth) {
        const token = localStorage.getItem('auth_token')
        if (!token) {
            console.log('❌ 未授权访问，跳转到登录页')
            next('/login')
            return
        }
    }

    next()
})

// 全局后置钩子
router.afterEach((to, from) => {
    console.log(`✅ 路由导航完成: ${to.path}`)
})

// 路由错误处理
router.onError((error) => {
    console.error('❌ 路由错误:', error)
})

export default router