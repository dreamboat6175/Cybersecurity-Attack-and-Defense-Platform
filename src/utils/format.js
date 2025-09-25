// src/utils/format.js
/**
 * 格式化时间
 * @param {string|Date} date - 时间
 * @param {string} format - 格式类型
 * @returns {string} 格式化后的时间
 */
export function formatTime(date, format = 'full') {
    if (!date) return '-'

    const d = new Date(date)
    if (isNaN(d.getTime())) return '-'

    const now = new Date()
    const diff = now.getTime() - d.getTime()

    switch (format) {
        case 'timestamp':
            return d.toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            })

        case 'short':
            return d.toLocaleDateString('zh-CN', {
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            })

        case 'date':
            return d.toLocaleDateString('zh-CN')

        case 'full':
        default:
            return d.toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            })
    }
}

/**
 * 格式化相对时间
 * @param {string|Date} date - 时间
 * @returns {string} 相对时间
 */
export function formatRelativeTime(date) {
    if (!date) return '-'

    const d = new Date(date)
    if (isNaN(d.getTime())) return '-'

    const now = new Date()
    const diff = now.getTime() - d.getTime()

    const minute = 60 * 1000
    const hour = minute * 60
    const day = hour * 24
    const week = day * 7
    const month = day * 30

    if (diff < minute) {
        return '刚刚'
    } else if (diff < hour) {
        return Math.floor(diff / minute) + '分钟前'
    } else if (diff < day) {
        return Math.floor(diff / hour) + '小时前'
    } else if (diff < week) {
        return Math.floor(diff / day) + '天前'
    } else if (diff < month) {
        return Math.floor(diff / week) + '周前'
    } else {
        return Math.floor(diff / month) + '月前'
    }
}

/**
 * 格式化流量数据
 * @param {number} bytes - 字节数
 * @param {number} decimals - 小数位数
 * @returns {string} 格式化后的流量
 */
export function formatTraffic(bytes, decimals = 2) {
    if (!bytes || bytes === 0) return '0 B'

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))
    const size = parseFloat((bytes / Math.pow(k, i)).toFixed(dm))

    return size + ' ' + sizes[i]
}

/**
 * 格式化数字
 * @param {number} num - 数字
 * @param {Object} options - 格式选项
 * @returns {string} 格式化后的数字
 */
export function formatNumber(num, options = {}) {
    const {
        minimumFractionDigits = 0,
        maximumFractionDigits = 2,
        useGrouping = true,
        locale = 'zh-CN'
    } = options

    if (typeof num !== 'number' || isNaN(num)) return '0'

    return num.toLocaleString(locale, {
        minimumFractionDigits,
        maximumFractionDigits,
        useGrouping
    })
}

/**
 * 格式化百分比
 * @param {number} value - 数值
 * @param {number} total - 总数
 * @param {number} decimals - 小数位数
 * @returns {string} 百分比字符串
 */
export function formatPercentage(value, total, decimals = 1) {
    if (!total || total === 0) return '0%'

    const percentage = (value / total) * 100
    return percentage.toFixed(decimals) + '%'
}

/**
 * 格式化货币
 * @param {number} amount - 金额
 * @param {string} currency - 货币符号
 * @param {string} locale - 本地化
 * @returns {string} 格式化后的货币
 */
export function formatCurrency(amount, currency = 'CNY', locale = 'zh-CN') {
    if (typeof amount !== 'number' || isNaN(amount)) return '¥0.00'

    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2
    }).format(amount)
}

/**
 * 格式化JSON
 * @param {*} data - 数据
 * @param {number} space - 缩进空格数
 * @returns {string} 格式化后的JSON字符串
 */
export function formatJSON(data, space = 2) {
    try {
        return JSON.stringify(data, null, space)
    } catch (error) {
        return String(data)
    }
}

/**
 * 格式化文本省略
 * @param {string} text - 文本
 * @param {number} length - 最大长度
 * @param {string} suffix - 省略号
 * @returns {string} 省略后的文本
 */
export function formatEllipsis(text, length = 50, suffix = '...') {
    if (!text || text.length <= length) return text
    return text.substring(0, length) + suffix
}

/**
 * 格式化电话号码
 * @param {string} phone - 电话号码
 * @returns {string} 格式化后的电话号码
 */
export function formatPhone(phone) {
    if (!phone) return ''

    const cleaned = phone.replace(/\D/g, '')

    if (cleaned.length === 11) {
        return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')
    }

    return phone
}

/**
 * 格式化身份证号
 * @param {string} idCard - 身份证号
 * @returns {string} 格式化后的身份证号
 */
export function formatIdCard(idCard) {
    if (!idCard || idCard.length !== 18) return idCard

    return idCard.replace(/(\d{6})(\d{8})(\d{4})/, '$1-$2-$3')
}

/**
 * 格式化银行卡号
 * @param {string} cardNumber - 银行卡号
 * @returns {string} 格式化后的银行卡号
 */
export function formatBankCard(cardNumber) {
    if (!cardNumber) return ''

    return cardNumber.replace(/\s/g, '').replace(/(\d{4})(?=\d)/g, '$1 ')
}

/**
 * 格式化IP地址
 * @param {string} ip - IP地址
 * @returns {string} 格式化后的IP地址
 */
export function formatIP(ip) {
    if (!ip) return ''

    // IPv4格式验证和格式化
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/
    const match = ip.match(ipv4Regex)

    if (match) {
        const parts = match.slice(1, 5).map(part => {
            const num = parseInt(part, 10)
            return num >= 0 && num <= 255 ? num.toString() : part
        })
        return parts.join('.')
    }

    return ip
}

/**
 * 格式化MAC地址
 * @param {string} mac - MAC地址
 * @returns {string} 格式化后的MAC地址
 */
export function formatMAC(mac) {
    if (!mac) return ''

    const cleaned = mac.replace(/[^a-fA-F0-9]/g, '')
    if (cleaned.length === 12) {
        return cleaned.match(/.{2}/g).join(':').toUpperCase()
    }

    return mac
}

/**
 * 格式化版本号
 * @param {string} version - 版本号
 * @returns {string} 格式化后的版本号
 */
export function formatVersion(version) {
    if (!version) return '0.0.0'

    const parts = version.split('.')
    while (parts.length < 3) {
        parts.push('0')
    }

    return parts.slice(0, 3).join('.')
}

/**
 * 高亮搜索关键词
 * @param {string} text - 原文本
 * @param {string} keyword - 搜索关键词
 * @param {string} className - 高亮CSS类名
 * @returns {string} 高亮后的HTML
 */
export function highlightKeyword(text, keyword, className = 'highlight') {
    if (!text || !keyword) return text

    const regex = new RegExp(`(${keyword})`, 'gi')
    return text.replace(regex, `<span class="${className}">$1</span>`)
}

/**
 * 转换驼峰命名
 * @param {string} str - 字符串
 * @returns {string} 驼峰命名字符串
 */
export function toCamelCase(str) {
    if (!str) return ''

    return str.replace(/[-_\s]+(.)?/g, (_, char) => char ? char.toUpperCase() : '')
}

/**
 * 转换短横线命名
 * @param {string} str - 字符串
 * @returns {string} 短横线命名字符串
 */
export function toKebabCase(str) {
    if (!str) return ''

    return str
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/[\s_]+/g, '-')
        .toLowerCase()
}

/**
 * 转换下划线命名
 * @param {string} str - 字符串
 * @returns {string} 下划线命名字符串
 */
export function toSnakeCase(str) {
    if (!str) return ''

    return str
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .replace(/[\s-]+/g, '_')
        .toLowerCase()
}