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
        component: () => import('../views/Login.vue')
    },
    {
        path: '/dashboard',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/:pathMatch(.*)*',
        redirect: '/login'
    }
]

const router = createRouter({
    history: createWebHashHistory(), // 使用Hash模式
    routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
    console.log('导航到:', to.path)

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

router.onError((error) => {
    console.error('路由错误:', error)
})

export default router