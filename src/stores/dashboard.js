// src/stores/dashboard.js
import { defineStore } from 'pinia'
import request from '@/api'
import wsManager, { wsHandlers } from '@/api/websocket'
import { ATTACK_METHODS } from '@/utils/constants'

export const useDashboardStore = defineStore('dashboard', {
    state: () => ({
        // 基础状态
        isLoading: false,
        error: null,
        lastUpdated: null,

        // 目标相关
        targets: [],
        selectedTargetId: null,

        // 攻击方法
        attackMethods: ATTACK_METHODS,

        // 攻击日志
        attackLogs: [],
        recentAttackLogs: [],

        // 网络拓扑
        networkNodes: [],
        networkEdges: [],

        // 漏洞扫描
        scanResults: {},
        vulnerabilityStats: {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
            total: 0
        },

        // 流量监控
        trafficData: {},
        realtimeTraffic: {
            incoming: 0,
            outgoing: 0,
            total: 0
        }
    }),

    getters: {
        selectedTarget: (state) => {
            return state.targets.find(target => target.id === state.selectedTargetId)
        },

        onlineTargets: (state) => {
            return state.targets.filter(target => target.status !== 'offline')
        },

        criticalTargets: (state) => {
            return state.targets.filter(target => target.status === 'danger')
        },

        totalVulnerabilities: (state) => {
            return state.targets.reduce((sum, target) => sum + (target.vulnerabilities || 0), 0)
        },

        recentAttacks: (state) => {
            return state.attackLogs.slice(0, 10)
        }
    },

    actions: {
        /**
         * 初始化仪表盘
         */
        async initializeDashboard() {
            try {
                this.isLoading = true
                console.log('🚀 初始化仪表盘数据...')

                // 加载基础数据
                await this.loadDashboardData()

                // 设置WebSocket监听
                this.setupWebSocketListeners()

                // 连接WebSocket
                wsManager.connect()

                this.lastUpdated = new Date().toISOString()
                console.log('✅ 仪表盘初始化完成')

            } catch (error) {
                console.error('❌ 仪表盘初始化失败:', error)
                this.error = error.message
                throw error
            } finally {
                this.isLoading = false
            }
        },

        /**
         * 加载仪表盘数据
         */
        async loadDashboardData() {
            try {
                const response = await request.get('/api/dashboard')

                if (response.data) {
                    this.targets = response.data.targets || []
                    this.attackLogs = response.data.attackLogs || []
                    this.recentAttackLogs = this.attackLogs.slice(0, 20)
                    this.networkNodes = response.data.networkTopology?.nodes || []
                    this.networkEdges = response.data.networkTopology?.edges || []

                    // 如果有目标且没有选中的目标，默认选中第一个
                    if (this.targets.length > 0 && !this.selectedTargetId) {
                        this.selectedTargetId = this.targets[0].id
                    }

                    // 加载选中目标的扫描数据
                    if (this.selectedTargetId) {
                        await this.loadVulnerabilityScan(this.selectedTargetId)
                    }
                }
            } catch (error) {
                console.error('❌ 加载仪表盘数据失败:', error)
                throw error
            }
        },

        /**
         * 刷新数据
         */
        async refreshData() {
            try {
                this.isLoading = true
                await this.loadDashboardData()
                this.lastUpdated = new Date().toISOString()
            } catch (error) {
                this.error = error.message
                throw error
            } finally {
                this.isLoading = false
            }
        },

        /**
         * 选择目标
         */
        async selectTarget(targetId) {
            if (this.selectedTargetId === targetId) return

            this.selectedTargetId = targetId

            if (targetId) {
                await this.loadVulnerabilityScan(targetId)
                await this.loadTrafficData(targetId)
            }
        },

        /**
         * 加载漏洞扫描数据
         */
        async loadVulnerabilityScan(targetId) {
            try {
                const response = await request.get(`/api/scan/${targetId}`)

                if (response.data) {
                    this.scanResults = response.data

                    // 更新漏洞统计
                    if (response.data.summary) {
                        this.vulnerabilityStats = {
                            ...response.data.summary,
                            total: Object.values(response.data.summary).reduce((sum, count) => sum + count, 0)
                        }
                    }
                }
            } catch (error) {
                console.error(`❌ 加载扫描数据失败 (${targetId}):`, error)
                this.scanResults = {}
                this.vulnerabilityStats = { critical: 0, high: 0, medium: 0, low: 0, total: 0 }
            }
        },

        /**
         * 启动扫描
         */
        async startScan(targetId) {
            try {
                await request.post(`/api/scan/${targetId}`)
                console.log(`🔍 扫描已启动: ${targetId}`)
                return true
            } catch (error) {
                console.error(`❌ 启动扫描失败 (${targetId}):`, error)
                throw error
            }
        },

        /**
         * 加载流量数据
         */
        async loadTrafficData(targetId, timeRange = '1h') {
            try {
                const response = await request.get(`/api/traffic/${targetId}?timeRange=${timeRange}`)

                if (response.data) {
                    this.trafficData = response.data
                }
            } catch (error) {
                console.error(`❌ 加载流量数据失败 (${targetId}):`, error)
                this.trafficData = {}
            }
        },

        /**
         * 添加攻击日志
         */
        addAttackLog(log) {
            const newLog = {
                id: `log_${Date.now()}_${Math.random()}`,
                timestamp: new Date().toISOString(),
                ...log
            }

            this.attackLogs.unshift(newLog)
            this.recentAttackLogs.unshift(newLog)

            // 限制日志数量
            if (this.attackLogs.length > 1000) {
                this.attackLogs = this.attackLogs.slice(0, 1000)
            }
            if (this.recentAttackLogs.length > 50) {
                this.recentAttackLogs = this.recentAttackLogs.slice(0, 50)
            }
        },

        /**
         * 更新目标状态
         */
        updateTargetStatus(targetId, status, timestamp) {
            const target = this.targets.find(t => t.id === targetId)
            if (target) {
                target.status = status
                target.lastSeen = timestamp || new Date().toISOString()

                // 如果是网络节点，同时更新网络拓扑
                const node = this.networkNodes.find(n => n.id === targetId)
                if (node) {
                    node.status = status
                }
            }
        },

        /**
         * 更新实时流量
         */
        updateRealtimeTraffic(trafficData) {
            this.realtimeTraffic = {
                ...this.realtimeTraffic,
                ...trafficData,
                timestamp: new Date().toISOString()
            }
        },

        /**
         * 设置WebSocket监听器
         */
        setupWebSocketListeners() {
            // 监听攻击日志
            wsHandlers.onAttackLog((data) => {
                console.log('📨 收到攻击日志:', data)
                this.addAttackLog(data)
            })

            // 监听目标状态变化
            wsHandlers.onTargetStatusChange((data) => {
                console.log('📨 目标状态变化:', data)
                this.updateTargetStatus(data.targetId, data.status, data.timestamp)
            })

            // 监听网络更新
            wsHandlers.onNetworkUpdate((data) => {
                console.log('📨 网络拓扑更新:', data)
                if (data.nodes) this.networkNodes = data.nodes
                if (data.edges) this.networkEdges = data.edges
            })

            // 监听扫描结果
            wsHandlers.onScanResult((data) => {
                console.log('📨 扫描结果:', data)
                if (data.targetId === this.selectedTargetId) {
                    this.scanResults = data.result
                    if (data.result.summary) {
                        this.vulnerabilityStats = {
                            ...data.result.summary,
                            total: Object.values(data.result.summary).reduce((sum, count) => sum + count, 0)
                        }
                    }
                }
            })

            // 监听流量更新
            wsHandlers.onTrafficUpdate((data) => {
                console.log('📨 流量更新:', data)
                this.updateRealtimeTraffic(data)
            })
        },

        /**
         * 清除错误
         */
        clearError() {
            this.error = null
        },

        /**
         * 重置状态
         */
        resetState() {
            this.$reset()
        }
    }
})