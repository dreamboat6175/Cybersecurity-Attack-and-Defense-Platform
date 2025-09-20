// 主题颜色常量 - 符合网络安全攻防指挥中心风格
export const THEME_COLORS = {
    // 主背景色 - 深邃科技蓝
    background: {
        primary: '#0A192F',
        secondary: '#112240',
        tertiary: '#1D2951'
    },

    // 文字颜色
    text: {
        primary: '#8892B0',      // 基础文字
        secondary: '#A8B2D1',    // 次要文字
        highlight: '#CCD6F6',    // 高亮文字
        muted: '#495670'         // 弱化文字
    },

    // 边框和分割线
    border: {
        primary: '#374151',
        secondary: '#4B5563',
        active: '#64FFDA'
    },

    // 阴影和辉光
    glow: {
        normal: '#2ECC71',
        warning: '#F39C12',
        critical: '#E74C3C',
        highlight: '#64FFDA'
    }
} as const

// 设备状态颜色 - 全局通用状态色板
export const STATUS_COLORS = {
    normal: '#2ECC71',    // 科技绿 - 正常运行
    warning: '#F39C12',   // 警示黄 - 告警状态
    critical: '#E74C3C',  // 关键红 - 严重故障
    offline: '#95A5A6'    // 中性灰 - 离线/未知
} as const

// ZC子系统网络颜色 - 高级方案专用
export const NETWORK_COLORS = {
    a_network: '#64FFDA',  // 数字薄荷绿 - A网(原绿网)
    b_network: '#FF2DF7'   // 电光洋红 - B网(原紫网)
} as const

// 链路状态颜色映射
export const LINK_STATUS_COLORS = {
    active: STATUS_COLORS.normal,
    warning: STATUS_COLORS.warning,
    down: STATUS_COLORS.critical,
    unknown: STATUS_COLORS.offline
} as const

// 设备类型专用颜色 (可选，用于图标着色)
export const DEVICE_TYPE_COLORS = {
    DSU: '#3498DB',      // 蓝色
    ZC: '#9B59B6',       // 紫色
    ATS: '#E67E22',      // 橙色
    CI: '#1ABC9C',       // 青色
    VOBC: '#F1C40F',     // 黄色
    PU: '#E74C3C',       // 红色
    CC: '#2ECC71',       // 绿色
    FTSM: '#95A5A6',     // 灰色
    GATEWAY: '#34495E',  // 深灰
    TIMETABLE: '#16A085',// 深青
    DISPATCH: '#D35400', // 深橙
    APP: '#8E44AD',      // 深紫
    DB: '#27AE60'        // 深绿
} as const

// 动画和效果颜色
export const ANIMATION_COLORS = {
    // 数据流动画
    flow: {
        normal: '#64FFDA',
        warning: '#F39C12',
        error: '#E74C3C'
    },

    // 呼吸动画 (用于故障节点)
    pulse: {
        from: '#E74C3C',
        to: '#C0392B'
    },

    // 选中状态
    selection: {
        node: '#64FFDA',
        link: '#3498DB'
    },

    // 悬浮状态
    hover: {
        node: '#A8B2D1',
        link: '#5DADE2'
    }
} as const

// 渐变色定义
export const GRADIENTS = {
    // 背景渐变
    background: {
        primary: 'linear-gradient(135deg, #0A192F 0%, #112240 100%)',
        secondary: 'linear-gradient(180deg, #112240 0%, #1D2951 100%)'
    },

    // 节点渐变
    node: {
        normal: 'radial-gradient(circle, #2ECC71 0%, #27AE60 100%)',
        warning: 'radial-gradient(circle, #F39C12 0%, #E67E22 100%)',
        critical: 'radial-gradient(circle, #E74C3C 0%, #C0392B 100%)',
        offline: 'radial-gradient(circle, #95A5A6 0%, #7F8C8D 100%)'
    },

    // 辉光效果
    glow: {
        normal: `0 0 20px ${STATUS_COLORS.normal}`,
        warning: `0 0 20px ${STATUS_COLORS.warning}`,
        critical: `0 0 20px ${STATUS_COLORS.critical}`,
        highlight: `0 0 30px ${NETWORK_COLORS.a_network}`
    }
} as const

// 透明度常量
export const OPACITY = {
    disabled: 0.3,
    inactive: 0.5,
    hover: 0.8,
    active: 1.0,
    overlay: 0.9
} as const

// 辅助函数：获取设备状态对应的颜色
export const getStatusColor = (status: string): string => {
    return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.offline
}

// 辅助函数：获取网络类型对应的颜色
export const getNetworkColor = (network: 'A' | 'B'): string => {
    return network === 'A' ? NETWORK_COLORS.a_network : NETWORK_COLORS.b_network
}

// 辅助函数：获取设备类型对应的颜色
export const getDeviceTypeColor = (deviceType: string): string => {
    return DEVICE_TYPE_COLORS[deviceType as keyof typeof DEVICE_TYPE_COLORS] || THEME_COLORS.text.primary
}

// 辅助函数：带透明度的颜色
export const withOpacity = (color: string, opacity: number): string => {
    // 如果是hex颜色，转换为rgba
    if (color.startsWith('#')) {
        const r = parseInt(color.slice(1, 3), 16)
        const g = parseInt(color.slice(3, 5), 16)
        const b = parseInt(color.slice(5, 7), 16)
        return `rgba(${r}, ${g}, ${b}, ${opacity})`
    }

    // 如果已经是rgba或rgb，直接替换透明度
    if (color.includes('rgba')) {
        return color.replace(/,\s*[\d.]+\)/, `, ${opacity})`)
    }

    if (color.includes('rgb')) {
        return color.replace('rgb', 'rgba').replace(')', `, ${opacity})`)
    }

    return color
}