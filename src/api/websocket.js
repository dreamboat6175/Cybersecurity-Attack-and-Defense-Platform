// src/api/websocket.js - 修复版本
class WebSocketManager {
    constructor() {
        this.ws = null
        this.url = import.meta.env.VITE_WS_URL || 'ws://localhost:3000/ws'
        this.reconnectInterval = 3000
        this.maxReconnectAttempts = 10
        this.reconnectAttempts = 0
        this.isConnecting = false
        this.isAuthenticated = false

        this.eventListeners = new Map()
        this.messageQueue = []

        console.log('[WebSocketManager] WebSocketManager initialized', {
            url: this.url,
            maxReconnectAttempts: this.maxReconnectAttempts
        })
    }

    connect() {
        if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
            return Promise.resolve()
        }

        return new Promise((resolve, reject) => {
            try {
                this.isConnecting = true
                console.log('[WebSocketManager] Connecting to', this.url)

                this.ws = new WebSocket(this.url)

                this.ws.onopen = () => {
                    console.log('[WebSocketManager] Connected successfully')
                    this.isConnecting = false
                    this.reconnectAttempts = 0
                    this.startHeartbeat()
                    this.processMessageQueue()
                    this.emit('connected')
                    resolve()
                }

                this.ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data)
                        this.emit('message', data)
                    } catch (err) {
                        console.warn('[WebSocketManager] Failed to parse message:', event.data)
                    }
                }

                this.ws.onerror = (error) => {
                    console.warn('[WebSocketManager] Connection error:', error)
                    this.isConnecting = false
                    this.emit('error', error)

                    // 如果是开发环境且后端未启动，不进行重连
                    if (import.meta.env.DEV) {
                        console.log('[WebSocketManager] 开发环境检测到连接失败，跳过重连')
                        reject(error)
                        return
                    }

                    reject(error)
                }

                this.ws.onclose = (event) => {
                    console.log('[WebSocketManager] Connection closed:', event.code, event.reason)
                    this.isConnecting = false
                    this.stopHeartbeat()
                    this.emit('disconnected', event)

                    // 如果不是正常关闭，尝试重连
                    if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
                        this.scheduleReconnect()
                    }
                }

            } catch (error) {
                this.isConnecting = false
                console.error('[WebSocketManager] Failed to create WebSocket:', error)
                reject(error)
            }
        })
    }

    disconnect() {
        console.log('[WebSocketManager] Disconnecting...')
        this.reconnectAttempts = this.maxReconnectAttempts // 防止重连
        this.stopHeartbeat()

        if (this.ws) {
            this.ws.close(1000, 'User initiated disconnect')
            this.ws = null
        }
    }

    send(data) {
        if (this.isConnected) {
            try {
                this.ws.send(JSON.stringify(data))
                return true
            } catch (error) {
                console.error('[WebSocketManager] Failed to send message:', error)
                return false
            }
        } else {
            // 如果未连接，将消息加入队列
            this.messageQueue.push(data)
            console.log('[WebSocketManager] Message queued (not connected)')
            return false
        }
    }

    scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('[WebSocketManager] Max reconnection attempts reached')
            return
        }

        this.reconnectAttempts++
        const delay = this.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1)

        console.log(`[WebSocketManager] Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`)

        setTimeout(() => {
            if (this.reconnectAttempts <= this.maxReconnectAttempts) {
                console.log(`[WebSocketManager] Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`)
                this.connect().catch(() => {
                    // 重连失败会自动触发下一次重连
                })
            }
        }, delay)
    }

    processMessageQueue() {
        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift()
            this.send(message)
        }
    }

    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            if (this.isConnected) {
                this.send({ type: 'ping' })
            }
        }, 30000) // 30秒心跳
    }

    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval)
            this.heartbeatInterval = null
        }
    }

    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, new Set())
        }
        this.eventListeners.get(event).add(callback)
    }

    off(event, callback) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).delete(callback)
        }
    }

    emit(event, data) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => {
                try {
                    callback(data)
                } catch (error) {
                    console.error(`[WebSocketManager] Error in ${event} callback:`, error)
                }
            })
        }
    }

    get isConnected() {
        return this.ws && this.ws.readyState === WebSocket.OPEN
    }

    get readyState() {
        return this.ws ? this.ws.readyState : WebSocket.CLOSED
    }
}

// 导出单例实例
const wsManager = new WebSocketManager()
export default wsManager