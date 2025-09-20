// src/router/index.ts
import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
    {
        path: '/',
        redirect: '/login'
    },
    {
        path: '/login',
        name: 'Login',
        component: () => import('../views/Login.vue'),
        meta: {
            title: '登录 - CBTC系统监控平台'
        }
    },
    {
        path: '/dashboard',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue'),
        meta: {
            requiresAuth: true,
            title: '控制台 - CBTC系统监控平台'
        }
    },
    {
        path: '/topology',
        name: 'SystemTopology',
        component: () => import('../views/SystemTopology.vue'),
        meta: {
            requiresAuth: true,
            title: '系统拓扑 - CBTC系统监控平台'
        }
    },
    {
        path: '/subsystem/:type/:id',
        name: 'SubsystemDetail',
        component: () => import('../views/SubsystemDetail.vue'),
        meta: {
            requiresAuth: true,
            title: '子系统详情 - CBTC系统监控平台'
        },
        props: true
    },
    // 重定向旧的路由
    {
        path: '/system-topology',
        redirect: '/topology'
    },
    // 404页面
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: () => import('../views/NotFound.vue'),
        meta: {
            title: '页面未找到 - CBTC系统监控平台'
        }
    }
]

const router = createRouter({
    history: createWebHashHistory(), // 使用Hash模式避免服务器配置问题
    routes,
    scrollBehavior(to, from, savedPosition) {
        // 路由切换时的滚动行为
        if (savedPosition) {
            return savedPosition
        } else {
            return { top: 0 }
        }
    }
})

// 全局前置守卫
router.beforeEach((to, from, next) => {
    console.log('Navigation:', from.path, '->', to.path)

    // 设置页面标题
    if (to.meta.title) {
        document.title = to.meta.title as string
    }

    const token = localStorage.getItem('token')

    // 检查认证
    if (to.meta.requiresAuth && !token) {
        console.log('Authentication required, redirecting to login')
        next('/login')
    } else if (to.path === '/login' && token) {
        console.log('Already authenticated, redirecting to topology')
        next('/topology') // 默认进入拓扑视图而不是dashboard
    } else {
        console.log('Navigation allowed')
        next()
    }
})

// 全局后置钩子
router.afterEach((to, from) => {
    console.log('Navigation completed:', to.path)

    // 这里可以添加页面访问统计
    // analytics.track('page_view', { path: to.path })
})

// 路由错误处理
router.onError((error) => {
    console.error('Router error:', error)

    // 这里可以添加错误上报
    // errorReporting.captureException(error)
})

export default router