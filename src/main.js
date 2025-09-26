// src/main.js - 完全修复版本
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './styles/main.css'

// 动态导入Mock模块，避免在生产环境中加载
let mockModule = null

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

            // 动态导入Mock模块
            mockModule = await import('./mock/index.js')
            await mockModule.initializeMock()

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

        // 在开发环境下显示更详细的错误信息
        if (import.meta.env.DEV) {
            console.trace('错误堆栈:', error.stack)
        }
    }

    // 开发环境配置
    if (import.meta.env.DEV) {
        // 启用Vue开发工具
        app.config.devtools = true

        console.log('🛠️ 开发环境配置:')
        console.log(`  - API地址: ${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}`)
        console.log(`  - WebSocket地址: ${import.meta.env.VITE_WS_URL || 'ws://localhost:3000'}`)
        console.log(`  - Mock模式: ${import.meta.env.VITE_USE_MOCK || 'true'}`)

        // 全局调试工具
        window.__VUE_APP__ = app
        window.__ROUTER__ = router
        window.__PINIA__ = pinia

        // 暴露Mock控制函数
        if (mockModule) {
            window.__MOCK__ = {
                destroy: mockModule.destroyMock,
                reinit: mockModule.initializeMock
            }
        }
    }

    // 添加全局属性和方法
    app.config.globalProperties.$log = console.log
    app.config.globalProperties.$error = console.error

    // 挂载应用
    app.mount('#app')
    console.log('✅ 应用启动完成')

    return app
}

// 启动应用
initApp().catch(error => {
    console.error('❌ 应用启动失败:', error)

    // 在页面上显示友好的错误信息
    document.body.innerHTML = `
        <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0c1620 0%, #1a2b42 100%);
            color: #CCD6F6;
            text-align: center;
            padding: 2rem;
        ">
            <div style="font-size: 4rem; margin-bottom: 2rem; animation: pulse 2s infinite;">⚠️</div>
            <h1 style="color: #F44336; margin-bottom: 1rem; font-size: 2rem;">应用启动失败</h1>
            <p style="color: #8892B0; margin-bottom: 2rem; max-width: 600px; line-height: 1.6;">
                网络安全监控平台无法正常启动。请检查以下可能的原因：<br>
                • 网络连接问题<br>
                • 依赖模块加载失败<br>
                • 浏览器兼容性问题<br><br>
                请打开浏览器开发者工具查看详细错误信息。
            </p>
            <div style="display: flex; gap: 1rem;">
                <button 
                    onclick="window.location.reload()" 
                    style="
                        padding: 12px 24px;
                        background: linear-gradient(135deg, #64FFDA, #4ECDC4);
                        color: #0A192F;
                        border: none;
                        border-radius: 8px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                    "
                    onmouseover="this.style.transform='scale(1.05)'"
                    onmouseout="this.style.transform='scale(1)'"
                >
                    重新加载
                </button>
                <button 
                    onclick="console.clear(); alert('控制台已清空，请重新加载页面查看错误信息')" 
                    style="
                        padding: 12px 24px;
                        background: rgba(255, 255, 255, 0.1);
                        color: #CCD6F6;
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        border-radius: 8px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                    "
                    onmouseover="this.style.background='rgba(255, 255, 255, 0.2)'"
                    onmouseout="this.style.background='rgba(255, 255, 255, 0.1)'"
                >
                    清空控制台
                </button>
            </div>
            <div style="
                margin-top: 2rem;
                padding: 1rem;
                background: rgba(255, 68, 68, 0.1);
                border: 1px solid rgba(255, 68, 68, 0.3);
                border-radius: 8px;
                max-width: 600px;
                font-family: 'Courier New', monospace;
                font-size: 0.875rem;
                text-align: left;
                color: #ff6b6b;
            ">
                <strong>错误详情:</strong><br>
                ${error.message || '未知错误'}<br><br>
                <strong>可能的解决方案:</strong><br>
                1. 确保网络连接正常<br>
                2. 清除浏览器缓存<br>
                3. 检查浏览器是否支持ES6+<br>
                4. 联系技术支持
            </div>
        </div>
        <style>
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
        </style>
    `
})