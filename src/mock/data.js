// src/mock/data.js - 修复循环导入问题
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

// 生成模拟目标数据
export function generateMockTargets() {
    return [
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
            status: 'offline',
            os: 'Linux Embedded',
            services: ['HTTP:8080'],
            lastSeen: new Date(Date.now() - 86400000).toISOString(),
            vulnerabilities: 5,
            scanning: false
        }
    ]
}

// 生成模拟攻击日志
export function generateMockAttackLogs(count = 20) {
    const attackTypes = ['sql_injection', 'xss', 'brute_force', 'dos', 'command_injection']
    const severities = ['low', 'medium', 'high', 'critical']
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
        const severity = severities[Math.floor(Math.random() * severities.length)]

        return {
            id: `log_${Date.now()}_${index}`,
            timestamp: new Date(Date.now() - Math.random() * 86400000 * 3).toISOString(),
            time: new Date(Date.now() - Math.random() * 86400000 * 3).toLocaleTimeString('en-US', {
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
            source: `192.168.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 254) + 1}`,
            blocked: Math.random() > 0.3
        }
    })
}

// 生成模拟扫描结果
export function generateMockScanResults(targetId) {
    return {
        targetId,
        timestamp: new Date().toISOString(),
        status: 'completed',
        results: {
            portScan: Math.floor(Math.random() * 20) + 80,
            serviceDetection: Math.floor(Math.random() * 20) + 75,
            vulnerability: Math.floor(Math.random() * 30) + 70,
            configCheck: Math.floor(Math.random() * 25) + 75,
            security: Math.floor(Math.random() * 30) + 70,
            compliance: Math.floor(Math.random() * 20) + 80
        },
        vulnerabilities: {
            critical: Math.floor(Math.random() * 3),
            high: Math.floor(Math.random() * 5),
            medium: Math.floor(Math.random() * 8),
            low: Math.floor(Math.random() * 10)
        },
        details: {
            openPorts: ['22', '80', '443', '3306'],
            services: ['SSH', 'HTTP', 'HTTPS', 'MySQL'],
            issues: [
                'Weak SSH configuration',
                'Outdated SSL certificate',
                'Default MySQL password'
            ]
        }
    }
}

// 生成模拟流量数据
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

// Mock仪表盘数据 - 在文件底部初始化以避免循环依赖
export const mockDashboardData = {
    targets: generateMockTargets(),
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
    },
    systemStatus: {
        uptime: '99.8%',
        cpu: 45,
        memory: 67,
        disk: 23,
        network: 89
    },
    recentAttackLogs: generateMockAttackLogs(20),
    networkTopology: {
        nodes: [
            {
                id: 'central',
                ip: '192.168.1.10',
                type: 'server',
                status: 'active',
                x: 300,
                y: 200
            },
            {
                id: 'node_1',
                ip: '192.168.1.20',
                type: 'client',
                status: 'normal',
                x: 200,
                y: 100
            },
            {
                id: 'node_2',
                ip: '192.168.1.30',
                type: 'client',
                status: 'warning',
                x: 400,
                y: 100
            },
            {
                id: 'node_3',
                ip: '192.168.1.40',
                type: 'client',
                status: 'normal',
                x: 500,
                y: 200
            },
            {
                id: 'node_4',
                ip: '192.168.1.50',
                type: 'client',
                status: 'normal',
                x: 400,
                y: 300
            },
            {
                id: 'node_5',
                ip: '192.168.1.60',
                type: 'client',
                status: 'normal',
                x: 200,
                y: 300
            },
            {
                id: 'node_6',
                ip: '192.168.1.70',
                type: 'client',
                status: 'normal',
                x: 100,
                y: 200
            }
        ],
        edges: [
            { source: 'central', target: 'node_1', type: 'normal' },
            { source: 'central', target: 'node_2', type: 'warning' },
            { source: 'central', target: 'node_3', type: 'normal' },
            { source: 'central', target: 'node_4', type: 'normal' },
            { source: 'central', target: 'node_5', type: 'normal' },
            { source: 'central', target: 'node_6', type: 'normal' }
        ]
    }
}