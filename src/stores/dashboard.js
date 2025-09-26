// src/stores/dashboard.js - 更新支持攻击界面
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { generateMockTargets, generateMockAttackLogs, generateMockTrafficData } from '@/mock/data.js'

export const useDashboardStore = defineStore('dashboard', () => {
    // 响应式状态
    const loading = ref(false)
    const error = ref(null)
    const lastUpdated = ref(null)

    // 攻击目标数据
    const targets = ref([])
    const selectedTarget = ref(null)

    // 攻击日志数据
    const attackLogs = ref([])
    const realtimeAttackLogs = ref([])
    const recentAttackLogs = ref([])

    // 系统指标数据
    const systemMetrics = ref({
        cpu: 0,
        memory: 0,
        disk: 0,
        network: 0
    })

    // 安全统计数据
    const securityStats = ref({
        threatsBlocked: 0,
        activeConnections: 0,
        vulnerabilities: 0,
        securityScore: 0
    })

    // 流量数据
    const trafficData = ref({
        '1h': {},
        '6h': {},
        '24h': {}
    })
    const realtimeTraffic = ref({
        total: 0,
        incoming: 0,
        outgoing: 0
    })

    // 攻击方法数据
    const attackMethods = ref([
        {
            id: 'vulnerability',
            name: 'VULNERABILITY SCAN',
            description: 'Comprehensive security vulnerability assessment',
            severity: 'medium',
            enabled: true
        },
        {
            id: 'brute_force',
            name: 'BRUTE FORCE',
            description: 'Password and authentication brute force attack',
            severity: 'high',
            enabled: true
        },
        {
            id: 'sql_injection',
            name: 'SQL INJECTION',
            description: 'Database injection attack vector',
            severity: 'critical',
            enabled: true
        },
        {
            id: 'command_injection',
            name: 'COMMAND INJECTION',
            description: 'System command injection exploit',
            severity: 'critical',
            enabled: true
        },
        {
            id: 'dos',
            name: 'DENIAL OF SERVICE',
            description: 'Distributed denial of service attack',
            severity: 'high',
            enabled: true
        },
        {
            id: 'mitm',
            name: 'MAN-IN-THE-MIDDLE',
            description: 'Network traffic interception attack',
            severity: 'high',
            enabled: true
        }
    ])

    // 计算属性
    const totalTargets = computed(() => targets.value.length)
    const activeTargets = computed(() => targets.value.filter(t => t.status === 'normal' || t.status === 'warning').length)
    const compromisedTargets = computed(() => targets.value.filter(t => t.status === 'compromised').length)
    const totalVulnerabilities = computed(() => targets.value.reduce((sum, target) => sum + (target.vulnerabilities || 0), 0))

    const recentAttacks = computed(() => {
        return realtimeAttackLogs.value.slice(0, 10)
    })

    const attacksByType = computed(() => {
        const types = {}
        realtimeAttackLogs.value.forEach(log => {
            types[log.type] = (types[log.type] || 0) + 1
        })
        return types
    })

    // Actions

    /**
     * 初始化仪表盘数据
     */
    async function initializeDashboard() {
        try {
            loading.value = true
            error.value = null

            console.log('🚀 初始化攻击仪表盘数据...')

            // 加载各种数据
            await Promise.all([
                loadTargets(),
                loadAttackLogs(),
                loadTrafficData(),
                loadSystemMetrics()
            ])

            lastUpdated.value = new Date()
            console.log('✅ 攻击仪表盘数据初始化完成')

        } catch (err) {
            console.error('❌ 初始化仪表盘失败:', err)
            error.value = err.message || '初始化失败'
        } finally {
            loading.value = false
        }
    }

    /**
     * 加载攻击目标
     */
    async function loadTargets() {
        try {
            console.log('🎯 加载攻击目标...')

            // 使用Mock数据
            targets.value = generateMockTargets()

            // 设置默认选中目标
            if (targets.value.length > 0 && !selectedTarget.value) {
                selectedTarget.value = targets.value[0]
            }

            console.log(`✅ 已加载 ${targets.value.length} 个攻击目标`)

        } catch (error) {
            console.error('❌ 加载攻击目标失败:', error)
            // 使用默认数据
            targets.value = [
                { id: 'target_1', ip: '192.168.1.10', name: 'Web Server', status: 'compromised', vulnerabilities: 3 },
                { id: 'target_2', ip: '192.168.1.20', name: 'Database Server', status: 'warning', vulnerabilities: 7 },
                { id: 'target_3', ip: '192.168.1.30', name: 'File Server', status: 'normal', vulnerabilities: 2 },
                { id: 'target_4', ip: '192.168.1.40', name: 'Admin Workstation', status: 'normal', vulnerabilities: 1 },
                { id: 'target_5', ip: '192.168.1.50', name: 'IoT Device', status: 'offline', vulnerabilities: 5 }
            ]
        }
    }

    /**
     * 加载攻击日志
     */
    async function loadAttackLogs() {
        try {
            console.log('📋 加载攻击日志...')

            // 使用Mock数据生成攻击日志
            const mockLogs = generateMockAttackLogs(50)

            attackLogs.value = mockLogs
            realtimeAttackLogs.value = mockLogs
            recentAttackLogs.value = mockLogs.slice(0, 20)

            console.log(`✅ 已加载 ${mockLogs.length} 条攻击日志`)

        } catch (error) {
            console.error('❌ 加载攻击日志失败:', error)
            // 使用默认数据
            const defaultLogs = [
                {
                    id: 'log_1',
                    time: '10:34:21',
                    target: '192.168.1.10',
                    description: 'SQL injection attempt',
                    type: 'sql_injection',
                    severity: 'high',
                    blocked: true
                },
                {
                    id: 'log_2',
                    time: '10:32:49',
                    target: '192.168.1.20',
                    description: 'Command injection attempt',
                    type: 'command_injection',
                    severity: 'critical',
                    blocked: false
                },
                {
                    id: 'log_3',
                    time: '10:30:15',
                    target: '192.168.1.30',
                    description: 'Brute force attack',
                    type: 'brute_force',
                    severity: 'medium',
                    blocked: true
                },
                {
                    id: 'log_4',
                    time: '10:27:58',
                    target: '192.168.1.10',
                    description: 'Vulnerability scan',
                    type: 'vulnerability',
                    severity: 'low',
                    blocked: false
                }
            ]

            attackLogs.value = defaultLogs
            realtimeAttackLogs.value = defaultLogs
            recentAttackLogs.value = defaultLogs
        }
    }

    /**
     * 加载流量数据
     */
    async function loadTrafficData() {
        try {
            console.log('📊 加载流量数据...')

            // 生成不同时间范围的流量数据
            trafficData.value['1h'] = generateMockTrafficData('1h')
            trafficData.value['6h'] = generateMockTrafficData('6h')
            trafficData.value['24h'] = generateMockTrafficData('24h')

            // 更新实时流量数据
            realtimeTraffic.value = {
                total: Math.floor(Math.random() * 1000) + 500,
                incoming: Math.floor(Math.random() * 600) + 200,
                outgoing: Math.floor(Math.random() * 400) + 100
            }

            console.log('✅ 流量数据加载完成')

        } catch (error) {
            console.error('❌ 加载流量数据失败:', error)
            // 使用默认数据
            realtimeTraffic.value = {
                total: 756,
                incoming: 456,
                outgoing: 300
            }
        }
    }

    /**
     * 加载系统指标
     */
    async function loadSystemMetrics() {
        try {
            console.log('⚙️ 加载系统指标...')

            // Mock系统指标数据
            systemMetrics.value = {
                cpu: Math.floor(Math.random() * 30) + 40,
                memory: Math.floor(Math.random() * 20) + 60,
                disk: Math.floor(Math.random() * 15) + 30,
                network: Math.floor(Math.random() * 25) + 50
            }

            securityStats.value = {
                threatsBlocked: Math.floor(Math.random() * 100) + 1200,
                activeConnections: Math.floor(Math.random() * 50) + 150,
                vulnerabilities: totalVulnerabilities.value,
                securityScore: Math.floor(Math.random() * 20) + 75
            }

            console.log('✅ 系统指标加载完成')

        } catch (error) {
            console.error('❌ 加载系统指标失败:', error)
        }
    }

    /**
     * 选择攻击目标
     */
    function selectTarget(target) {
        console.log('🎯 选择攻击目标:', target.ip)
        selectedTarget.value = target
    }

    /**
     * 添加攻击日志
     */
    function addAttackLog(log) {
        console.log('📝 添加攻击日志:', log)

        // 添加到日志数组的开头
        realtimeAttackLogs.value.unshift(log)
        attackLogs.value.unshift(log)

        // 限制日志数量，保持最新的100条
        if (realtimeAttackLogs.value.length > 100) {
            realtimeAttackLogs.value = realtimeAttackLogs.value.slice(0, 100)
        }

        if (attackLogs.value.length > 100) {
            attackLogs.value = attackLogs.value.slice(0, 100)
        }

        // 更新最近攻击日志
        recentAttackLogs.value = realtimeAttackLogs.value.slice(0, 20)
    }

    /**
     * 执行攻击方法
     */
    async function executeAttackMethod(methodId, targetIp) {
        try {
            console.log('⚔️ 执行攻击方法:', methodId, '目标:', targetIp)

            const method = attackMethods.value.find(m => m.id === methodId)
            if (!method) {
                throw new Error('未找到攻击方法')
            }

            const now = new Date()
            const newLog = {
                id: `log_${Date.now()}`,
                time: now.toTimeString().substring(0, 8),
                target: targetIp,
                description: getAttackDescription(methodId),
                type: methodId,
                severity: method.severity,
                blocked: Math.random() > 0.3, // 70% 概率被阻断
                timestamp: now.toISOString()
            }

            // 添加到攻击日志
            addAttackLog(newLog)

            // 模拟攻击执行延迟
            await new Promise(resolve => setTimeout(resolve, 1000))

            console.log('✅ 攻击方法执行完成')
            return newLog

        } catch (error) {
            console.error('❌ 执行攻击方法失败:', error)
            throw error
        }
    }

    /**
     * 获取攻击描述
     */
    function getAttackDescription(methodId) {
        const descriptions = {
            'vulnerability': 'Vulnerability scan completed',
            'brute_force': 'Brute force attack initiated',
            'sql_injection': 'SQL injection attempt',
            'command_injection': 'Command injection attempt',
            'dos': 'DoS attack launched',
            'mitm': 'MITM attack deployed'
        }

        return descriptions[methodId] || 'Unknown attack method'
    }

    /**
     * 刷新数据
     */
    async function refreshData() {
        console.log('🔄 刷新仪表盘数据...')
        await initializeDashboard()
    }

    /**
     * 清理数据
     */
    function clearData() {
        targets.value = []
        attackLogs.value = []
        realtimeAttackLogs.value = []
        recentAttackLogs.value = []
        selectedTarget.value = null
        lastUpdated.value = null
    }

    // 返回store的公共接口
    return {
        // 状态
        loading,
        error,
        lastUpdated,

        // 攻击目标
        targets,
        selectedTarget,
        totalTargets,
        activeTargets,
        compromisedTargets,

        // 攻击日志
        attackLogs,
        realtimeAttackLogs,
        recentAttackLogs,
        recentAttacks,
        attacksByType,

        // 系统指标
        systemMetrics,
        securityStats,
        totalVulnerabilities,

        // 流量数据
        trafficData,
        realtimeTraffic,

        // 攻击方法
        attackMethods,

        // 方法
        initializeDashboard,
        loadTargets,
        loadAttackLogs,
        loadTrafficData,
        loadSystemMetrics,
        selectTarget,
        addAttackLog,
        executeAttackMethod,
        refreshData,
        clearData
    }
})