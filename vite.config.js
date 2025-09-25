// vite.config.js - 修复版本
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
    plugins: [vue()],

    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
            '@/components': resolve(__dirname, 'src/components'),
            '@/views': resolve(__dirname, 'src/views'),
            '@/stores': resolve(__dirname, 'src/stores'),
            '@/utils': resolve(__dirname, 'src/utils'),
            '@/api': resolve(__dirname, 'src/api'),
            '@/styles': resolve(__dirname, 'src/styles'),
            '@/assets': resolve(__dirname, 'src/assets')
        }
    },

    server: {
        port: 3000,
        host: 'localhost', // 明确指定localhost，而不是true
        open: false, // 暂时不自动打开浏览器
        cors: true,
        strictPort: false, // 如果端口被占用，尝试下一个
        // 暂时注释掉代理配置，因为没有后端服务器
        // proxy: {
        //     '/api': {
        //         target: 'http://localhost:8080',
        //         changeOrigin: true,
        //         secure: false
        //     },
        //     '/ws': {
        //         target: 'ws://localhost:8080',
        //         ws: true,
        //         changeOrigin: true
        //     }
        // }
    },

    build: {
        outDir: 'dist',
        sourcemap: false,
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true
            }
        },
        rollupOptions: {
            output: {
                chunkFileNames: 'assets/js/[name]-[hash].js',
                entryFileNames: 'assets/js/[name]-[hash].js',
                assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
                manualChunks: {
                    vue: ['vue', 'vue-router', 'pinia'],
                    charts: ['echarts', '@antv/g6'],
                    utils: ['axios']
                }
            }
        },
        chunkSizeWarningLimit: 1000
    },

    css: {
        preprocessorOptions: {
            css: {
                charset: false
            }
        }
    },

    define: {
        __VUE_PROD_DEVTOOLS__: false
    },

    optimizeDeps: {
        include: [
            'vue',
            'vue-router',
            'pinia',
            'axios',
            'echarts',
            '@antv/g6'
        ]
    }
})