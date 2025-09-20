// src/utils/layout-algorithms.ts
import type { TopologyNode, TopologyLink, Position } from '../types/topology'
import type { DeviceType } from '../types/devices'
import { SYSTEM_LAYOUT_CONFIG, SUBSYSTEM_LAYOUT_CONFIG } from '../constants/config'

/**
 * 分层布局算法 - 用于系统层拓扑
 */
export async function calculateHierarchicalLayout(
    nodes: TopologyNode[],
    links: TopologyLink[]
): Promise<TopologyNode[]> {
    console.log('Computing hierarchical layout for', nodes.length, 'nodes')

    const layoutedNodes = nodes.map(node => ({ ...node }))

    // 按设备类型分层
    const layers = {
        dsu: layoutedNodes.filter(node => node.type === 'DSU'),
        zc: layoutedNodes.filter(node => node.type === 'ZC'),
        ats: layoutedNodes.filter(node => node.type === 'ATS'),
        ci: layoutedNodes.filter(node => node.type === 'CI'),
        vobc: layoutedNodes.filter(node => node.type === 'VOBC')
    }

    const config = SYSTEM_LAYOUT_CONFIG

    // DSU层布局 - 顶层
    layoutLayer(layers.dsu, config.layers.dsu.y, config.layers.dsu.spacing)

    // 核心层布局 - ZC和ATS并排
    const coreNodes = [...layers.zc, ...layers.ats]
    layoutLayer(coreNodes, config.layers.core.y, config.layers.core.spacing)

    // 接口层布局 - CI
    layoutLayer(layers.ci, config.layers.interface.y, config.layers.interface.spacing)

    // 车载层布局 - VOBC
    layoutLayer(layers.vobc, config.layers.vehicle.y, config.layers.vehicle.spacing)

    return layoutedNodes
}

/**
 * 力导向布局算法 - 用于复杂网络结构
 */
export async function calculateForceLayout(
    nodes: TopologyNode[],
    links: TopologyLink[]
): Promise<TopologyNode[]> {
    console.log('Computing force layout for', nodes.length, 'nodes')

    const layoutedNodes = nodes.map(node => ({ ...node }))

    // 初始化随机位置
    layoutedNodes.forEach(node => {
        if (node.position.x === 0 && node.position.y === 0) {
            node.position = {
                x: Math.random() * 800 + 200,
                y: Math.random() * 600 + 200
            }
        }
    })

    // 力导向参数
    const config = {
        iterations: 100,
        springLength: 150,
        springStrength: 0.3,
        repulsionStrength: 5000,
        damping: 0.85,
        centerForce: 0.01
    }

    // 运行力导向仿真
    for (let i = 0; i < config.iterations; i++) {
        // 计算每个节点受到的力
        layoutedNodes.forEach(node => {
            let fx = 0, fy = 0

            // 排斥力 - 节点间相互排斥
            layoutedNodes.forEach(other => {
                if (node.id !== other.id) {
                    const dx = node.position.x - other.position.x
                    const dy = node.position.y - other.position.y
                    const distance = Math.sqrt(dx * dx + dy * dy) || 1

                    const repulsion = config.repulsionStrength / (distance * distance)
                    fx += (dx / distance) * repulsion
                    fy += (dy / distance) * repulsion
                }
            })

            // 弹簧力 - 连接的节点相互吸引
            links.forEach(link => {
                let connectedNode: TopologyNode | undefined

                if (link.source === node.id) {
                    connectedNode = layoutedNodes.find(n => n.id === link.target)
                } else if (link.target === node.id) {
                    connectedNode = layoutedNodes.find(n => n.id === link.source)
                }

                if (connectedNode) {
                    const dx = connectedNode.position.x - node.position.x
                    const dy = connectedNode.position.y - node.position.y
                    const distance = Math.sqrt(dx * dx + dy * dy) || 1

                    const springForce = config.springStrength * (distance - config.springLength)
                    fx += (dx / distance) * springForce
                    fy += (dy / distance) * springForce
                }
            })

            // 中心力 - 防止节点飘得太远
            const centerX = 600
            const centerY = 400
            fx += (centerX - node.position.x) * config.centerForce
            fy += (centerY - node.position.y) * config.centerForce

            // 应用阻尼并更新位置
            node.position.x += fx * config.damping
            node.position.y += fy * config.damping
        })

        // 每10次迭代减少一次力的强度
        if (i % 10 === 0) {
            config.springStrength *= 0.95
            config.repulsionStrength *= 0.95
        }
    }

    return layoutedNodes
}

/**
 * ZC子系统布局算法 - 专用于ZC内部组件
 */
export function calculateZCSubsystemLayout(
    nodes: TopologyNode[],
    links: TopologyLink[]
): TopologyNode[] {
    const layoutedNodes = nodes.map(node => ({ ...node }))
    const config = SUBSYSTEM_LAYOUT_CONFIG.zc

    // 按设备类型分组
    const nodesByType = {
        PU: layoutedNodes.filter(node => node.type === 'PU'),
        CC: layoutedNodes.filter(node => node.type === 'CC'),
        FTSM: layoutedNodes.filter(node => node.type === 'FTSM')
    }

    const center = config.centerPosition
    const spacing = config.nodeSpacing

    // PU设备环形布局
    if (nodesByType.PU.length > 0) {
        const radius = spacing * 1.5
        nodesByType.PU.forEach((node, index) => {
            const angle = (index / nodesByType.PU.length) * 2 * Math.PI
            node.position = {
                x: center.x + Math.cos(angle) * radius,
                y: center.y + Math.sin(angle) * radius
            }
        })
    }

    // CC设备在中心区域
    if (nodesByType.CC.length > 0) {
        nodesByType.CC.forEach((node, index) => {
            node.position = {
                x: center.x + (index - (nodesByType.CC.length - 1) / 2) * spacing * 0.6,
                y: center.y
            }
        })
    }

    // FTSM设备在下方
    if (nodesByType.FTSM.length > 0) {
        nodesByType.FTSM.forEach((node, index) => {
            node.position = {
                x: center.x + (index - (nodesByType.FTSM.length - 1) / 2) * spacing * 0.8,
                y: center.y + spacing * 1.2
            }
        })
    }

    return layoutedNodes
}

/**
 * ATS子系统布局算法 - 专用于ATS内部模块
 */
export function calculateATSSubsystemLayout(
    nodes: TopologyNode[],
    links: TopologyLink[]
): TopologyNode[] {
    const layoutedNodes = nodes.map(node => ({ ...node }))
    const config = SUBSYSTEM_LAYOUT_CONFIG.ats

    // 按功能分层排布
    const modulesByLayer = {
        gateway: layoutedNodes.filter(node => node.type === 'GATEWAY'),
        processing: layoutedNodes.filter(node =>
            node.type === 'TIMETABLE' || node.type === 'DISPATCH'
        ),
        application: layoutedNodes.filter(node => node.type === 'APP'),
        storage: layoutedNodes.filter(node => node.type === 'DB')
    }

    const center = config.centerPosition
    const spacing = config.nodeSpacing

    // 网关层 - 顶部
    layoutLayer(modulesByLayer.gateway, center.y - spacing * 1.5, spacing)

    // 处理层 - 中上
    layoutLayer(modulesByLayer.processing, center.y - spacing * 0.5, spacing)

    // 应用层 - 中下
    layoutLayer(modulesByLayer.application, center.y + spacing * 0.5, spacing)

    // 存储层 - 底部
    layoutLayer(modulesByLayer.storage, center.y + spacing * 1.5, spacing)

    return layoutedNodes
}

/**
 * 网格布局算法 - 简单的网格排列
 */
export function calculateGridLayout(
    nodes: TopologyNode[],
    options: {
        columns?: number
        spacing?: number
        startX?: number
        startY?: number
    } = {}
): TopologyNode[] {
    const layoutedNodes = nodes.map(node => ({ ...node }))

    const {
        columns = Math.ceil(Math.sqrt(nodes.length)),
        spacing = 120,
        startX = 100,
        startY = 100
    } = options

    layoutedNodes.forEach((node, index) => {
        const row = Math.floor(index / columns)
        const col = index % columns

        node.position = {
            x: startX + col * spacing,
            y: startY + row * spacing
        }
    })

    return layoutedNodes
}

/**
 * 圆形布局算法 - 节点环形排列
 */
export function calculateCircleLayout(
    nodes: TopologyNode[],
    options: {
        centerX?: number
        centerY?: number
        radius?: number
    } = {}
): TopologyNode[] {
    const layoutedNodes = nodes.map(node => ({ ...node }))

    const {
        centerX = 400,
        centerY = 300,
        radius = 200
    } = options

    layoutedNodes.forEach((node, index) => {
        const angle = (index / nodes.length) * 2 * Math.PI
        node.position = {
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius
        }
    })

    return layoutedNodes
}

/**
 * 辅助函数：在指定Y坐标上水平布局节点
 */
function layoutLayer(nodes: TopologyNode[], y: number, spacing: number): void {
    if (nodes.length === 0) return

    const totalWidth = (nodes.length - 1) * spacing
    const startX = 600 - totalWidth / 2 // 假设画布中心X为600

    nodes.forEach((node, index) => {
        node.position = {
            x: startX + index * spacing,
            y: y
        }
    })
}

/**
 * 辅助函数：检测布局冲突并调整
 */
function resolveNodeCollisions(nodes: TopologyNode[], minDistance: number = 80): void {
    const maxIterations = 10

    for (let iteration = 0; iteration < maxIterations; iteration++) {
        let hasCollision = false

        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const nodeA = nodes[i]
                const nodeB = nodes[j]

                const dx = nodeA.position.x - nodeB.position.x
                const dy = nodeA.position.y - nodeB.position.y
                const distance = Math.sqrt(dx * dx + dy * dy)

                if (distance < minDistance) {
                    hasCollision = true

                    // 计算分离向量
                    const separationDistance = (minDistance - distance) / 2
                    const separationX = (dx / distance) * separationDistance
                    const separationY = (dy / distance) * separationDistance

                    // 移动节点
                    nodeA.position.x += separationX
                    nodeA.position.y += separationY
                    nodeB.position.x -= separationX
                    nodeB.position.y -= separationY
                }
            }
        }

        if (!hasCollision) break
    }
}

/**
 * 辅助函数：计算布局边界
 */
export function calculateLayoutBounds(nodes: TopologyNode[]): {
    minX: number
    maxX: number
    minY: number
    maxY: number
    width: number
    height: number
    centerX: number
    centerY: number
} {
    if (nodes.length === 0) {
        return {
            minX: 0, maxX: 800, minY: 0, maxY: 600,
            width: 800, height: 600, centerX: 400, centerY: 300
        }
    }

    const positions = nodes.map(node => node.position)
    const minX = Math.min(...positions.map(p => p.x)) - 50
    const maxX = Math.max(...positions.map(p => p.x)) + 50
    const minY = Math.min(...positions.map(p => p.y)) - 50
    const maxY = Math.max(...positions.map(p => p.y)) + 50

    return {
        minX,
        maxX,
        minY,
        maxY,
        width: maxX - minX,
        height: maxY - minY,
        centerX: (minX + maxX) / 2,
        centerY: (minY + maxY) / 2
    }
}

/**
 * 布局动画：平滑过渡到新位置
 */
export function animateLayoutTransition(
    nodes: TopologyNode[],
    targetPositions: Position[],
    duration: number = 1000
): Promise<void> {
    return new Promise((resolve) => {
        const startTime = Date.now()
        const initialPositions = nodes.map(node => ({ ...node.position }))

        function animate() {
            const elapsed = Date.now() - startTime
            const progress = Math.min(elapsed / duration, 1)

            // 使用缓动函数
            const easeProgress = easeInOutCubic(progress)

            nodes.forEach((node, index) => {
                const initial = initialPositions[index]
                const target = targetPositions[index]

                if (target) {
                    node.position.x = initial.x + (target.x - initial.x) * easeProgress
                    node.position.y = initial.y + (target.y - initial.y) * easeProgress
                }
            })

            if (progress < 1) {
                requestAnimationFrame(animate)
            } else {
                resolve()
            }
        }

        animate()
    })
}

/**
 * 缓动函数：三次贝塞尔曲线
 */
function easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

/**
 * 导出布局策略枚举
 */
export enum LayoutStrategy {
    HIERARCHICAL = 'hierarchical',
    FORCE = 'force',
    GRID = 'grid',
    CIRCLE = 'circle',
    ZC_SUBSYSTEM = 'zc_subsystem',
    ATS_SUBSYSTEM = 'ats_subsystem'
}

/**
 * 布局工厂函数
 */
export async function applyLayout(
    nodes: TopologyNode[],
    links: TopologyLink[],
    strategy: LayoutStrategy,
    options?: any
): Promise<TopologyNode[]> {
    switch (strategy) {
        case LayoutStrategy.HIERARCHICAL:
            return calculateHierarchicalLayout(nodes, links)

        case LayoutStrategy.FORCE:
            return calculateForceLayout(nodes, links)

        case LayoutStrategy.GRID:
            return calculateGridLayout(nodes, options)

        case LayoutStrategy.CIRCLE:
            return calculateCircleLayout(nodes, options)

        case LayoutStrategy.ZC_SUBSYSTEM:
            return calculateZCSubsystemLayout(nodes, links)

        case LayoutStrategy.ATS_SUBSYSTEM:
            return calculateATSSubsystemLayout(nodes, links)

        default:
            console.warn(`Unknown layout strategy: ${strategy}`)
            return nodes
    }
}