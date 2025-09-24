// 模拟数据生成
import { TARGET_STATUS, ATTACK_TYPES, NODE_TYPES } from '@/utils/constants'

// 生成随机IP地址
const generateRandomIP = () => {
    return `192.168.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 254) + 1}`
}

// 生成随机MAC地址
const generateRandomMAC = () => {
    return Array.from({ length: 6 }, () =>
        Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
    ).join(':')
}

// 生成时间戳
const generateTimestamp = (offsetHours = 0) => {
    const now = new Date()
    now.setHours(now.getHours() - offsetHours)
    return now.toISOString()
}

// 模拟目标列表
export const mockTargets = [
    {
        id: 'target_1',
        ip: '192.168.1.10',
        name: 'Web Server',
        type: 'server',
        status: TARGET_STATUS.NORMAL,
        os: 'Ubuntu 20.04',
        services: ['HTTP:80', 'HTTPS:443', 'SSH:22'],
        lastSeen: generateTimestamp(0.5),
        vulnerabilities: 3
    },
    {
        id: 'target_2',
        ip: '192.168.1.20',
        name: 'Database Server',
        type: 'server',
        status: TARGET_STATUS.WARNING,
        os: 'CentOS 8',
        services: ['MySQL:3306', 'SSH:22'],
        lastSeen: generateTimestamp(1),
        vulnerabilities: 7
    },
    {
        id: 'target_3',
        ip: '192.168.1.30',
        name: 'File Server',
        type: 'server',
        status: TARGET_STATUS.DANGER,
        os: 'Windows Server 2019',
        services: ['SMB:445', 'FTP:21', 'RDP:3389'],
        lastSeen: generateTimestamp(0.2),
        vulnerabilities: 12
    },
    {
        id: 'target_4',
        ip: '192.168.1.100',
        name: 'Admin Workstation',
        type: 'client',
        status: TARGET_STATUS.NORMAL,
        os: 'Windows 10',
        services: ['RDP:3389'],
        lastSeen: generateTimestamp(2),
        vulnerabilities: 2
    },
    {
        id: 'target_5',
        ip: '192.168.1.200',
        name: 'IoT Device',
        type: 'device',
        status: TARGET_STATUS.OFFLINE,
        os: 'Linux Embedded',
        services: ['HTTP:8080'],
        lastSeen: generateTimestamp(24),
        vulnerabilities: 5
    }
]

// 模拟攻击日志
export const generateMockAttackLogs = (count = 20) => {
    const attackTypes = Object.values(ATTACK_TYPES)
    const severities = ['low', 'medium', 'high', 'critical']
    const descriptions = {
        [ATTACK_TYPES.SQL_INJECTION]: [
            'SQL injection attempt detected in login form',
            'Malicious SQL query intercepted',
            'Database access attempt via injection'
        ],
        [ATTACK_TYPES.XSS]: [
            'Cross-site scripting attempt blocked',
            'Malicious script injection detected',
            'XSS payload in user input'
        ],
        [ATTACK_TYPES.BRUTE_FORCE]: [
            'Multiple failed login attempts',
            'Password brute force attack detected',
            'Suspicious authentication activity'
        ],
        [ATTACK_TYPES.DOS]: [
            'DDoS attack traffic detected',
            'Service unavailable due to attack',
            'High volume requests from single source'
        ]
    }

    return Array.from({ length: count }, (_, index) => {
        const attackType = attackTypes[Math.floor(Math.random() * attackTypes.length)]
        const target = mockTargets[Math.floor(Math.random() * mockTargets.length)]
        const severity = severities[Math.floor(Math.random() * severities.length)]

        return {
            id: `log_${Date.now()}_${index}`,
            timestamp: generateTimestamp(Math.random() * 72), // 最近3天内
            target: target.ip,
            targetName: target.name,
            type: attackType,
            severity,
            description: descriptions[attackType]?.[Math.floor(Math.random() * descriptions[attackType].length)] || 'Unknown attack detected',
            source: generateRandomIP(),
            blocked: Math.random() > 0.3, // 70% 被阻止
            details: {
                protocol: Math.random() > 0.5 ? 'TCP' : 'UDP',
                port: Math.floor(Math.random() * 65535),
                payload: Math.random().toString(36).substring(2, 15)
            }
        }
    })
}

// 模拟网络拓扑数据
export const mockNetworkTopology = {
    nodes: [
        {
            id: 'router_1',
            label: 'Main Router',
            type: NODE_TYPES.ROUTER,
            ip: '192.168.1.1',
            status: 'active',
            x: 400,
            y: 300
        },
        {
            id: 'firewall_1',
            label: 'Firewall',
            type: NODE_TYPES.FIREWALL,
            ip: '192.168.1.254',
            status: 'active',
            x: 400,
            y: 200
        },
        {
            id: 'server_1',
            label: 'Web Server',
            type: NODE_TYPES.SERVER,
            ip: '192.168.1.10',
            status: 'normal',
            x: 200,
            y: 400
        },
        {
            id: 'server_2',
            label: 'DB Server',
            type: NODE_TYPES.DATABASE,
            ip: '192.168.1.20',
            status: 'warning',
            x: 600,
            y: 400
        },
        {
            id: 'client_1',
            label: 'Admin PC',
            type: NODE_TYPES.CLIENT,
            ip: '192.168.1.100',
            status: 'normal',
            x: 300,
            y: 500
        },
        {
            id: 'client_2',
            label: 'User PC',
            type: NODE_TYPES.CLIENT,
            ip: '192.168.1.101',
            status: 'normal',
            x: 500,
            y: 500
        }
    ],
    edges: [
        { source: 'firewall_1', target: 'router_1', type: 'normal' },
        { source: 'router_1', target: 'server_1', type: 'normal' },
        { source: 'router_1', target: 'server_2', type: 'warning' },
        { source: 'router_1', target: 'client_1', type: 'normal' },
        { source: 'router_1', target: 'client_2', type: 'normal' }
    ]
}

// 模拟漏洞扫描数据
export const generateMockScanResult = (targetId) => {
    const vulnerabilityTypes = [
        'SQL注入', 'XSS漏洞', '弱密码', '端口开放',
        '服务版本过旧', '权限配置错误', '加密强度不足'
    ]

    return {
        targetId,
        scanTime: new Date().toISOString(),
        radar: {
            indicators: vulnerabilityTypes.map(name => ({ name, max: 100 })),
            data: [{
                name: '风险等级',
                value: vulnerabilityTypes.map(() => Math.floor(Math.random() * 100))
            }]
        },
        summary: {
            critical: Math.floor(Math.random() * 5),
            high: Math.floor(Math.random() * 10),
            medium: Math.floor(Math.random() * 15),
            low: Math.floor(Math.random() * 20)
        },
        details: vulnerabilityTypes.map((type, index) => ({
            id: `vuln_${index}`,
            type,
            severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)],
            description: `发现${type}相关安全风险`,
            recommendation: `建议修复${type}问题`,
            cvss: (Math.random() * 10).toFixed(1)
        }))
    }
}

// 模拟流量数据
export const generateMockTrafficData = (targetId, timeRange = '1h') => {
    const now = new Date()
    const points = timeRange === '1h' ? 60 : timeRange === '6h' ? 72 : 144
    const interval = timeRange === '1h' ? 60000 : timeRange === '6h' ? 300000 : 600000

    const generateTrafficPoint = (timestamp) => ({
        timestamp: new Date(timestamp).toISOString(),
        incoming: Math.floor(Math.random() * 1000000), // bytes
        outgoing: Math.floor(Math.random() * 500000),
        packets: Math.floor(Math.random() * 1000),
        connections: Math.floor(Math.random() * 50)
    })

    const traffic = []
    for (let i = points; i >= 0; i--) {
        const timestamp = now.getTime() - (i * interval)
        traffic.push(generateTrafficPoint(timestamp))
    }

    return {
        targetId,
        timeRange,
        data: traffic,
        summary: {
            totalIncoming: traffic.reduce((sum, point) => sum + point.incoming, 0),
            totalOutgoing: traffic.reduce((sum, point) => sum + point.outgoing, 0),
            avgConnections: Math.floor(traffic.reduce((sum, point) => sum + point.connections, 0) / traffic.length),
            peakTraffic: Math.max(...traffic.map(point => point.incoming + point.outgoing))
        }
    }
}

// 模拟实时统计数据
export const mockStats = {
    totalTargets: mockTargets.length,
    onlineTargets: mockTargets.filter(t => t.status !== TARGET_STATUS.OFFLINE).length,
    activeAttacks: Math.floor(Math.random() * 10) + 5,
    vulnerabilities: mockTargets.reduce((sum, target) => sum + target.vulnerabilities, 0),
    networkTraffic: Math.floor(Math.random() * 10000000), // bytes per second
    systemHealth: Math.floor(Math.random() * 20) + 80, // 80-100%
    uptime: Math.floor(Math.random() * 100) + 95 // 95-100%
}

// 模拟仪表盘初始数据
export const mockDashboardData = {
    targets: mockTargets,
    attackLogs: generateMockAttackLogs(50),
    networkTopology: mockNetworkTopology,
    stats: mockStats,
    lastUpdated: new Date().toISOString()
}

// 模拟用户数据
export const mockUser = {
    id: 'user_1',
    username: 'admin',
    email: 'admin@security.com',
    role: 'administrator',
    avatar: null,
    permissions: ['read', 'write', 'admin'],
    lastLogin: generateTimestamp(2),
    createdAt: generateTimestamp(30 * 24) // 30天前创建
}

// 模拟登录响应
export const mockAuthResponse = {
    success: true,
    token: 'mock_jwt_token_' + Math.random().toString(36).substring(2),
    user: mockUser,
    expiresIn: 3600 // 1小时
}

// WebSocket模拟消息生成器
export class MockWebSocketServer {
    constructor() {
        this.clients = new Set()
        this.messageInterval = null
    }

    addClient(client) {
        this.clients.add(client)

        // 如果是第一个客户端，开始发送模拟消息
        if (this.clients.size === 1) {
            this.startSendingMessages()
        }
    }

    removeClient(client) {
        this.clients.delete(client)

        // 如果没有客户端了，停止发送消息
        if (this.clients.size === 0) {
            this.stopSendingMessages()
        }
    }

    startSendingMessages() {
        this.messageInterval = setInterval(() => {
            this.sendRandomMessage()
        }, 5000) // 每5秒发送一条消息
    }

    stopSendingMessages() {
        if (this.messageInterval) {
            clearInterval(this.messageInterval)
            this.messageInterval = null
        }
    }

    sendRandomMessage() {
        const messageTypes = [
            'ATTACK_LOG',
            'TARGET_STATUS',
            'TRAFFIC_UPDATE'
        ]

        const messageType = messageTypes[Math.floor(Math.random() * messageTypes.length)]
        let message

        switch (messageType) {
            case 'ATTACK_LOG':
                const logs = generateMockAttackLogs(1)
                message = {
                    type: 'ATTACK_LOG',
                    data: logs[0]
                }
                break

            case 'TARGET_STATUS':
                const target = mockTargets[Math.floor(Math.random() * mockTargets.length)]
                const statuses = Object.values(TARGET_STATUS)
                message = {
                    type: 'TARGET_STATUS',
                    data: {
                        targetId: target.id,
                        status: statuses[Math.floor(Math.random() * statuses.length)],
                        timestamp: new Date().toISOString()
                    }
                }
                break

            case 'TRAFFIC_UPDATE':
                message = {
                    type: 'TRAFFIC_UPDATE',
                    data: {
                        timestamp: new Date().toISOString(),
                        incoming: Math.floor(Math.random() * 1000000),
                        outgoing: Math.floor(Math.random() * 500000),
                        total: Math.floor(Math.random() * 1500000)
                    }
                }
                break
        }

        // 发送给所有客户端
        this.broadcast(JSON.stringify(message))
    }

    broadcast(message) {
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message)
            }
        })
    }
}

// 导出模拟WebSocket服务器实例
export const mockWsServer = new MockWebSocketServer()