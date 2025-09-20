import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
    {
        path: '/',
        redirect: '/login' // 先重定向到 login 页面，确保有内容显示
    },
    {
        path: '/login',
        name: 'Login',
        component: () => import('../views/Login.vue')
    },
    {
        path: '/dashboard',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue'),
        meta: { requiresAuth: true }
    },
    // 添加一个 catch-all 路由来处理 404
    {
        path: '/:pathMatch(.*)*',
        redirect: '/login'
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// 简化的路由守卫，先确保基本功能正常
router.beforeEach((to, from, next) => {
    console.log('导航到:', to.path) // 添加调试信息

    const token = localStorage.getItem('token')

    if (to.meta.requiresAuth && !token) {
        console.log('需要认证，重定向到登录')
        next('/login')
    } else if (to.path === '/login' && token) {
        console.log('已登录，重定向到仪表板')
        next('/dashboard')
    } else {
        console.log('正常导航')
        next()
    }
})

// 添加路由错误处理
router.onError((error) => {
    console.error('路由错误:', error)
})

export default router