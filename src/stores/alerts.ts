import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AlertInfo } from '../types/topology'

// 告警统计接口
export interface AlertStats {
    total: number
    unacknowledged: number
    bySeverity: {
        low: number
        medium: number
        high: number
        critical: number
    }
    byType: {
        device: number
        link: number
    }
}

// 告警过滤器接口
export interface AlertFilter {
    severity?: ('low' | 'medium' | 'high' | 'critical')[]
    type?: ('device' | 'link')[]
    acknowledged?: boolean
    timeRange?: {
        start: Date
        end: Date
    }
    searchText?: string
}

// 告警排序选项
export type AlertSortBy = 'timestamp' | 'severity' | 'type' | 'message'
export type AlertSortOrder = 'asc' | 'desc'

export const useAlertsStore = defineStore('alerts', () => {
    // ===== 响应式状态 =====

    // 告警列表
    const alerts = ref<AlertInfo[]>([])

    // 过滤器和排序
    const filter = ref<AlertFilter>({
        acknowledged: false // 默认只显示未确认的告警
    })
    const sortBy = ref<AlertSortBy>('timestamp')
    const sortOrder = ref<AlertSortOrder>('desc')

    // 分页
    const currentPage = ref(1)
    const pageSize = ref(20)

    // 选中的告警
    const selectedAlertIds = ref<Set<string>>(new Set())

    // 告警面板状态
    const isPanelVisible = ref(false)
    const isPanelMinimized = ref(false)

    // 音效设置
    const soundEnabled = ref(true)
    const notificationEnabled = ref(true)

    // 自动刷新
    const autoRefresh = ref(true)
    const refreshInterval = ref(5000) // 5秒

    // 加载状态
    const isLoading = ref(false)
    const error = ref<string | null>(null)

    // ===== 计算属性 =====

    // 过滤后的告警列表
    const filteredAlerts = computed(() => {
        let result = alerts.value

        // 按严重程度过滤
        if (filter.value.severity && filter.value.severity.length > 0) {
            result = result.filter(alert => filter.value.severity!.includes(alert.severity))
        }

        // 按类型过滤
        if (filter.value.type && filter.value.type.length > 0) {
            result = result.filter(alert => filter.value.type!.includes(alert.type))
        }

        // 按确认状态过滤
        if (filter.value.acknowledged !== undefined) {
            result = result.filter(alert => alert.acknowledged === filter.value.acknowledged)
        }

        // 按时间范围过滤
        if (filter.value.timeRange) {
            const { start, end } = filter.value.timeRange
            result = result.filter(alert =>
                alert.timestamp >= start && alert.timestamp <= end
            )
        }

        // 按搜索文本过滤
        if (filter.value.searchText) {
            const searchText = filter.value.searchText.toLowerCase()
            result = result.filter(alert =>
                alert.message.toLowerCase().includes(searchText) ||
                alert.deviceId?.toLowerCase().includes(searchText) ||
                alert.linkId?.toLowerCase().includes(searchText)
            )
        }

        return result
    })

    // 排序后的告警列表
    const sortedAlerts = computed(() => {
        const result = [...filteredAlerts.value]

        result.sort((a, b) => {
            let comparison = 0

            switch (sortBy.value) {
                case 'timestamp':
                    comparison = a.timestamp.getTime() - b.timestamp.getTime()
                    break
                case 'severity':
                    const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 }
                    comparison = severityOrder[a.severity] - severityOrder[b.severity]
                    break
                case 'type':
                    comparison = a.type.localeCompare(b.type)
                    break
                case 'message':
                    comparison = a.message.localeCompare(b.message)
                    break
            }

            return sortOrder.value === 'asc' ? comparison : -comparison
        })

        return result
    })

    // 分页后的告警列表
    const paginatedAlerts = computed(() => {
        const start = (currentPage.value - 1) * pageSize.value
        const end = start + pageSize.value
        return sortedAlerts.value.slice(start, end)
    })

    // 告警统计
    const alertStats = computed((): AlertStats => {
        const stats: AlertStats = {
            total: alerts.value.length,
            unacknowledged: 0,
            bySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
            byType: { device: 0, link: 0 }
        }

        alerts.value.forEach(alert => {
            // 统计未确认告警
            if (!alert.acknowledged) {
                stats.unacknowledged++
            }

            // 按严重程度统计
            stats.bySeverity[alert.severity]++

            // 按类型统计
            stats.byType[alert.type]++
        })

        return stats
    })

    // 是否有未确认的关键告警
    const hasCriticalAlerts = computed(() =>
        alerts.value.some(alert =>
            alert.severity === 'critical' && !alert.acknowledged
        )
    )

    // 最新的未确认告警
    const latestUnacknowledgedAlert = computed(() =>
        alerts.value
            .filter(alert => !alert.acknowledged)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0] || null
    )

    // 分页信息
    const paginationInfo = computed(() => ({
        currentPage: currentPage.value,
        pageSize: pageSize.value,
        total: sortedAlerts.value.length,
        totalPages: Math.ceil(sortedAlerts.value.length / pageSize.value),
        hasNext: currentPage.value < Math.ceil(sortedAlerts.value.length / pageSize.value),
        hasPrev: currentPage.value > 1
    }))

    // 选中的告警数量
    const selectedCount = computed(() => selectedAlertIds.value.size)

    // 是否全选
    const isAllSelected = computed(() =>
        paginatedAlerts.value.length > 0 &&
        paginatedAlerts.value.every(alert => selectedAlertIds.value.has(alert.id))
    )

    // ===== Actions (方法) =====

    // 添加告警
    function addAlert(alert: Omit<AlertInfo, 'id' | 'timestamp' | 'acknowledged'>) {
        const newAlert: AlertInfo = {
            ...alert,
            id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date(),
            acknowledged: false
        }

        alerts.value.unshift(newAlert)

        // 触发通知
        if (notificationEnabled.value) {
            triggerNotification(newAlert)
        }

        // 播放音效
        if (soundEnabled.value) {
            playAlertSound(newAlert.severity)
        }

        return newAlert.id
    }

    // 批量添加告警
    function addAlerts(alertList: Array<Omit<AlertInfo, 'id' | 'timestamp' | 'acknowledged'>>) {
        alertList.forEach(alert => addAlert(alert))
    }

    // 确认告警
    function acknowledgeAlert(alertId: string) {
        const alert = alerts.value.find(a => a.id === alertId)
        if (alert) {
            alert.acknowledged = true
        }
    }

    // 批量确认告警
    function acknowledgeAlerts(alertIds: string[]) {
        alertIds.forEach(id => acknowledgeAlert(id))
    }

    // 确认所有告警
    function acknowledgeAllAlerts() {
        alerts.value.forEach(alert => {
            alert.acknowledged = true
        })
    }

    // 确认所有过滤后的告警
    function acknowledgeFilteredAlerts() {
        filteredAlerts.value.forEach(alert => {
            alert.acknowledged = true
        })
    }

    // 删除告警
    function deleteAlert(alertId: string) {
        const index = alerts.value.findIndex(a => a.id === alertId)
        if (index !== -1) {
            alerts.value.splice(index, 1)
        }
    }

    // 批量删除告警
    function deleteAlerts(alertIds: string[]) {
        alerts.value = alerts.value.filter(alert => !alertIds.includes(alert.id))
    }

    // 清除已确认的告警
    function clearAcknowledgedAlerts() {
        alerts.value = alerts.value.filter(alert => !alert.acknowledged)
    }

    // 清除所有告警
    function clearAllAlerts() {
        alerts.value = []
        selectedAlertIds.value.clear()
    }

    // 设置过滤器
    function setFilter(newFilter: Partial<AlertFilter>) {
        filter.value = { ...filter.value, ...newFilter }
        currentPage.value = 1 // 重置到第一页
    }

    // 重置过滤器
    function resetFilter() {
        filter.value = { acknowledged: false }
        currentPage.value = 1
    }

    // 设置排序
    function setSorting(by: AlertSortBy, order: AlertSortOrder) {
        sortBy.value = by
        sortOrder.value = order
        currentPage.value = 1
    }

    // 切换排序顺序
    function toggleSortOrder() {
        sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
    }

    // 设置分页
    function setPage(page: number) {
        if (page >= 1 && page <= paginationInfo.value.totalPages) {
            currentPage.value = page
        }
    }

    // 下一页
    function nextPage() {
        if (paginationInfo.value.hasNext) {
            currentPage.value++
        }
    }

    // 上一页
    function prevPage() {
        if (paginationInfo.value.hasPrev) {
            currentPage.value--
        }
    }

    // 设置页面大小
    function setPageSize(size: number) {
        pageSize.value = size
        currentPage.value = 1
    }

    // 选择告警
    function selectAlert(alertId: string) {
        selectedAlertIds.value.add(alertId)
    }

    // 取消选择告警
    function deselectAlert(alertId: string) {
        selectedAlertIds.value.delete(alertId)
    }

    // 切换告警选择状态
    function toggleAlertSelection(alertId: string) {
        if (selectedAlertIds.value.has(alertId)) {
            selectedAlertIds.value.delete(alertId)
        } else {
            selectedAlertIds.value.add(alertId)
        }
    }

    // 全选当前页告警
    function selectAllInPage() {
        paginatedAlerts.value.forEach(alert => {
            selectedAlertIds.value.add(alert.id)
        })
    }

    // 取消全选
    function deselectAll() {
        selectedAlertIds.value.clear()
    }

    // 切换全选状态
    function toggleSelectAll() {
        if (isAllSelected.value) {
            // 取消选择当前页的所有告警
            paginatedAlerts.value.forEach(alert => {
                selectedAlertIds.value.delete(alert.id)
            })
        } else {
            // 选择当前页的所有告警
            selectAllInPage()
        }
    }

    // 获取选中的告警
    function getSelectedAlerts() {
        return alerts.value.filter(alert => selectedAlertIds.value.has(alert.id))
    }

    // 面板控制
    function showPanel() {
        isPanelVisible.value = true
        isPanelMinimized.value = false
    }

    function hidePanel() {
        isPanelVisible.value = false
    }

    function togglePanel() {
        isPanelVisible.value = !isPanelVisible.value
    }

    function minimizePanel() {
        isPanelMinimized.value = true
    }

    function maximizePanel() {
        isPanelMinimized.value = false
    }

    function togglePanelMinimize() {
        isPanelMinimized.value = !isPanelMinimized.value
    }

    // 设置配置
    function setSoundEnabled(enabled: boolean) {
        soundEnabled.value = enabled
    }

    function setNotificationEnabled(enabled: boolean) {
        notificationEnabled.value = enabled
    }

    function setAutoRefresh(enabled: boolean) {
        autoRefresh.value = enabled
    }

    function setRefreshInterval(interval: number) {
        refreshInterval.value = interval
    }

    // 触发通知
    function triggerNotification(alert: AlertInfo) {
        if (!('Notification' in window)) return

        if (Notification.permission === 'granted') {
            const notification = new Notification(`${alert.severity.toUpperCase()} 告警`, {
                body: alert.message,
                icon: '/favicon.ico',
                tag: alert.id
            })

            // 3秒后自动关闭
            setTimeout(() => notification.close(), 3000)
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    triggerNotification(alert)
                }
            })
        }
    }

    // 播放告警音效
    function playAlertSound(severity: AlertInfo['severity']) {
        try {
            const audio = new Audio()

            // 根据严重程度选择不同音效
            switch (severity) {
                case 'critical':
                    audio.src = '/sounds/critical-alert.mp3'
                    break
                case 'high':
                    audio.src = '/sounds/high-alert.mp3'
                    break
                case 'medium':
                    audio.src = '/sounds/medium-alert.mp3'
                    break
                case 'low':
                    audio.src = '/sounds/low-alert.mp3'
                    break
            }

            audio.volume = 0.5
            audio.play().catch(console.warn) // 忽略播放失败的错误
        } catch (error) {
            console.warn('Failed to play alert sound:', error)
        }
    }

    // 根据设备ID查找相关告警
    function getAlertsByDevice(deviceId: string) {
        return alerts.value.filter(alert => alert.deviceId === deviceId)
    }

    // 根据链路ID查找相关告警
    function getAlertsByLink(linkId: string) {
        return alerts.value.filter(alert => alert.linkId === linkId)
    }

    // 获取特定时间范围内的告警
    function getAlertsByTimeRange(start: Date, end: Date) {
        return alerts.value.filter(alert =>
            alert.timestamp >= start && alert.timestamp <= end
        )
    }

    // 导出告警数据
    function exportAlerts(format: 'json' | 'csv' = 'json') {
        const data = filteredAlerts.value.map(alert => ({
            id: alert.id,
            type: alert.type,
            severity: alert.severity,
            message: alert.message,
            deviceId: alert.deviceId || '',
            linkId: alert.linkId || '',
            timestamp: alert.timestamp.toISOString(),
            acknowledged: alert.acknowledged
        }))

        if (format === 'json') {
            return JSON.stringify(data, null, 2)
        } else {
            // CSV格式
            const headers = ['ID', 'Type', 'Severity', 'Message', 'Device ID', 'Link ID', 'Timestamp', 'Acknowledged']
            const rows = data.map(item => [
                item.id,
                item.type,
                item.severity,
                item.message,
                item.deviceId,
                item.linkId,
                item.timestamp,
                item.acknowledged
            ])

            return [headers, ...rows].map(row =>
                row.map(cell => `"${cell}"`).join(',')
            ).join('\n')
        }
    }

    // 重置告警状态
    function resetAlertsState() {
        alerts.value = []
        selectedAlertIds.value.clear()
        currentPage.value = 1
        resetFilter()
        hidePanel()
        isLoading.value = false
        error.value = null
    }

    // 返回所有状态和方法
    return {
        // 状态
        alerts,
        filter,
        sortBy,
        sortOrder,
        currentPage,
        pageSize,
        selectedAlertIds,
        isPanelVisible,
        isPanelMinimized,
        soundEnabled,
        notificationEnabled,
        autoRefresh,
        refreshInterval,
        isLoading,
        error,

        // 计算属性
        filteredAlerts,
        sortedAlerts,
        paginatedAlerts,
        alertStats,
        hasCriticalAlerts,
        latestUnacknowledgedAlert,
        paginationInfo,
        selectedCount,
        isAllSelected,

        // 方法
        addAlert,
        addAlerts,
        acknowledgeAlert,
        acknowledgeAlerts,
        acknowledgeAllAlerts,
        acknowledgeFilteredAlerts,
        deleteAlert,
        deleteAlerts,
        clearAcknowledgedAlerts,
        clearAllAlerts,
        setFilter,
        resetFilter,
        setSorting,
        toggleSortOrder,
        setPage,
        nextPage,
        prevPage,
        setPageSize,
        selectAlert,
        deselectAlert,
        toggleAlertSelection,
        selectAllInPage,
        deselectAll,
        toggleSelectAll,
        getSelectedAlerts,
        showPanel,
        hidePanel,
        togglePanel,
        minimizePanel,
        maximizePanel,
        togglePanelMinimize,
        setSoundEnabled,
        setNotificationEnabled,
        setAutoRefresh,
        setRefreshInterval,
        triggerNotification,
        playAlertSound,
        getAlertsByDevice,
        getAlertsByLink,
        getAlertsByTimeRange,
        exportAlerts,
        resetAlertsState
    }
})