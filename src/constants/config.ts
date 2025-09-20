import type { TopologyConfig, SystemLayoutConfig, SubsystemLayoutConfig } from '../types/topology'

// API配置
export const API_CONFIG = {
    baseURL: process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3000/api',
    timeout: 10000,

    endpoints: {
        // 设备相关
        devices: '/devices',
        deviceStatus: '/devices/status',
        deviceDetails: (id: string) => `/devices/${id}`,

        // 拓扑相关
        topology: '/topology',
        systemTopology: '/topology/system',
        subsystemTopology: (type: string, id: string) => `/topology/subsystem/${type}/${id}`,

        // 监控相关
        alerts: '/monitoring/alerts',
        metrics: '/monitoring/metrics',

        // 认证相关
        login: '/auth/login',
        userInfo: '/auth/me'
    }
} as const

// WebSocket配置
export const WEBSOCKET_CONFIG = {
    url: process.env.NODE_ENV === 'production' ? 'wss://localhost/ws' : 'ws://localhost:3001/ws',
    reconnectInterval: 3000,
    maxReconnectAttempts: 5,
    heartbeatInterval: 30000,

    channels: {
        deviceStatus: 'device_status',
        linkStatus: 'link_status',
        alerts: 'alerts',
        topology: 'topology_updates'
    }
} as const

// 拓扑图默认配置
export const DEFAULT_TOPOLOGY_CONFIG: TopologyConfig = {
    // 画布尺寸
    canvasWidth: 1200,
    canvasHeight: 800,

    // 节点配置
    nodeDefaultSize: {
        width: 80,
        height: 60
    },
    nodeSpacing: {
        horizontal: 150,
        vertical: 120
    },

    // 链路配置
    linkWidth: 2,
    linkAnimationSpeed: 1000, // ms

    // 交互配置
    enableZoom: true,
    enablePan: true,
    enableSelection: true,

    // 动画配置
    animationDuration: 500,
    enableGlowEffect: true,
    enableFlowAnimation: true
} as const

// 系统层布局配置
export const SYSTEM_LAYOUT_CONFIG: SystemLayoutConfig = {
    layers: {
        // DSU层 - 顶层
        dsu: {
            y: 100,
            spacing: 200
        },

        // 核心层 - ZC, ATS
        core: {
            y: 280,
            spacing: 250
        },

        // 接口层 - CI
        interface: {
            y: 460,
            spacing: 180
        },

        // 车载层 - VOBC
        vehicle: {
            y: 640,
            spacing: 120
        }
    }
} as const

// 子系统布局配置
export const SUBSYSTEM_LAYOUT_CONFIG: SubsystemLayoutConfig = {
    // ZC子系统配置
    zc: {
        centerPosition: { x: 600, y: 400 },
        nodeSpacing: 150,
        networkOffset: 30  // A/B网络线路的垂直偏移
    },

    // ATS子系统配置
    ats: {
        centerPosition: { x: 600, y: 400 },
        nodeSpacing: 120,
        moduleLayout: 'hierarchical'
    }
} as const

// 设备类型显示配置
export const DEVICE_DISPLAY_CONFIG = {
    DSU: {
        icon: 'server',
        label: '数据存储单元',
        description: 'Data Storage Unit'
    },
    ZC: {
        icon: 'control',
        label: '区域控制器',
        description: 'Zone Controller'
    },
    ATS: {
        icon: 'monitor',
        label: '自动列车监督',
        description: 'Automatic Train Supervision'
    },
    CI: {
        icon: 'interface',
        label: '计算机联锁',
        description: 'Computer Interlocking'
    },
    VOBC: {
        icon: 'train',
        label: '车载控制器',
        description: 'Vehicle On-Board Controller'
    },
    PU: {
        icon: 'processor',
        label: '处理单元',
        description: 'Processing Unit'
    },
    CC: {
        icon: 'communication',
        label: '通信控制器',
        description: 'Communication Controller'
    },
    FTSM: {
        icon: 'safety',
        label: '故障安全模块',
        description: 'Fail-Safe Module'
    },
    GATEWAY: {
        icon: 'gateway',
        label: '网关',
        description: 'Gateway'
    },
    TIMETABLE: {
        icon: 'schedule',
        label: '时刻表',
        description: 'Timetable'
    },
    DISPATCH: {
        icon: 'dispatch',
        label: '调度',
        description: 'Dispatch'
    },
    APP: {
        icon: 'application',
        label: '应用计算机',
        description: 'Application Computer'
    },
    DB: {
        icon: 'database',
        label: '数据库',
        description: 'Database'
    }
} as const

// 动画配置
export const ANIMATION_CONFIG = {
    // 节点动画
    node: {
        hover: {
            scale: 1.1,
            duration: 200
        },
        select: {
            scale: 1.15,
            duration: 300
        },
        pulse: {
            scale: [1, 1.05, 1],
            duration: 2000,
            repeat: -1
        }
    },

    // 链路动画
    link: {
        flow: {
            duration: 2000,
            repeat: -1
        },
        highlight: {
            strokeWidth: [2, 4, 2],
            duration: 1000
        }
    },

    // 视图切换动画
    transition: {
        drillDown: {
            duration: 800,
            ease: 'power2.inOut'
        },
        drillUp: {
            duration: 600,
            ease: 'power2.out'
        }
    }
} as const

// 数据更新频率配置
export const UPDATE_INTERVALS = {
    deviceStatus: 2000,    // 设备状态更新间隔 (ms)
    linkStatus: 1500,      // 链路状态更新间隔 (ms)
    metrics: 5000,         // 系统指标更新间隔 (ms)
    topology: 10000        // 拓扑结构更新间隔 (ms)
} as const

// 告警配置
export const ALERT_CONFIG = {
    maxDisplayCount: 50,   // 最大显示告警数量
    autoAcknowledgeTime: 300000, // 自动确认时间 (5分钟)

    severityLevels: {
        low: { priority: 1, color: '#3498DB' },
        medium: { priority: 2, color: '#F39C12' },
        high: { priority: 3, color: '#E67E22' },
        critical: { priority: 4, color: '#E74C3C' }
    }
} as const

// 性能配置
export const PERFORMANCE_CONFIG = {
    // 虚拟化阈值
    virtualizationThreshold: {
        nodes: 100,    // 节点数量超过此值时启用虚拟化
        links: 200     // 链路数量超过此值时启用虚拟化
    },

    // 渲染优化
    rendering: {
        enableGPUAcceleration: true,
        useWebGL: false,  // 复杂场景时可启用
        enableLOD: true   // 距离层次细节
    },

    // 交互防抖
    debounce: {
        hover: 100,
        resize: 300,
        search: 500
    }
} as const

// 导出所有配置的类型
export type ApiConfig = typeof API_CONFIG
export type WebSocketConfig = typeof WEBSOCKET_CONFIG
export type DeviceDisplayConfig = typeof DEVICE_DISPLAY_CONFIG