// 应用入口文件
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

// 全局警告处理
app.config.warnHandler = (msg, instance, trace) => {
    if (import.meta.env.DEV) {
        console.warn('Vue Warning:', msg)
        console.warn('Trace:', trace)
    }
}

// 开发环境配置
if (import.meta.env.DEV) {
    // 启用Vue开发工具
    app.config.devtools = true

    // 异步初始化Mock环境，不阻塞应用启动
    setTimeout(async () => {
        try {
            const { initializeMock } = await import('@/mock')
            initializeMock()
        } catch (error) {
            console.warn('Mock 初始化失败:', error)
        }
    }, 100)

    // 全局调试方法
    window.__VUE_APP__ = app
    window.__ROUTER__ = router
    window.__PINIA__ = pinia

    console.log('应用启动 - 开发模式')
    console.log('Vue版本:', app.version)
    console.log('API地址:', import.meta.env.VITE_API_BASE_URL)
    console.log('WebSocket地址:', import.meta.env.VITE_WS_URL)
    console.log('Mock模式:', import.meta.env.VITE_USE_MOCK)
}

// 生产环境配置
if (import.meta.env.PROD) {
    // 禁用开发工具
    app.config.devtools = false

    // 清理console（可选）
    if (!import.meta.env.VITE_DEBUG) {
        console.log = () => {}
        console.warn = () => {}
        console.error = () => {}
    }
}

// 挂载应用
app.mount('#app')

// 导出应用实例（用于测试等）
export default app