// src/mock/index.js - 修复版本
let mock = null

export function initializeMock() {
    console.log('🔧 Mock初始化开始...')
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

    // 使用Promise.all同时加载所有依赖
    return Promise.all([
        import('axios-mock-adapter'),
        import('axios'),
        import('./data')
    ]).then(([MockAdapterModule, axiosModule, mockDataModule]) => {
        const MockAdapter = MockAdapterModule.default
        const axios = axiosModule.default

        // 设置Mock适配器
        setupMockRoutes(axios, MockAdapter, mockDataModule)

        console.log('✅ Mock环境初始化完成')
        return true
    }).catch(error => {
        console.error('❌ Mock适配器加载失败:', error)
        throw error
    })
}

function setupMockRoutes(axios, MockAdapter, mockData) {
    console.log('🔧 开始设置Mock路由...')

    const {
        mockDashboardData,
        mockAuthResponse,
        generateMockAttackLogs,
        generateMockScanResult,
        generateMockTrafficData
    } = mockData

    // 创建Mock适配器实例
    mock = new MockAdapter(axios, {
        delayResponse: 300,
        onNoMatch: 'passthrough' // 未匹配的请求会正常发送
    })

    console.log('📝 设置认证相关接口...')

    // 认证相关接口
    mock.onPost('/api/auth/login').reply((config) => {
        console.log('🔐 Mock: 处理登录请求', config.data)

        try {
            const { username, password } = JSON.parse(config.data)

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
}

export { mock }