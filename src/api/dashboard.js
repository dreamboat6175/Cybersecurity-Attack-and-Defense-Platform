import api from './index'

export const dashboardAPI = {
    // 获取仪表盘总体数据
    getDashboardOverview() {
        return api.get('/dashboard/overview')
    },

    // 获取系统统计信息
    getSystemStats() {
        return api.get('/dashboard/stats')
    },

    // 获取实时流量数据
    getRealtimeTraffic() {
        return api.get('/dashboard/traffic/realtime')
    }
}