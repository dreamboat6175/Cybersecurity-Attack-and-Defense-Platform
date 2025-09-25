// src/main.js - 修复Mock导入问题
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import { initializeMock } from './mock' // 修复：使用正确的导出名称

import App from './App.vue'
import './styles/main.css'

async function initApp() {
    console.log('🚀 应用启动...')

    // 创建Vue应用实例
    const app = createApp(App)

    // 创建Pinia实例
    const pinia = createPinia()

    // 注册插件
    app.use(pinia)
    app.use(router)

    // 开发环境设置Mock
    if (import.meta.env.DEV) {
        try {
            console.log('🔧 正在初始化Mock环境...')
            await initializeMock() // 使用await确保Mock初始化完成
            console.log('✅ Mock服务已启动')
        } catch (error) {
            console.error('❌ Mock服务启动失败:', error)
            console.warn('⚠️ 将继续启动应用，但Mock功能不可用')
        }
    } else {
        console.log('🏭 生产环境，跳过Mock初始化')
    }

    // 全局错误处理
    app.config.errorHandler = (error, instance, info) => {
        console.error('❌ Vue应用错误:', error)
        console.error('错误信息:', info)
        console.error('组件实例:', instance)
    }

    // 开发环境配置
    if (import.meta.env.DEV) {
        // 启用Vue开发工具
        app.config.devtools = true

        console.log('🛠️ 开发环境配置:')
        console.log(`  - API地址: ${import.meta.env.VITE_API_BASE_URL}`)
        console.log(`  - WebSocket地址: ${import.meta.env.VITE_WS_URL}`)
        console.log(`  - Mock模式: ${import.meta.env.VITE_USE_MOCK}`)

        // 全局调试工具
        window.__VUE_APP__ = app
        window.__ROUTER__ = router
        window.__PINIA__ = pinia
    }

    // 挂载应用
    app.mount('#app')
    console.log('✅ 应用启动完成')

    return app
}

// 启动应用
initApp().catch(error => {
    console.error('❌ 应用启动失败:', error)
    // 在页面上显示错误信息
    document.body.innerHTML = `
        <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            background: #0A192F;
            color: #CCD6F6;
            text-align: center;
            padding: 2rem;
        ">
            <div style="font-size: 4rem; margin-bottom: 2rem;">⚠️</div>
            <h1 style="color: #F44336; margin-bottom: 1rem;">应用启动失败</h1>
            <p style="color: #8892B0; margin-bottom: 2rem;">请检查控制台了解详细错误信息</p>
            <button 
                onclick="window.location.reload()" 
                style="
                    padding: 12px 24px;
                    background: linear-gradient(135deg, #64FFDA, #4ECDC4);
                    color: #0A192F;
                    border: none;
                    border-radius: 6px;
                    font-weight: 600;
                    cursor: pointer;
                "
            >
                重新加载
            </button>
        </div>
    `
})