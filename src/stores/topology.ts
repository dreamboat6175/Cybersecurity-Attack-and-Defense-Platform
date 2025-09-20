import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
    TopologyState,
    TopologyNode,
    TopologyLink,
    TopologyLevel,
    SubsystemType,
    Position,
    AlertInfo
} from '../types/topology'
import type { DeviceStatus, LinkStatus } from '../types/devices'

export const useTopologyStore = defineStore('topology', () => {
    // ===== 响应式状态 =====

    // 当前视图层级
    const currentLevel = ref<TopologyLevel>('system')
    const currentSubsystem = ref<SubsystemType | null>(null)
    const currentSubsystemId = ref<string | null>(null)

    // 节点和链路数据
    const nodes = ref<TopologyNode[]>([])
    const links = ref<TopologyLink[]>([])

    // 交互状态
    const selectedNodeId = ref<string | null>(null)
    const selectedLinkId = ref<string | null>(null)
    const hoveredElementId = ref<string | null>(null)
    const hoveredElementType = ref<'node' | 'link' | null>(null)

    // 视图控制
    const zoomLevel = ref(1)
    const panOffset = ref<Position>({ x: 0, y: 0 })

    // 布局控制
    const layoutType = ref<'hierarchical' | 'force' | 'manual'>('hierarchical')
    const autoLayout = ref(true)

    // 加载状态
    const isLoading = ref(false)
    const error = ref<string | null>(null)

    // 告警数据
    const alerts = ref<AlertInfo[]>([])

    // ===== 计算属性 =====

    // 当前选中的节点
    const selectedNode = computed(() =>
        selectedNodeId.value ? nodes.value.find(n => n.id === selectedNodeId.value) : null
    )

    // 当前选中的链路
    const selectedLink = computed(() =>
        selectedLinkId.value ? links.value.find(l => l.id === selectedLinkId.value) : null
    )

    // 当前悬浮的元素
    const hoveredElement = computed(() => {
        if (!hoveredElementId.value) return null

        if (hoveredElementType.value === 'node') {
            return nodes.value.find(n => n.id === hoveredElementId.value)
        } else if (hoveredElementType.value === 'link') {
            return links.value.find(l => l.id === hoveredElementId.value)
        }
        return null
    })

    // 按状态分组的节点统计
    const nodeStatusStats = computed(() => {
        const stats = {
            normal: 0,
            warning: 0,
            critical: 0,
            offline: 0
        }

        nodes.value.forEach(node => {
            stats[node.status] = (stats[node.status] || 0) + 1
        })

        return stats
    })

    // 按状态分组的链路统计
    const linkStatusStats = computed(() => {
        const stats = {
            active: 0,
            warning: 0,
            down: 0,
            unknown: 0
        }

        links.value.forEach(link => {
            stats[link.status] = (stats[link.status] || 0) + 1
        })

        return stats
    })

    // 系统健康度评分 (0-100)
    const systemHealthScore = computed(() => {
        const totalNodes = nodes.value.length
        if (totalNodes === 0) return 100

        const normalNodes = nodeStatusStats.value.normal
        const warningNodes = nodeStatusStats.value.warning
        const criticalNodes = nodeStatusStats.value.critical

        // 计算健康度：正常=100分，告警=70分，故障=0分
        const score = (normalNodes * 100 + warningNodes * 70) / totalNodes
        return Math.round(score)
    })

    // 当前视图是否为子系统视图
    const isSubsystemView = computed(() => currentLevel.value === 'subsystem')

    // 是否有活跃告警
    const hasActiveAlerts = computed(() =>
        alerts.value.some(alert => !alert.acknowledged)
    )

    // 关键告警数量
    const criticalAlertsCount = computed(() =>
        alerts.value.filter(alert =>
            alert.severity === 'critical' && !alert.acknowledged
        ).length
    )

    // ===== Actions (方法) =====

    // 设置拓扑数据
    function setTopologyData(newNodes: TopologyNode[], newLinks: TopologyLink[]) {
        nodes.value = newNodes
        links.value = newLinks
    }

    // 更新节点状态
    function updateNodeStatus(nodeId: string, status: DeviceStatus) {
        const node = nodes.value.find(n => n.id === nodeId)
        if (node) {
            node.status = status
        }
    }

    // 更新链路状态
    function updateLinkStatus(linkId: string, status: LinkStatus) {
        const link = links.value.find(l => l.id === linkId)
        if (link) {
            link.status = status
        }
    }

    // 批量更新节点状态
    function batchUpdateNodeStatus(updates: Array<{ nodeId: string, status: DeviceStatus }>) {
        updates.forEach(({ nodeId, status }) => {
            updateNodeStatus(nodeId, status)
        })
    }

    // 批量更新链路状态
    function batchUpdateLinkStatus(updates: Array<{ linkId: string, status: LinkStatus }>) {
        updates.forEach(({ linkId, status }) => {
            updateLinkStatus(linkId, status)
        })
    }

    // 选择节点
    function selectNode(nodeId: string | null) {
        selectedNodeId.value = nodeId
        selectedLinkId.value = null // 清除链路选择
    }

    // 选择链路
    function selectLink(linkId: string | null) {
        selectedLinkId.value = linkId
        selectedNodeId.value = null // 清除节点选择
    }

    // 设置悬浮元素
    function setHoveredElement(elementId: string | null, elementType: 'node' | 'link' | null) {
        hoveredElementId.value = elementId
        hoveredElementType.value = elementType
    }

    // 清除选择
    function clearSelection() {
        selectedNodeId.value = null
        selectedLinkId.value = null
    }

    // 清除悬浮
    function clearHover() {
        hoveredElementId.value = null
        hoveredElementType.value = null
    }

    // 切换到系统层视图
    function switchToSystemView() {
        currentLevel.value = 'system'
        currentSubsystem.value = null
        currentSubsystemId.value = null
        clearSelection()
        clearHover()
    }

    // 切换到子系统视图
    function switchToSubsystemView(subsystemType: SubsystemType, subsystemId: string) {
        currentLevel.value = 'subsystem'
        currentSubsystem.value = subsystemType
        currentSubsystemId.value = subsystemId
        clearSelection()
        clearHover()
    }

    // 设置视图控制参数
    function setViewTransform(zoom: number, pan: Position) {
        zoomLevel.value = zoom
        panOffset.value = { ...pan }
    }

    // 重置视图
    function resetView() {
        zoomLevel.value = 1
        panOffset.value = { x: 0, y: 0 }
    }

    // 设置布局类型
    function setLayoutType(type: 'hierarchical' | 'force' | 'manual') {
        layoutType.value = type
    }

    // 切换自动布局
    function toggleAutoLayout() {
        autoLayout.value = !autoLayout.value
    }

    // 设置加载状态
    function setLoading(loading: boolean) {
        isLoading.value = loading
    }

    // 设置错误信息
    function setError(errorMessage: string | null) {
        error.value = errorMessage
    }

    // 添加告警
    function addAlert(alert: AlertInfo) {
        alerts.value.unshift(alert)
    }

    // 确认告警
    function acknowledgeAlert(alertId: string) {
        const alert = alerts.value.find(a => a.id === alertId)
        if (alert) {
            alert.acknowledged = true
        }
    }

    // 批量确认告警
    function acknowledgeAllAlerts() {
        alerts.value.forEach(alert => {
            alert.acknowledged = true
        })
    }

    // 清除已确认的告警
    function clearAcknowledgedAlerts() {
        alerts.value = alerts.value.filter(alert => !alert.acknowledged)
    }

    // 根据节点ID查找相关链路
    function getNodeLinks(nodeId: string) {
        return links.value.filter(link =>
            link.source === nodeId || link.target === nodeId
        )
    }

    // 获取子系统节点
    function getSubsystemNodes(subsystemId: string) {
        return nodes.value.filter(node => node.parentSystem === subsystemId)
    }

    // 获取特定状态的节点
    function getNodesByStatus(status: DeviceStatus) {
        return nodes.value.filter(node => node.status === status)
    }

    // 获取特定状态的链路
    function getLinksByStatus(status: LinkStatus) {
        return links.value.filter(link => link.status === status)
    }

    // 导出完整状态 (用于调试)
    function exportState(): TopologyState {
        return {
            currentLevel: currentLevel.value,
            currentSubsystem: currentSubsystem.value,
            currentSubsystemId: currentSubsystemId.value,
            nodes: nodes.value,
            links: links.value,
            selectedNodeId: selectedNodeId.value,
            selectedLinkId: selectedLinkId.value,
            hoveredElementId: hoveredElementId.value,
            hoveredElementType: hoveredElementType.value,
            zoomLevel: zoomLevel.value,
            panOffset: panOffset.value,
            layoutType: layoutType.value,
            autoLayout: autoLayout.value,
            isLoading: isLoading.value,
            error: error.value
        }
    }

    // 重置所有状态
    function resetAllState() {
        currentLevel.value = 'system'
        currentSubsystem.value = null
        currentSubsystemId.value = null
        nodes.value = []
        links.value = []
        selectedNodeId.value = null
        selectedLinkId.value = null
        hoveredElementId.value = null
        hoveredElementType.value = null
        zoomLevel.value = 1
        panOffset.value = { x: 0, y: 0 }
        layoutType.value = 'hierarchical'
        autoLayout.value = true
        isLoading.value = false
        error.value = null
        alerts.value = []
    }

    // 返回所有状态和方法
    return {
        // 状态
        currentLevel,
        currentSubsystem,
        currentSubsystemId,
        nodes,
        links,
        selectedNodeId,
        selectedLinkId,
        hoveredElementId,
        hoveredElementType,
        zoomLevel,
        panOffset,
        layoutType,
        autoLayout,
        isLoading,
        error,
        alerts,

        // 计算属性
        selectedNode,
        selectedLink,
        hoveredElement,
        nodeStatusStats,
        linkStatusStats,
        systemHealthScore,
        isSubsystemView,
        hasActiveAlerts,
        criticalAlertsCount,

        // 方法
        setTopologyData,
        updateNodeStatus,
        updateLinkStatus,
        batchUpdateNodeStatus,
        batchUpdateLinkStatus,
        selectNode,
        selectLink,
        setHoveredElement,
        clearSelection,
        clearHover,
        switchToSystemView,
        switchToSubsystemView,
        setViewTransform,
        resetView,
        setLayoutType,
        toggleAutoLayout,
        setLoading,
        setError,
        addAlert,
        acknowledgeAlert,
        acknowledgeAllAlerts,
        clearAcknowledgedAlerts,
        getNodeLinks,
        getSubsystemNodes,
        getNodesByStatus,
        getLinksByStatus,
        exportState,
        resetAllState
    }
})