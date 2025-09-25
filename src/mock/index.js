// src/mock/index.js - 修复版本
let mock = null

export function initializeMock() {
    // 强制检查环境变量
    const shouldUseMock = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.DEV

    if (!shouldUseMock) {
        console.log('Mock模式未启用')
        return
    }

    console.log('初始化Mock环境...')

    try {
        // 同步导入以确保在API调用前完成初始化
        Promise.all([
            import('axios-mock-adapter'),
            import('axios'),
            import('./data')
        ]).then(([{ default: MockAdapter }, { default: axios }, mockData]) => {
            setupMockRoutes(axios, MockAdapter, mockData)
            console.log('✅ Mock环境初始化完成')
        }).catch(error => {
            console.error('❌ Mock适配器加载失败:', error)
        })

    } catch (error) {
        console.error('❌ Mock初始化失败:', error)
    }
}


function setupMockRoutes(axios, MockAdapter, mockData) {
    const {
        mockDashboardData,
        mockAuthResponse,
        generateMockAttackLogs,
        generateMockScanResult,
        generateMockTrafficData
    } = mockData

    mock = new MockAdapter(axios, { delayResponse: 300 })

    // 认证相关接口
    mock.onPost('/api/auth/login').reply((config) => {
        const { username, password } = JSON.parse(config.data)

        if (username === 'admin' && password === 'admin123') {
            return [200, mockAuthResponse]
        }

        return [401, { success: false, message: '用户名或密码错误' }]
    })

    mock.onGet('/api/auth/me').reply(() => {
        return [200, { success: true, user: mockAuthResponse.user }]
    })

    mock.onPost('/api/auth/logout').reply(() => {
        return [200, { success: true, message: '登出成功' }]
    })

    // 仪表盘数据接口
    mock.onGet('/api/dashboard').reply(() => {
        return [200, {
            success: true,
            data: mockDashboardData
        }]
    })

    // 目标相关接口
    mock.onGet('/api/targets').reply(() => {
        return [200, {
            success: true,
            data: mockDashboardData.targets
        }]
    })

    mock.onPost('/api/targets').reply((config) => {
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
        const scanResult = generateMockScanResult(targetId)

        return [200, {
            success: true,
            data: scanResult
        }]
    })

    mock.onPost(/\/api\/scan\/.*/).reply((config) => {
        const targetId = config.url.split('/').pop()

        // 模拟扫描启动
        setTimeout(() => {
            const scanResult = generateMockScanResult(targetId)
            console.log('扫描完成:', scanResult)
        }, 3000)

        return [200, {
            success: true,
            message: '扫描已启动'
        }]
    })

    // 攻击日志接口
    mock.onGet('/api/attacks/logs').reply(() => {
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

        const trafficData = generateMockTrafficData(targetId, timeRange)

        return [200, {
            success: true,
            data: trafficData
        }]
    })

    console.log('Mock环境初始化完成')
}