// src/mock/index.js
let mock = null

export function initializeMock() {
    if (!import.meta.env.VITE_USE_MOCK) return

    console.log('初始化Mock环境...')

    try {
        // 动态导入以避免阻塞
        import('axios-mock-adapter').then(({ default: MockAdapter }) => {
            import('axios').then(({ default: axios }) => {
                import('./data').then(mockData => {
                    setupMockRoutes(axios, MockAdapter, mockData)
                })
            })
        }).catch(error => {
            console.warn('Mock适配器加载失败，使用静态数据:', error)
            // 如果无法加载 Mock 适配器，直接返回，应用仍能正常工作
        })

    } catch (error) {
        console.warn('Mock初始化失败:', error)
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