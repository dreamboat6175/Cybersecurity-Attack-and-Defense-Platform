// src/mock/index.js - 修复版本
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
    }
]

const generateMockAttackLogs = (count = 20) => {
    const attackTypes = ['SQL注入', 'XSS攻击', '端口扫描', 'DDoS攻击', '暴力破解', '文件包含', 'CSRF攻击']
    const severities = ['低', '中', '高', '严重']
    const sourceIPs = ['10.0.0.1', '192.168.1.100', '203.0.113.1', '198.51.100.1']

    return Array.from({ length: count }, (_, i) => ({
        id: `attack_${i + 1}`,
        timestamp: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
        sourceIp: sourceIPs[Math.floor(Math.random() * sourceIPs.length)],
        targetIp: '192.168.1.' + (10 + Math.floor(Math.random() * 50)),
        attackType: attackTypes[Math.floor(Math.random() * attackTypes.length)],
        severity: severities[Math.floor(Math.random() * severities.length)],
        status: Math.random() > 0.3 ? '已阻断' : '已通过',
        description: `检测到来自 ${sourceIPs[Math.floor(Math.random() * sourceIPs.length)]} 的攻击尝试`
    }))
}

const mockDashboardData = {
    systemStatus: {
        cpu: Math.floor(Math.random() * 30) + 40,
        memory: Math.floor(Math.random() * 20) + 60,
        disk: Math.floor(Math.random() * 15) + 30,
        network: Math.floor(Math.random() * 25) + 50
    },
    securityMetrics: {
        threatsBlocked: Math.floor(Math.random() * 100) + 1200,
        activeConnections: Math.floor(Math.random() * 50) + 150,
        vulnerabilities: Math.floor(Math.random() * 10) + 25,
        securityScore: Math.floor(Math.random() * 20) + 75
    },
    targets: generateMockTargets(),
    recentAlerts: generateMockAttackLogs(10),
    attackStatistics: { critical: 5, high: 15, medium: 12, low: 8 },
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
        // 修复：先导入axios实例，然后导入MockAdapter
        const apiModule = await import('@/api/index.js')
        const MockAdapterModule = await import('axios-mock-adapter')

        const MockAdapter = MockAdapterModule.default || MockAdapterModule
        const apiInstance = apiModule.default?.axios || apiModule.axios

        if (!apiInstance) {
            throw new Error('无法获取axios实例')
        }

        if (!apiInstance.defaults) {
            throw new Error('axios实例未正确初始化')
        }

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
        onNoMatch: 'passthrough'
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

    console.log('✅ Mock路由设置完成')
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