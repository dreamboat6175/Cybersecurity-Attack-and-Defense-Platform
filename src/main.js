// src/main.js - 应用入口文件
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'

import App from './App.vue'

// 导入页面组件
const CyberSecurityDashboard = () => import('./views/CyberSecurityDashboard.vue')
const Login = () => import('./views/Login.vue')

// 路由配置
const routes = [
    {
        path: '/',
        redirect: '/login'
    },
    {
        path: '/login',
        name: 'Login',
        component: Login
    },
    {
        path: '/cybersec',
        name: 'CyberSec',
        component: CyberSecurityDashboard
    },
    {
        path: '/dashboard',
        name: 'Dashboard',
        component: CyberSecurityDashboard
    }
]

// 创建路由实例
const router = createRouter({
    history: createWebHistory(),
    routes
})

// 创建Pinia状态管理
const pinia = createPinia()

// 初始化Mock数据
async function initializeMock() {
    try {
        if (import.meta.env.VITE_USE_MOCK === 'true') {
            const { initializeMock } = await import('./mock/index.js')
            await initializeMock()
            console.log('✅ Mock环境初始化完成')
        }
    } catch (error) {
        console.warn('⚠️ Mock初始化失败，将使用默认数据:', error)
    }
}

// 创建应用实例
const app = createApp(App)

// 注册插件
app.use(pinia)
app.use(router)

// 初始化并启动应用
async function bootstrap() {
    try {
        // 初始化Mock数据
        await initializeMock()

        // 挂载应用
        app.mount('#app')

        console.log('🚀 网络安全攻防平台启动成功')
        console.log('📊 当前环境:', import.meta.env.MODE)
        console.log('🔧 Mock模式:', import.meta.env.VITE_USE_MOCK === 'true' ? '已启用' : '已禁用')

    } catch (error) {
        console.error('❌ 应用启动失败:', error)

        // 降级启动，不使用Mock
        app.mount('#app')
        console.log('🔄 应用已降级启动')
    }
}

// 启动应用
bootstrap()