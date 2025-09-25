// src/router/index.js - 临时简化版本
import { createRouter, createWebHistory } from 'vue-router'

// 路由组件（懒加载）
const Dashboard = () => import('@/views/Dashboard.vue')
const Login = () => import('@/views/Login.vue')

// 路由定义 - 暂时移除认证检查
const routes = [
    {
        path: '/',
        name: 'root',
        redirect: '/login' // 暂时直接跳转到登录页
    },
    {
        path: '/dashboard',
        name: 'dashboard',
        component: Dashboard,
        meta: {
            title: '仪表盘'
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
        redirect: '/login' // 404时重定向到登录页
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

// 简化的路由守卫 - 暂时只设置页面标题
router.beforeEach((to, from, next) => {
    // 设置页面标题
    const baseTitle = '网络安全攻防平台'
    document.title = to.meta.title ? `${to.meta.title} - ${baseTitle}` : baseTitle

    console.log(`🧭 路由导航: ${from.path} -> ${to.path}`)

    // 直接放行，不做认证检查
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