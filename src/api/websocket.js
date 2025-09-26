// src/api/websocket.js - 重构版本
// 统一的 WebSocket 管理器

import { WS_MESSAGE_TYPES } from '@/utils/constants'
import { sleep } from '@/utils/helpers'

/**
 * WebSocket 连接状态
 */
export const CONNECTION_STATE = {
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    DISCONNECTING: 'disconnecting',
    DISCONNECTED: 'disconnected',
    ERROR: 'error'
}

/**
 * WebSocket 管理器类
 */
export class WebSocketManager {
    constructor(options = {}) {
        // 配置选项
        this.config = {
            url: options.url || this.getWebSocketUrl(),
            protocols: options.protocols || [],
            reconnectInterval: options.reconnectInterval || 3000,
            maxReconnectAttempts: options.maxReconnectAttempts || 10,
            heartbeatInterval: options.heartbeatInterval || 30000,
            debug: options.debug || false,
            ...options
        }

        // 内部状态
        this.ws = null
        this.state = CONNECTION_STATE.DISCONNECTED
        this.reconnectAttempts = 0
        this.lastConnectTime = null

        // 定时器管理
        this.timers = new Map()

        // 消息处理器
        this.messageHandlers = new Map()
        this.globalHandlers = new Set()

        // 事件监听器
        this.eventListeners = new Map()

        // 消息队列（离线时使用）
        this.messageQueue = []
        this.maxQueueSize = options.maxQueueSize || 100

        // 绑定方法
        this.handleOpen = this.handleOpen.bind(this)
        this.handleMessage = this.handleMessage.bind(this)
        this.handleError = this.handleError.bind(this)
        this.handleClose = this.handleClose.bind(this)

        this.log('WebSocketManager initialized', this.config)
    }

    /**
     * 获取 WebSocket URL
     */
    getWebSocketUrl() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
        const host = window.location.host
        return `${protocol}//${host}/ws`
    }

    /**
     * 日志输出
     */
    log(message, ...args) {
        if (this.config.debug) {
            console.log(`[WebSocketManager] ${message}`, ...args)
        }
    }

    /**
     * 连接 WebSocket
     */
    async connect() {
        if (this.isConnecting() || this.isConnected()) {
            this.log('Connection already exists, skipping connect')
            return Promise.resolve()
        }

        return new Promise((resolve, reject) => {
            try {
                this.setState(CONNECTION_STATE.CONNECTING)
                this.log('Connecting to', this.config.url)

                // 创建 WebSocket 连接
                this.ws = new WebSocket(this.config.url, this.config.protocols)

                // 设置二进制数据类型
                this.ws.binaryType = 'arraybuffer'

                // 绑定事件处理器
                this.ws.addEventListener('open', (event) => {
                    this.handleOpen(event)
                    resolve()
                })

                this.ws.addEventListener('message', this.handleMessage)
                this.ws.addEventListener('error', (event) => {
                    this.handleError(event)
                    reject(event)
                })

                this.ws.addEventListener('close', this.handleClose)

                // 连接超时处理
                this.setTimer('connect_timeout', () => {
                    if (this.isConnecting()) {
                        this.log('Connection timeout')
                        this.disconnect()
                        reject(new Error('Connection timeout'))
                    }
                }, 10000)

            } catch (error) {
                this.log('Connection error:', error)
                this.setState(CONNECTION_STATE.ERROR)
                reject(error)
            }
        })
    }

    /**
     * 断开连接
     */
    disconnect(code = 1000, reason = 'Client disconnect') {
        this.log('Disconnecting...', { code, reason })

        // 清理所有定时器
        this.clearAllTimers()

        // 重置重连计数
        this.reconnectAttempts = 0

        // 设置状态为断开中
        this.setState(CONNECTION_STATE.DISCONNECTING)

        // 关闭连接
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.close(code, reason)
        } else {
            this.setState(CONNECTION_STATE.DISCONNECTED)
        }
    }

    /**
     * 重连
     */
    async reconnect() {
        if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
            this.log('Max reconnect attempts reached, giving up')
            this.emit('reconnect_failed', { attempts: this.reconnectAttempts })
            return
        }

        this.reconnectAttempts++
        const delay = this.calculateBackoffDelay()

        this.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`)
        this.emit('reconnecting', { attempt: this.reconnectAttempts, delay })

        await sleep(delay)

        try {
            await this.connect()
            this.log('Reconnected successfully')
            this.reconnectAttempts = 0
            this.emit('reconnected', { attempts: this.reconnectAttempts })
        } catch (error) {
            this.log('Reconnect failed:', error)
            this.scheduleReconnect()
        }
    }

    /**
     * 计算退避延迟时间
     */
    calculateBackoffDelay() {
        const baseDelay = this.config.reconnectInterval
        const maxDelay = 30000 // 最大30秒
        const exponentialDelay = baseDelay * Math.pow(2, this.reconnectAttempts - 1)
        return Math.min(exponentialDelay, maxDelay)
    }

    /**
     * 安排重连
     */
    scheduleReconnect() {
        this.setTimer('reconnect', () => {
            this.reconnect()
        }, 100) // 立即安排重连
    }

    /**
     * 发送消息
     */
    send(type, data = null, options = {}) {
        const message = {
            type,
            data,
            timestamp: Date.now(),
            id: this.generateMessageId(),
            ...options
        }

        if (!this.isConnected()) {
            if (options.queue !== false) {
                this.queueMessage(message)
                this.log('Message queued (not connected):', message)
                return false
            } else {
                this.log('Message dropped (not connected and queue disabled):', message)
                return false
            }
        }

        try {
            const messageString = JSON.stringify(message)
            this.ws.send(messageString)
            this.log('Message sent:', message)
            this.emit('message_sent', message)
            return true
        } catch (error) {
            this.log('Failed to send message:', error, message)
            this.emit('send_error', { error, message })
            return false
        }
    }

    /**
     * 生成消息ID
     */
    generateMessageId() {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    /**
     * 消息队列管理
     */
    queueMessage(message) {
        if (this.messageQueue.length >= this.maxQueueSize) {
            this.messageQueue.shift() // 移除最老的消息
        }
        this.messageQueue.push(message)
    }

    /**
     * 处理消息队列
     */
    processMessageQueue() {
        if (this.messageQueue.length === 0) return

        this.log(`Processing ${this.messageQueue.length} queued messages`)

        const messages = [...this.messageQueue]
        this.messageQueue = []

        messages.forEach(message => {
            this.send(message.type, message.data, { ...message, queue: false })
        })
    }

    /**
     * 注册消息处理器
     */
    on(type, handler) {
        if (typeof handler !== 'function') {
            throw new Error('Handler must be a function')
        }

        if (!this.messageHandlers.has(type)) {
            this.messageHandlers.set(type, new Set())
        }

        this.messageHandlers.get(type).add(handler)
        this.log(`Registered handler for message type: ${type}`)

        // 返回取消订阅函数
        return () => this.off(type, handler)
    }

    /**
     * 移除消息处理器
     */
    off(type, handler) {
        if (this.messageHandlers.has(type)) {
            const handlers = this.messageHandlers.get(type)
            handlers.delete(handler)

            if (handlers.size === 0) {
                this.messageHandlers.delete(type)
            }

            this.log(`Unregistered handler for message type: ${type}`)
        }
    }

    /**
     * 注册全局消息处理器
     */
    onMessage(handler) {
        if (typeof handler !== 'function') {
            throw new Error('Handler must be a function')
        }

        this.globalHandlers.add(handler)
        this.log('Registered global message handler')

        return () => this.offMessage(handler)
    }

    /**
     * 移除全局消息处理器
     */
    offMessage(handler) {
        this.globalHandlers.delete(handler)
        this.log('Unregistered global message handler')
    }

    /**
     * 注册事件监听器
     */
    addEventListener(event, handler) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, new Set())
        }

        this.eventListeners.get(event).add(handler)
        return () => this.removeEventListener(event, handler)
    }

    /**
     * 移除事件监听器
     */
    removeEventListener(event, handler) {
        if (this.eventListeners.has(event)) {
            const listeners = this.eventListeners.get(event)
            listeners.delete(handler)

            if (listeners.size === 0) {
                this.eventListeners.delete(event)
            }
        }
    }

    /**
     * 触发事件
     */
    emit(event, data = null) {
        this.log(`Event: ${event}`, data)

        if (this.eventListeners.has(event)) {
            const listeners = this.eventListeners.get(event)
            listeners.forEach(listener => {
                try {
                    listener(data)
                } catch (error) {
                    this.log(`Error in event listener for ${event}:`, error)
                }
            })
        }
    }

    /**
     * 定时器管理
     */
    setTimer(name, callback, delay) {
        this.clearTimer(name)
        this.timers.set(name, setTimeout(() => {
            this.timers.delete(name)
            callback()
        }, delay))
    }

    clearTimer(name) {
        if (this.timers.has(name)) {
            clearTimeout(this.timers.get(name))
            this.timers.delete(name)
        }
    }

    clearAllTimers() {
        this.timers.forEach((timerId, name) => {
            clearTimeout(timerId)
        })
        this.timers.clear()
        this.log('All timers cleared')
    }

    /**
     * 状态管理
     */
    setState(newState) {
        const oldState = this.state
        this.state = newState

        if (oldState !== newState) {
            this.log(`State changed: ${oldState} -> ${newState}`)
            this.emit('state_change', { oldState, newState })
        }
    }

    /**
     * 状态检查方法
     */
    isConnecting() {
        return this.state === CONNECTION_STATE.CONNECTING
    }

    isConnected() {
        return this.state === CONNECTION_STATE.CONNECTED
    }

    isDisconnected() {
        return this.state === CONNECTION_STATE.DISCONNECTED
    }

    /**
     * 心跳管理
     */
    startHeartbeat() {
        this.stopHeartbeat()

        if (this.config.heartbeatInterval > 0) {
            this.setTimer('heartbeat', () => {
                if (this.isConnected()) {
                    this.send('ping', { timestamp: Date.now() })
                    this.startHeartbeat() // 重新设置定时器
                }
            }, this.config.heartbeatInterval)

            this.log('Heartbeat started')
        }
    }

    stopHeartbeat() {
        this.clearTimer('heartbeat')
        this.log('Heartbeat stopped')
    }

    /**
     * 事件处理器
     */
    handleOpen(event) {
        this.log('Connection opened')
        this.lastConnectTime = Date.now()
        this.setState(CONNECTION_STATE.CONNECTED)

        // 清除连接超时定时器
        this.clearTimer('connect_timeout')

        // 重置重连计数
        this.reconnectAttempts = 0

        // 开始心跳
        this.startHeartbeat()

        // 处理消息队列
        this.processMessageQueue()

        // 触发连接事件
        this.emit('connected', event)
    }

    handleMessage(event) {
        try {
            const message = JSON.parse(event.data)
            this.log('Message received:', message)

            // 处理特殊消息类型
            if (message.type === 'pong') {
                this.handlePong(message)
                return
            }

            // 调用全局处理器
            this.globalHandlers.forEach(handler => {
                try {
                    handler(message, event)
                } catch (error) {
                    this.log('Error in global message handler:', error)
                }
            })

            // 调用特定类型处理器
            if (this.messageHandlers.has(message.type)) {
                const handlers = this.messageHandlers.get(message.type)
                handlers.forEach(handler => {
                    try {
                        handler(message.data, message)
                    } catch (error) {
                        this.log(`Error in message handler for ${message.type}:`, error)
                    }
                })
            } else {
                this.log(`No handler registered for message type: ${message.type}`)
            }

            this.emit('message', message)

        } catch (error) {
            this.log('Failed to parse message:', error, event.data)
            this.emit('parse_error', { error, data: event.data })
        }
    }

    handleError(event) {
        this.log('Connection error:', event)
        this.setState(CONNECTION_STATE.ERROR)
        this.emit('error', event)

        // 如果是连接中出错，尝试重连
        if (this.reconnectAttempts < this.config.maxReconnectAttempts) {
            this.scheduleReconnect()
        }
    }

    handleClose(event) {
        this.log('Connection closed:', { code: event.code, reason: event.reason })

        // 停止心跳
        this.stopHeartbeat()

        // 清理连接
        this.ws = null

        // 设置状态
        if (this.state !== CONNECTION_STATE.DISCONNECTING) {
            this.setState(CONNECTION_STATE.DISCONNECTED)

            // 非主动断开，尝试重连
            if (event.code !== 1000 && this.reconnectAttempts < this.config.maxReconnectAttempts) {
                this.scheduleReconnect()
            }
        } else {
            this.setState(CONNECTION_STATE.DISCONNECTED)
        }

        this.emit('disconnected', event)
    }

    handlePong(message) {
        const now = Date.now()
        const latency = now - message.data.timestamp
        this.log(`Pong received, latency: ${latency}ms`)
        this.emit('pong', { latency, timestamp: now })
    }

    /**
     * 获取连接状态信息
     */
    getStatus() {
        return {
            state: this.state,
            isConnected: this.isConnected(),
            reconnectAttempts: this.reconnectAttempts,
            lastConnectTime: this.lastConnectTime,
            messageQueueSize: this.messageQueue.length,
            readyState: this.ws ? this.ws.readyState : null,
            url: this.config.url
        }
    }

    /**
     * 销毁管理器
     */
    destroy() {
        this.log('Destroying WebSocketManager')

        // 断开连接
        this.disconnect()

        // 清理所有处理器和监听器
        this.messageHandlers.clear()
        this.globalHandlers.clear()
        this.eventListeners.clear()

        // 清理消息队列
        this.messageQueue = []

        // 清理所有定时器
        this.clearAllTimers()

        this.emit('destroyed')
    }
}

// 创建默认实例
const defaultManager = new WebSocketManager({
    debug: import.meta.env.DEV
})

// 便捷的消息处理器工厂
export const createHandlers = (manager = defaultManager) => ({
    /**
     * 监听攻击日志
     */
    onAttackLog: (callback) => manager.on(WS_MESSAGE_TYPES.ATTACK_LOG, callback),

    /**
     * 监听目标状态变化
     */
    onTargetStatus: (callback) => manager.on(WS_MESSAGE_TYPES.TARGET_STATUS, callback),

    /**
     * 监听扫描结果
     */
    onScanResult: (callback) => manager.on(WS_MESSAGE_TYPES.SCAN_RESULT, callback),

    /**
     * 监听网络更新
     */
    onNetworkUpdate: (callback) => manager.on(WS_MESSAGE_TYPES.NETWORK_UPDATE, callback),

    /**
     * 监听流量更新
     */
    onTrafficUpdate: (callback) => manager.on(WS_MESSAGE_TYPES.TRAFFIC_UPDATE, callback),

    /**
     * 监听系统警报
     */
    onSystemAlert: (callback) => manager.on(WS_MESSAGE_TYPES.SYSTEM_ALERT, callback)
})

// 导出默认实例和处理器工厂
export const wsHandlers = createHandlers()
export default defaultManager