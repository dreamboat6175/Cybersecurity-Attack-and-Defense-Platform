// src/mock/index.js - 完全内联版本，避免动态导入问题
let mock = null
let isInitialized = false

// 内联Mock数据，避免文件导入问题
const mockAuthResponse = {
    success: true,
    token: 'mock-jwt-token-' + Date.now(),
    user: {
        id: 1,
        username: 'admin',
        email: 'admin@cybersec.com',
        role: 'admin',
        avatar: null,
        permissions: [
            'dashboard:view',
            'targets:manage',
            'attacks:view',
            'reports:generate'
        ],
        lastLogin: new Date().toISOString()
    },
    expiresIn: 3600 * 8
}

const generateMockTargets = () => [
    {
        id: 'target_1',
        ip: '192.168.1.10',
        name: 'Web Server',
        type: 'server',
        status: 'normal',
        os: 'Ubuntu 20.04',
        services: ['HTTP:80', 'HTTPS:443', 'SSH:22'],
        lastSeen: new Date().toISOString(),
        vulnerabilities: 3,
        scanning: false
    },
    {
        id: 'target_2',
        ip: '192.168.1.20',
        name: 'Database Server',
        type: 'server',
        status: 'warning',
        os: 'CentOS 8',
        services: ['MySQL:3306', 'SSH:22'],
        lastSeen: new Date(Date.now() - 3600000).toISOString(),
        vulnerabilities: 7,
        scanning: false
    },
    {
        id: 'target_3',
        ip: '192.168.1.30',
        name: 'File Server',
        type: 'server',
        status: 'normal',
        os: 'Windows Server 2019',
        services: ['SMB:445', 'FTP:21'],
        lastSeen: new Date(Date.now() - 1800000).toISOString(),
        vulnerabilities: 2,
        scanning: false
    }
]

const generateMockAttackLogs = (count = 20) => {
    const attackTypes = ['sql_injection', 'xss', 'brute_force', 'dos', 'command_injection']
    const targets = ['192.168.1.10', '192.168.1.20', '192.168.1.30', '192.168.1.40']
    const descriptions = {
        sql_injection: 'SQL injection attempt',
        xss: 'Cross-site scripting attack',
        brute_force: 'Brute force attack',
        dos: 'Denial of service attack',
        command_injection: 'Command injection attempt'
    }

    return Array.from({ length: count }, (_, index) => {
        const attackType = attackTypes[Math.floor(Math.random() * attackTypes.length)]
        const target = targets[Math.floor(Math.random() * targets.length)]

        return {
            id: `log_${Date.now()}_${index}`,
            timestamp: new Date(Date.now() - Math.random() * 86400000 * 3).toISOString(),
            time: new Date().toLocaleTimeString('en-US', {
                hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit'
            }),
            target,
            type: attackType,
            description: descriptions[attackType],
            source: `192.168.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 254) + 1}`,
            blocked: Math.random() > 0.3
        }
    })
}

const mockDashboardData = {
    targets: generateMockTargets(),
    threats: { active: 3, resolved: 127, investigating: 8 },
    attacks: { today: 42, thisWeek: 287, thisMonth: 1205 },
    vulnerabilities: { critical: 2, high: 5, medium: 12, low: 8 },
    recentAttackLogs: generateMockAttackLogs(20)
}

export async function initializeMock() {
    console.log('🔧 Mock初始化开始...')

    if (isInitialized) {
        console.log('✅ Mock已经初始化，跳过')
        return
    }

    const shouldUseMock = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.DEV
    if (!shouldUseMock) {
        console.log('❌ Mock模式未启用')
        return
    }

    console.log('✅ Mock模式已启用，开始初始化...')

    try {
        // 直接导入，避免动态导入问题
        const [MockAdapterModule, apiModule] = await Promise.all([
            import('axios-mock-adapter'),
            import('@/api/index.js')
        ])

        const MockAdapter = MockAdapterModule.default
        const apiInstance = apiModule.axios

        console.log('🔗 Mock将绑定到API实例:', apiInstance.defaults.baseURL)
        setupMockRoutes(apiInstance, MockAdapter)

        isInitialized = true
        console.log('✅ Mock环境初始化完成')
    } catch (error) {
        console.error('❌ Mock适配器加载失败:', error)
        throw error
    }
}

function setupMockRoutes(axiosInstance, MockAdapter) {
    console.log('🔧 开始设置Mock路由...')

    if (mock) {
        console.log('🧹 清理旧的Mock实例')
        mock.restore()
    }

    mock = new MockAdapter(axiosInstance, {
        delayResponse: 300,
        onNoMatch: 'passthrough' // 改为passthrough避免错误
    })

    console.log('📝 设置认证相关接口...')

    // 认证接口
    mock.onPost('/api/auth/login').reply((config) => {
        console.log('🔐 Mock: 处理登录请求')

        try {
            const requestData = typeof config.data === 'string' ?
                JSON.parse(config.data) : config.data
            const { username, password } = requestData

            console.log('🔐 Mock: 解析的认证信息:', { username, password: '***' })

            if (username === 'admin' && password === 'admin123') {
                console.log('✅ Mock: 登录成功')
                return [200, mockAuthResponse]
            }

            console.log('❌ Mock: 登录失败')
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

    // 扫描相关接口
    mock.onGet(/\/api\/scan\/.*/).reply((config) => {
        const targetId = config.url.split('/').pop()
        console.log('🔍 Mock: 获取扫描结果', targetId)

        const scanResult = {
            targetId,
            timestamp: new Date().toISOString(),
            status: 'completed',
            results: {
                portScan: Math.floor(Math.random() * 20) + 80,
                vulnerability: Math.floor(Math.random() * 30) + 70,
                security: Math.floor(Math.random() * 30) + 70
            },
            vulnerabilities: {
                critical: Math.floor(Math.random() * 3),
                high: Math.floor(Math.random() * 5),
                medium: Math.floor(Math.random() * 8),
                low: Math.floor(Math.random() * 10)
            }
        }

        return [200, {
            success: true,
            data: scanResult
        }]
    })

    mock.onPost(/\/api\/scan\/.*/).reply((config) => {
        const targetId = config.url.split('/').pop()
        console.log('🚀 Mock: 启动扫描', targetId)

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
        console.log('📈 Mock: 获取流量数据')

        const trafficData = {
            timeRange: '6h',
            dataPoints: Array.from({ length: 72 }, (_, i) => ({
                timestamp: new Date(Date.now() - (72 - 1 - i) * 300000).toISOString(),
                value: Math.sin(i * 0.2) * 30 + Math.random() * 20 + 40,
                attacks: Math.floor(Math.random() * 10)
            })),
            summary: {
                totalTraffic: 5000,
                totalAttacks: 120,
                avgTraffic: 70
            }
        }

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
    console.log('  - GET  /api/scan/*')
    console.log('  - POST /api/scan/*')
    console.log('  - GET  /api/attacks/logs')
    console.log('  - GET  /api/traffic/*')
}

export function destroyMock() {
    if (mock) {
        mock.restore()
        mock = null
        isInitialized = false
        console.log('🧹 Mock已清理')
    }
}

export { mock }