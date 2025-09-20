import { computed } from 'vue'
import {
    STATUS_COLORS,
    NETWORK_COLORS,
    DEVICE_TYPE_COLORS,
    ANIMATION_COLORS,
    GRADIENTS,
    getStatusColor,
    getNetworkColor,
    getDeviceTypeColor,
    withOpacity
} from '../constants/colors'
import type { DeviceStatus, LinkStatus, DeviceType, NetworkType } from '../types/devices'

export function useStatusColors() {

    // ===== 节点颜色计算 =====

    // 获取节点颜色 (基于状态)
    function getNodeColor(status: DeviceStatus): string {
        return getStatusColor(status)
    }

    // 获取节点边框颜色
    function getNodeBorderColor(status: DeviceStatus, isSelected: boolean = false, isHovered: boolean = false): string {
        if (isSelected) {
            return ANIMATION_COLORS.selection.node
        }
        if (isHovered) {
            return ANIMATION_COLORS.hover.node
        }
        return getStatusColor(status)
    }

    // 获取节点辉光效果
    function getNodeGlow(status: DeviceStatus, intensity: number = 1): string {
        const baseColor = getStatusColor(status)
        const glowSize = 20 * intensity
        return `0 0 ${glowSize}px ${withOpacity(baseColor, 0.6)}`
    }

    // 获取节点渐变背景
    function getNodeGradient(status: DeviceStatus): string {
        return GRADIENTS.node[status] || GRADIENTS.node.offline
    }

    // 计算节点显示颜色 (综合考虑状态、选中、悬浮等)
    function computeNodeDisplayColor(
        status: DeviceStatus,
        isSelected: boolean = false,
        isHovered: boolean = false,
        opacity: number = 1
    ): {
        fill: string
        stroke: string
        shadow: string
        gradient: string
    } {
        const baseColor = getStatusColor(status)
        const strokeColor = getNodeBorderColor(status, isSelected, isHovered)
        const shadowColor = getNodeGlow(status, isHovered ? 1.5 : 1)
        const gradientColor = getNodeGradient(status)

        return {
            fill: withOpacity(baseColor, opacity),
            stroke: strokeColor,
            shadow: shadowColor,
            gradient: gradientColor
        }
    }

    // ===== 链路颜色计算 =====

    // 获取链路颜色 (基于状态)
    function getLinkColor(status: LinkStatus): string {
        const colorMap = {
            active: STATUS_COLORS.normal,
            warning: STATUS_COLORS.warning,
            down: STATUS_COLORS.critical,
            unknown: STATUS_COLORS.offline
        }
        return colorMap[status] || STATUS_COLORS.offline
    }

    // 获取网络链路颜色 (ZC子系统专用)
    function getNetworkLinkColor(network: NetworkType, status: LinkStatus): string {
        // 如果链路故障，使用故障颜色
        if (status === 'down') {
            return STATUS_COLORS.critical
        }
        if (status === 'warning') {
            return STATUS_COLORS.warning
        }

        // 否则使用网络颜色
        return getNetworkColor(network)
    }

    // 获取链路动画颜色
    function getLinkAnimationColor(status: LinkStatus): string {
        return ANIMATION_COLORS.flow[status === 'down' ? 'error' : 'normal']
    }

    // 计算链路显示颜色
    function computeLinkDisplayColor(
        status: LinkStatus,
        network?: NetworkType,
        isSelected: boolean = false,
        isHovered: boolean = false,
        opacity: number = 1
    ): {
        stroke: string
        animation: string
        width: number
    } {
        let strokeColor: string

        if (network) {
            strokeColor = getNetworkLinkColor(network, status)
        } else {
            strokeColor = getLinkColor(status)
        }

        if (isSelected) {
            strokeColor = ANIMATION_COLORS.selection.link
        } else if (isHovered) {
            strokeColor = ANIMATION_COLORS.hover.link
        }

        const animationColor = getLinkAnimationColor(status)
        const width = isSelected ? 4 : isHovered ? 3 : 2

        return {
            stroke: withOpacity(strokeColor, opacity),
            animation: animationColor,
            width
        }
    }

    // ===== 设备类型颜色 =====

    // 获取设备图标颜色
    function getDeviceIconColor(deviceType: DeviceType, status: DeviceStatus): string {
        // 如果设备故障，使用状态颜色
        if (status === 'critical' || status === 'warning') {
            return getStatusColor(status)
        }

        // 否则使用设备类型颜色
        return getDeviceTypeColor(deviceType)
    }

    // ===== 状态指示器颜色 =====

    // 获取状态点颜色
    function getStatusDotColor(status: DeviceStatus): string {
        return getStatusColor(status)
    }

    // 获取状态文本颜色
    function getStatusTextColor(status: DeviceStatus): string {
        return getStatusColor(status)
    }

    // 获取状态背景颜色
    function getStatusBackgroundColor(status: DeviceStatus, opacity: number = 0.1): string {
        return withOpacity(getStatusColor(status), opacity)
    }

    // ===== 动画和过渡颜色 =====

    // 获取呼吸动画颜色 (用于故障节点)
    function getPulseColors(status: DeviceStatus): { from: string, to: string } {
        const baseColor = getStatusColor(status)
        return {
            from: baseColor,
            to: withOpacity(baseColor, 0.3)
        }
    }

    // 获取数据流动画颜色
    function getFlowAnimationColor(status: LinkStatus = 'active'): string {
        return ANIMATION_COLORS.flow[status === 'down' ? 'error' : 'normal']
    }

    // ===== 主题相关颜色 =====

    // 获取对比色 (用于文本)
    function getContrastColor(backgroundColor: string): string {
        // 简单的对比度计算，实际项目中可能需要更复杂的算法
        const darkColors = [STATUS_COLORS.critical, STATUS_COLORS.offline]

        if (darkColors.includes(backgroundColor)) {
            return '#FFFFFF'
        }
        return '#000000'
    }

    // 获取悬浮状态颜色
    function getHoverColor(baseColor: string): string {
        return withOpacity(baseColor, 0.8)
    }

    // 获取选中状态颜色
    function getSelectedColor(baseColor: string): string {
        return ANIMATION_COLORS.selection.node
    }

    // ===== 颜色工具函数 =====

    // 颜色插值 (用于动画)
    function interpolateColor(color1: string, color2: string, factor: number): string {
        // 简化的颜色插值，实际项目中建议使用专业的颜色库
        const hex1 = color1.replace('#', '')
        const hex2 = color2.replace('#', '')

        const r1 = parseInt(hex1.substr(0, 2), 16)
        const g1 = parseInt(hex1.substr(2, 2), 16)
        const b1 = parseInt(hex1.substr(4, 2), 16)

        const r2 = parseInt(hex2.substr(0, 2), 16)
        const g2 = parseInt(hex2.substr(2, 2), 16)
        const b2 = parseInt(hex2.substr(4, 2), 16)

        const r = Math.round(r1 + (r2 - r1) * factor)
        const g = Math.round(g1 + (g2 - g1) * factor)
        const b = Math.round(b1 + (b2 - b1) * factor)

        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
    }

    // 生成颜色变体 (更亮或更暗)
    function generateColorVariant(color: string, factor: number): string {
        // factor > 1 变亮，factor < 1 变暗
        const hex = color.replace('#', '')
        const r = Math.min(255, Math.round(parseInt(hex.substr(0, 2), 16) * factor))
        const g = Math.min(255, Math.round(parseInt(hex.substr(2, 2), 16) * factor))
        const b = Math.min(255, Math.round(parseInt(hex.substr(4, 2), 16) * factor))

        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
    }

    // ===== 批量颜色处理 =====

    // 批量计算节点颜色
    function computeNodesColors(nodes: Array<{
        id: string
        status: DeviceStatus
        deviceType: DeviceType
        isSelected?: boolean
        isHovered?: boolean
    }>) {
        return nodes.map(node => ({
            id: node.id,
            colors: computeNodeDisplayColor(
                node.status,
                node.isSelected,
                node.isHovered
            ),
            iconColor: getDeviceIconColor(node.deviceType, node.status)
        }))
    }

    // 批量计算链路颜色
    function computeLinksColors(links: Array<{
        id: string
        status: LinkStatus
        network?: NetworkType
        isSelected?: boolean
        isHovered?: boolean
    }>) {
        return links.map(link => ({
            id: link.id,
            colors: computeLinkDisplayColor(
                link.status,
                link.network,
                link.isSelected,
                link.isHovered
            )
        }))
    }

    // ===== CSS变量生成 =====

    // 生成CSS自定义属性
    function generateCSSVariables(): Record<string, string> {
        return {
            '--status-normal': STATUS_COLORS.normal,
            '--status-warning': STATUS_COLORS.warning,
            '--status-critical': STATUS_COLORS.critical,
            '--status-offline': STATUS_COLORS.offline,
            '--network-a': NETWORK_COLORS.a_network,
            '--network-b': NETWORK_COLORS.b_network,
            '--animation-selection': ANIMATION_COLORS.selection.node,
            '--animation-hover': ANIMATION_COLORS.hover.node,
            '--flow-normal': ANIMATION_COLORS.flow.normal,
            '--flow-error': ANIMATION_COLORS.flow.error
        }
    }

    // ===== 计算属性 =====

    // 所有状态颜色的计算属性
    const statusColors = computed(() => STATUS_COLORS)
    const networkColors = computed(() => NETWORK_COLORS)
    const deviceTypeColors = computed(() => DEVICE_TYPE_COLORS)
    const animationColors = computed(() => ANIMATION_COLORS)

    // CSS变量的计算属性
    const cssVariables = computed(() => generateCSSVariables())

    // ===== 返回接口 =====

    return {
        // 基础颜色常量
        statusColors,
        networkColors,
        deviceTypeColors,
        animationColors,

        // 节点颜色方法
        getNodeColor,
        getNodeBorderColor,
        getNodeGlow,
        getNodeGradient,
        computeNodeDisplayColor,

        // 链路颜色方法
        getLinkColor,
        getNetworkLinkColor,
        getLinkAnimationColor,
        computeLinkDisplayColor,

        // 设备类型颜色
        getDeviceIconColor,

        // 状态指示器颜色
        getStatusDotColor,
        getStatusTextColor,
        getStatusBackgroundColor,

        // 动画颜色
        getPulseColors,
        getFlowAnimationColor,

        // 主题颜色
        getContrastColor,
        getHoverColor,
        getSelectedColor,

        // 颜色工具
        interpolateColor,
        generateColorVariant,
        withOpacity,

        // 批量处理
        computeNodesColors,
        computeLinksColors,

        // CSS相关
        cssVariables,
        generateCSSVariables
    }
}