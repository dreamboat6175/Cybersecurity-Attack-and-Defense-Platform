import api from '../index'
import type { TopologyNode, TopologyLink, SubsystemType } from '../../types/topology'
import type { Device, CommunicationLink } from '../../types/devices'

// API响应类型定义
export interface TopologyResponse {
    nodes: Device[]
    links: CommunicationLink[]
    metadata?: {
        timestamp: string
        version: string
        checksum?: string
    }
}

export interface SubsystemTopologyResponse extends TopologyResponse {
    subsystemType: SubsystemType
    subsystemId: string
    parentSystem?: string
}

export interface TopologyUpdateEvent {
    type: 'node_added' | 'node_removed' | 'node_updated' | 'link_added' | 'link_removed' | 'link_updated'
    data: Device | CommunicationLink
    timestamp: string
}

// 拓扑数据转换函数
function transformDeviceToNode(device: Device): TopologyNode {
    return {
        id: device.id,
        type: device.type,
        label: device.name,
        position: { x: 0, y: 0 }, // 初始位置，后续由布局算法计算
        size: { width: 80, height: 60 }, // 默认尺寸
        status: device.status,
        metadata: device.metadata,
        parentSystem: device.parentSystem
    }
}

function transformLinkToTopologyLink(link: CommunicationLink): TopologyLink {
    return {
        id: link.id,
        source: link.sourceId,
        target: link.targetId,
        type: link.type,
        status: link.status,
        network: link.network,
        metadata: link.metadata
    }
}

// ===== 系统拓扑API =====

/**
 * 获取系统层拓扑数据
 */
export async function getSystemTopology(): Promise<{
    nodes: TopologyNode[]
    links: TopologyLink[]
}> {
    try {
        const response = await api.get<TopologyResponse>('/topology/system')

        return {
            nodes: response.nodes.map(transformDeviceToNode),
            links: response.links.map(transformLinkToTopologyLink)
        }
    } catch (error) {
        console.error('Failed to fetch system topology:', error)
        throw new Error('获取系统拓扑失败')
    }
}

/**
 * 获取系统拓扑概览统计
 */
export async function getSystemTopologyStats(): Promise<{
    totalNodes: number
    totalLinks: number
    nodesByType: Record<string, number>
    nodesByStatus: Record<string, number>
    linksByStatus: Record<string, number>
}> {
    try {
        const response = await api.get('/topology/system/stats')
        return response
    } catch (error) {
        console.error('Failed to fetch system topology stats:', error)
        throw new Error('获取系统拓扑统计失败')
    }
}

// ===== 子系统拓扑API =====

/**
 * 获取ZC子系统拓扑数据
 */
export async function getZCSubsystemTopology(zcId: string): Promise<{
    nodes: TopologyNode[]
    links: TopologyLink[]
}> {
    try {
        const response = await api.get<SubsystemTopologyResponse>(`/topology/subsystem/zc/${zcId}`)

        return {
            nodes: response.nodes.map(transformDeviceToNode),
            links: response.links.map(transformLinkToTopologyLink)
        }
    } catch (error) {
        console.error(`Failed to fetch ZC subsystem topology for ${zcId}:`, error)
        throw new Error(`获取ZC-${zcId}子系统拓扑失败`)
    }
}

/**
 * 获取ATS子系统拓扑数据
 */
export async function getATSSubsystemTopology(atsId: string): Promise<{
    nodes: TopologyNode[]
    links: TopologyLink[]
}> {
    try {
        const response = await api.get<SubsystemTopologyResponse>(`/topology/subsystem/ats/${atsId}`)

        return {
            nodes: response.nodes.map(transformDeviceToNode),
            links: response.links.map(transformLinkToTopologyLink)
        }
    } catch (error) {
        console.error(`Failed to fetch ATS subsystem topology for ${atsId}:`, error)
        throw new Error(`获取ATS-${atsId}子系统拓扑失败`)
    }
}

/**
 * 通用获取子系统拓扑数据
 */
export async function getSubsystemTopology(
    type: SubsystemType,
    id: string
): Promise<{
    nodes: TopologyNode[]
    links: TopologyLink[]
}> {
    if (type === 'ZC') {
        return getZCSubsystemTopology(id)
    } else if (type === 'ATS') {
        return getATSSubsystemTopology(id)
    } else {
        throw new Error(`不支持的子系统类型: ${type}`)
    }
}

// ===== 拓扑结构管理API =====

/**
 * 更新节点位置
 */
export async function updateNodePosition(
    nodeId: string,
    position: { x: number; y: number }
): Promise<void> {
    try {
        await api.patch(`/topology/nodes/${nodeId}/position`, {
            x: position.x,
            y: position.y
        })
    } catch (error) {
        console.error(`Failed to update node position for ${nodeId}:`, error)
        throw new Error('更新节点位置失败')
    }
}

/**
 * 批量更新节点位置
 */
export async function batchUpdateNodePositions(
    updates: Array<{ nodeId: string; position: { x: number; y: number } }>
): Promise<void> {
    try {
        await api.patch('/topology/nodes/positions', { updates })
    } catch (error) {
        console.error('Failed to batch update node positions:', error)
        throw new Error('批量更新节点位置失败')
    }
}

/**
 * 保存拓扑布局
 */
export async function saveTopologyLayout(
    level: 'system' | 'subsystem',
    layoutData: {
        subsystemId?: string
        subsystemType?: SubsystemType
        nodes: Array<{ id: string; position: { x: number; y: number } }>
        layoutType: string
        metadata?: Record<string, any>
    }
): Promise<void> {
    try {
        await api.post('/topology/layouts', {
            level,
            ...layoutData,
            timestamp: new Date().toISOString()
        })
    } catch (error) {
        console.error('Failed to save topology layout:', error)
        throw new Error('保存拓扑布局失败')
    }
}

/**
 * 加载拓扑布局
 */
export async function loadTopologyLayout(
    level: 'system' | 'subsystem',
    subsystemId?: string,
    subsystemType?: SubsystemType
): Promise<{
    nodes: Array<{ id: string; position: { x: number; y: number } }>
    layoutType: string
    metadata?: Record<string, any>
    timestamp: string
} | null> {
    try {
        const params = new URLSearchParams({ level })
        if (subsystemId) params.append('subsystemId', subsystemId)
        if (subsystemType) params.append('subsystemType', subsystemType)

        const response = await api.get(`/topology/layouts?${params.toString()}`)
        return response || null
    } catch (error) {
        console.error('Failed to load topology layout:', error)
        return null
    }
}

// ===== 拓扑搜索API =====

/**
 * 搜索拓扑节点
 */
export async function searchTopologyNodes(
    query: string,
    filters?: {
        type?: string[]
        status?: string[]
        subsystem?: string
    }
): Promise<TopologyNode[]> {
    try {
        const response = await api.get<{ nodes: Device[] }>('/topology/search/nodes', {
            params: {
                q: query,
                ...filters
            }
        })

        return response.nodes.map(transformDeviceToNode)
    } catch (error) {
        console.error('Failed to search topology nodes:', error)
        throw new Error('搜索拓扑节点失败')
    }
}

/**
 * 根据路径查找节点
 */
export async function findNodePath(
    sourceId: string,
    targetId: string
): Promise<{
    path: string[]
    links: TopologyLink[]
    distance: number
}> {
    try {
        const response = await api.get(`/topology/path/${sourceId}/${targetId}`)

        return {
            path: response.path,
            links: response.links.map(transformLinkToTopologyLink),
            distance: response.distance
        }
    } catch (error) {
        console.error(`Failed to find path from ${sourceId} to ${targetId}:`, error)
        throw new Error('查找节点路径失败')
    }
}

// ===== 拓扑分析API =====

/**
 * 获取节点邻居信息
 */
export async function getNodeNeighbors(
    nodeId: string,
    depth: number = 1
): Promise<{
    nodes: TopologyNode[]
    links: TopologyLink[]
}> {
    try {
        const response = await api.get<TopologyResponse>(`/topology/nodes/${nodeId}/neighbors`, {
            params: { depth }
        })

        return {
            nodes: response.nodes.map(transformDeviceToNode),
            links: response.links.map(transformLinkToTopologyLink)
        }
    } catch (error) {
        console.error(`Failed to get neighbors for node ${nodeId}:`, error)
        throw new Error('获取节点邻居失败')
    }
}

/**
 * 获取拓扑图连通性分析
 */
export async function getTopologyConnectivity(): Promise<{
    components: Array<{
        id: string
        nodes: string[]
        size: number
        isIsolated: boolean
    }>
    bridges: string[] // 桥接链路ID
    cutVertices: string[] // 关键节点ID
}> {
    try {
        const response = await api.get('/topology/analysis/connectivity')
        return response
    } catch (error) {
        console.error('Failed to get topology connectivity:', error)
        throw new Error('获取拓扑连通性分析失败')
    }
}

/**
 * 获取拓扑图性能分析
 */
export async function getTopologyPerformance(): Promise<{
    averageLatency: number
    bottleneckLinks: Array<{
        linkId: string
        utilization: number
        latency: number
    }>
    criticalPaths: Array<{
        source: string
        target: string
        latency: number
        hops: number
    }>
}> {
    try {
        const response = await api.get('/topology/analysis/performance')
        return response
    } catch (error) {
        console.error('Failed to get topology performance:', error)
        throw new Error('获取拓扑性能分析失败')
    }
}

// ===== 拓扑配置API =====

/**
 * 获取拓扑配置
 */
export async function getTopologyConfig(): Promise<{
    autoRefresh: boolean
    refreshInterval: number
    layoutAlgorithm: string
    visualSettings: Record<string, any>
}> {
    try {
        const response = await api.get('/topology/config')
        return response
    } catch (error) {
        console.error('Failed to get topology config:', error)
        throw new Error('获取拓扑配置失败')
    }
}

/**
 * 更新拓扑配置
 */
export async function updateTopologyConfig(
    config: Partial<{
        autoRefresh: boolean
        refreshInterval: number
        layoutAlgorithm: string
        visualSettings: Record<string, any>
    }>
): Promise<void> {
    try {
        await api.patch('/topology/config', config)
    } catch (error) {
        console.error('Failed to update topology config:', error)
        throw new Error('更新拓扑配置失败')
    }
}

// ===== 导出功能API =====

/**
 * 导出拓扑数据
 */
export async function exportTopologyData(
    format: 'json' | 'xml' | 'csv',
    level: 'system' | 'subsystem',
    subsystemId?: string
): Promise<Blob> {
    try {
        const params = new URLSearchParams({ format, level })
        if (subsystemId) params.append('subsystemId', subsystemId)

        const response = await api.get(`/topology/export?${params.toString()}`, {
            responseType: 'blob'
        })

        return response
    } catch (error) {
        console.error('Failed to export topology data:', error)
        throw new Error('导出拓扑数据失败')
    }
}

/**
 * 导出拓扑图像
 */
export async function exportTopologyImage(
    format: 'png' | 'svg' | 'pdf',
    level: 'system' | 'subsystem',
    subsystemId?: string,
    options?: {
        width?: number
        height?: number
        quality?: number
        includeLabels?: boolean
    }
): Promise<Blob> {
    try {
        const params = new URLSearchParams({ format, level })
        if (subsystemId) params.append('subsystemId', subsystemId)

        const response = await api.post(`/topology/export/image?${params.toString()}`, options, {
            responseType: 'blob'
        })

        return response
    } catch (error) {
        console.error('Failed to export topology image:', error)
        throw new Error('导出拓扑图像失败')
    }
}

// ===== 实时数据API =====

/**
 * 获取拓扑实时状态快照
 */
export async function getTopologySnapshot(): Promise<{
    timestamp: string
    nodes: Array<{ id: string; status: string; metadata?: any }>
    links: Array<{ id: string; status: string; metadata?: any }>
    alerts: Array<{ id: string; severity: string; message: string }>
}> {
    try {
        const response = await api.get('/topology/snapshot')
        return response
    } catch (error) {
        console.error('Failed to get topology snapshot:', error)
        throw new Error('获取拓扑快照失败')
    }
}

/**
 * 订阅拓扑更新通知
 */
export async function subscribeTopologyUpdates(
    callback: (event: TopologyUpdateEvent) => void
): Promise<() => void> {
    try {
        // 这里实际应该建立 WebSocket 连接或 SSE 连接
        // 示例使用轮询模式
        const interval = setInterval(async () => {
            try {
                const snapshot = await getTopologySnapshot()
                // 处理变更检测逻辑
                // 实际实现中应该比较前后状态差异
            } catch (error) {
                console.error('Failed to poll topology updates:', error)
            }
        }, 5000)

        return () => clearInterval(interval)
    } catch (error) {
        console.error('Failed to subscribe topology updates:', error)
        throw new Error('订阅拓扑更新失败')
    }
}

// ===== 错误处理和重试机制 =====

/**
 * 带重试的API调用
 */
async function withRetry<T>(
    apiCall: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
): Promise<T> {
    let lastError: Error

    for (let i = 0; i < maxRetries; i++) {
        try {
            return await apiCall()
        } catch (error) {
            lastError = error as Error

            if (i < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)))
            }
        }
    }

    throw lastError!
}

/**
 * 带重试的系统拓扑获取
 */
export const getSystemTopologyWithRetry = (maxRetries?: number) =>
    withRetry(() => getSystemTopology(), maxRetries)

/**
 * 带重试的子系统拓扑获取
 */
export const getSubsystemTopologyWithRetry = (
    type: SubsystemType,
    id: string,
    maxRetries?: number
) => withRetry(() => getSubsystemTopology(type, id), maxRetries)

// ===== 缓存机制 =====

interface CacheEntry<T> {
    data: T
    timestamp: number
    ttl: number
}

class TopologyCache {
    private cache = new Map<string, CacheEntry<any>>()
    private defaultTTL = 30000 // 30秒默认缓存时间

    set<T>(key: string, data: T, ttl?: number): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl: ttl || this.defaultTTL
        })
    }

    get<T>(key: string): T | null {
        const entry = this.cache.get(key)

        if (!entry) return null

        if (Date.now() - entry.timestamp > entry.ttl) {
            this.cache.delete(key)
            return null
        }

        return entry.data
    }

    clear(): void {
        this.cache.clear()
    }

    has(key: string): boolean {
        const entry = this.cache.get(key)

        if (!entry) return false

        if (Date.now() - entry.timestamp > entry.ttl) {
            this.cache.delete(key)
            return false
        }

        return true
    }
}

// 全局缓存实例
const topologyCache = new TopologyCache()

/**
 * 带缓存的系统拓扑获取
 */
export async function getSystemTopologyWithCache(useCache: boolean = true): Promise<{
    nodes: TopologyNode[]
    links: TopologyLink[]
}> {
    const cacheKey = 'system-topology'

    if (useCache) {
        const cached = topologyCache.get<{ nodes: TopologyNode[]; links: TopologyLink[] }>(cacheKey)
        if (cached) return cached
    }

    const data = await getSystemTopology()

    if (useCache) {
        topologyCache.set(cacheKey, data, 60000) // 1分钟缓存
    }

    return data
}

/**
 * 带缓存的子系统拓扑获取
 */
export async function getSubsystemTopologyWithCache(
    type: SubsystemType,
    id: string,
    useCache: boolean = true
): Promise<{
    nodes: TopologyNode[]
    links: TopologyLink[]
}> {
    const cacheKey = `subsystem-topology-${type}-${id}`

    if (useCache) {
        const cached = topologyCache.get<{ nodes: TopologyNode[]; links: TopologyLink[] }>(cacheKey)
        if (cached) return cached
    }

    const data = await getSubsystemTopology(type, id)

    if (useCache) {
        topologyCache.set(cacheKey, data, 30000) // 30秒缓存
    }

    return data
}

/**
 * 清除拓扑缓存
 */
export function clearTopologyCache(): void {
    topologyCache.clear()
}

/**
 * 清除特定拓扑缓存
 */
export function clearSpecificTopologyCache(
    level: 'system' | 'subsystem',
    subsystemType?: SubsystemType,
    subsystemId?: string
): void {
    if (level === 'system') {
        topologyCache.cache.delete('system-topology')
    } else if (level === 'subsystem' && subsystemType && subsystemId) {
        topologyCache.cache.delete(`subsystem-topology-${subsystemType}-${subsystemId}`)
    }
}

// ===== 模拟数据生成器 (开发环境) =====

/**
 * 生成模拟系统拓扑数据
 */
export function generateMockSystemTopology(): {
    nodes: TopologyNode[]
    links: TopologyLink[]
} {
    const nodes: TopologyNode[] = [
        {
            id: 'dsu-1',
            type: 'DSU',
            label: 'DSU-1',
            position: { x: 400, y: 100 },
            size: { width: 80, height: 60 },
            status: 'normal',
            metadata: {
                ip: '192.168.1.10',
                cpuUsage: 35,
                memoryUsage: 60,
                uptime: 86400
            }
        },
        {
            id: 'zc-1',
            type: 'ZC',
            label: 'ZC-1',
            position: { x: 200, y: 280 },
            size: { width: 80, height: 60 },
            status: 'normal',
            metadata: {
                ip: '192.168.1.20',
                cpuUsage: 45,
                memoryUsage: 55
            }
        },
        {
            id: 'zc-2',
            type: 'ZC',
            label: 'ZC-2',
            position: { x: 600, y: 280 },
            size: { width: 80, height: 60 },
            status: 'critical',
            metadata: {
                ip: '192.168.1.21',
                cpuUsage: 85,
                memoryUsage: 90
            }
        },
        {
            id: 'ats-1',
            type: 'ATS',
            label: 'ATS-1',
            position: { x: 400, y: 280 },
            size: { width: 80, height: 60 },
            status: 'warning',
            metadata: {
                ip: '192.168.1.30',
                cpuUsage: 75,
                memoryUsage: 80
            }
        },
        {
            id: 'ci-1',
            type: 'CI',
            label: 'CI-1',
            position: { x: 400, y: 460 },
            size: { width: 80, height: 60 },
            status: 'normal',
            metadata: {
                ip: '192.168.1.40'
            }
        },
        {
            id: 'vobc-1',
            type: 'VOBC',
            label: 'VOBC-1',
            position: { x: 200, y: 640 },
            size: { width: 80, height: 60 },
            status: 'normal',
            metadata: {
                ip: '192.168.2.10'
            }
        },
        {
            id: 'vobc-2',
            type: 'VOBC',
            label: 'VOBC-2',
            position: { x: 400, y: 640 },
            size: { width: 80, height: 60 },
            status: 'normal',
            metadata: {
                ip: '192.168.2.11'
            }
        },
        {
            id: 'vobc-3',
            type: 'VOBC',
            label: 'VOBC-3',
            position: { x: 600, y: 640 },
            size: { width: 80, height: 60 },
            status: 'offline',
            metadata: {
                ip: '192.168.2.12'
            }
        }
    ]

    const links: TopologyLink[] = [
        {
            id: 'link-dsu-zc1',
            source: 'dsu-1',
            target: 'zc-1',
            type: 'control',
            status: 'active',
            metadata: {
                protocol: 'TCP',
                bandwidth: 1000,
                latency: 5
            }
        },
        {
            id: 'link-dsu-zc2',
            source: 'dsu-1',
            target: 'zc-2',
            type: 'control',
            status: 'down',
            metadata: {
                protocol: 'TCP',
                bandwidth: 1000,
                latency: 0
            }
        },
        {
            id: 'link-dsu-ats',
            source: 'dsu-1',
            target: 'ats-1',
            type: 'data',
            status: 'active',
            metadata: {
                protocol: 'UDP',
                bandwidth: 1000,
                latency: 8
            }
        },
        {
            id: 'link-zc1-ci',
            source: 'zc-1',
            target: 'ci-1',
            type: 'control',
            status: 'active',
            metadata: {
                protocol: 'TCP',
                bandwidth: 100,
                latency: 3
            }
        },
        {
            id: 'link-ats-ci',
            source: 'ats-1',
            target: 'ci-1',
            type: 'data',
            status: 'warning',
            metadata: {
                protocol: 'TCP',
                bandwidth: 100,
                latency: 15
            }
        },
        {
            id: 'link-ci-vobc1',
            source: 'ci-1',
            target: 'vobc-1',
            type: 'control',
            status: 'active',
            metadata: {
                protocol: 'Radio',
                bandwidth: 10,
                latency: 20
            }
        },
        {
            id: 'link-ci-vobc2',
            source: 'ci-1',
            target: 'vobc-2',
            type: 'control',
            status: 'active',
            metadata: {
                protocol: 'Radio',
                bandwidth: 10,
                latency: 18
            }
        },
        {
            id: 'link-ci-vobc3',
            source: 'ci-1',
            target: 'vobc-3',
            type: 'control',
            status: 'unknown',
            metadata: {
                protocol: 'Radio',
                bandwidth: 10,
                latency: 0
            }
        }
    ]

    return { nodes, links }
}

/**
 * 生成模拟ZC子系统拓扑数据
 */
export function generateMockZCSubsystemTopology(zcId: string): {
    nodes: TopologyNode[]
    links: TopologyLink[]
} {
    const nodes: TopologyNode[] = [
        {
            id: `${zcId}-pu-1`,
            type: 'PU',
            label: 'PU-1',
            position: { x: 500, y: 200 },
            size: { width: 60, height: 50 },
            status: 'normal',
            parentSystem: zcId,
            metadata: {
                ip: '192.168.3.10',
                cpuUsage: 40,
                memoryUsage: 65
            }
        },
        {
            id: `${zcId}-pu-2`,
            type: 'PU',
            label: 'PU-2',
            position: { x: 700, y: 200 },
            size: { width: 60, height: 50 },
            status: 'critical',
            parentSystem: zcId,
            metadata: {
                ip: '192.168.3.11',
                cpuUsage: 95,
                memoryUsage: 85
            }
        },
        {
            id: `${zcId}-cc-1`,
            type: 'CC',
            label: 'CC-1',
            position: { x: 600, y: 400 },
            size: { width: 60, height: 50 },
            status: 'normal',
            parentSystem: zcId,
            metadata: {
                ip: '192.168.3.20'
            }
        },
        {
            id: `${zcId}-ftsm-1`,
            type: 'FTSM',
            label: 'FTSM-1',
            position: { x: 400, y: 400 },
            size: { width: 60, height: 50 },
            status: 'normal',
            parentSystem: zcId,
            metadata: {
                ip: '192.168.3.30'
            }
        }
    ]

    const links: TopologyLink[] = [
        {
            id: `${zcId}-link-pu1-cc-a`,
            source: `${zcId}-pu-1`,
            target: `${zcId}-cc-1`,
            type: 'internal',
            status: 'active',
            network: 'A',
            metadata: {
                protocol: 'TCP'
            }
        },
        {
            id: `${zcId}-link-pu1-cc-b`,
            source: `${zcId}-pu-1`,
            target: `${zcId}-cc-1`,
            type: 'internal',
            status: 'active',
            network: 'B',
            metadata: {
                protocol: 'TCP'
            }
        },
        {
            id: `${zcId}-link-pu2-cc-a`,
            source: `${zcId}-pu-2`,
            target: `${zcId}-cc-1`,
            type: 'internal',
            status: 'down',
            network: 'A',
            metadata: {
                protocol: 'TCP'
            }
        },
        {
            id: `${zcId}-link-pu2-cc-b`,
            source: `${zcId}-pu-2`,
            target: `${zcId}-cc-1`,
            type: 'internal',
            status: 'active',
            network: 'B',
            metadata: {
                protocol: 'TCP'
            }
        },
        {
            id: `${zcId}-link-cc-ftsm-a`,
            source: `${zcId}-cc-1`,
            target: `${zcId}-ftsm-1`,
            type: 'internal',
            status: 'active',
            network: 'A',
            metadata: {
                protocol: 'Safety'
            }
        },
        {
            id: `${zcId}-link-cc-ftsm-b`,
            source: `${zcId}-cc-1`,
            target: `${zcId}-ftsm-1`,
            type: 'internal',
            status: 'active',
            network: 'B',
            metadata: {
                protocol: 'Safety'
            }
        }
    ]

    return { nodes, links }
}

/**
 * 生成模拟ATS子系统拓扑数据
 */
export function generateMockATSSubsystemTopology(atsId: string): {
    nodes: TopologyNode[]
    links: TopologyLink[]
} {
    const nodes: TopologyNode[] = [
        {
            id: `${atsId}-gateway-1`,
            type: 'GATEWAY',
            label: 'Gateway-1',
            position: { x: 400, y: 200 },
            size: { width: 60, height: 50 },
            status: 'normal',
            parentSystem: atsId,
            metadata: {
                ip: '192.168.4.10'
            }
        },
        {
            id: `${atsId}-app-1`,
            type: 'APP',
            label: 'APP-1',
            position: { x: 300, y: 350 },
            size: { width: 60, height: 50 },
            status: 'normal',
            parentSystem: atsId,
            metadata: {
                ip: '192.168.4.20'
            }
        },
        {
            id: `${atsId}-db-1`,
            type: 'DB',
            label: 'DB-1',
            position: { x: 500, y: 350 },
            size: { width: 60, height: 50 },
            status: 'normal',
            parentSystem: atsId,
            metadata: {
                ip: '192.168.4.30'
            }
        },
        {
            id: `${atsId}-dispatch-1`,
            type: 'DISPATCH',
            label: 'Dispatch-1',
            position: { x: 400, y: 500 },
            size: { width: 60, height: 50 },
            status: 'warning',
            parentSystem: atsId,
            metadata: {
                ip: '192.168.4.40'
            }
        }
    ]

    const links: TopologyLink[] = [
        {
            id: `${atsId}-link-gateway-app`,
            source: `${atsId}-gateway-1`,
            target: `${atsId}-app-1`,
            type: 'data',
            status: 'active',
            metadata: {
                protocol: 'HTTP'
            }
        },
        {
            id: `${atsId}-link-gateway-db`,
            source: `${atsId}-gateway-1`,
            target: `${atsId}-db-1`,
            type: 'data',
            status: 'active',
            metadata: {
                protocol: 'SQL'
            }
        },
        {
            id: `${atsId}-link-app-db`,
            source: `${atsId}-app-1`,
            target: `${atsId}-db-1`,
            type: 'data',
            status: 'active',
            metadata: {
                protocol: 'SQL'
            }
        },
        {
            id: `${atsId}-link-app-dispatch`,
            source: `${atsId}-app-1`,
            target: `${atsId}-dispatch-1`,
            type: 'control',
            status: 'warning',
            metadata: {
                protocol: 'TCP'
            }
        }
    ]

    return { nodes, links }
}

// 在开发环境下使用模拟数据
if (process.env.NODE_ENV === 'development') {
    // 覆盖某些API函数以返回模拟数据
    Object.assign(module.exports, {
        getSystemTopology: () => Promise.resolve(generateMockSystemTopology()),
        getZCSubsystemTopology: (zcId: string) => Promise.resolve(generateMockZCSubsystemTopology(zcId)),
        getATSSubsystemTopology: (atsId: string) => Promise.resolve(generateMockATSSubsystemTopology(atsId))
    })
}