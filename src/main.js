import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import { setupMock } from './mock'

import App from './App.vue'
import './styles/main.css'

async function initApp() {
    console.log('🚀 应用启动...')

    // 创建Vue应用
    const app = createApp(App)

    // 创建Pinia实例
    const pinia = createPinia()

    // 注册插件
    app.use(pinia)
    app.use(router)

    // 开发环境设置Mock
    if (import.meta.env.DEV) {
        try {
            setupMock()
            console.log('✅ Mock服务已启动')
        } catch (error) {
            console.error('❌ Mock服务启动失败:', error)
        }
    }

    // 全局错误处理
    app.config.errorHandler = (error, instance, info) => {
        console.error('❌ Vue应用错误:', error)
        console.error('错误信息:', info)
    }

    // 挂载应用
    app.mount('#app')
    console.log('✅ 应用启动完成')
}

initApp().catch(error => {
    console.error('❌ 应用启动失败:', error)
})