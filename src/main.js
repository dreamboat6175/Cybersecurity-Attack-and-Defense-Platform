// src/main.js - 重构版本
// 应用程序主入口，负责应用的初始化和启动

import { createApp } from 'vue'
import { createPinia } from 'pinia'

// 导入核心组件和配置
import App from './App.vue'
import router from './router'
import api from './api'
import wsManager from './api/websocket'

// 导入样式
import './styles/main.css'

// 导入工具和常量
import { sleep } from './utils/helpers'
import { STORAGE_KEYS } from './utils/constants'

// ======================
// 应用配置类
// ======================

/**
 * 应用配置管理器
 */
class AppConfig {
    constructor() {
        this.config = {
            name: '网络安全攻防平台',
            version: import.meta.env.VITE_APP_VERSION || '1.0.0',
            env: import.meta.env.MODE,
            isDev: import.meta.env.DEV,
            isProd: import.meta.env.PROD,
            apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
            wsUrl: import.meta.env.VITE_WS_URL || '/ws',
            enableMock: import.meta.env.VITE_USE_MOCK === 'true'
        }
    }

    /**
     * 获取配置信息
     */
    get(key) {
        return this.config[key]
    }

    /**
     * 获取所有配置
     */
    getAll() {
        return { ...this.config }
    }

    /**
     * 打印启动信息
     */
    printStartupInfo() {
        const { name, version, env, apiBaseUrl, wsUrl } = this.config

        console.log(`🚀 启动 ${name} v${version}`)
        console.log(`📦 环境: ${env}`)
        console.log(`🌐 API: ${apiBaseUrl}`)
        console.log(`🔌 WebSocket: ${wsUrl}`)

        if (this.isDev) {
            console.log('🛠️ 开发模式已启用')
            if (this.config.enableMock) {
                console.log('🎭 Mock模式已启用')
            }
        }
    }
}

// ======================
// 应用初始化器
// ======================

/**
 * 应用初始化器
 */
class AppInitializer {
    constructor() {
        this.config = new AppConfig()
        this.initSteps = []
        this.app = null
        this.pinia = null
    }

    /**
     * 添加初始化步骤
     */
    addInitStep(name, fn, required = true) {
        this.initSteps.push({ name, fn, required })
    }

    /**
     * 创建Vue应用实例
     */
    createApp() {
        console.log('📦 创建Vue应用实例...')

        this.app = createApp(App)

        // 全局错误处理
        this.setupErrorHandling()

        // 开发环境配置
        if (this.config.get('isDev')) {
            this.app.config.devtools = true
            this.exposeDevTools()
        }

        return this.app
    }

    /**
     * 创建状态管理
     */
    createStore() {
        console.log('🏪 创建Pinia状态管理...')

        this.pinia = createPinia()

        // 开发环境添加调试插件
        if (this.config.get('isDev')) {
            this.setupPiniaDevtools()
        }

        return this.pinia
    }

    /**
     * 设置错误处理
     */
    setupErrorHandling() {
        // Vue应用级错误处理
        this.app.config.errorHandler = (error, instance, info) => {
            console.error('❌ Vue应用错误:', error)
            console.error('错误信息:', info)
            console.error('组件实例:', instance)

            // 开发环境显示详细错误
            if (this.config.get('isDev')) {
                console.trace('错误堆栈:', error.stack)
            }

            // 这里可以添加错误上报逻辑
            this.reportError(error, { info, instance })
        }

        // 全局未捕获异常处理
        window.addEventListener('error', (event) => {
            console.error('❌ 全局错误:', event.error)
            this.reportError(event.error, { type: 'global', event })
        })

        // 全局未捕获Promise异常处理
        window.addEventListener('unhandledrejection', (event) => {
            console.error('❌ 未处理的Promise拒绝:', event.reason)
            this.reportError(event.reason, { type: 'unhandledrejection', event })
        })
    }

    /**
     * 错误上报
     */
    reportError(error, context = {}) {
        // 在生产环境中，这里可以集成错误监控服务
        // 如 Sentry、Bugsnag 等

        if (this.config.get('isProd')) {
            // 生产环境错误上报
            console.log('📊 错误已上报:', { error, context })
        }
    }

    /**
     * 设置Pinia开发工具
     */
    setupPiniaDevtools() {
        this.pinia.use(({ store }) => {
            // 添加store调试信息
            store.$onAction(({ name, args, after, onError }) => {
                const startTime = Date.now()

                console.log(`🏪 Store Action: ${store.$id}.${name}`, args)

                after((result) => {
                    const duration = Date.now() - startTime
                    console.log(`✅ Action完成: ${name} (${duration}ms)`, result)
                })

                onError((error) => {
                    console.error(`❌ Action失败: ${name}`, error)
                })
            })
        })
    }

    /**
     * 暴露开发工具
     */
    exposeDevTools() {
        window.__VUE_APP__ = this.app
        window.__ROUTER__ = router
        window.__PINIA__ = this.pinia
        window.__API__ = api
        window.__WS__ = wsManager
        window.__CONFIG__ = this.config
    }

    /**
     * 初始化Mock服务
     */
    async initMock() {
        if (!this.config.get('enableMock') || !this.config.get('isDev')) {
            return
        }

        try {
            console.log('🎭 初始化Mock服务...')

            const mockModule = await import('./mock/index.js')
            await mockModule.initializeMock()

            console.log('✅ Mock服务启动成功')

            // 暴露Mock控制函数
            if (mockModule.destroyMock) {
                window.__MOCK__ = {
                    destroy: mockModule.destroyMock,
                    reinit: mockModule.initializeMock
                }
            }

        } catch (error) {
            console.warn('⚠️ Mock服务启动失败:', error)
            console.warn('应用将继续启动，但Mock功能不可用')
        }
    }

    /**
     * 检查认证状态
     */
    async checkAuthStatus() {
        try {
            const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
            const userInfo = localStorage.getItem(STORAGE_KEYS.USER_INFO)

            if (token && userInfo) {
                console.log('✅ 发现本地认证信息')

                // 这里可以验证token是否仍然有效
                // const isValid = await api.get('/auth/verify')

                return true
            }

            return false
        } catch (error) {
            console.warn('⚠️ 认证检查失败:', error)
            return false
        }
    }

    /**
     * 初始化WebSocket连接
     */
    async initWebSocket() {
        try {
            // 只有在已认证的情况下才连接WebSocket
            const isAuthenticated = await this.checkAuthStatus()

            if (isAuthenticated) {
                console.log('🔌 初始化WebSocket连接...')
                await wsManager.connect()
                console.log('✅ WebSocket连接成功')
            } else {
                console.log('ℹ️ 未认证，跳过WebSocket连接')
            }

        } catch (error) {
            console.warn('⚠️ WebSocket连接失败:', error)
            // WebSocket失败不应该阻止应用启动
        }
    }

    /**
     * 注册插件
     */
    registerPlugins() {
        console.log('🔌 注册应用插件...')

        this.app.use(this.pinia)
        this.app.use(router)

        // 注册全局属性
        this.app.config.globalProperties.$api = api
        this.app.config.globalProperties.$ws = wsManager
        this.app.config.globalProperties.$config = this.config
    }

    /**
     * 执行初始化
     */
    async initialize() {
        try {
            console.log('🚀 开始应用初始化...')

            // 打印启动信息
            this.config.printStartupInfo()

            // 添加初始化步骤
            this.addInitStep('mock', () => this.initMock(), false)
            this.addInitStep('auth', () => this.checkAuthStatus(), false)
            this.addInitStep('websocket', () => this.initWebSocket(), false)

            // 执行初始化步骤
            for (const step of this.initSteps) {
                try {
                    console.log(`⏳ 执行初始化步骤: ${step.name}`)
                    await step.fn()
                } catch (error) {
                    console.error(`❌ 初始化步骤失败: ${step.name}`, error)

                    if (step.required) {
                        throw error
                    }
                }
            }

            console.log('✅ 应用初始化完成')

        } catch (error) {
            console.error('❌ 应用初始化失败:', error)
            throw error
        }
    }

    /**
     * 启动应用
     */
    async start() {
        try {
            // 创建应用
            this.createApp()
            this.createStore()

            // 注册插件
            this.registerPlugins()

            // 执行初始化
            await this.initialize()

            // 挂载应用
            this.app.mount('#app')

            console.log('🎉 应用启动成功!')

            return this.app

        } catch (error) {
            console.error('💥 应用启动失败:', error)
            this.showErrorPage(error)
            throw error
        }
    }

    /**
     * 显示错误页面
     */
    showErrorPage(error) {
        const errorHTML = `
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
                <div style="font-size: 4rem; margin-bottom: 2rem;">💥</div>
                <h1 style="color: #F44336; margin-bottom: 1rem; font-size: 2rem;">应用启动失败</h1>
                <p style="color: #8892B0; margin-bottom: 2rem; max-width: 600px; line-height: 1.6;">
                    ${this.config.get('name')}无法正常启动。<br>
                    错误信息: ${error.message || '未知错误'}<br><br>
                    请检查网络连接和浏览器兼容性，或联系管理员。
                </p>
                <div style="display: flex; gap: 1rem;">
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
                            transition: transform 0.2s ease;
                        "
                        onmouseover="this.style.transform='scale(1.05)'"
                        onmouseout="this.style.transform='scale(1)'"
                    >
                        重新加载
                    </button>
                    <button 
                        onclick="window.open('https://support.company.com', '_blank')" 
                        style="
                            padding: 12px 24px;
                            background: transparent;
                            color: #64FFDA;
                            border: 1px solid #64FFDA;
                            border-radius: 6px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.2s ease;
                        "
                        onmouseover="this.style.backgroundColor='#64FFDA'; this.style.color='#0A192F'"
                        onmouseout="this.style.backgroundColor='transparent'; this.style.color='#64FFDA'"
                    >
                        获取帮助
                    </button>
                </div>
                <details style="margin-top: 2rem; color: #8892B0; font-size: 0.9rem;">
                    <summary style="cursor: pointer; margin-bottom: 1rem;">技术详情</summary>
                    <pre style="text-align: left; background: #0A192F; padding: 1rem; border-radius: 4px; overflow: auto;">
${error.stack || error.toString()}
                    </pre>
                </details>
            </div>
        `

        document.body.innerHTML = errorHTML
    }
}

// ======================
// 启动应用
// ======================

/**
 * 启动应用
 */
async function startApp() {
    const initializer = new AppInitializer()

    try {
        await initializer.start()
    } catch (error) {
        // 错误已在initializer中处理
        console.error('应用启动失败，请查看详细错误信息')
    }
}

// 启动应用
startApp()

// 导出应用实例供测试使用
export { AppInitializer, AppConfig }