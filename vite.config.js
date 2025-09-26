import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src')
        }
    },
    server: {
        port: 5173,
        open: true,
        cors: true,
        proxy: {
            // 代理API请求到后端服务器（生产环境）
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
            },
            // 代理WebSocket连接
            '/ws': {
                target: 'ws://localhost:3000',
                ws: true,
                changeOrigin: true
            }
        }
    },
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: false,
        minify: 'terser',
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['vue', 'vue-router', 'pinia'],
                    utils: ['axios']
                }
            }
        }
    },
    define: {
        __VUE_OPTIONS_API__: true,
        __VUE_PROD_DEVTOOLS__: false
    }
})