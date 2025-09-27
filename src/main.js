// main.js - 应用入口文件
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// 创建Vue应用实例
const app = createApp(App)

// 注册路由
app.use(router)

// 全局错误处理
app.config.errorHandler = (err, instance, info) => {
    console.error('全局错误:', err)
    console.error('错误信息:', info)

    // 可以在这里添加错误上报逻辑
    // errorReporting.report(err, info)
}

// 全局警告处理
app.config.warnHandler = (msg, instance, trace) => {
    console.warn('Vue警告:', msg)
    console.warn('组件追踪:', trace)
}

// 全局属性
app.config.globalProperties.$appName = '网络安全攻防平台'
app.config.globalProperties.$version = '1.0.0'

// 开发环境配置
if (import.meta.env.DEV) {
    app.config.devtools = true

    // 开发环境下的调试工具
    window.app = app
    window.router = router

    console.log('🚀 网络安全攻防平台启动')
    console.log('📦 Vue版本:', app.version)
    console.log('🛠️ 开发模式：已启用')
}

// 挂载应用
app.mount('#app')

// 全局未捕获错误处理
window.addEventListener('error', (event) => {
    console.error('🚨 全局JavaScript错误:', event.error)
    console.error('📍 错误位置:', event.filename, ':', event.lineno, ':', event.colno)
})

// 全局未捕获Promise错误处理
window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 未捕获的Promise错误:', event.reason)
    // 阻止默认的控制台错误输出
    event.preventDefault()
})

// 页面可见性变化处理
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        console.log('📱 页面变为可见')
        // 可以在这里添加页面重新激活的逻辑
    } else {
        console.log('📱 页面变为隐藏')
        // 可以在这里添加页面暂停的逻辑
    }
})

// 网络状态监听
window.addEventListener('online', () => {
    console.log('🌐 网络连接已恢复')
})

window.addEventListener('offline', () => {
    console.log('🌐 网络连接已断开')
})

export default app