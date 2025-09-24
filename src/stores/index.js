// Pinia Store 入口文件
import { createPinia } from 'pinia'

// 创建pinia实例
const pinia = createPinia()

// 开发环境添加插件
if (import.meta.env.DEV) {
    // 可以添加开发时的插件，比如持久化、日志等
    pinia.use(({ store }) => {
        // 添加store的调试信息
        store.$onAction(({ name, args, after, onError }) => {
            console.log(`🏪 Store Action: ${store.$id}.${name}`, args)

            after((result) => {
                console.log(`✅ Action ${name} completed:`, result)
            })

            onError((error) => {
                console.error(`❌ Action ${name} failed:`, error)
            })
        })
    })
}

export default pinia