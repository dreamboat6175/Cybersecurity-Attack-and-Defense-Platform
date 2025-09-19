import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 用户认证状态
export const useAuthStore = defineStore('auth', () => {
    const token = ref<string | null>(localStorage.getItem('token'))
    const user = ref<any>(null)

    const isLoggedIn = computed(() => !!token.value)

    const login = async (username: string, password: string) => {
        // 模拟登录
        if (username === 'admin' && password === 'admin123') {
            token.value = 'mock-token-123'
            user.value = { username, role: 'admin' }
            localStorage.setItem('token', token.value)
            return true
        }
        throw new Error('用户名或密码错误')
    }

    const logout = () => {
        token.value = null
        user.value = null
        localStorage.removeItem('token')
    }

    return {
        token,
        user,
        isLoggedIn,
        login,
        logout
    }
})

// 系统状态
export const useSystemStore = defineStore('system', () => {
    const loading = ref(false)
    const sidebarCollapsed = ref(false)

    const setLoading = (status: boolean) => {
        loading.value = status
    }

    const toggleSidebar = () => {
        sidebarCollapsed.value = !sidebarCollapsed.value
    }

    return {
        loading,
        sidebarCollapsed,
        setLoading,
        toggleSidebar
    }
})
