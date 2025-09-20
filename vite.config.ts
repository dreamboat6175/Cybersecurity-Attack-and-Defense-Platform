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
        // 关键配置：History API fallback
        historyApiFallback: {
            index: '/index.html',
        },
        // 或者使用这个配置
        middlewareMode: false,
        proxy: {},
        // 确保所有路由都返回index.html
        fs: {
            strict: false
        }
    },
    optimizeDeps: {
        include: ['vue', 'vue-router', 'pinia', 'ant-design-vue']
    },
    // 生产环境构建配置
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