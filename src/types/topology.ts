import type { Device, CommunicationLink, DeviceType, DeviceStatus, LinkStatus, NetworkType } from './devices'

// 拓扑视图层级
export enum TopologyLevel {
    SYSTEM = 'system',       // Level 1: 系统层拓扑
    SUBSYSTEM = 'subsystem'  // Level 2: 子系统详细视图
}

// 子系统类型
export enum SubsystemType {
    ZC = 'ZC',
    ATS = 'ATS'
}

// 节点位置坐标
export interface Position {
    x: number
    y: number
}

// 节点大小
export interface NodeSize {
    width: number
    height: number
}

// 拓扑节点接口
export interface TopologyNode {
    id: string
    type: DeviceType
    label: string
    position: Position
    size: NodeSize
    status: DeviceStatus
    metadata: Device['metadata']
    parentSystem?: string
    isSelected?: boolean
    isHovered?: boolean
    zIndex?: number
}

// 拓扑链路接口
export interface TopologyLink {
    id: string
    source: string
    target: string
    type: CommunicationLink['type']
    status: LinkStatus
    network?: NetworkType
    metadata: CommunicationLink['metadata']
    isSelected?: boolean
    isHovered?: boolean
    points?: Position[]  // 链路路径点
}

// 拓扑图状态接口
export interface TopologyState {
    // 当前视图层级
    currentLevel: TopologyLevel

    // 当前查看的子系统
    currentSubsystem: SubsystemType | null
    currentSubsystemId: string | null

    // 节点和链路数据
    nodes: TopologyNode[]
    links: TopologyLink[]

    // 交互状态
    selectedNodeId: string | null
    selectedLinkId: string | null
    hoveredElementId: string | null
    hoveredElementType: 'node' | 'link' | null

    // 视图控制
    zoomLevel: number
    panOffset: Position

    // 布局控制
    layoutType: 'hierarchical' | 'force' | 'manual'
    autoLayout: boolean

    // 加载状态
    isLoading: boolean
    error: string | null
}

// 拓扑图配置接口
export interface TopologyConfig {
    // 画布尺寸
    canvasWidth: number
    canvasHeight: number

    // 节点配置
    nodeDefaultSize: NodeSize
    nodeSpacing: { horizontal: number, vertical: number }

    // 链路配置
    linkWidth: number
    linkAnimationSpeed: number

    // 交互配置
    enableZoom: boolean
    enablePan: boolean
    enableSelection: boolean

    // 动画配置
    animationDuration: number
    enableGlowEffect: boolean
    enableFlowAnimation: boolean
}

// 告警信息接口
export interface AlertInfo {
    id: string
    deviceId?: string
    linkId?: string
    type: 'device' | 'link'
    severity: 'low' | 'medium' | 'high' | 'critical'
    message: string
    timestamp: Date
    acknowledged: boolean
}

// 系统层布局配置
export interface SystemLayoutConfig {
    layers: {
        dsu: { y: number, spacing: number }
        core: { y: number, spacing: number }    // ZC, ATS
        interface: { y: number, spacing: number } // CI
        vehicle: { y: number, spacing: number }   // VOBC
    }
}

// 子系统布局配置
export interface SubsystemLayoutConfig {
    zc: {
        centerPosition: Position
        nodeSpacing: number
        networkOffset: number  // A/B网络的偏移距离
    }
    ats: {
        centerPosition: Position
        nodeSpacing: number
        moduleLayout: 'grid' | 'hierarchical'
    }
}

// 拓扑图事件接口
export interface TopologyEvent {
    type: 'nodeClick' | 'linkClick' | 'nodeHover' | 'linkHover' | 'canvasClick'
    target: TopologyNode | TopologyLink | null
    position: Position
    originalEvent: MouseEvent
}

// 导出主要类型
export type {
    Device,
    CommunicationLink
}