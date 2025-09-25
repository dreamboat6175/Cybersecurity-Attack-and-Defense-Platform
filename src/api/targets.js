import api from './index'

export const targetsAPI = {
    // 获取目标列表
    getTargets() {
        return api.get('/targets')
    },

    // 添加新目标
    addTarget(target) {
        return api.post('/targets', target)
    },

    // 删除目标
    deleteTarget(id) {
        return api.delete(`/targets/${id}`)
    },

    // 获取目标详情
    getTargetDetail(id) {
        return api.get(`/targets/${id}`)
    },

    // 启动目标扫描
    startScan(id, scanType = 'full') {
        return api.post(`/targets/${id}/scan`, { scanType })
    },

    // 获取扫描结果
    getScanResults(id) {
        return api.get(`/targets/${id}/scan/results`)
    }
}