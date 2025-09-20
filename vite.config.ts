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
        port: 5173,
        host: '127.0.0.1',
        open: true,
        // 移除不支持的配置项
        // Vite会自动处理SPA的路由回退
    },
    optimizeDeps: {
        include: ['vue', 'vue-router', 'pinia', 'ant-design-vue']
    },
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html')
            }
        }
    }
})