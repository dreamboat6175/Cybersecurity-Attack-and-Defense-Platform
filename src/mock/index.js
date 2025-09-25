// src/mock/index.js - 彻底修复版本：确保Mock绑定到正确的axios实例
let mock = null
let isInitialized = false

export function initializeMock() {
    console.log('🔧 Mock初始化开始...')

    // 如果已经初始化过，直接返回
    if (isInitialized) {
        console.log('✅ Mock已经初始化，跳过')
        return Promise.resolve()
    }

    console.log('环境变量检查:', {
        VITE_USE_MOCK: import.meta.env.VITE_USE_MOCK,
        DEV: import.meta.env.DEV
    })

    // 检查是否应该使用Mock
    const shouldUseMock = import.meta.env.VITE_USE_MOCK === 'true' ||
        import.meta.env.VITE_USE_MOCK === true ||
        import.meta.env.DEV

    if (!shouldUseMock) {
        console.log('❌ Mock模式未启用')
        return Promise.resolve()
    }

    console.log('✅ Mock模式已启用，开始初始化...')

    // 关键修复：导入我们实际使用的API实例，而不是默认axios
    return Promise.all([
        import('axios-mock-adapter'),
        import('@/api'), // 导入我们的API模块，获取实际使用的axios实例
        import('./data')
    ]).then(([MockAdapterModule, apiModule, mockDataModule]) => {
        const MockAdapter = MockAdapterModule.default
        // 使用API模块导出的axios实例
        const apiInstance = apiModule.axios || apiModule.default

        console.log('🔗 Mock将绑定到API实例:', apiInstance.defaults.baseURL)

        // 设置Mock适配器
        setupMockRoutes(apiInstance, MockAdapter, mockDataModule)

        isInitialized = true
        console.log('✅ Mock环境初始化完成')
        return true
    }).catch(error => {
        console.error('❌ Mock适配器加载失败:', error)
        console.error('Error details:', error.message, error.stack)
        throw error
    })
}

function setupMockRoutes(axiosInstance, MockAdapter, mockData) {
    console.log('🔧 开始设置Mock路由...')
    console.log('🔗 绑定Mock到axios实例:', axiosInstance.defaults)

    const {
        mockDashboardData,
        mockAuthResponse,
        generateMockAttackLogs,
        generateMockScanResult,
        generateMockTrafficData
    } = mockData

    // 销毁旧的mock实例（如果存在）
    if (mock) {
        console.log('🧹 清理旧的Mock实例')
        mock.restore()
    }

    // 关键修复：绑定到正确的axios实例
    mock = new MockAdapter(axiosInstance, {
        delayResponse: 300,
        onNoMatch: 'throwException' // 改为抛出异常便于调试
    })

    console.log('📝 设置认证相关接口...')

    // 认证相关接口
    mock.onPost('/api/auth/login').reply((config) => {
        console.log('🔐 Mock: 处理登录请求')
        console.log('🔐 Mock: 请求数据:', config.data)

        try {
            const requestData = typeof config.data === 'string' ? JSON.parse(config.data) : config.data
            const { username, password } = requestData

            console.log('🔐 Mock: 解析的认证信息:', { username, password: '***' })

            if (username === 'admin' && password === 'admin123') {
                console.log('✅ Mock: 登录成功')
                return [200, mockAuthResponse]
            }

            console.log('❌ Mock: 登录失败 - 用户名或密码错误')
            return [401, { success: false, message: '用户名或密码错误' }]
        } catch (error) {
            console.error('❌ Mock: 解析登录数据失败', error)
            return [400, { success: false, message: '请求数据格式错误' }]
        }
    })

    mock.onGet('/api/auth/me').reply(() => {
        console.log('👤 Mock: 获取用户信息')
        return [200, { success: true, user: mockAuthResponse.user }]
    })

    mock.onPost('/api/auth/logout').reply(() => {
        console.log('🚪 Mock: 用户登出')
        return [200, { success: true, message: '登出成功' }]
    })

    console.log('📊 设置仪表盘数据接口...')

    // 仪表盘数据接口
    mock.onGet('/api/dashboard').reply(() => {
        console.log('📊 Mock: 获取仪表盘数据')
        return [200, {
            success: true,
            data: mockDashboardData
        }]
    })

    // 目标相关接口
    mock.onGet('/api/targets').reply(() => {
        console.log('🎯 Mock: 获取目标列表')
        return [200, {
            success: true,
            data: mockDashboardData.targets
        }]
    })

    mock.onPost('/api/targets').reply((config) => {
        console.log('🎯 Mock: 添加新目标', config.data)
        const newTarget = JSON.parse(config.data)
        newTarget.id = `target_${Date.now()}`
        newTarget.status = 'normal'
        newTarget.services = ['HTTP:80']
        newTarget.lastSeen = new Date().toISOString()
        newTarget.vulnerabilities = 0

        mockDashboardData.targets.push(newTarget)

        return [200, {
            success: true,
            data: newTarget
        }]
    })

    mock.onDelete(/\/api\/targets\/.*/).reply((config) => {
        const targetId = config.url.split('/').pop()
        console.log('🗑️ Mock: 删除目标', targetId)

        const index = mockDashboardData.targets.findIndex(t => t.id === targetId)

        if (index > -1) {
            mockDashboardData.targets.splice(index, 1)
            return [200, { success: true }]
        }

        return [404, { success: false, message: '目标不存在' }]
    })

    // 扫描相关接口
    mock.onGet(/\/api\/scan\/.*/).reply((config) => {
        const targetId = config.url.split('/').pop()
        console.log('🔍 Mock: 获取扫描结果', targetId)

        const scanResult = generateMockScanResult(targetId)

        return [200, {
            success: true,
            data: scanResult
        }]
    })

    mock.onPost(/\/api\/scan\/.*/).reply((config) => {
        const targetId = config.url.split('/').pop()
        console.log('🚀 Mock: 启动扫描', targetId)

        // 模拟扫描启动
        setTimeout(() => {
            const scanResult = generateMockScanResult(targetId)
            console.log('✅ Mock: 扫描完成', scanResult)
        }, 3000)

        return [200, {
            success: true,
            message: '扫描已启动'
        }]
    })

    // 攻击日志接口
    mock.onGet('/api/attacks/logs').reply(() => {
        console.log('📋 Mock: 获取攻击日志')
        return [200, {
            success: true,
            data: generateMockAttackLogs(50)
        }]
    })

    // 流量数据接口
    mock.onGet(/\/api\/traffic\/.*/).reply((config) => {
        const params = new URLSearchParams(config.url.split('?')[1])
        const targetId = config.url.split('/')[3]
        const timeRange = params.get('timeRange') || '1h'

        console.log('📈 Mock: 获取流量数据', { targetId, timeRange })

        const trafficData = generateMockTrafficData(targetId, timeRange)

        return [200, {
            success: true,
            data: trafficData
        }]
    })

    console.log('✅ Mock路由设置完成')
    console.log('📋 已注册的Mock路由:')
    console.log('  - POST /api/auth/login')
    console.log('  - GET  /api/auth/me')
    console.log('  - POST /api/auth/logout')
    console.log('  - GET  /api/dashboard')
    console.log('  - GET  /api/targets')
    console.log('  - POST /api/targets')
    console.log('  - DELETE /api/targets/*')
    console.log('  - GET  /api/scan/*')
    console.log('  - POST /api/scan/*')
    console.log('  - GET  /api/attacks/logs')
    console.log('  - GET  /api/traffic/*')

    console.log('🔍 Mock实例详情:', {
        adapter: mock.adapter,
        instance: axiosInstance.defaults.baseURL,
        interceptors: axiosInstance.interceptors.request.handlers.length + axiosInstance.interceptors.response.handlers.length
    })
}

// 导出用于清理
export function destroyMock() {
    if (mock) {
        mock.restore()
        mock = null
        isInitialized = false
        console.log('🧹 Mock已清理')
    }
}

export { mock }