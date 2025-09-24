// 路由配置
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// 路由组件（懒加载）
const Dashboard = () => import('@/views/Dashboard.vue')
const Login = () => import('@/views/Login.vue')

// 路由定义
const routes = [
    {
        path: '/',
        name: 'root',
        redirect: '/dashboard'
    },
    {
        path: '/dashboard',
        name: 'dashboard',
        component: Dashboard,
        meta: {
            requiresAuth: true,
            title: '仪表盘'
        }
    },
    {
        path: '/login',
        name: 'login',
        component: Login,
        meta: {
            requiresAuth: false,
            title: '登录',
            hideForAuth: true // 已登录用户隐藏
        }
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'notFound',
        redirect: '/dashboard'
    }
]

// 创建路由实例
const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior(to, from, savedPosition) {
        // 页面切换时滚动行为
        if (savedPosition) {
            return savedPosition
        } else {
            return { top: 0 }
        }
    }
})

// 全局前置守卫
router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore()

    // 设置页面标题
    const baseTitle = import.meta.env.VITE_APP_TITLE || '网络安全攻防平台'
    document.title = to.meta.title ? `${to.meta.title} - ${baseTitle}` : baseTitle

    console.log(`🧭 路由导航: ${from.path} -> ${to.path}`)

    // 检查认证状态
    if (to.meta.requiresAuth) {
        // 需要认证的页面
        if (!authStore.isAuthenticated) {
            console.log('🔐 未认证，重定向到登录页')
            next({
                name: 'login',
                query: { redirect: to.fullPath }
            })
            return
        }

        // 验证token有效性
        try {
            const isValid = await authStore.validateToken()
            if (!isValid) {
                console.log('🔐 Token无效，重定向到登录页')
                next({
                    name: 'login',
                    query: { redirect: to.fullPath }
                })
                return
            }
        } catch (error) {
            console.error('❌ Token验证失败:', error)
            next({
                name: 'login',
                query: { redirect: to.fullPath }
            })
            return
        }
    } else if (to.meta.hideForAuth && authStore.isAuthenticated) {
        // 已登录用户不应访问的页面（如登录页）
        console.log('👤 已登录，重定向到仪表盘')
        next({ name: 'dashboard' })
        return
    }

    next()
})

// 全局后置钩子
router.afterEach((to, from) => {
    console.log(`✅ 路由导航完成: ${to.path}`)

    // 这里可以添加页面访问统计等逻辑
    if (import.meta.env.PROD) {
        // 生产环境下的统计代码
        // analytics.track('page_view', { path: to.path })
    }
})

// 路由错误处理
router.onError((error) => {
    console.error('❌ 路由错误:', error)

    // 可以在这里添加错误上报逻辑
    // errorReporting.captureException(error)
})

export default router