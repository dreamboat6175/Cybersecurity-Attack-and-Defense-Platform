// 系统常量定义文件
// 网络安全攻防平台 - 常量配置

// API 相关常量
export const API_CONFIG = {
    BASE_URL: '/api',
    TIMEOUT: 10000,
    RETRY_COUNT: 3,
    RETRY_DELAY: 1000
}

// WebSocket 相关常量
export const WS_CONFIG = {
    URL: '/ws',
    RECONNECT_INTERVAL: 3000,
    MAX_RECONNECT_ATTEMPTS: 5,
    HEARTBEAT_INTERVAL: 30000
}

// 目标状态常量
export const TARGET_STATUS = {
    NORMAL: 'normal',
    WARNING: 'warning',
    DANGER: 'danger',
    OFFLINE: 'offline',
    SCANNING: 'scanning'
}

// 目标状态显示文本
export const TARGET_STATUS_TEXT = {
    [TARGET_STATUS.NORMAL]: '正常',
    [TARGET_STATUS.WARNING]: '警告',
    [TARGET_STATUS.DANGER]: '危险',
    [TARGET_STATUS.OFFLINE]: '离线',
    [TARGET_STATUS.SCANNING]: '扫描中'
}

// 目标状态颜色映射
export const TARGET_STATUS_COLORS = {
    [TARGET_STATUS.NORMAL]: '#00D4AA',
    [TARGET_STATUS.WARNING]: '#FFC107',
    [TARGET_STATUS.DANGER]: '#F44336',
    [TARGET_STATUS.OFFLINE]: '#8892B0',
    [TARGET_STATUS.SCANNING]: '#64FFDA'
}

// 攻击类型常量
export const ATTACK_TYPES = {
    SQL_INJECTION: 'sql_injection',
    XSS: 'xss',
    BRUTE_FORCE: 'brute_force',
    DOS: 'dos',
    COMMAND_INJECTION: 'command_injection',
    CSRF: 'csrf',
    XXE: 'xxe',
    SSRF: 'ssrf'
}

// 攻击类型显示文本
export const ATTACK_TYPE_NAMES = {
    [ATTACK_TYPES.SQL_INJECTION]: 'SQL注入',
    [ATTACK_TYPES.XSS]: 'XSS攻击',
    [ATTACK_TYPES.BRUTE_FORCE]: '暴力破解',
    [ATTACK_TYPES.DOS]: 'DOS攻击',
    [ATTACK_TYPES.COMMAND_INJECTION]: '命令注入',
    [ATTACK_TYPES.CSRF]: 'CSRF攻击',
    [ATTACK_TYPES.XXE]: 'XXE攻击',
    [ATTACK_TYPES.SSRF]: 'SSRF攻击'
}

// 攻击方法列表（匹配效果图）
export const ATTACK_METHODS = [
    'VULNERABILITY SCAN',
    'BRUTE FORCE',
    'SQL INJECTION',
    'COMMAND INJECTION',
    'DENIAL OF SERVICE',
    'MAN-IN-THE-MIDDLE'
]

// 漏洞严重程度
export const VULNERABILITY_SEVERITY = {
    CRITICAL: 'critical',
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low'
}

// 漏洞严重程度显示文本
export const SEVERITY_LABELS = {
    [VULNERABILITY_SEVERITY.CRITICAL]: '严重',
    [VULNERABILITY_SEVERITY.HIGH]: '高危',
    [VULNERABILITY_SEVERITY.MEDIUM]: '中危',
    [VULNERABILITY_SEVERITY.LOW]: '低危'
}

// 漏洞严重程度颜色
export const SEVERITY_COLORS = {
    [VULNERABILITY_SEVERITY.CRITICAL]: '#F44336',
    [VULNERABILITY_SEVERITY.HIGH]: '#FF9800',
    [VULNERABILITY_SEVERITY.MEDIUM]: '#FFC107',
    [VULNERABILITY_SEVERITY.LOW]: '#2196F3'
}

// 网络节点类型
export const NODE_TYPES = {
    SERVER: 'server',
    CLIENT: 'client',
    ROUTER: 'router',
    FIREWALL: 'firewall',
    SWITCH: 'switch',
    DATABASE: 'database',
    DEVICE: 'device'
}

// 网络节点类型显示文本
export const NODE_TYPE_NAMES = {
    [NODE_TYPES.SERVER]: '服务器',
    [NODE_TYPES.CLIENT]: '客户端',
    [NODE_TYPES.ROUTER]: '路由器',
    [NODE_TYPES.FIREWALL]: '防火墙',
    [NODE_TYPES.SWITCH]: '交换机',
    [NODE_TYPES.DATABASE]: '数据库',
    [NODE_TYPES.DEVICE]: '设备'
}

// WebSocket消息类型
export const WS_MESSAGE_TYPES = {
    ATTACK_LOG: 'ATTACK_LOG',
    TARGET_STATUS: 'TARGET_STATUS',
    SCAN_RESULT: 'SCAN_RESULT',
    NETWORK_UPDATE: 'NETWORK_UPDATE',
    TRAFFIC_UPDATE: 'TRAFFIC_UPDATE',
    HEARTBEAT: 'HEARTBEAT',
    SYSTEM_ALERT: 'SYSTEM_ALERT'
}

// 数据刷新间隔（毫秒）
export const REFRESH_INTERVALS = {
    REALTIME: 1000,      // 实时数据（1秒）
    FAST: 5000,          // 快速更新（5秒）
    NORMAL: 30000,       // 正常更新（30秒）
    SLOW: 60000,         // 慢速更新（1分钟）
    DASHBOARD: 10000     // 仪表盘更新（10秒）
}

// 时间范围选项
export const TIME_RANGES = {
    '1h': { label: '1小时', value: '1h', minutes: 60 },
    '6h': { label: '6小时', value: '6h', minutes: 360 },
    '24h': { label: '24小时', value: '24h', minutes: 1440 },
    '7d': { label: '7天', value: '7d', minutes: 10080 },
    '30d': { label: '30天', value: '30d', minutes: 43200 }
}

// 默认时间范围
export const DEFAULT_TIME_RANGE = '6h'

// 图表配置
export const CHART_CONFIG = {
    COLORS: {
        PRIMARY: '#64FFDA',
        SECONDARY: '#4ECDC4',
        SUCCESS: '#00D4AA',
        WARNING: '#FFC107',
        DANGER: '#F44336',
        INFO: '#2196F3'
    },
    GRADIENTS: {
        AREA: 'rgba(100, 255, 218, 0.2)',
        AREA_START: 'rgba(100, 255, 218, 0.3)',
        AREA_END: 'rgba(100, 255, 218, 0.05)'
    }
}

// 分页配置
export const PAGINATION = {
    DEFAULT_PAGE_SIZE: 20,
    PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
    MAX_PAGE_SIZE: 1000
}

// 本地存储键名
export const STORAGE_KEYS = {
    AUTH_TOKEN: 'auth_token',
    USER_INFO: 'user_info',
    DASHBOARD_SETTINGS: 'dashboard_settings',
    THEME: 'theme',
    LANGUAGE: 'language'
}

// 文件上传配置
export const UPLOAD_CONFIG = {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
        'text/csv',
        'application/json'
    ]
}

// 验证规则
export const VALIDATION_RULES = {
    IP_REGEX: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    URL_REGEX: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
    PORT_REGEX: /^([1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$/,
    MAC_REGEX: /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/
}

// 系统限制
export const SYSTEM_LIMITS = {
    MAX_TARGETS: 1000,
    MAX_LOGS_DISPLAY: 100,
    MAX_CHART_POINTS: 500,
    MAX_WEBSOCKET_RETRIES: 10
}

// 错误代码
export const ERROR_CODES = {
    NETWORK_ERROR: 'NETWORK_ERROR',
    AUTH_FAILED: 'AUTH_FAILED',
    PERMISSION_DENIED: 'PERMISSION_DENIED',
    RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    SERVER_ERROR: 'SERVER_ERROR',
    TIMEOUT_ERROR: 'TIMEOUT_ERROR'
}

// 错误消息
export const ERROR_MESSAGES = {
    [ERROR_CODES.NETWORK_ERROR]: '网络连接失败',
    [ERROR_CODES.AUTH_FAILED]: '认证失败，请重新登录',
    [ERROR_CODES.PERMISSION_DENIED]: '权限不足',
    [ERROR_CODES.RESOURCE_NOT_FOUND]: '资源不存在',
    [ERROR_CODES.VALIDATION_ERROR]: '数据验证失败',
    [ERROR_CODES.SERVER_ERROR]: '服务器内部错误',
    [ERROR_CODES.TIMEOUT_ERROR]: '请求超时'
}

// 默认配置
export const DEFAULT_CONFIG = {
    DASHBOARD_REFRESH_INTERVAL: REFRESH_INTERVALS.DASHBOARD,
    WS_RECONNECT_INTERVAL: WS_CONFIG.RECONNECT_INTERVAL,
    WS_MAX_RECONNECT_ATTEMPTS: WS_CONFIG.MAX_RECONNECT_ATTEMPTS,
    API_TIMEOUT: API_CONFIG.TIMEOUT,
    TIME_RANGE: DEFAULT_TIME_RANGE,
    PAGE_SIZE: PAGINATION.DEFAULT_PAGE_SIZE
}

// 导出所有常量作为默认导出
export default {
    API_CONFIG,
    WS_CONFIG,
    TARGET_STATUS,
    TARGET_STATUS_TEXT,
    TARGET_STATUS_COLORS,
    ATTACK_TYPES,
    ATTACK_TYPE_NAMES,
    ATTACK_METHODS,
    VULNERABILITY_SEVERITY,
    SEVERITY_LABELS,
    SEVERITY_COLORS,
    NODE_TYPES,
    NODE_TYPE_NAMES,
    WS_MESSAGE_TYPES,
    REFRESH_INTERVALS,
    TIME_RANGES,
    DEFAULT_TIME_RANGE,
    CHART_CONFIG,
    PAGINATION,
    STORAGE_KEYS,
    UPLOAD_CONFIG,
    VALIDATION_RULES,
    SYSTEM_LIMITS,
    ERROR_CODES,
    ERROR_MESSAGES,
    DEFAULT_CONFIG
}