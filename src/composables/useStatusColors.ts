// src/composables/useStatusColors.ts
import { computed } from 'vue'
import type { DeviceStatus, LinkStatus, NetworkType } from '../types/devices'

// 状态颜色常量
export const STATUS_COLORS = {
    normal: '#2ECC71',    // 科技绿
    warning: '#F39C12',   // 警示黄
    critical: '#E74C3C',  // 关键红
    offline: '#95A5A6',   // 中性灰
    active: '#2ECC71',    // 活跃状态
    down: '#E74C3C',      // 中断状态
    unknown: '#6C757D'    // 未知状态
} as const

// 网络颜色常量 (ZC子系统专用)
export const NETWORK_COLORS = {
    A: '#64FFDA',  // 数字薄荷绿 (A网)
    B: '#FF2DF7'   // 电光洋红 (B网)
} as const

// 状态边框颜色
export const STATUS_STROKE_COLORS = {
    normal: '#27AE60',
    warning: '#E67E22',
    critical: '#C0392B',
    offline: '#7F8C8D',
    active: '#27AE60',
    down: '#C0392B',
    unknown: '#5D6D7E'
} as const

// src/composables/useStatusColors.ts
import { computed } from 'vue'
import type { DeviceStatus, LinkStatus, NetworkType } from '../types/devices'

// 状态颜色常量
export const STATUS_COLORS = {
    normal: '#2ECC71',    // 科技绿
    warning: '#F39C12',   // 警示黄
    critical: '#E74C3C',  // 关键红
    offline: '#95A5A6',   // 中性灰
    active: '#2ECC71',    // 活跃状态
    down: '#E74C3C',      // 中断状态
    unknown: '#6C757D'    // 未知状态
} as const

// 网络颜色常量 (ZC子系统专用)
export const NETWORK_COLORS = {
    A: '#64FFDA',  // 数字薄荷绿 (A网)
    B: '#FF2DF7'   // 电光洋红 (B网)
} as const

// 状态边框颜色
export const STATUS_STROKE_COLORS = {
    normal: '#27AE60',
    warning: '#E67E22',
    critical: '#C0392B',
    offline: '#7F8C8D',
    active: '#27AE60',
    down: '#C0392B',
    unknown: '#5D6D7E'
} as const

// 状态背景颜色 (带透明度)
export const STATUS_BACKGROUND_COLORS = {
    normal: 'rgba(46, 204, 113, 0.1)',
    warning: 'rgba(243, 156, 18, 0.1)',
    critical: 'rgba(231, 76, 60, 0.1)',
    offline: 'rgba(149, 165, 166, 0.1)',
    active: 'rgba(46, 204, 113, 0.1)',
    down: 'rgba(231, 76, 60, 0.1)',
    unknown: 'rgba(108, 117, 125, 0.1)'
} as const

// 状态渐变色
export const STATUS_GRADIENTS = {
    normal: 'linear-gradient(135deg, #2ECC71 0%, #27AE60 100%)',
    warning: 'linear-gradient(135deg, #F39C12 0%, #E67E22 100%)',
    critical: 'linear-gradient(135deg, #E74C3C 0%, #C0392B 100%)',
    offline: 'linear-gradient(135deg, #95A5A6 0%, #7F8C8D 100%)',
    active: 'linear-gradient(135deg, #2ECC71 0%, #27AE60 100%)',
    down: 'linear-gradient(135deg, #E74C3C 0%, #C0392B 100%)',
    unknown: 'linear-gradient(135deg, #6C757D 0%, #5D6D7E 100%)'
} as const

/**
 * 状态颜色管理 Composable
 */
export function useStatusColors() {
    /**
     * 获取状态主色
     */
    function getStatusColor(status: DeviceStatus | LinkStatus): string {
        return STATUS_COLORS[status] || STATUS_COLORS.unknown
    }

    /**
     * 获取状态边框色
     */
    function getStatusStrokeColor(status: DeviceStatus | LinkStatus): string {
        return STATUS_STROKE_COLORS[status] || STATUS_STROKE_COLORS.unknown
    }

    /**
     * 获取状态背景色
     */
    function getStatusBackgroundColor(status: DeviceStatus | LinkStatus): string {
        return STATUS_BACKGROUND_COLORS[status] || STATUS_BACKGROUND_COLORS.unknown
    }

    /**
     * 获取状态渐变
     */
    function getStatusGradient(status: DeviceStatus | LinkStatus): string {
        return STATUS_GRADIENTS[status] || STATUS_GRADIENTS.unknown
    }

    /**
     * 获取网络颜色
     */
    function getNetworkColor(network: NetworkType): string {
        return NETWORK_COLORS[network] || '#64FFDA'
    }

    /**
     * 获取网络颜色 (带透明度)
     */
    function getNetworkColorWithOpacity(network: NetworkType, opacity: number = 0.8): string {
        const color = getNetworkColor(network)
        // 将十六进制转换为 rgba
        const r = parseInt(color.slice(1, 3), 16)
        const g = parseInt(color.slice(3, 5), 16)
        const b = parseInt(color.slice(5, 7), 16)
        return `rgba(${r}, ${g}, ${b}, ${opacity})`
    }

    /**
     * 获取状态优先级 (用于排序)
     */
    function getStatusPriority(status: DeviceStatus | LinkStatus): number {
        const priorities = {
            critical: 4,
            down: 4,
            warning: 3,
            unknown: 2,
            offline: 1,
            normal: 0,
            active: 0
        }
        return priorities[status] ?? 0
    }

    /**
     * 判断状态是否为健康状态
     */
    function isHealthyStatus(status: DeviceStatus | LinkStatus): boolean {
        return status === 'normal' || status === 'active'
    }

    /**
     * 判断状态是否为故障状态
     */
    function isFaultStatus(status: DeviceStatus | LinkStatus): boolean {
        return status === 'critical' || status === 'down'
    }

    /**
     * 判断状态是否为告警状态
     */
    function isWarningStatus(status: DeviceStatus | LinkStatus): boolean {
        return status === 'warning'
    }

    /**
     * 获取状态文本描述
     */
    function getStatusText(status: DeviceStatus | LinkStatus): string {
        const statusTexts = {
            normal: '正常',
            warning: '告警',
            critical: '故障',
            offline: '离线',
            active: '活跃',
            down: '中断',
            unknown: '未知'
        }
        return statusTexts[status] || '未知'
    }

    /**
     * 获取状态CSS类名
     */
    function getStatusClass(status: DeviceStatus | LinkStatus): string {
        return `status-${status}`
    }

    /**
     * 根据多个状态计算综合状态
     */
    function aggregateStatus(statuses: (DeviceStatus | LinkStatus)[]): DeviceStatus | LinkStatus {
        if (statuses.length === 0) return 'unknown'

        // 按优先级排序，返回最高优先级的状态
        const sortedStatuses = statuses.sort((a, b) =>
            getStatusPriority(b) - getStatusPriority(a)
        )

        return sortedStatuses[0]
    }

    /**
     * 计算健康度评分 (0-100)
     */
    function calculateHealthScore(statuses: (DeviceStatus | LinkStatus)[]): number {
        if (statuses.length === 0) return 100

        const total = statuses.length
        const weights = {
            normal: 100,
            active: 100,
            warning: 70,
            unknown: 50,
            offline: 30,
            critical: 0,
            down: 0
        }

        const totalScore = statuses.reduce((sum, status) => {
            return sum + (weights[status] ?? 0)
        }, 0)

        return Math.round(totalScore / total)
    }

    /**
     * 获取状态对应的图标
     */
    function getStatusIcon(status: DeviceStatus | LinkStatus): string {
        const icons = {
            normal: '✅',
            active: '✅',
            warning: '⚠️',
            critical: '🚨',
            down: '🚨',
            offline: '📴',
            unknown: '❓'
        }
        return icons[status] || '❓'
    }

    /**
     * 获取网络状态指示器颜色
     */
    function getNetworkStatusColor(network: NetworkType, status: LinkStatus): string {
        const baseColor = getNetworkColor(network)

        if (status === 'down' || status === 'unknown') {
            return STATUS_COLORS.critical
        }
        if (status === 'warning') {
            return STATUS_COLORS.warning
        }

        return baseColor
    }

    /**
     * 创建状态颜色的CSS变量对象
     */
    const statusColorVars = computed(() => ({
        '--color-status-normal': STATUS_COLORS.normal,
        '--color-status-warning': STATUS_COLORS.warning,
        '--color-status-critical': STATUS_COLORS.critical,
        '--color-status-offline': STATUS_COLORS.offline,
        '--color-network-a': NETWORK_COLORS.A,
        '--color-network-b': NETWORK_COLORS.B
    }))

    return {
        // 常量
        STATUS_COLORS,
        NETWORK_COLORS,
        STATUS_STROKE_COLORS,
        STATUS_BACKGROUND_COLORS,
        STATUS_GRADIENTS,

        // 基本颜色获取函数
        getStatusColor,
        getStatusStrokeColor,
        getStatusBackgroundColor,
        getStatusGradient,
        getNetworkColor,
        getNetworkColorWithOpacity,
        getNetworkStatusColor,

        // 状态判断函数
        getStatusPriority,
        isHealthyStatus,
        isFaultStatus,
        isWarningStatus,
        getStatusText,
        getStatusClass,
        getStatusIcon,

        // 状态计算函数
        aggregateStatus,
        calculateHealthScore,

        // 响应式变量
        statusColorVars
    }
}