import api from './index'

export const attacksAPI = {
    // 获取攻击日志
    getAttackLogs(params = {}) {
        return api.get('/attacks/logs', { params })
    },

    // 获取攻击方法列表
    getAttackMethods() {
        return api.get('/attacks/methods')
    },

    // 模拟攻击
    simulateAttack(targetId, methodId) {
        return api.post('/attacks/simulate', { targetId, methodId })
    },

    // 获取流量数据
    getTrafficData(timeRange = '6h') {
        return api.get(`/attacks/traffic/${timeRange}`)
    },

    // 获取网络拓扑
    getNetworkTopology() {
        return api.get('/attacks/network/topology')
    }
}