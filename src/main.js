// src/main.js - 修复版本，确保Mock完全初始化后再挂载应用
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import pinia from './stores'

// 导入全局样式
import '@/styles/main.css'

// 创建Vue应用实例
const app = createApp(App)

// 注册插件
app.use(pinia)
app.use(router)

// 全局错误处理
app.config.errorHandler = (error, instance, info) => {
    console.error('Vue Error:', error)
    console.error('Error Info:', info)
    console.error('Component Instance:', instance)
}

// 初始化应用
async function initializeApp() {
    // 开发环境配置
    if (import.meta.env.DEV) {
        // 启用Vue开发工具
        app.config.devtools = true

        console.log('应用启动 - 开发模式')
        console.log('Vue版本:', app.version)
        console.log('API地址:', import.meta.env.VITE_API_BASE_URL)
        console.log('WebSocket地址:', import.meta.env.VITE_WS_URL)
        console.log('Mock模式:', import.meta.env.VITE_USE_MOCK)
        console.log('环境变量检查:', {
            VITE_USE_MOCK: import.meta.env.VITE_USE_MOCK,
            VITE_USE_MOCK_TYPE: typeof import.meta.env.VITE_USE_MOCK,
            DEV: import.meta.env.DEV
        })

        // 修复Mock初始化逻辑 - 关键修复：等待Mock完全初始化
        const shouldUseMock = import.meta.env.VITE_USE_MOCK === 'true' ||
            import.meta.env.VITE_USE_MOCK === true

        if (shouldUseMock) {
            console.log('🔧 正在初始化Mock环境...')
            try {
                // 等待Mock完全初始化完成
                const { initializeMock } = await import('@/mock')
                await initializeMock()
                console.log('✅ Mock环境初始化成功，可以安全地进行API调用')
            } catch (error) {
                console.error('❌ Mock 初始化失败:', error)
                // 即使Mock失败，也要继续启动应用
            }
        } else {
            console.log('⚠️ Mock模式未启用')
        }

        // 全局调试方法
        window.__VUE_APP__ = app
        window.__ROUTER__ = router
        window.__PINIA__ = pinia
    }

    // 挂载应用 - 在Mock完全准备好之后
    app.mount('#app')
    console.log('🚀 应用挂载完成')
}

// 启动应用
initializeApp().catch(error => {
    console.error('❌ 应用初始化失败:', error)
    // 即使初始化失败，也尝试挂载基本应用
    app.mount('#app')
})

export default app