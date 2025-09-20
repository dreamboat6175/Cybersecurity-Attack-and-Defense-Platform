import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useSystemStore } from '../stores/system'
import { useTopologyStore } from '../stores/topology'
import { useAlertsStore } from '../stores/alerts'
import { WEBSOCKET_CONFIG } from '../constants/config'
import type { DeviceStatus, LinkStatus } from '../types/devices'
import type { AlertInfo } from '../types/topology'

// WebSocket消息类型
interface WebSocketMessage {
    type: string
    channel: string
    data: any
    timestamp: string
}

// 设备状态更新消息
interface DeviceStatusUpdate {
    deviceId: string
    status: DeviceStatus
    metadata?: any
}

// 链路状态更新消息
interface LinkStatusUpdate {
    linkId: string
    status: LinkStatus
    metadata?: any
}

// 告警消息
interface AlertMessage {
    deviceId?: string
    linkId?: string
    type: 'device' | 'link'
    severity: 'low' | 'medium' | 'high' | 'critical'
    message: string
}

export function useWebSocket() {
    const systemStore = useSystemStore()
    const topologyStore = useTopologyStore()
    const alertsStore = useAlertsStore()

    // ===== 响应式状态 =====

    // WebSocket实例
    const ws = ref<WebSocket | null>(null)

    // 连接状态
    const isConnected = ref(false)
    const isConnecting = ref(false)
    const reconnectAttempts = ref(0)
    const lastError = ref<string | null>(null)

    // 重连控制
    const maxReconnectAttempts = ref(WEBSOCKET_CONFIG.maxReconnectAttempts)
    const reconnectInterval = ref(WEBSOCKET_CONFIG.reconnectInterval)
    const reconnectTimer = ref<NodeJS.Timeout | null>(null)

    // 心跳控制
    const heartbeatTimer = ref<NodeJS.Timeout | null>(null)
    const lastHeartbeat = ref<Date | null>(null)

    // 消息队列 (断线时暂存)
    const messageQueue = ref<WebSocketMessage[]>([])
    const maxQueueSize = ref(100)

    // 统计信息
    const stats = ref({
        messagesReceived: 0,
        messagesSent: 0,
        bytesReceived: 0,
        bytesSent: 0,
        lastMessageTime: null as Date | null
    })

    // ===== 计算属性 =====

    // 连接状态描述
    const connectionStatus = computed(() => {
        if (isConnecting.value) return 'connecting'
        if (isConnected.value) return 'connected'
        if (reconnectAttempts.value > 0) return 'reconnecting'
        return 'disconnected'
    })

    // 连接质量
    const connectionQuality = computed(() => {
        if (!isConnected.value) return 'poor'

        const now = Date.now()
        const lastHeartbeatTime = lastHeartbeat.value?.getTime() || 0
        const timeSinceHeartbeat = now - lastHeartbeatTime

        if (timeSinceHeartbeat < 10000) return 'excellent'      // < 10s
        if (timeSinceHeartbeat < 30000) return 'good'           // < 30s
        if (timeSinceHeartbeat < 60000) return 'fair'           // < 60s
        return 'poor'
    })

    // 是否应该重连
    const shouldReconnect = computed(() =>
        !isConnected.value &&
        !isConnecting.value &&
        reconnectAttempts.value < maxReconnectAttempts.value
    )

    // ===== WebSocket连接管理 =====

    // 连接WebSocket
    function connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (isConnected.value || isConnecting.value) {
                resolve()
                return
            }

            try {
                isConnecting.value = true
                lastError.value = null

                // 创建WebSocket连接
                ws.value = new WebSocket(WEBSOCKET_CONFIG.url)

                // 设置二进制数据类型
                ws.value.binaryType = 'arraybuffer'

                // 连接打开事件
                ws.value.onopen = () => {
                    isConnected.value = true
                    isConnecting.value = false
                    reconnectAttempts.value = 0
                    lastError.value = null

                    // 更新系统状态
                    systemStore.updateWebSocketStatus({
                        isConnected: true,
                        lastConnected: new Date(),
                        lastError: null
                    })

                    // 开始心跳
                    startHeartbeat()

                    // 发送队列中的消息
                    flushMessageQueue()

                    console.log('WebSocket connected successfully')
                    resolve()
                }

                // 消息接收事件
                ws.value.onmessage = (event) => {
                    handleMessage(event)
                }

                // 连接关闭事件
                ws.value.onclose = (event) => {
                    handleDisconnection(event)
                }

                // 连接错误事件
                ws.value.onerror = (event) => {
                    const errorMsg = 'WebSocket connection error'
                    lastError.value = errorMsg
                    isConnecting.value = false

                    systemStore.updateWebSocketStatus({
                        lastError: errorMsg
                    })

                    systemStore.addErrorLog('error', errorMsg, undefined, { event })
                    console.error('WebSocket error:', event)

                    reject(new Error(errorMsg))
                }

                // 连接超时处理
                setTimeout(() => {
                    if (isConnecting.value && !isConnected.value) {
                        ws.value?.close()
                        isConnecting.value = false
                        const errorMsg = 'WebSocket connection timeout'
                        lastError.value = errorMsg
                        reject(new Error(errorMsg))
                    }
                }, 10000) // 10秒超时

            } catch (error) {
                isConnecting.value = false
                const errorMsg = `Failed to create WebSocket: ${error}`
                lastError.value = errorMsg
                systemStore.addErrorLog('error', errorMsg)
                reject(error)
            }
        })
    }

    // 断开连接
    function disconnect(): void {
        if (reconnectTimer.value) {
            clearTimeout(reconnectTimer.value)
            reconnectTimer.value = null
        }

        stopHeartbeat()

        if (ws.value) {
            ws.value.close(1000, 'Manual disconnect')
            ws.value = null
        }

        isConnected.value = false
        isConnecting.value = false
        reconnectAttempts.value = 0

        systemStore.updateWebSocketStatus({
            isConnected: false
        })
    }

    // 重新连接
    async function reconnect(): Promise<void> {
        if (!shouldReconnect.value) return

        reconnectAttempts.value++
        systemStore.updateWebSocketStatus({
            reconnectAttempts: reconnectAttempts.value
        })

        console.log(`WebSocket reconnection attempt ${reconnectAttempts.value}/${maxReconnectAttempts.value}`)

        try {
            await connect()
        } catch (error) {
            console.error(`Reconnection attempt ${reconnectAttempts.value} failed:`, error)

            if (shouldReconnect.value) {
                // 指数退避重连
                const delay = Math.min(reconnectInterval.value * Math.pow(2, reconnectAttempts.value - 1), 30000)

                reconnectTimer.value = setTimeout(() => {
                    reconnect()
                }, delay)
            }
        }
    }

    // 处理断开连接
    function handleDisconnection(event: CloseEvent): void {
        isConnected.value = false
        isConnecting.value = false

        stopHeartbeat()

        systemStore.updateWebSocketStatus({
            isConnected: false
        })

        // 记录断开原因
        let reason = 'Unknown reason'
        if (event.code === 1000) reason = 'Normal closure'
        else if (event.code === 1001) reason = 'Going away'
        else if (event.code === 1002) reason = 'Protocol error'
        else if (event.code === 1003) reason = 'Unsupported data'
        else if (event.code === 1006) reason = 'Abnormal closure'
        else if (event.code === 1011) reason = 'Server error'

        console.log(`WebSocket disconnected: ${reason} (code: ${event.code})`)

        // 自动重连 (除非是正常关闭)
        if (event.code !== 1000 && shouldReconnect.value) {
            setTimeout(() => reconnect(), reconnectInterval.value)
        }
    }

    // ===== 消息处理 =====

    // 处理接收到的消息
    function handleMessage(event: MessageEvent): void {
        try {
            stats.value.messagesReceived++
            stats.value.bytesReceived += event.data.length || 0
            stats.value.lastMessageTime = new Date()

            // 解析消息
            const message: WebSocketMessage = JSON.parse(event.data)

            // 根据消息类型分发处理
            switch (message.channel) {
                case WEBSOCKET_CONFIG.channels.deviceStatus:
                    handleDeviceStatusUpdate(message.data)
                    break
                case WEBSOCKET_CONFIG.channels.linkStatus:
                    handleLinkStatusUpdate(message.data)
                    break
                case WEBSOCKET_CONFIG.channels.alerts:
                    handleAlertMessage(message.data)
                    break
                case WEBSOCKET_CONFIG.channels.topology:
                    handleTopologyUpdate(message.data)
                    break
                case 'heartbeat':
                    handleHeartbeat(message.data)
                    break
                default:
                    console.warn('Unknown message channel:', message.channel)
            }

        } catch (error) {
            console.error('Failed to parse WebSocket message:', error)
            systemStore.addErrorLog('warning', 'Failed to parse WebSocket message')
        }
    }

    // 处理设备状态更新
    function handleDeviceStatusUpdate(data: DeviceStatusUpdate | DeviceStatusUpdate[]): void {
        const updates = Array.isArray(data) ? data : [data]

        updates.forEach(update => {
            topologyStore.updateNodeStatus(update.deviceId, update.status)

            // 如果是故障状态，生成告警
            if (update.status === 'critical' || update.status === 'warning') {
                alertsStore.addAlert({
                    deviceId: update.deviceId,
                    type: 'device',
                    severity: update.status === 'critical' ? 'critical' : 'medium',
                    message: `设备 ${update.deviceId} 状态异常: ${update.status}`
                })
            }
        })
    }

    // 处理链路状态更新
    function handleLinkStatusUpdate(data: LinkStatusUpdate | LinkStatusUpdate[]): void {
        const updates = Array.isArray(data) ? data : [data]

        updates.forEach(update => {
            topologyStore.updateLinkStatus(update.linkId, update.status)

            // 如果是故障状态，生成告警
            if (update.status === 'down' || update.status === 'warning') {
                alertsStore.addAlert({
                    linkId: update.linkId,
                    type: 'link',
                    severity: update.status === 'down' ? 'high' : 'medium',
                    message: `链路 ${update.linkId} 状态异常: ${update.status}`
                })
            }
        })
    }

    // 处理告警消息
    function handleAlertMessage(data: AlertMessage | AlertMessage[]): void {
        const alerts = Array.isArray(data) ? data : [data]

        alerts.forEach(alert => {
            alertsStore.addAlert(alert)
        })
    }

    // 处理拓扑更新
    function handleTopologyUpdate(data: any): void {
        // TODO: 实现拓扑结构动态更新
        console.log('Topology update received:', data)
    }

    // 处理心跳消息
    function handleHeartbeat(data: any): void {
        lastHeartbeat.value = new Date()
    }

    // ===== 消息发送 =====

    // 发送消息
    function sendMessage(channel: string, data: any): boolean {
        const message: WebSocketMessage = {
            type: 'message',
            channel,
            data,
            timestamp: new Date().toISOString()
        }

        if (isConnected.value && ws.value?.readyState === WebSocket.OPEN) {
            try {
                const messageStr = JSON.stringify(message)
                ws.value.send(messageStr)

                stats.value.messagesSent++
                stats.value.bytesSent += messageStr.length

                return true
            } catch (error) {
                console.error('Failed to send WebSocket message:', error)
                systemStore.addErrorLog('warning', 'Failed to send WebSocket message')
                return false
            }
        } else {
            // 连接断开时将消息加入队列
            if (messageQueue.value.length < maxQueueSize.value) {
                messageQueue.value.push(message)
            } else {
                // 队列满时移除最旧的消息
                messageQueue.value.shift()
                messageQueue.value.push(message)
            }
            return false
        }
    }

    // 发送设备状态查询
    function queryDeviceStatus(deviceId: string): boolean {
        return sendMessage('query_device_status', { deviceId })
    }

    // 发送链路状态查询
    function queryLinkStatus(linkId: string): boolean {
        return sendMessage('query_link_status', { linkId })
    }

    // 订阅频道
    function subscribe(channel: string): boolean {
        return sendMessage('subscribe', { channel })
    }

    // 取消订阅频道
    function unsubscribe(channel: string): boolean {
        return sendMessage('unsubscribe', { channel })
    }

    // 刷新消息队列
    function flushMessageQueue(): void {
        if (messageQueue.value.length === 0) return

        const messages = [...messageQueue.value]
        messageQueue.value = []

        messages.forEach(message => {
            sendMessage(message.channel, message.data)
        })

        console.log(`Flushed ${messages.length} queued messages`)
    }

    // ===== 心跳机制 =====

    // 开始心跳
    function startHeartbeat(): void {
        stopHeartbeat() // 确保没有重复的定时器

        heartbeatTimer.value = setInterval(() => {
            if (isConnected.value) {
                sendMessage('heartbeat', { timestamp: Date.now() })
            }
        }, WEBSOCKET_CONFIG.heartbeatInterval)
    }

    // 停止心跳
    function stopHeartbeat(): void {
        if (heartbeatTimer.value) {
            clearInterval(heartbeatTimer.value)
            heartbeatTimer.value = null
        }
    }

    // ===== 订阅管理 =====

    // 订阅所有默认频道
    function subscribeToDefaultChannels(): void {
        const channels = Object.values(WEBSOCKET_CONFIG.channels)
        channels.forEach(channel => {
            subscribe(channel)
        })
    }

    // 取消订阅所有频道
    function unsubscribeFromAllChannels(): void {
        const channels = Object.values(WEBSOCKET_CONFIG.channels)
        channels.forEach(channel => {
            unsubscribe(channel)
        })
    }

    // ===== 监控和统计 =====

    // 重置统计信息
    function resetStats(): void {
        stats.value = {
            messagesReceived: 0,
            messagesSent: 0,
            bytesReceived: 0,
            bytesSent: 0,
            lastMessageTime: null
        }
    }

    // 获取连接信息
    function getConnectionInfo() {
        return {
            url: WEBSOCKET_CONFIG.url,
            status: connectionStatus.value,
            quality: connectionQuality.value,
            isConnected: isConnected.value,
            reconnectAttempts: reconnectAttempts.value,
            lastError: lastError.value,
            lastHeartbeat: lastHeartbeat.value,
            stats: { ...stats.value },
            queueSize: messageQueue.value.length
        }
    }

    // ===== 错误处理和恢复 =====

    // 处理连接错误
    function handleConnectionError(error: Error): void {
        console.error('WebSocket connection error:', error)

        systemStore.addErrorLog('error', `WebSocket error: ${error.message}`, error.stack)

        // 触发重连
        if (shouldReconnect.value) {
            setTimeout(() => reconnect(), reconnectInterval.value)
        }
    }

    // 强制重连
    function forceReconnect(): Promise<void> {
        disconnect()
        reconnectAttempts.value = 0
        return connect()
    }

    // 检查连接健康状态
    function checkConnectionHealth(): boolean {
        if (!isConnected.value) return false

        const now = Date.now()
        const lastHeartbeatTime = lastHeartbeat.value?.getTime() || 0
        const timeSinceHeartbeat = now - lastHeartbeatTime

        // 如果超过2倍心跳间隔没有收到心跳，认为连接不健康
        if (timeSinceHeartbeat > WEBSOCKET_CONFIG.heartbeatInterval * 2) {
            console.warn('WebSocket connection appears unhealthy, forcing reconnection')
            forceReconnect()
            return false
        }

        return true
    }

    // ===== 配置管理 =====

    // 更新重连配置
    function updateReconnectConfig(maxAttempts: number, interval: number): void {
        maxReconnectAttempts.value = maxAttempts
        reconnectInterval.value = interval
    }

    // 更新消息队列配置
    function updateQueueConfig(maxSize: number): void {
        maxQueueSize.value = maxSize

        // 如果当前队列超过新的最大值，截断队列
        if (messageQueue.value.length > maxSize) {
            messageQueue.value = messageQueue.value.slice(-maxSize)
        }
    }

    // ===== 生命周期管理 =====

    // 组件挂载时自动连接
    onMounted(async () => {
        try {
            await connect()
            subscribeToDefaultChannels()

            // 启动连接健康检查
            setInterval(checkConnectionHealth, 60000) // 每分钟检查一次

        } catch (error) {
            console.error('Failed to establish WebSocket connection on mount:', error)
        }
    })

    // 组件卸载时清理
    onUnmounted(() => {
        disconnect()

        if (reconnectTimer.value) {
            clearTimeout(reconnectTimer.value)
        }
    })

    // 监听页面可见性变化
    if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                // 页面重新可见时检查连接状态
                if (!isConnected.value && shouldReconnect.value) {
                    reconnect()
                }
            }
        })
    }

    // 监听网络状态变化
    if (typeof window !== 'undefined' && 'navigator' in window) {
        window.addEventListener('online', () => {
            console.log('Network came back online, attempting to reconnect WebSocket')
            if (!isConnected.value) {
                reconnectAttempts.value = 0 // 重置重连次数
                reconnect()
            }
        })

        window.addEventListener('offline', () => {
            console.log('Network went offline, WebSocket will be disconnected')
        })
    }

    // ===== 调试和开发工具 =====

    // 模拟消息 (开发时使用)
    function simulateMessage(channel: string, data: any): void {
        if (process.env.NODE_ENV === 'development') {
            const message = {
                data: JSON.stringify({
                    type: 'message',
                    channel,
                    data,
                    timestamp: new Date().toISOString()
                })
            } as MessageEvent

            handleMessage(message)
        }
    }

    // 模拟设备状态变化
    function simulateDeviceStatusChange(deviceId: string, status: DeviceStatus): void {
        if (process.env.NODE_ENV === 'development') {
            simulateMessage(WEBSOCKET_CONFIG.channels.deviceStatus, {
                deviceId,
                status,
                metadata: { timestamp: Date.now() }
            })
        }
    }

    // 模拟链路状态变化
    function simulateLinkStatusChange(linkId: string, status: LinkStatus): void {
        if (process.env.NODE_ENV === 'development') {
            simulateMessage(WEBSOCKET_CONFIG.channels.linkStatus, {
                linkId,
                status,
                metadata: { timestamp: Date.now() }
            })
        }
    }

    // 模拟告警
    function simulateAlert(alert: Omit<AlertMessage, 'timestamp'>): void {
        if (process.env.NODE_ENV === 'development') {
            simulateMessage(WEBSOCKET_CONFIG.channels.alerts, alert)
        }
    }

    // 导出连接状态 (用于调试)
    function exportConnectionState() {
        return {
            connection: getConnectionInfo(),
            config: WEBSOCKET_CONFIG,
            queue: messageQueue.value,
            timers: {
                reconnectTimer: !!reconnectTimer.value,
                heartbeatTimer: !!heartbeatTimer.value
            }
        }
    }

    // ===== 返回接口 =====

    return {
        // 状态
        isConnected,
        isConnecting,
        connectionStatus,
        connectionQuality,
        reconnectAttempts,
        lastError,
        lastHeartbeat,
        stats,

        // 连接管理
        connect,
        disconnect,
        reconnect,
        forceReconnect,

        // 消息发送
        sendMessage,
        queryDeviceStatus,
        queryLinkStatus,

        // 订阅管理
        subscribe,
        unsubscribe,
        subscribeToDefaultChannels,
        unsubscribeFromAllChannels,

        // 配置管理
        updateReconnectConfig,
        updateQueueConfig,

        // 监控工具
        getConnectionInfo,
        checkConnectionHealth,
        resetStats,

        // 开发工具
        simulateMessage,
        simulateDeviceStatusChange,
        simulateLinkStatusChange,
        simulateAlert,
        exportConnectionState
    }
}