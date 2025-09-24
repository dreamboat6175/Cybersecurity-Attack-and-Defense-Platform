// 应用常量定义

// API 端点
export const API_ENDPOINTS = {
    DASHBOARD: '/dashboard',
    TARGETS: '/targets',
    ATTACKS: '/attacks',
    NETWORK: '/network',
    VULNERABILITIES: '/vulnerabilities',
    SCAN: '/scan'
}

// WebSocket 消息类型
export const WS_MESSAGE_TYPES = {
    ATTACK_LOG: 'ATTACK_LOG',
    TARGET_STATUS: 'TARGET_STATUS',
    NETWORK_UPDATE: 'NETWORK_UPDATE',
    SCAN_RESULT: 'SCAN_RESULT',
    TRAFFIC_UPDATE: 'TRAFFIC_UPDATE'
}

// 目标状态
export const TARGET_STATUS = {
    NORMAL: 'normal',
    WARNING: 'warning',
    DANGER: 'danger',
    OFFLINE: 'offline'
}

// 攻击类型
export const ATTACK_TYPES = {
    SQL_INJECTION: 'sql_injection',
    XSS: 'xss',
    BRUTE_FORCE: 'brute_force',
    DOS: 'dos',
    MALWARE: 'malware',
    PHISHING: 'phishing',
    MITM: 'mitm',
    BUFFER_OVERFLOW: 'buffer_overflow'
}

// 攻击方法配置
export const ATTACK_METHODS = [
    {
        id: 'sql_injection',
        name: 'SQL注入',
        icon: '🛡️',
        description: '通过恶意SQL语句获取数据库信息',
        risk: 'high'
    },
    {
        id: 'xss',
        name: 'XSS攻击',
        icon: '⚡',
        description: '跨站脚本攻击，窃取用户信息',
        risk: 'medium'
    },
    {
        id: 'brute_force',
        name: '暴力破解',
        icon: '🔨',
        description: '通过大量尝试破解密码',
        risk: 'medium'
    },
    {
        id: 'dos',
        name: 'DoS攻击',
        icon: '💥',
        description: '拒绝服务攻击，使系统无法响应',
        risk: 'high'
    },
    {
        id: 'malware',
        name: '恶意软件',
        icon: '🦠',
        description: '植入恶意软件控制系统',
        risk: 'critical'
    },
    {
        id: 'phishing',
        name: '钓鱼攻击',
        icon: '🎣',
        description: '伪造网站骗取用户信息',
        risk: 'medium'
    }
]

// 风险等级配置
export const RISK_LEVELS = {
    low: { label: '低', color: '#00D4AA', priority: 1 },
    medium: { label: '中', color: '#FFC107', priority: 2 },
    high: { label: '高', color: '#FF9800', priority: 3 },
    critical: { label: '严重', color: '#F44336', priority: 4 }
}

// 网络节点类型
export const NODE_TYPES = {
    SERVER: 'server',
    CLIENT: 'client',
    ROUTER: 'router',
    FIREWALL: 'firewall',
    DATABASE: 'database'
}

// 图表主题配置
export const CHART_THEME = {
    backgroundColor: 'transparent',
    textStyle: {
        color: '#CCD6F6',
        fontSize: 12,
        fontFamily: 'Inter, sans-serif'
    },
    grid: {
        borderColor: '#233554'
    },
    categoryAxis: {
        axisLine: { lineStyle: { color: '#233554' } },
        splitLine: { lineStyle: { color: '#233554' } },
        axisLabel: { color: '#8892B0' }
    },
    valueAxis: {
        axisLine: { lineStyle: { color: '#233554' } },
        splitLine: { lineStyle: { color: '#233554' } },
        axisLabel: { color: '#8892B0' }
    }
}

// 默认配置
export const DEFAULT_CONFIG = {
    // WebSocket重连配置
    WS_RECONNECT_INTERVAL: 5000,
    WS_MAX_RECONNECT_ATTEMPTS: 5,

    // API请求配置
    API_TIMEOUT: 10000,
    API_RETRY_TIMES: 3,

    // 数据更新频率
    DATA_REFRESH_INTERVAL: 30000,

    // 日志显示数量
    MAX_LOG_ENTRIES: 100,

    // 图表更新频率
    CHART_UPDATE_INTERVAL: 2000
}