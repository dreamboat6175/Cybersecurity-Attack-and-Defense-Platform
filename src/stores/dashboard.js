// src/stores/dashboard.js
import { defineStore } from 'pinia'
import api from '@/api'

export const useDashboardStore = defineStore('dashboard', {
    state: () => ({
        // 基础状态
        isInitialized: false,
        loading: false,
        error: null,

        // 目标相关
        targets: [],
        selectedTargetId: null,

        // 攻击日志
        attackLogs: [],
        realtimeAttackLogs: [],

        // 扫描结果
        scanResults: {},

        // 流量数据
        trafficData: {},
        realtimeTraffic: {
            total: 0,
            incoming: 0,
            outgoing: 0
        },

        // 系统指标
        systemMetrics: {
            cpu: 0,
            memory: 0,
            disk: 0,
            network: 0
        },

        // 安全统计
        securityStats: {
            threatsBlocked: 0,
            activeConnections: 0,
            vulnerabilities: 0,
            securityScore: 0
        }
    }),

    getters: {
        selectedTarget: (state) => {
            return state.targets.find(target => target.id === state.selectedTargetId)
        },

        recentAttackLogs: (state) => {
            return [...state.realtimeAttackLogs, ...state.attackLogs]
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, 100) // 只保留最近100条
        },

        onlineTargets: (state) => {
            return state.targets.filter(target => target.status !== 'offline')
        },

        vulnerableTargets: (state) => {
            return state.targets.filter(target => target.vulnerabilities > 0)
        }
    },

    actions: {
        /**
         * 初始化仪表板
         */
        async initializeDashboard() {
            if (this.isInitialized) return

            try {
                this.loading = true
                this.error = null

                // 并行加载所有数据
                await Promise.all([
                    this.loadTargets(),
                    this.loadAttackLogs(),
                    this.loadTrafficData(),
                    this.loadSystemMetrics()
                ])

                this.isInitialized = true
                console.log('✅ 仪表板数据初始化完成')

            } catch (error) {
                this.error = error.message
                console.error('❌ 仪表板初始化失败:', error)
                throw error
            } finally {
                this.loading = false
            }
        },

        /**
         * 加载目标列表
         */
        async loadTargets() {
            try {
                const response = await api.get('/api/targets')
                this.targets = response.data || []

                // 如果没有选中目标，选择第一个
                if (!this.selectedTargetId && this.targets.length > 0) {
                    this.selectedTargetId = this.targets[0].id
                }
            } catch (error) {
                console.error('加载目标列表失败:', error)
                // 使用Mock数据
                this.targets = [
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
                        lastSeen: new Date().toISOString(),
                        vulnerabilities: 7,
                        scanning: false
                    }
                ]
                if (!this.selectedTargetId && this.targets.length > 0) {
                    this.selectedTargetId = this.targets[0].id
                }
            }
        },

        /**
         * 加载攻击日志
         */
        async loadAttackLogs() {
            try {
                const response = await api.get('/api/attacks/logs')
                this.attackLogs = response.data || []
            } catch (error) {
                console.error('加载攻击日志失败:', error)
                // 使用Mock数据
                this.attackLogs = []
            }
        },

        /**
         * 加载流量数据
         */
        async loadTrafficData() {
            try {
                const response = await api.get('/api/traffic/6h')
                this.trafficData['6h'] = response.data || {}

                // 更新实时流量数据
                this.realtimeTraffic = {
                    total: Math.floor(Math.random() * 1000) + 500,
                    incoming: Math.floor(Math.random() * 600) + 200,
                    outgoing: Math.floor(Math.random() * 400) + 100
                }
            } catch (error) {
                console.error('加载流量数据失败:', error)
                // Mock数据
                this.realtimeTraffic = {
                    total: 756,
                    incoming: 456,
                    outgoing: 300
                }
            }
        },

        /**
         * 加载系统指标
         */
        async loadSystemMetrics() {
            try {
                // Mock系统指标数据
                this.systemMetrics = {
                    cpu: Math.floor(Math.random() * 30) + 40,
                    memory: Math.floor(Math.random() * 20) + 60,
                    disk: Math.floor(Math.random() * 15) + 30,
                    network: Math.floor(Math.random() * 25) + 50
                }

                this.securityStats = {
                    threatsBlocked: Math.floor(Math.random() * 100) + 1200,
                    activeConnections: Math.floor(Math.random() * 50) + 150,
                    vulnerabilities: this.targets.reduce((sum, target) => sum + target.vulnerabilities, 0),
                    securityScore: Math.floor(Math.random() * 20) + 75
                }
            } catch (error) {
                console.error('加载系统指标失败:', error)
            }
        },

        /**
         * 选择目标
         */
        selectTarget(targetId) {
            this.selectedTargetId = targetId
            console.log('🎯 选择目标:', targetId)
        },

        /**
         * 添加目标
         */
        async addTarget(targetData) {
            try {
                const response = await api.post('/api/targets', targetData)

                if (response.success) {
                    this.targets.push(response.data)
                    console.log('✅ 目标添加成功')
                    return response.data
                } else {
                    throw new Error(response.message || '添加目标失败')
                }
            } catch (error) {
                console.error('添加目标失败:', error)
                throw error
            }
        },

        /**
         * 开始扫描
         */
        async startScan(targetId) {
            try {
                const target = this.targets.find(t => t.id === targetId)
                if (!target) throw new Error('目标不存在')

                // 更新目标状态
                target.scanning = true

                const response = await api.post(`/api/scan/${targetId}`)

                if (response.success) {
                    console.log('✅ 扫描启动成功')
                } else {
                    target.scanning = false
                    throw new Error(response.message || '启动扫描失败')
                }
            } catch (error) {
                console.error('启动扫描失败:', error)
                const target = this.targets.find(t => t.id === targetId)
                if (target) target.scanning = false
                throw error
            }
        },

        /**
         * 添加实时攻击日志
         */
        addRealtimeAttack(attackData) {
            this.realtimeAttackLogs.unshift(attackData)

            // 限制实时日志数量
            if (this.realtimeAttackLogs.length > 50) {
                this.realtimeAttackLogs = this.realtimeAttackLogs.slice(0, 50)
            }
        },

        /**
         * 更新扫描结果
         */
        updateScanResult(scanResult) {
            this.scanResults[scanResult.targetId] = scanResult

            // 更新目标状态
            const target = this.targets.find(t => t.id === scanResult.targetId)
            if (target) {
                target.scanning = false
                target.lastScan = scanResult.timestamp
                if (scanResult.vulnerabilities) {
                    target.vulnerabilities = scanResult.vulnerabilities.length
                }
            }
        },

        /**
         * 更新目标状态
         */
        updateTargetStatus(statusData) {
            const target = this.targets.find(t => t.id === statusData.targetId)
            if (target) {
                Object.assign(target, statusData)
            }
        },

        /**
         * 更新流量数据
         */
        updateTrafficData(trafficData) {
            if (trafficData.realtime) {
                this.realtimeTraffic = trafficData.realtime
            }

            if (trafficData.timeRange && trafficData.data) {
                this.trafficData[trafficData.timeRange] = trafficData.data
            }
        },

        /**
         * 刷新数据
         */
        async refreshData() {
            try {
                console.log('🔄 刷新仪表板数据...')

                await Promise.all([
                    this.loadSystemMetrics(),
                    this.loadTrafficData()
                ])

                console.log('✅ 数据刷新完成')
            } catch (error) {
                console.error('❌ 数据刷新失败:', error)
            }
        },

        /**
         * 刷新流量数据
         */
        async refreshTrafficData(timeRange) {
            try {
                const response = await api.get(`/api/traffic/${timeRange}`)
                this.trafficData[timeRange] = response.data || {}
            } catch (error) {
                console.error('刷新流量数据失败:', error)
            }
        },

        /**
         * 清除错误
         */
        clearError() {
            this.error = null
        }
    }
})