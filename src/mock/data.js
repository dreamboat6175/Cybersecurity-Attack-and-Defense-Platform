// src/mock/data.js - 攻击界面专用Mock数据

// Mock认证响应格式
export const mockAuthResponse = {
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
    expiresIn: 3600 * 8 // 8小时
}

// 生成攻击目标数据 - 与界面完全匹配
export function generateMockTargets() {
    return [
        {
            id: 'target_1',
            ip: '192.168.1.10',
            name: 'Web Server',
            type: 'server',
            status: 'compromised', // 已被攻陷
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
            status: 'normal',
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
        },
        {
            id: 'target_4',
            ip: '192.168.1.40',
            name: 'Admin Workstation',
            type: 'client',
            status: 'normal',
            os: 'Windows 10',
            services: ['RDP:3389'],
            lastSeen: new Date(Date.now() - 600000).toISOString(),
            vulnerabilities: 1,
            scanning: false
        },
        {
            id: 'target_5',
            ip: '192.168.1.50',
            name: 'IoT Device',
            type: 'device',
            status: 'normal',
            os: 'Linux Embedded',
            services: ['HTTP:8080'],
            lastSeen: new Date(Date.now() - 86400000).toISOString(),
            vulnerabilities: 5,
            scanning: false
        }
    ]
}

// 生成攻击日志 - 匹配界面显示格式
export function generateMockAttackLogs(count = 20) {
    const attackTypes = ['sql_injection', 'xss', 'brute_force', 'dos', 'command_injection', 'vulnerability']
    const severities = ['low', 'medium', 'high', 'critical']
    const targets = ['192.168.1.10', '192.168.1.20', '192.168.1.30', '192.168.1.40', '192.168.1.50']

    const descriptions = {
        sql_injection: 'SQL injection attempt',
        xss: 'Cross-site scripting attack',
        brute_force: 'Brute force attack',
        dos: 'Denial of service attack',
        command_injection: 'Command injection attempt',
        vulnerability: 'Vulnerability scan'
    }

    // 生成初始日志数据，包含界面显示的默认日志
    const defaultLogs = [
        {
            id: 'log_default_1',
            timestamp: new Date(Date.now() - 1000).toISOString(),
            time: '10:34:21',
            target: '192.168.1.10',
            targetName: 'Web Server',
            type: 'sql_injection',
            severity: 'high',
            description: 'SQL injection attempt',
            source: '192.168.2.100',
            blocked: true
        },
        {
            id: 'log_default_2',
            timestamp: new Date(Date.now() - 2000).toISOString(),
            time: '10:32:49',
            target: '192.168.1.300', // 注意这里是300，匹配原界面
            targetName: 'Unknown Target',
            type: 'command_injection',
            severity: 'critical',
            description: 'Command injection attempt',
            source: '192.168.2.101',
            blocked: false
        },
        {
            id: 'log_default_3',
            timestamp: new Date(Date.now() - 3000).toISOString(),
            time: '10:30:15',
            target: '192.168.1.20',
            targetName: 'Database Server',
            type: 'brute_force',
            severity: 'medium',
            description: 'Brute force attack',
            source: '192.168.2.102',
            blocked: true
        },
        {
            id: 'log_default_4',
            timestamp: new Date(Date.now() - 4000).toISOString(),
            time: '10:27:58',
            target: '192.168.1.10',
            targetName: 'Web Server',
            type: 'vulnerability',
            severity: 'low',
            description: 'Vulnerability scan',
            source: '192.168.2.103',
            blocked: false
        }
    ]

    // 生成额外的随机日志
    const additionalLogs = Array.from({ length: count - 4 }, (_, index) => {
        const attackType = attackTypes[Math.floor(Math.random() * attackTypes.length)]
        const target = targets[Math.floor(Math.random() * targets.length)]
        const severity = severities[Math.floor(Math.random() * severities.length)]
        const logTime = new Date(Date.now() - (index + 5) * 60000) // 每分钟一条

        return {
            id: `log_${Date.now()}_${index}`,
            timestamp: logTime.toISOString(),
            time: logTime.toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            }),
            target,
            targetName: `Target ${target.split('.')[3]}`,
            type: attackType,
            severity,
            description: descriptions[attackType],
            source: `192.168.${Math.floor(Math.random() * 10) + 2}.${Math.floor(Math.random() * 254) + 1}`,
            blocked: Math.random() > 0.3
        }
    })

    return [...defaultLogs, ...additionalLogs]
}

// 生成流量数据
export function generateMockTrafficData(timeRange = '6h') {
    const points = timeRange === '1h' ? 60 : timeRange === '6h' ? 72 : 144
    const now = new Date()

    const data = Array.from({ length: points }, (_, i) => {
        const timestamp = new Date(now.getTime() - (points - 1 - i) * 60000 * (timeRange === '1h' ? 1 : timeRange === '6h' ? 5 : 10))

        return {
            timestamp: timestamp.toISOString(),
            time: timeRange === '1h' ?
                timestamp.toLocaleTimeString('en-US', { minute: '2-digit' }) :
                timeRange === '6h' ?
                    timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) :
                    timestamp.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }),
            value: Math.sin(i * 0.2) * 30 + Math.random() * 20 + 40,
            attacks: Math.floor(Math.random() * 10),
            blocked: Math.floor(Math.random() * 5)
        }
    })

    return {
        timeRange,
        dataPoints: data,
        summary: {
            totalTraffic: data.reduce((sum, point) => sum + point.value, 0),
            totalAttacks: data.reduce((sum, point) => sum + point.attacks, 0),
            totalBlocked: data.reduce((sum, point) => sum + point.blocked, 0),
            avgTraffic: Math.round(data.reduce((sum, point) => sum + point.value, 0) / data.length)
        }
    }
}

// 生成网络拓扑数据
export function generateNetworkTopology() {
    return {
        nodes: [
            {
                id: 'central',
                ip: '192.168.1.10',
                type: 'server',
                status: 'compromised',
                x: 300,
                y: 200,
                radius: 25
            },
            {
                id: 'node_1',
                ip: '192.168.1.20',
                type: 'server',
                status: 'normal',
                x: 150,
                y: 120,
                radius: 20
            },
            {
                id: 'node_2',
                ip: '192.168.1.30',
                type: 'server',
                status: 'normal',
                x: 300,
                y: 80,
                radius: 20
            },
            {
                id: 'node_3',
                ip: '192.168.1.40',
                type: 'client',
                status: 'normal',
                x: 450,
                y: 120,
                radius: 20
            },
            {
                id: 'node_4',
                ip: '192.168.1.50',
                type: 'device',
                status: 'normal',
                x: 150,
                y: 280,
                radius: 20
            },
            {
                id: 'node_5',
                ip: '192.168.1.60',
                type: 'client',
                status: 'normal',
                x: 300,
                y: 320,
                radius: 20
            },
            {
                id: 'node_6',
                ip: '192.168.1.70',
                type: 'server',
                status: 'warning',
                x: 450,
                y: 200,
                radius: 20
            },
            {
                id: 'node_7',
                ip: '192.168.1.80',
                type: 'server',
                status: 'compromised',
                x: 450,
                y: 280,
                radius: 20
            }
        ],
        edges: [
            { id: 'e1', source: 'central', target: 'node_1', x1: 300, y1: 200, x2: 150, y2: 120 },
            { id: 'e2', source: 'central', target: 'node_2', x1: 300, y1: 200, x2: 300, y2: 80 },
            { id: 'e3', source: 'central', target: 'node_3', x1: 300, y1: 200, x2: 450, y2: 120 },
            { id: 'e4', source: 'central', target: 'node_4', x1: 300, y1: 200, x2: 150, y2: 280 },
            { id: 'e5', source: 'central', target: 'node_5', x1: 300, y1: 200, x2: 300, y2: 320 },
            { id: 'e6', source: 'central', target: 'node_6', x1: 300, y1: 200, x2: 450, y2: 200 },
            { id: 'e7', source: 'central', target: 'node_7', x1: 300, y1: 200, x2: 450, y2: 280 }
        ]
    }
}

// 生成蜘蛛图扫描数据
export function generateVulnerabilityScanData() {
    return {
        metrics: [
            { name: 'SCORE', value: 85, angle: 0, x: 0, y: -85 },
            { name: 'SIGRE', value: 73, angle: 72, x: 73, y: -42 },
            { name: 'AVAILABILITY', value: 69, angle: 144, x: 45, y: 69 },
            { name: 'INTEGRITY', value: 69, angle: 216, x: -45, y: 69 },
            { name: 'SCORE', value: 73, angle: 288, x: -73, y: -42 }
        ],
        summary: {
            overallScore: 74,
            criticalVulns: 2,
            highVulns: 5,
            mediumVulns: 12,
            lowVulns: 8
        }
    }
}

// 攻击方法配置
export const attackMethodsConfig = [
    {
        id: 'vulnerability',
        name: 'VULNERABILITY SCAN',
        description: 'Comprehensive security vulnerability assessment',
        severity: 'medium',
        enabled: true,
        estimatedTime: '5-10 minutes',
        successRate: 85
    },
    {
        id: 'brute_force',
        name: 'BRUTE FORCE',
        description: 'Password and authentication brute force attack',
        severity: 'high',
        enabled: true,
        estimatedTime: '10-30 minutes',
        successRate: 45
    },
    {
        id: 'sql_injection',
        name: 'SQL INJECTION',
        description: 'Database injection attack vector',
        severity: 'critical',
        enabled: true,
        estimatedTime: '2-5 minutes',
        successRate: 60
    },
    {
        id: 'command_injection',
        name: 'COMMAND INJECTION',
        description: 'System command injection exploit',
        severity: 'critical',
        enabled: true,
        estimatedTime: '1-3 minutes',
        successRate: 70
    },
    {
        id: 'dos',
        name: 'DENIAL OF SERVICE',
        description: 'Distributed denial of service attack',
        severity: 'high',
        enabled: true,
        estimatedTime: '15-60 minutes',
        successRate: 90
    },
    {
        id: 'mitm',
        name: 'MAN-IN-THE-MIDDLE',
        description: 'Network traffic interception attack',
        severity: 'high',
        enabled: true,
        estimatedTime: '20-45 minutes',
        successRate: 55
    }
]

// 系统状态数据
export function generateSystemMetrics() {
    return {
        cpu: Math.floor(Math.random() * 30) + 40,
        memory: Math.floor(Math.random() * 20) + 60,
        disk: Math.floor(Math.random() * 15) + 30,
        network: Math.floor(Math.random() * 25) + 50,
        uptime: '99.8%',
        lastUpdate: new Date().toISOString()
    }
}

// 安全统计数据
export function generateSecurityStats() {
    return {
        threatsBlocked: Math.floor(Math.random() * 100) + 1200,
        activeConnections: Math.floor(Math.random() * 50) + 150,
        vulnerabilities: Math.floor(Math.random() * 20) + 25,
        securityScore: Math.floor(Math.random() * 20) + 75,
        activeSessions: Math.floor(Math.random() * 10) + 15,
        suspiciousActivities: Math.floor(Math.random() * 5) + 2
    }
}

// 实时流量数据
export function generateRealtimeTraffic() {
    return {
        total: Math.floor(Math.random() * 1000) + 500,
        incoming: Math.floor(Math.random() * 600) + 200,
        outgoing: Math.floor(Math.random() * 400) + 100,
        packetsPerSecond: Math.floor(Math.random() * 5000) + 2000,
        bytesPerSecond: Math.floor(Math.random() * 1000000) + 500000
    }
}

// 攻击类型分布数据
export function generateAttackDistribution() {
    return [
        { type: 'sql_injection', name: 'SQL注入', count: 15, color: '#ef4444' },
        { type: 'xss', name: 'XSS攻击', count: 8, color: '#f97316' },
        { type: 'brute_force', name: '暴力破解', count: 12, color: '#eab308' },
        { type: 'dos', name: 'DOS攻击', count: 6, color: '#3b82f6' },
        { type: 'command_injection', name: '命令注入', count: 4, color: '#8b5cf6' },
        { type: 'vulnerability', name: '漏洞扫描', count: 3, color: '#06b6d4' }
    ]
}

// 主要的Mock仪表盘数据
export const mockDashboardData = {
    targets: generateMockTargets(),
    networkTopology: generateNetworkTopology(),
    vulnerabilityScan: generateVulnerabilityScanData(),
    attackMethods: attackMethodsConfig,
    systemMetrics: generateSystemMetrics(),
    securityStats: generateSecurityStats(),
    realtimeTraffic: generateRealtimeTraffic(),
    attackDistribution: generateAttackDistribution(),
    trafficData: {
        '1h': generateMockTrafficData('1h'),
        '6h': generateMockTrafficData('6h'),
        '24h': generateMockTrafficData('24h')
    },
    recentAttackLogs: generateMockAttackLogs(20),
    threats: {
        active: 3,
        resolved: 127,
        investigating: 8
    },
    attacks: {
        today: 42,
        thisWeek: 287,
        thisMonth: 1205
    },
    vulnerabilities: {
        critical: 2,
        high: 5,
        medium: 12,
        low: 8
    }
}

// 辅助函数
export function getAttackMethodById(id) {
    return attackMethodsConfig.find(method => method.id === id)
}

export function getTargetById(id) {
    return mockDashboardData.targets.find(target => target.id === id)
}

export function getTargetByIp(ip) {
    return mockDashboardData.targets.find(target => target.ip === ip)
}

// 动态更新函数
export function updateMockData() {
    mockDashboardData.systemMetrics = generateSystemMetrics()
    mockDashboardData.securityStats = generateSecurityStats()
    mockDashboardData.realtimeTraffic = generateRealtimeTraffic()

    console.log('🔄 Mock数据已更新')
    return mockDashboardData
}

// 模拟攻击执行
export function simulateAttackExecution(methodId, targetIp) {
    const method = getAttackMethodById(methodId)
    const target = getTargetByIp(targetIp)

    if (!method || !target) {
        throw new Error('攻击方法或目标不存在')
    }

    const now = new Date()
    const success = Math.random() < (method.successRate / 100)

    const result = {
        id: `attack_${Date.now()}`,
        methodId,
        methodName: method.name,
        targetIp,
        targetName: target.name,
        timestamp: now.toISOString(),
        time: now.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }),
        success,
        severity: method.severity,
        description: success ?
            `${method.description} - 攻击成功` :
            `${method.description} - 攻击失败`,
        blocked: !success,
        details: {
            estimatedTime: method.estimatedTime,
            actualTime: Math.floor(Math.random() * 30) + 10 + ' seconds',
            techniques: ['Port scanning', 'Service detection', 'Vulnerability assessment'],
            impact: success ? 'High' : 'None'
        }
    }

    console.log('⚔️ 模拟攻击执行:', result)
    return result
}