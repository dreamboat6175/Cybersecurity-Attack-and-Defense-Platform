// WebSocket 连接管理
import { WS_MESSAGE_TYPES, DEFAULT_CONFIG } from '@/utils/constants'

class WebSocketManager {
    constructor() {
        this.ws = null
        this.reconnectAttempts = 0
        this.maxReconnectAttempts = DEFAULT_CONFIG.WS_MAX_RECONNECT_ATTEMPTS
        this.reconnectInterval = DEFAULT_CONFIG.WS_RECONNECT_INTERVAL
        this.isConnected = false
        this.messageHandlers = new Map()
        this.heartbeatTimer = null
        this.reconnectTimer = null

        // 绑定方法的this
        this.handleOpen = this.handleOpen.bind(this)
        this.handleMessage = this.handleMessage.bind(this)
        this.handleClose = this.handleClose.bind(this)
        this.handleError = this.handleError.bind(this)
    }

    /**
     * 连接WebSocket
     * @param {string} url - WebSocket服务器地址
     */
    connect(url = null) {
        const wsUrl = url || import.meta.env.VITE_WS_URL

        if (!wsUrl) {
            console.error('❌ WebSocket URL 未配置')
            return
        }

        try {
            console.log('🔌 正在连接WebSocket:', wsUrl)
            this.ws = new WebSocket(wsUrl)

            // 绑定事件处理器
            this.ws.onopen = this.handleOpen
            this.ws.onmessage = this.handleMessage
            this.ws.onclose = this.handleClose
            this.ws.onerror = this.handleError

        } catch (error) {
            console.error('❌ WebSocket连接失败:', error)
            this.scheduleReconnect()
        }
    }

    /**
     * 连接打开处理
     */
    handleOpen(event) {
        console.log('✅ WebSocket连接已建立')
        this.isConnected = true
        this.reconnectAttempts = 0

        // 开始心跳检测
        this.startHeartbeat()

        // 触发连接成功事件
        this.emit('connected', event)
    }

    /**
     * 消息接收处理
     */
    handleMessage(event) {
        try {
            const message = JSON.parse(event.data)
            console.log('📨 收到WebSocket消息:', message)

            // 处理心跳响应
            if (message.type === 'pong') {
                return
            }

            // 分发消息到对应的处理器
            const { type, data } = message
            if (this.messageHandlers.has(type)) {
                const handlers = this.messageHandlers.get(type)
                handlers.forEach(handler => {
                    try {
                        handler(data)
                    } catch (error) {
                        console.error(`❌ 消息处理器错误 (${type}):`, error)
                    }
                })
            }

            // 触发通用消息事件
            this.emit('message', message)

        } catch (error) {
            console.error('❌ WebSocket消息解析失败:', error)
        }
    }

    /**
     * 连接关闭处理
     */
    handleClose(event) {
        console.log('🔌 WebSocket连接已关闭:', event.code, event.reason)
        this.isConnected = false
        this.stopHeartbeat()

        // 触发连接关闭事件
        this.emit('disconnected', event)

        // 非正常关闭才进行重连
        if (event.code !== 1000) {
            this.scheduleReconnect()
        }
    }

    /**
     * 连接错误处理
     */
    handleError(event) {
        console.error('❌ WebSocket连接错误:', event)
        this.emit('error', event)
    }

    /**
     * 发送消息
     * @param {string} type - 消息类型
     * @param {*} data - 消息数据
     */
    send(type, data = null) {
        if (!this.isConnected || !this.ws) {
            console.warn('⚠️ WebSocket未连接，消息发送失败')
            return false
        }

        try {
            const message = JSON.stringify({ type, data, timestamp: Date.now() })
            this.ws.send(message)
            console.log('📤 发送WebSocket消息:', { type, data })
            return true
        } catch (error) {
            console.error('❌ WebSocket消息发送失败:', error)
            return false
        }
    }

    /**
     * 注册消息处理器
     * @param {string} type - 消息类型
     * @param {Function} handler - 处理函数
     */
    on(type, handler) {
        if (!this.messageHandlers.has(type)) {
            this.messageHandlers.set(type, [])
        }
        this.messageHandlers.get(type).push(handler)
    }

    /**
     * 移除消息处理器
     * @param {string} type - 消息类型
     * @param {Function} handler - 处理函数
     */
    off(type, handler) {
        if (this.messageHandlers.has(type)) {
            const handlers = this.messageHandlers.get(type)
            const index = handlers.indexOf(handler)
            if (index > -1) {
                handlers.splice(index, 1)
            }
        }
    }

    /**
     * 触发事件（内部使用）
     */
    emit(event, data) {
        // 可以在这里添加全局事件处理逻辑
        console.log(`🎯 WebSocket事件: ${event}`, data)
    }

    /**
     * 开始心跳检测
     */
    startHeartbeat() {
        this.stopHeartbeat()
        this.heartbeatTimer = setInterval(() => {
            this.send('ping')
        }, 30000) // 每30秒发送一次心跳
    }

    /**
     * 停止心跳检测
     */
    stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer)
            this.heartbeatTimer = null
        }
    }

    /**
     * 安排重连
     */
    scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('❌ WebSocket重连次数超限，停止重连')
            this.emit('reconnect_failed')
            return
        }

        this.reconnectAttempts++
        console.log(`🔄 将在${this.reconnectInterval/1000}秒后进行第${this.reconnectAttempts}次重连...`)

        this.reconnectTimer = setTimeout(() => {
            this.connect()
        }, this.reconnectInterval)
    }

    /**
     * 手动重连
     */
    reconnect() {
        this.reconnectAttempts = 0
        this.disconnect()
        this.connect()
    }

    /**
     * 断开连接
     */
    disconnect() {
        console.log('🔌 主动断开WebSocket连接')

        // 清理定时器
        this.stopHeartbeat()
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer)
            this.reconnectTimer = null
        }

        // 关闭连接
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.close(1000, 'Client disconnect')
        }

        this.ws = null
        this.isConnected = false
        this.reconnectAttempts = 0
    }

    /**
     * 获取连接状态
     */
    getStatus() {
        return {
            isConnected: this.isConnected,
            reconnectAttempts: this.reconnectAttempts,
            readyState: this.ws ? this.ws.readyState : WebSocket.CLOSED
        }
    }
}

// 创建全局WebSocket管理器实例
const wsManager = new WebSocketManager()

// 便捷的消息类型处理器
export const wsHandlers = {
    /**
     * 监听攻击日志
     * @param {Function} callback - 回调函数
     */
    onAttackLog: (callback) => {
        wsManager.on(WS_MESSAGE_TYPES.ATTACK_LOG, callback)
    },

    /**
     * 监听目标状态变化
     * @param {Function} callback - 回调函数
     */
    onTargetStatusChange: (callback) => {
        wsManager.on(WS_MESSAGE_TYPES.TARGET_STATUS, callback)
    },

    /**
     * 监听网络拓扑更新
     * @param {Function} callback - 回调函数
     */
    onNetworkUpdate: (callback) => {
        wsManager.on(WS_MESSAGE_TYPES.NETWORK_UPDATE, callback)
    },

    /**
     * 监听扫描结果
     * @param {Function} callback - 回调函数
     */
    onScanResult: (callback) => {
        wsManager.on(WS_MESSAGE_TYPES.SCAN_RESULT, callback)
    },

    /**
     * 监听流量更新
     * @param {Function} callback - 回调函数
     */
    onTrafficUpdate: (callback) => {
        wsManager.on(WS_MESSAGE_TYPES.TRAFFIC_UPDATE, callback)
    }
}

export default wsManager