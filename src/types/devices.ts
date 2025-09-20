// 设备类型枚举
export enum DeviceType {
    DSU = 'DSU',
    ZC = 'ZC',
    ATS = 'ATS',
    CI = 'CI',
    VOBC = 'VOBC',
    // ZC子系统内部设备
    PU = 'PU',
    CC = 'CC',
    FTSM = 'FTSM',
    // ATS子系统内部设备
    GATEWAY = 'GATEWAY',
    TIMETABLE = 'TIMETABLE',
    DISPATCH = 'DISPATCH',
    APP = 'APP',
    DB = 'DB'
}

// 设备状态枚举
export enum DeviceStatus {
    NORMAL = 'normal',    // 正常运行
    WARNING = 'warning',  // 告警状态
    CRITICAL = 'critical', // 严重故障
    OFFLINE = 'offline'   // 离线/未知
}

// 链路状态枚举
export enum LinkStatus {
    ACTIVE = 'active',     // 通信正常
    WARNING = 'warning',   // 通信告警
    DOWN = 'down',         // 通信中断
    UNKNOWN = 'unknown'    // 状态未知
}

// 链路类型枚举
export enum LinkType {
    CONTROL = 'control',     // 控制链路
    DATA = 'data',          // 数据链路
    BACKUP = 'backup',      // 备用链路
    INTERNAL = 'internal'   // 内部链路
}

// 网络类型 (ZC子系统专用)
export enum NetworkType {
    A_NETWORK = 'A',  // A网 (原绿网)
    B_NETWORK = 'B'   // B网 (原紫网)
}

// 设备元数据接口
export interface DeviceMetadata {
    ip?: string
    location?: string
    version?: string
    cpuUsage?: number
    memoryUsage?: number
    temperature?: number
    uptime?: number
    lastHeartbeat?: Date
    description?: string
}

// 链路元数据接口
export interface LinkMetadata {
    protocol?: string
    bandwidth?: number
    latency?: number
    packetLoss?: number
    throughput?: number
    lastUpdate?: Date
    description?: string
}

// 设备基础接口
export interface Device {
    id: string
    type: DeviceType
    name: string
    status: DeviceStatus
    metadata: DeviceMetadata
    parentSystem?: string  // 所属系统
    createdAt: Date
    updatedAt: Date
}

// 通信链路接口
export interface CommunicationLink {
    id: string
    sourceId: string
    targetId: string
    type: LinkType
    status: LinkStatus
    network?: NetworkType  // ZC子系统专用
    metadata: LinkMetadata
    createdAt: Date
    updatedAt: Date
}