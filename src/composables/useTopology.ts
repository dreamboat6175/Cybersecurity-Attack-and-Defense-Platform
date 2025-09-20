import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useTopologyStore } from '../stores/topology'
import { useSystemStore } from '../stores/system'
import { useAlertsStore } from '../stores/alerts'
import type {
    TopologyNode,
    TopologyLink,
    TopologyEvent,
    Position,
    SubsystemType
} from '../types/topology'
import type { DeviceType, DeviceStatus, LinkStatus } from '../types/devices'
import { SYSTEM_LAYOUT_CONFIG, SUBSYSTEM_LAYOUT_CONFIG } from '../constants/config'

export function useTopology() {
    const topologyStore = useTopologyStore()
    const systemStore = useSystemStore()
    const alertsStore = useAlertsStore()

    // ===== 响应式状态 =====

    // 布局计算状态
    const isCalculatingLayout = ref(false)
    const layoutProgress = ref(0)

    // 动画状态
    const isAnimating = ref(false)
    const animationProgress = ref(0)

    // 选择框状态
    const selectionBox = ref<{
        start: Position
        end: Position
        isActive: boolean
    }>({
        start: { x: 0, y: 0 },
        end: { x: 0, y: 0 },
        isActive: false
    })

    // ===== 计算属性 =====

    // 当前视图的节点和链路
    const currentNodes = computed(() => topologyStore.nodes)
    const currentLinks = computed(() => topologyStore.links)

    // 可见的节点 (考虑缩放和视窗)
    const visibleNodes = computed(() => {
        // TODO: 实现视窗裁剪优化
        return currentNodes.value
    })

    // 可见的链路
    const visibleLinks = computed(() => {
        // TODO: 实现视窗裁剪优化
        return currentLinks.value
    })

    // 节点布局边界
    const layoutBounds = computed(() => {
        if (currentNodes.value.length === 0) {
            return { minX: 0, maxX: 800, minY: 0, maxY: 600 }
        }

        const positions = currentNodes.value.map(node => node.position)
        return {
            minX: Math.min(...positions.map(p => p.x)) - 100,
            maxX: Math.max(...positions.map(p => p.x)) + 100,
            minY: Math.min(...positions.map(p => p.y)) - 100,
            maxY: Math.max(...positions.map(p => p.y)) + 100
        }
    })

    // 是否需要重新布局
    const needsLayout = computed(() => {
        return topologyStore.autoLayout && currentNodes.value.some(node =>
            node.position.x === 0 && node.position.y === 0
        )
    })

    // ===== 布局算法 =====

    // 系统层分层布局
    function calculateSystemLayout(nodes: TopologyNode[]): TopologyNode[] {
        const config = SYSTEM_LAYOUT_CONFIG
        const result = nodes.map(node => ({ ...node }))

        // 按设备类型分层
        const layers = {
            DSU: result.filter(n => n.type === 'DSU'),
            ZC: result.filter(n => n.type === 'ZC'),
            ATS: result.filter(n => n.type === 'ATS'),
            CI: result.filter(n => n.type === 'CI'),
            VOBC: result.filter(n => n.type === 'VOBC')
        }

        // DSU层布局
        positionNodesInLayer(layers.DSU, config.layers.dsu.y, config.layers.dsu.spacing)

        // 核心层布局 (ZC + ATS)
        const coreNodes = [...layers.ZC, ...layers.ATS]
        positionNodesInLayer(coreNodes, config.layers.core.y, config.layers.core.spacing)

        // CI层布局
        positionNodesInLayer(layers.CI, config.layers.interface.y, config.layers.interface.spacing)

        // VOBC层布局
        positionNodesInLayer(layers.VOBC, config.layers.vehicle.y, config.layers.vehicle.spacing)

        return result
    }

    // 在指定层级中定位节点
    function positionNodesInLayer(nodes: TopologyNode[], y: number, spacing: number) {
        const totalWidth = (nodes.length - 1) * spacing
        const startX = 400 - totalWidth / 2 // 居中对齐

        nodes.forEach((node, index) => {
            node.position = {
                x: startX + index * spacing,
                y: y
            }
        })
    }

    // ZC子系统圆形布局
    function calculateZCSubsystemLayout(nodes: TopologyNode[]): TopologyNode[] {
        const config = SUBSYSTEM_LAYOUT_CONFIG.zc
        const result = nodes.map(node => ({ ...node }))

        if (result.length === 0) return result

        if (result.length === 1) {
            // 单个节点居中
            result[0].position = config.centerPosition
            return result
        }

        // 圆形分布
        const radius = Math.max(150, result.length * 30)
        const angleStep = (2 * Math.PI) / result.length

        result.forEach((node, index) => {
            const angle = index * angleStep - Math.PI / 2 // 从顶部开始
            node.position = {
                x: config.centerPosition.x + radius * Math.cos(angle),
                y: config.centerPosition.y + radius * Math.sin(angle)
            }
        })

        return result
    }

    // ATS子系统网格布局
    function calculateATSSubsystemLayout(nodes: TopologyNode[]): TopologyNode[] {
        const config = SUBSYSTEM_LAYOUT_CONFIG.ats
        const result = nodes.map(node => ({ ...node }))

        if (result.length === 0) return result

        // 计算网格尺寸
        const cols = Math.ceil(Math.sqrt(result.length))
        const rows = Math.ceil(result.length / cols)

        const startX = config.centerPosition.x - (cols - 1) * config.nodeSpacing / 2
        const startY = config.centerPosition.y - (rows - 1) * config.nodeSpacing / 2

        result.forEach((node, index) => {
            const col = index % cols
            const row = Math.floor(index / cols)

            node.position = {
                x: startX + col * config.nodeSpacing,
                y: startY + row * config.nodeSpacing
            }
        })

        return result
    }

    // 力导向布局 (简化版)
    function calculateForceLayout(nodes: TopologyNode[], links: TopologyLink[]): TopologyNode[] {
        const result = nodes.map(node => ({ ...node }))
        const iterations = 100
        const repulsionStrength = 5000
        const attractionStrength = 0.1
        const damping = 0.8

        // 初始化速度
        const velocities = result.map(() => ({ x: 0, y: 0 }))

        for (let iter = 0; iter < iterations; iter++) {
            // 计算排斥力
            for (let i = 0; i < result.length; i++) {
                for (let j = i + 1; j < result.length; j++) {
                    const dx = result[j].position.x - result[i].position.x
                    const dy = result[j].position.y - result[i].position.y
                    const distance = Math.sqrt(dx * dx + dy * dy) || 1

                    const force = repulsionStrength / (distance * distance)
                    const fx = (dx / distance) * force
                    const fy = (dy / distance) * force

                    velocities[i].x -= fx
                    velocities[i].y -= fy
                    velocities[j].x += fx
                    velocities[j].y += fy
                }
            }

            // 计算吸引力 (基于链路)
            links.forEach(link => {
                const sourceIdx = result.findIndex(n => n.id === link.source)
                const targetIdx = result.findIndex(n => n.id === link.target)

                if (sourceIdx !== -1 && targetIdx !== -1) {
                    const dx = result[targetIdx].position.x - result[sourceIdx].position.x
                    const dy = result[targetIdx].position.y - result[sourceIdx].position.y

                    const fx = dx * attractionStrength
                    const fy = dy * attractionStrength

                    velocities[sourceIdx].x += fx
                    velocities[sourceIdx].y += fy
                    velocities[targetIdx].x -= fx
                    velocities[targetIdx].y -= fy
                }
            })

            // 更新位置和应用阻尼
            result.forEach((node, i) => {
                velocities[i].x *= damping
                velocities[i].y *= damping

                node.position.x += velocities[i].x
                node.position.y += velocities[i].y
            })
        }

        return result
    }

    // ===== 交互处理 =====

    // 处理节点点击
    function handleNodeClick(node: TopologyNode, event: MouseEvent): void {
        // 更新选择状态
        topologyStore.selectNode(node.id)

        // 双击进入子系统
        if (event.detail === 2 && (node.type === 'ZC' || node.type === 'ATS')) {
            drillDownToSubsystem(node.type as SubsystemType, node.id)
        }

        // 发出事件
        const topologyEvent: TopologyEvent = {
            type: 'nodeClick',
            target: node,
            position: { x: event.clientX, y: event.clientY },
            originalEvent: event
        }

        emitTopologyEvent(topologyEvent)
    }

    // 处理链路点击
    function handleLinkClick(link: TopologyLink, event: MouseEvent): void {
        topologyStore.selectLink(link.id)

        const topologyEvent: TopologyEvent = {
            type: 'linkClick',
            target: link,
            position: { x: event.clientX, y: event.clientY },
            originalEvent: event
        }

        emitTopologyEvent(topologyEvent)
    }

    // 处理节点悬浮
    function handleNodeHover(node: TopologyNode | null): void {
        topologyStore.setHoveredElement(node?.id || null, node ? 'node' : null)
    }

    // 处理链路悬浮
    function handleLinkHover(link: TopologyLink | null): void {
        topologyStore.setHoveredElement(link?.id || null, link ? 'link' : null)
    }

    // 处理画布点击
    function handleCanvasClick(event: MouseEvent): void {
        topologyStore.clearSelection()

        const topologyEvent: TopologyEvent = {
            type: 'canvasClick',
            target: null,
            position: { x: event.clientX, y: event.clientY },
            originalEvent: event
        }

        emitTopologyEvent(topologyEvent)
    }

    // ===== 视图控制 =====

    // 下钻到子系统
    async function drillDownToSubsystem(type: SubsystemType, id: string): Promise<void> {
        try {
            topologyStore.setLoading(true)

            // 切换到子系统视图
            topologyStore.switchToSubsystemView(type, id)

            // 加载子系统数据
            await loadSubsystemData(type, id)

            // 计算布局
            await calculateAndApplyLayout()

        } catch (error) {
            console.error('Failed to drill down to subsystem:', error)
            systemStore.addErrorLog('error', `Failed to load subsystem ${type}:${id}`)
        } finally {
            topologyStore.setLoading(false)
        }
    }

    // 返回到系统视图
    async function drillUpToSystem(): Promise<void> {
        try {
            topologyStore.setLoading(true)

            // 切换到系统视图
            topologyStore.switchToSystemView()

            // 加载系统数据
            await loadSystemData()

            // 计算布局
            await calculateAndApplyLayout()

        } catch (error) {
            console.error('Failed to drill up to system:', error)
            systemStore.addErrorLog('error', 'Failed to load system topology')
        } finally {
            topologyStore.setLoading(false)
        }
    }

    // 缩放到适合视图
    function zoomToFit(padding: number = 50): void {
        const bounds = layoutBounds.value
        const viewWidth = 1200 // TODO: 从实际画布获取
        const viewHeight = 800

        const contentWidth = bounds.maxX - bounds.minX
        const contentHeight = bounds.maxY - bounds.minY

        const scaleX = (viewWidth - 2 * padding) / contentWidth
        const scaleY = (viewHeight - 2 * padding) / contentHeight
        const scale = Math.min(scaleX, scaleY, 2) // 最大放大2倍

        const centerX = (bounds.minX + bounds.maxX) / 2
        const centerY = (bounds.minY + bounds.maxY) / 2

        const panX = viewWidth / 2 - centerX * scale
        const panY = viewHeight / 2 - centerY * scale

        topologyStore.setViewTransform(scale, { x: panX, y: panY })
    }

    // 缩放到选中节点
    function zoomToNode(nodeId: string): void {
        const node = currentNodes.value.find(n => n.id === nodeId)
        if (!node) return

        const scale = 1.5
        const viewWidth = 1200
        const viewHeight = 800

        const panX = viewWidth / 2 - node.position.x * scale
        const panY = viewHeight / 2 - node.position.y * scale

        topologyStore.setViewTransform(scale, { x: panX, y: panY })
    }

    // ===== 数据加载 =====

    // 加载系统拓扑数据
    async function loadSystemData(): Promise<void> {
        // TODO: 实际的API调用
        // 这里先用模拟数据
        const mockNodes: TopologyNode[] = [
            {
                id: 'dsu1',
                type: 'DSU',
                label: 'DSU-1',
                position: { x: 0, y: 0 },
                size: { width: 80, height: 60 },
                status: 'normal',
                metadata: {
                    ip: '192.168.1.10',
                    cpuUsage: 45,
                    memoryUsage: 60
                }
            },
            {
                id: 'zc1',
                type: 'ZC',
                label: 'ZC-1',
                position: { x: 0, y: 0 },
                size: { width: 80, height: 60 },
                status: 'normal',
                metadata: {
                    ip: '192.168.1.20',
                    cpuUsage: 35,
                    memoryUsage: 55
                }
            },
            {
                id: 'ats1',
                type: 'ATS',
                label: 'ATS-1',
                position: { x: 0, y: 0 },
                size: { width: 80, height: 60 },
                status: 'warning',
                metadata: {
                    ip: '192.168.1.30',
                    cpuUsage: 75,
                    memoryUsage: 80
                }
            }
        ]

        const mockLinks: TopologyLink[] = [
            {
                id: 'link1',
                source: 'dsu1',
                target: 'zc1',
                type: 'control',
                status: 'active',
                metadata: {
                    bandwidth: 1000,
                    latency: 5
                }
            },
            {
                id: 'link2',
                source: 'dsu1',
                target: 'ats1',
                type: 'data',
                status: 'active',
                metadata: {
                    bandwidth: 1000,
                    latency: 8
                }
            }
        ]

        topologyStore.setTopologyData(mockNodes, mockLinks)
    }

    // 加载子系统数据
    async function loadSubsystemData(type: SubsystemType, id: string): Promise<void> {
        if (type === 'ZC') {
            await loadZCSubsystemData(id)
        } else if (type === 'ATS') {
            await loadATSSubsystemData(id)
        }
    }

    // 加载ZC子系统数据
    async function loadZCSubsystemData(zcId: string): Promise<void> {
        // TODO: 实际的API调用
        const mockNodes: TopologyNode[] = [
            {
                id: 'pu1',
                type: 'PU',
                label: 'PU-1',
                position: { x: 0, y: 0 },
                size: { width: 60, height: 50 },
                status: 'normal',
                parentSystem: zcId,
                metadata: { ip: '192.168.2.10' }
            },
            {
                id: 'pu2',
                type: 'PU',
                label: 'PU-2',
                position: { x: 0, y: 0 },
                size: { width: 60, height: 50 },
                status: 'critical',
                parentSystem: zcId,
                metadata: { ip: '192.168.2.11' }
            },
            {
                id: 'cc1',
                type: 'CC',
                label: 'CC-1',
                position: { x: 0, y: 0 },
                size: { width: 60, height: 50 },
                status: 'normal',
                parentSystem: zcId,
                metadata: { ip: '192.168.2.20' }
            }
        ]

        const mockLinks: TopologyLink[] = [
            {
                id: 'zc_link1_a',
                source: 'pu1',
                target: 'cc1',
                type: 'internal',
                status: 'active',
                network: 'A',
                metadata: { protocol: 'TCP' }
            },
            {
                id: 'zc_link1_b',
                source: 'pu1',
                target: 'cc1',
                type: 'internal',
                status: 'active',
                network: 'B',
                metadata: { protocol: 'TCP' }
            },
            {
                id: 'zc_link2_a',
                source: 'pu2',
                target: 'cc1',
                type: 'internal',
                status: 'down', // A网故障
                network: 'A',
                metadata: { protocol: 'TCP' }
            },
            {
                id: 'zc_link2_b',
                source: 'pu2',
                target: 'cc1',
                type: 'internal',
                status: 'active',
                network: 'B',
                metadata: { protocol: 'TCP' }
            }
        ]

        topologyStore.setTopologyData(mockNodes, mockLinks)
    }

    // 加载ATS子系统数据
    async function loadATSSubsystemData(atsId: string): Promise<void> {
        // TODO: 实际的API调用
        const mockNodes: TopologyNode[] = [
            {
                id: 'gateway1',
                type: 'GATEWAY',
                label: 'Gateway-1',
                position: { x: 0, y: 0 },
                size: { width: 60, height: 50 },
                status: 'normal',
                parentSystem: atsId,
                metadata: { ip: '192.168.3.10' }
            },
            {
                id: 'db1',
                type: 'DB',
                label: 'Database-1',
                position: { x: 0, y: 0 },
                size: { width: 60, height: 50 },
                status: 'normal',
                parentSystem: atsId,
                metadata: { ip: '192.168.3.20' }
            }
        ]

        const mockLinks: TopologyLink[] = [
            {
                id: 'ats_link1',
                source: 'gateway1',
                target: 'db1',
                type: 'data',
                status: 'active',
                metadata: { protocol: 'SQL' }
            }
        ]

        topologyStore.setTopologyData(mockNodes, mockLinks)
    }

    // ===== 布局计算和应用 =====

    // 计算并应用布局
    async function calculateAndApplyLayout(): Promise<void> {
        if (!topologyStore.autoLayout) return

        isCalculatingLayout.value = true
        layoutProgress.value = 0

        try {
            const nodes = [...currentNodes.value]
            let layoutedNodes: TopologyNode[]

            // 根据当前视图选择布局算法
            if (topologyStore.currentLevel === 'system') {
                layoutedNodes = calculateSystemLayout(nodes)
            } else if (topologyStore.currentSubsystem === 'ZC') {
                layoutedNodes = calculateZCSubsystemLayout(nodes)
            } else if (topologyStore.currentSubsystem === 'ATS') {
                layoutedNodes = calculateATSSubsystemLayout(nodes)
            } else {
                layoutedNodes = calculateForceLayout(nodes, currentLinks.value)
            }

            layoutProgress.value = 50

            // 应用布局动画
            await animateToLayout(layoutedNodes)

            layoutProgress.value = 100

        } catch (error) {
            console.error('Layout calculation failed:', error)
            systemStore.addErrorLog('error', 'Layout calculation failed')
        } finally {
            isCalculatingLayout.value = false
            layoutProgress.value = 0
        }
    }

    // 动画到新布局
    async function animateToLayout(targetNodes: TopologyNode[]): Promise<void> {
        return new Promise((resolve) => {
            isAnimating.value = true
            animationProgress.value = 0

            const duration = 800
            const startTime = Date.now()

            // 保存原始位置
            const originalPositions = currentNodes.value.map(node => ({ ...node.position }))

            const animate = () => {
                const elapsed = Date.now() - startTime
                const progress = Math.min(elapsed / duration, 1)

                // 缓动函数 (easeInOutCubic)
                const eased = progress < 0.5
                    ? 4 * progress * progress * progress
                    : 1 - Math.pow(-2 * progress + 2, 3) / 2

                // 插值计算新位置
                currentNodes.value.forEach((node, index) => {
                    const targetNode = targetNodes[index]
                    const original = originalPositions[index]

                    if (targetNode) {
                        node.position.x = original.x + (targetNode.position.x - original.x) * eased
                        node.position.y = original.y + (targetNode.position.y - original.y) * eased
                    }
                })

                animationProgress.value = progress * 100

                if (progress < 1) {
                    requestAnimationFrame(animate)
                } else {
                    isAnimating.value = false
                    animationProgress.value = 0
                    resolve()
                }
            }

            animate()
        })
    }

    // ===== 事件系统 =====

    // 事件回调列表
    const eventCallbacks = ref<Map<string, Function[]>>(new Map())

    // 注册事件监听器
    function addEventListener(eventType: string, callback: Function): () => void {
        if (!eventCallbacks.value.has(eventType)) {
            eventCallbacks.value.set(eventType, [])
        }

        eventCallbacks.value.get(eventType)!.push(callback)

        // 返回取消监听的函数
        return () => {
            const callbacks = eventCallbacks.value.get(eventType)
            if (callbacks) {
                const index = callbacks.indexOf(callback)
                if (index > -1) {
                    callbacks.splice(index, 1)
                }
            }
        }
    }

    // 发出拓扑事件
    function emitTopologyEvent(event: TopologyEvent): void {
        const callbacks = eventCallbacks.value.get(event.type)
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(event)
                } catch (error) {
                    console.error(`Error in topology event callback for ${event.type}:`, error)
                }
            })
        }
    }

    // ===== 搜索和过滤 =====

    // 搜索节点
    function searchNodes(query: string): TopologyNode[] {
        if (!query.trim()) return []

        const lowerQuery = query.toLowerCase()
        return currentNodes.value.filter(node =>
            node.label.toLowerCase().includes(lowerQuery) ||
            node.id.toLowerCase().includes(lowerQuery) ||
            node.type.toLowerCase().includes(lowerQuery) ||
            node.metadata.ip?.toLowerCase().includes(lowerQuery)
        )
    }

    // 高亮搜索结果
    function highlightSearchResults(nodeIds: string[]): void {
        currentNodes.value.forEach(node => {
            node.isSelected = nodeIds.includes(node.id)
        })
    }

    // 过滤节点
    function filterNodesByStatus(status: DeviceStatus[]): TopologyNode[] {
        return currentNodes.value.filter(node => status.includes(node.status))
    }

    // ===== 生命周期 =====

    // 组件挂载时
    onMounted(async () => {
        try {
            // 初始化系统监控
            systemStore.initializeSystemMonitoring()

            // 加载初始数据
            if (topologyStore.currentLevel === 'system') {
                await loadSystemData()
            }

            // 计算初始布局
            if (needsLayout.value) {
                await calculateAndApplyLayout()
            }

            // 适应视图
            setTimeout(() => zoomToFit(), 100)

        } catch (error) {
            console.error('Failed to initialize topology:', error)
            systemStore.addErrorLog('error', 'Failed to initialize topology view')
        }
    })

    // 组件卸载时
    onUnmounted(() => {
        // 清理事件监听器
        eventCallbacks.value.clear()
    })

    // 监听自动布局变化
    watch(() => topologyStore.autoLayout, (enabled) => {
        if (enabled && needsLayout.value) {
            calculateAndApplyLayout()
        }
    })

    // 监听节点数据变化
    watch(() => topologyStore.nodes.length, () => {
        if (needsLayout.value) {
            calculateAndApplyLayout()
        }
    })

    // ===== 返回接口 =====

    return {
        // 状态
        currentNodes,
        currentLinks,
        visibleNodes,
        visibleLinks,
        layoutBounds,
        needsLayout,
        isCalculatingLayout,
        layoutProgress,
        isAnimating,
        animationProgress,
        selectionBox,

        // 布局方法
        calculateSystemLayout,
        calculateZCSubsystemLayout,
        calculateATSSubsystemLayout,
        calculateForceLayout,
        calculateAndApplyLayout,
        animateToLayout,

        // 交互方法
        handleNodeClick,
        handleLinkClick,
        handleNodeHover,
        handleLinkHover,
        handleCanvasClick,

        // 视图控制
        drillDownToSubsystem,
        drillUpToSystem,
        zoomToFit,
        zoomToNode,

        // 数据加载
        loadSystemData,
        loadSubsystemData,

        // 事件系统
        addEventListener,
        emitTopologyEvent,

        // 搜索过滤
        searchNodes,
        highlightSearchResults,
        filterNodesByStatus
    }
}