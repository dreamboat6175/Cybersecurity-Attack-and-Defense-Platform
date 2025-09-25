import { defineStore } from 'pinia'
import { dashboardAPI } from '@/api/dashboard'
import { targetsAPI } from '@/api/targets'
import { attacksAPI } from '@/api/attacks'

export const useDashboardStore = defineStore('dashboard', {
    state: () => ({
        // 加载状态
        loading: false,
        error: null,

        // 基础数据
        systemStats: {
            totalTargets: 0,
            onlineTargets: 0,
            activeAttacks: 0,
            vulnerabilities: 0
        },

        // 目标列表
        targets: [],
        selectedTargetId: null,

        // 攻击日志
        attackLogs: [],
        realtimeAttackLogs: [],

        // 网络拓扑
        networkTopology: {
            nodes: [],
            edges: []
        },

        // 扫描结果
        vulnerabilityScans: {},

        // 流量数据
        trafficData: {},
        realtimeTraffic: {
            incoming: 0,
            outgoing: 0,
            total: 0
        },

        // 攻击方法
        attackMethods: []
    }),

    getters: {
        // 当前选中的目标
        selectedTarget: (state) => {
            return state.targets.find(target => target.id === state.selectedTargetId)
        },

        // 在线目标数量
        onlineTargetsCount: (state) => {
            return state.targets.filter(target => target.status !== 'offline').length
        },

        // 最近攻击日志
        recentAttackLogs: (state) => {
            return state.attackLogs.slice(0, 10)
        },

        // 当前目标的扫描结果
        currentTargetScan: (state) => {
            return state.selectedTargetId ? state.vulnerabilityScans[state.selectedTargetId] : null
        }
    },

    actions: {
        // 初始化仪表盘
        async initializeDashboard() {
            try {
                this.loading = true
                this.error = null

                console.log('🚀 开始初始化仪表盘数据...')

                // 并行加载基础数据
                const [
                    overviewData,
                    targetsData,
                    logsData,
                    methodsData,
                    topologyData
                ] = await Promise.all([
                    dashboardAPI.getDashboardOverview(),
                    targetsAPI.getTargets(),
                    attacksAPI.getAttackLogs({ limit: 50 }),
                    attacksAPI.getAttackMethods(),
                    attacksAPI.getNetworkTopology()
                ])

                // 更新状态
                this.systemStats = overviewData.stats
                this.targets = targetsData.targets
                this.attackLogs = logsData.logs
                this.attackMethods = methodsData.methods
                this.networkTopology = topologyData.topology

                // 默认选中第一个目标
                if (this.targets.length > 0) {
                    await this.selectTarget(this.targets[0].id)
                }

                // 启动实时数据更新
                this.startRealtimeUpdates()

                console.log('✅ 仪表盘初始化完成')

            } catch (error) {
                console.error('❌ 仪表盘初始化失败:', error)
                this.error = error.message
                throw error
            } finally {
                this.loading = false
            }
        },

        // 选择目标
        async selectTarget(targetId) {
            try {
                console.log(`🎯 选择目标: ${targetId}`)

                this.selectedTargetId = targetId

                // 加载该目标的扫描结果
                const scanResults = await targetsAPI.getScanResults(targetId)
                this.vulnerabilityScans[targetId] = scanResults

                // 加载流量数据
                await this.loadTrafficData('6h')

            } catch (error) {
                console.error('❌ 选择目标失败:', error)
                this.error = error.message
            }
        },

        // 添加目标
        async addTarget(targetData) {
            try {
                console.log('🎯 添加新目标:', targetData)

                const result = await targetsAPI.addTarget(targetData)
                this.targets.push(result.target)

                return result

            } catch (error) {
                console.error('❌ 添加目标失败:', error)
                this.error = error.message
                throw error
            }
        },

        // 启动扫描
        async startScan(targetId, scanType = 'full') {
            try {
                console.log(`🔍 启动扫描: ${targetId}`)

                const result = await targetsAPI.startScan(targetId, scanType)

                // 更新目标状态
                const target = this.targets.find(t => t.id === targetId)
                if (target) {
                    target.scanning = true
                }

                return result

            } catch (error) {
                console.error('❌ 启动扫描失败:', error)
                this.error = error.message
                throw error
            }
        },

        // 加载流量数据
        async loadTrafficData(timeRange = '6h') {
            try {
                console.log(`📊 加载流量数据: ${timeRange}`)

                const trafficData = await attacksAPI.getTrafficData(timeRange)
                this.trafficData[timeRange] = trafficData

            } catch (error) {
                console.error('❌ 加载流量数据失败:', error)
                this.error = error.message
            }
        },

        // 模拟攻击
        async simulateAttack(targetId, methodId) {
            try {
                console.log(`⚔️ 模拟攻击: ${targetId} -> ${methodId}`)

                const result = await attacksAPI.simulateAttack(targetId, methodId)

                // 添加到攻击日志
                if (result.log) {
                    this.attackLogs.unshift(result.log)
                    this.realtimeAttackLogs.unshift(result.log)
                }

                return result

            } catch (error) {
                console.error('❌ 模拟攻击失败:', error)
                this.error = error.message
                throw error
            }
        },

        // 启动实时数据更新
        startRealtimeUpdates() {
            // 每30秒更新一次实时流量
            setInterval(async () => {
                try {
                    const realtimeData = await dashboardAPI.getRealtimeTraffic()
                    this.realtimeTraffic = realtimeData.traffic
                } catch (error) {
                    console.error('❌ 更新实时流量失败:', error)
                }
            }, 30000)
        },

        // WebSocket消息处理
        handleWebSocketMessage(message) {
            switch (message.type) {
                case 'ATTACK_LOG':
                    this.attackLogs.unshift(message.data)
                    this.realtimeAttackLogs.unshift(message.data)
                    // 保持最近100条
                    if (this.attackLogs.length > 100) {
                        this.attackLogs.pop()
                    }
                    break

                case 'TARGET_STATUS':
                    const target = this.targets.find(t => t.id === message.data.targetId)
                    if (target) {
                        Object.assign(target, message.data.status)
                    }
                    break

                case 'SCAN_RESULT':
                    this.vulnerabilityScans[message.data.targetId] = message.data.results
                    break

                case 'TRAFFIC_UPDATE':
                    this.realtimeTraffic = message.data
                    break

                default:
                    console.log('🔔 未知WebSocket消息:', message)
            }
        },

        // 清除错误
        clearError() {
            this.error = null
        }
    }
})