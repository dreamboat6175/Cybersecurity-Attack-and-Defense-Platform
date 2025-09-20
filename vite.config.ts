import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src')
        }
    },
    server: {
        port: 3000,
        open: true
    },
    // 添加这个配置来帮助解析 .vue 文件
    optimizeDeps: {
        include: ['vue', 'vue-router', 'pinia', 'ant-design-vue']
    }
})