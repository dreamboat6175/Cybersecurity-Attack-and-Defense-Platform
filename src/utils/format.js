// 格式化工具函数
// 网络安全攻防平台 - 数据格式化工具

/**
 * 格式化时间显示
 * @param {string|Date|number} timestamp - 时间戳
 * @param {string} format - 格式类型: 'full', 'short', 'relative', 'time'
 * @returns {string} 格式化后的时间字符串
 */
export function formatTime(timestamp, format = 'full') {
    if (!timestamp) return '--'

    const date = new Date(timestamp)
    const now = new Date()

    // 检查日期是否有效
    if (isNaN(date.getTime())) return '--'

    switch (format) {
        case 'time':
            // 仅显示时间，格式: HH:mm:ss (匹配效果图)
            return date.toLocaleTimeString('en-GB', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            })

        case 'short':
            // 短格式: MM/DD HH:mm
            return date.toLocaleString('en-US', {
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            })

        case 'relative':
            // 相对时间: 3分钟前, 1小时前等
            const diff = now - date
            const seconds = Math.floor(diff / 1000)
            const minutes = Math.floor(seconds / 60)
            const hours = Math.floor(minutes / 60)
            const days = Math.floor(hours / 24)

            if (seconds < 60) return '刚刚'
            if (minutes < 60) return `${minutes}分钟前`
            if (hours < 24) return `${hours}小时前`
            if (days < 7) return `${days}天前`

            return date.toLocaleDateString('zh-CN')

        case 'full':
        default:
            // 完整格式: YYYY-MM-DD HH:mm:ss
            return date.toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            })
    }
}

/**
 * 格式化数字显示（流量、数量等）
 * @param {number} num - 要格式化的数字
 * @param {number} decimals - 小数位数
 * @returns {string} 格式化后的数字字符串
 */
export function formatNumber(num, decimals = 1) {
    if (typeof num !== 'number' || isNaN(num)) return '0'

    const absNum = Math.abs(num)

    if (absNum >= 1000000000) {
        return (num / 1000000000).toFixed(decimals) + 'B'
    }
    if (absNum >= 1000000) {
        return (num / 1000000).toFixed(decimals) + 'M'
    }
    if (absNum >= 1000) {
        return (num / 1000).toFixed(decimals) + 'K'
    }

    return num.toString()
}

/**
 * 格式化字节大小
 * @param {number} bytes - 字节数
 * @param {number} decimals - 小数位数
 * @returns {string} 格式化后的大小字符串
 */
export function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 B'
    if (typeof bytes !== 'number' || isNaN(bytes)) return '0 B'

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']

    const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k))
    const size = parseFloat((bytes / Math.pow(k, i)).toFixed(dm))

    return `${size} ${sizes[i] || 'B'}`
}

/**
 * 格式化百分比
 * @param {number} value - 数值 (0-100)
 * @param {number} decimals - 小数位数
 * @returns {string} 格式化后的百分比字符串
 */
export function formatPercent(value, decimals = 1) {
    if (typeof value !== 'number' || isNaN(value)) return '0%'
    return `${value.toFixed(decimals)}%`
}

/**
 * 格式化IP地址（添加零填充等）
 * @param {string} ip - IP地址
 * @returns {string} 格式化后的IP地址
 */
export function formatIP(ip) {
    if (!ip || typeof ip !== 'string') return '--'

    // 验证IP地址格式
    const ipRegex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/
    const match = ip.match(ipRegex)

    if (!match) return ip

    // 检查每个部分是否在有效范围内
    const parts = match.slice(1).map(Number)
    const isValid = parts.every(part => part >= 0 && part <= 255)

    return isValid ? ip : '--'
}

/**
 * 格式化端口号
 * @param {number|string} port - 端口号
 * @returns {string} 格式化后的端口号
 */
export function formatPort(port) {
    const portNum = parseInt(port, 10)
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
        return '--'
    }
    return portNum.toString()
}

/**
 * 格式化服务名称（端口:服务格式）
 * @param {string} service - 服务字符串，如 "HTTP:80"
 * @returns {string} 格式化后的服务名称
 */
export function formatService(service) {
    if (!service || typeof service !== 'string') return '--'

    const [name, port] = service.split(':')
    if (!name) return '--'

    if (port && formatPort(port) !== '--') {
        return `${name}:${formatPort(port)}`
    }

    return name
}

/**
 * 格式化持续时间
 * @param {number} milliseconds - 毫秒数
 * @returns {string} 格式化后的持续时间字符串
 */
export function formatDuration(milliseconds) {
    if (typeof milliseconds !== 'number' || milliseconds < 0) return '0秒'

    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}天${hours % 24}小时`
    if (hours > 0) return `${hours}小时${minutes % 60}分钟`
    if (minutes > 0) return `${minutes}分钟${seconds % 60}秒`
    return `${seconds}秒`
}

/**
 * 格式化MAC地址
 * @param {string} mac - MAC地址
 * @returns {string} 格式化后的MAC地址
 */
export function formatMAC(mac) {
    if (!mac || typeof mac !== 'string') return '--'

    // 移除所有非十六进制字符
    const cleanMac = mac.replace(/[^0-9A-Fa-f]/g, '')

    if (cleanMac.length !== 12) return mac // 如果长度不对，返回原值

    // 格式化为 XX:XX:XX:XX:XX:XX
    return cleanMac.match(/.{2}/g).join(':').toUpperCase()
}

/**
 * 格式化漏洞评分
 * @param {number} score - CVSS评分 (0-10)
 * @returns {string} 格式化后的评分字符串
 */
export function formatCVSSScore(score) {
    if (typeof score !== 'number' || isNaN(score)) return '--'

    const clampedScore = Math.max(0, Math.min(10, score))
    return clampedScore.toFixed(1)
}

/**
 * 格式化URL显示
 * @param {string} url - URL地址
 * @param {number} maxLength - 最大显示长度
 * @returns {string} 格式化后的URL
 */
export function formatURL(url, maxLength = 50) {
    if (!url || typeof url !== 'string') return '--'

    if (url.length <= maxLength) return url

    const start = url.substring(0, Math.floor(maxLength / 2) - 2)
    const end = url.substring(url.length - Math.floor(maxLength / 2) + 2)

    return `${start}...${end}`
}

/**
 * 格式化JSON数据为可读字符串
 * @param {any} data - 要格式化的数据
 * @param {number} indent - 缩进空格数
 * @returns {string} 格式化后的JSON字符串
 */
export function formatJSON(data, indent = 2) {
    try {
        return JSON.stringify(data, null, indent)
    } catch (error) {
        return String(data)
    }
}

/**
 * 格式化状态文本（添加颜色类名）
 * @param {string} status - 状态值
 * @param {Object} statusMap - 状态映射对象
 * @returns {Object} 包含文本和类名的对象
 */
export function formatStatus(status, statusMap = {}) {
    const text = statusMap[status] || status || '未知'
    const className = `status-${status}`.toLowerCase()

    return { text, className }
}

/**
 * 格式化数组为逗号分隔的字符串
 * @param {Array} array - 要格式化的数组
 * @param {string} separator - 分隔符
 * @param {number} maxItems - 最大显示项数
 * @returns {string} 格式化后的字符串
 */
export function formatArray(array, separator = ', ', maxItems = 5) {
    if (!Array.isArray(array) || array.length === 0) return '--'

    const items = array.slice(0, maxItems)
    const result = items.join(separator)

    if (array.length > maxItems) {
        return `${result} 等${array.length}项`
    }

    return result
}

/**
 * 格式化错误消息
 * @param {Error|string} error - 错误对象或消息
 * @returns {string} 格式化后的错误消息
 */
export function formatError(error) {
    if (!error) return '未知错误'

    if (typeof error === 'string') return error

    if (error.message) return error.message

    return '系统错误'
}

/**
 * 截断文本并添加省略号
 * @param {string} text - 要截断的文本
 * @param {number} maxLength - 最大长度
 * @returns {string} 截断后的文本
 */
export function truncateText(text, maxLength = 50) {
    if (!text || typeof text !== 'string') return ''

    if (text.length <= maxLength) return text

    return text.substring(0, maxLength - 3) + '...'
}

// 导出所有格式化函数
export default {
    formatTime,
    formatNumber,
    formatBytes,
    formatPercent,
    formatIP,
    formatPort,
    formatService,
    formatDuration,
    formatMAC,
    formatCVSSScore,
    formatURL,
    formatJSON,
    formatStatus,
    formatArray,
    formatError,
    truncateText
}