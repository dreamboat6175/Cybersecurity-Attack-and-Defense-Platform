// src/stores/auth.js
import { defineStore } from 'pinia'
import request from '@/api'

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null,
        token: localStorage.getItem('auth_token'),
        isLoading: false,
        error: null
    }),

    getters: {
        isAuthenticated: (state) => !!state.token && !!state.user,
        userInfo: (state) => state.user,
        hasPermission: (state) => (permission) => {
            return state.user?.permissions?.includes(permission) || false
        }
    },

    actions: {
        /**
         * 登录
         */
        async login(credentials) {
            try {
                this.isLoading = true
                this.error = null

                const response = await request.post('/api/auth/login', credentials)

                if (response.success) {
                    this.token = response.token
                    this.user = response.user

                    // 存储到本地
                    localStorage.setItem('auth_token', response.token)

                    return { success: true }
                } else {
                    throw new Error(response.message || '登录失败')
                }
            } catch (error) {
                this.error = error.message
                return { success: false, message: error.message }
            } finally {
                this.isLoading = false
            }
        },

        /**
         * 登出
         */
        async logout() {
            try {
                this.isLoading = true

                // 调用后端登出接口
                await request.post('/api/auth/logout')
            } catch (error) {
                console.warn('登出接口调用失败:', error)
            } finally {
                // 清除本地状态
                this.user = null
                this.token = null
                this.error = null

                // 清除本地存储
                localStorage.removeItem('auth_token')

                this.isLoading = false
            }
        },

        /**
         * 检查认证状态
         */
        async checkAuthStatus() {
            if (!this.token) {
                return false
            }

            try {
                this.isLoading = true
                const response = await request.get('/api/auth/me')

                if (response.success) {
                    this.user = response.user
                    return true
                } else {
                    throw new Error('用户信息获取失败')
                }
            } catch (error) {
                console.warn('认证状态检查失败:', error)
                await this.logout()
                return false
            } finally {
                this.isLoading = false
            }
        },

        /**
         * 验证Token有效性
         */
        async validateToken() {
            if (!this.token) {
                return false
            }

            try {
                const response = await request.get('/api/auth/me')
                return response.success
            } catch (error) {
                console.warn('Token验证失败:', error)
                return false
            }
        },

        /**
         * 刷新Token
         */
        async refreshToken() {
            try {
                const response = await request.post('/api/auth/refresh')

                if (response.success) {
                    this.token = response.token
                    localStorage.setItem('auth_token', response.token)
                    return true
                }

                return false
            } catch (error) {
                console.warn('Token刷新失败:', error)
                return false
            }
        },

        /**
         * 更新用户信息
         */
        async updateProfile(profileData) {
            try {
                this.isLoading = true
                this.error = null

                const response = await request.put('/api/auth/profile', profileData)

                if (response.success) {
                    this.user = { ...this.user, ...response.user }
                    return { success: true }
                } else {
                    throw new Error(response.message || '更新失败')
                }
            } catch (error) {
                this.error = error.message
                return { success: false, message: error.message }
            } finally {
                this.isLoading = false
            }
        },

        /**
         * 修改密码
         */
        async changePassword(passwordData) {
            try {
                this.isLoading = true
                this.error = null

                const response = await request.post('/api/auth/change-password', passwordData)

                if (response.success) {
                    return { success: true, message: '密码修改成功' }
                } else {
                    throw new Error(response.message || '密码修改失败')
                }
            } catch (error) {
                this.error = error.message
                return { success: false, message: error.message }
            } finally {
                this.isLoading = false
            }
        },

        /**
         * 清除错误
         */
        clearError() {
            this.error = null
        }
    }
})