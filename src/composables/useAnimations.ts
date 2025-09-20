import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ANIMATION_CONFIG } from '../constants/config'
import type { Position } from '../types/topology'

// 动画状态接口
interface AnimationState {
    id: string
    element: string | HTMLElement
    startTime: number
    duration: number
    progress: number
    isComplete: boolean
    onComplete?: () => void
}

// 缓动函数类型
type EasingFunction = (t: number) => number

export function useAnimations() {

    // ===== 响应式状态 =====

    // 当前运行的动画列表
    const activeAnimations = ref<Map<string, AnimationState>>(new Map())

    // 动画帧计时器
    const animationFrameId = ref<number | null>(null)

    // 动画是否启用
    const animationsEnabled = ref(true)

    // 性能监控
    const performanceStats = ref({
        frameRate: 0,
        lastFrameTime: 0,
        animationCount: 0
    })

    // ===== 计算属性 =====

    // 是否有运行中的动画
    const hasActiveAnimations = computed(() => activeAnimations.value.size > 0)

    // 动画数量
    const animationCount = computed(() => activeAnimations.value.size)

    // ===== 缓动函数 =====

    const easingFunctions: Record<string, EasingFunction> = {
        linear: (t: number) => t,

        easeIn: (t: number) => t * t,
        easeOut: (t: number) => t * (2 - t),
        easeInOut: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,

        easeInCubic: (t: number) => t * t * t,
        easeOutCubic: (t: number) => (--t) * t * t + 1,
        easeInOutCubic: (t: number) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,

        easeInQuart: (t: number) => t * t * t * t,
        easeOutQuart: (t: number) => 1 - (--t) * t * t * t,
        easeInOutQuart: (t: number) => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,

        easeInBack: (t: number) => t * t * (2.7 * t - 1.7),
        easeOutBack: (t: number) => (--t) * t * (2.7 * t + 1.7) + 1,

        bounce: (t: number) => {
            if (t < 1 / 2.75) {
                return 7.5625 * t * t
            } else if (t < 2 / 2.75) {
                return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75
            } else if (t < 2.5 / 2.75) {
                return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375
            } else {
                return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375
            }
        }
    }

    // ===== 核心动画方法 =====

    // 创建动画
    function createAnimation(
        id: string,
        element: string | HTMLElement,
        duration: number,
        onUpdate: (progress: number, easedProgress: number) => void,
        options: {
            easing?: string
            delay?: number
            onComplete?: () => void
            onStart?: () => void
        } = {}
    ): string {
        const {
            easing = 'easeInOut',
            delay = 0,
            onComplete,
            onStart
        } = options

        // 如果动画被禁用，直接完成
        if (!animationsEnabled.value) {
            onUpdate(1, 1)
            onComplete?.()
            return id
        }

        // 延迟执行
        const startAnimation = () => {
            const animationState: AnimationState = {
                id,
                element,
                startTime: performance.now(),
                duration,
                progress: 0,
                isComplete: false,
                onComplete
            }

            activeAnimations.value.set(id, animationState)
            onStart?.()

            // 启动动画循环
            if (!animationFrameId.value) {
                startAnimationLoop()
            }
        }

        if (delay > 0) {
            setTimeout(startAnimation, delay)
        } else {
            startAnimation()
        }

        return id
    }

    // 停止动画
    function stopAnimation(id: string): void {
        const animation = activeAnimations.value.get(id)
        if (animation) {
            activeAnimations.value.delete(id)

            // 如果没有活动动画，停止动画循环
            if (activeAnimations.value.size === 0 && animationFrameId.value) {
                cancelAnimationFrame(animationFrameId.value)
                animationFrameId.value = null
            }
        }
    }

    // 停止所有动画
    function stopAllAnimations(): void {
        activeAnimations.value.clear()

        if (animationFrameId.value) {
            cancelAnimationFrame(animationFrameId.value)
            animationFrameId.value = null
        }
    }

    // 动画循环
    function startAnimationLoop(): void {
        const animate = (currentTime: number) => {
            // 更新性能统计
            updatePerformanceStats(currentTime)

            const completedAnimations: string[] = []

            // 更新所有活动动画
            activeAnimations.value.forEach((animation, id) => {
                const elapsed = currentTime - animation.startTime
                const progress = Math.min(elapsed / animation.duration, 1)

                animation.progress = progress

                if (progress >= 1) {
                    animation.isComplete = true
                    completedAnimations.push(id)
                }
            })

            // 清理完成的动画
            completedAnimations.forEach(id => {
                const animation = activeAnimations.value.get(id)
                if (animation) {
                    animation.onComplete?.()
                    activeAnimations.value.delete(id)
                }
            })

            // 继续动画循环
            if (activeAnimations.value.size > 0) {
                animationFrameId.value = requestAnimationFrame(animate)
            } else {
                animationFrameId.value = null
            }
        }

        animationFrameId.value = requestAnimationFrame(animate)
    }

    // 更新性能统计
    function updatePerformanceStats(currentTime: number): void {
        const timeSinceLastFrame = currentTime - performanceStats.value.lastFrameTime

        if (timeSinceLastFrame > 0) {
            performanceStats.value.frameRate = Math.round(1000 / timeSinceLastFrame)
            performanceStats.value.lastFrameTime = currentTime
            performanceStats.value.animationCount = activeAnimations.value.size
        }
    }

    // ===== 预定义动画 =====

    // 节点悬浮动画
    function animateNodeHover(
        nodeElement: HTMLElement,
        isHovering: boolean,
        onComplete?: () => void
    ): string {
        const config = ANIMATION_CONFIG.node.hover
        const targetScale = isHovering ? config.scale : 1
        const currentScale = parseFloat(nodeElement.style.transform.replace(/.*scale\(([\d.]+)\).*/, '$1') || '1')

        return createAnimation(
            `node-hover-${nodeElement.id || Date.now()}`,
            nodeElement,
            config.duration,
            (progress, easedProgress) => {
                const scale = currentScale + (targetScale - currentScale) * easedProgress
                nodeElement.style.transform = `scale(${scale})`
            },
            {
                easing: 'easeOut',
                onComplete
            }
        )
    }

    // 节点选择动画
    function animateNodeSelection(
        nodeElement: HTMLElement,
        isSelected: boolean,
        onComplete?: () => void
    ): string {
        const config = ANIMATION_CONFIG.node.select
        const targetScale = isSelected ? config.scale : 1
        const currentScale = parseFloat(nodeElement.style.transform.replace(/.*scale\(([\d.]+)\).*/, '$1') || '1')

        return createAnimation(
            `node-select-${nodeElement.id || Date.now()}`,
            nodeElement,
            config.duration,
            (progress, easedProgress) => {
                const scale = currentScale + (targetScale - currentScale) * easedProgress
                nodeElement.style.transform = `scale(${scale})`

                // 添加选中状态的视觉效果
                if (isSelected) {
                    nodeElement.style.filter = `drop-shadow(0 0 10px rgba(100, 255, 218, ${easedProgress * 0.8}))`
                } else {
                    nodeElement.style.filter = `drop-shadow(0 0 10px rgba(100, 255, 218, ${(1 - easedProgress) * 0.8}))`
                }
            },
            {
                easing: 'easeInOut',
                onComplete
            }
        )
    }

    // 节点脉冲动画 (用于故障状态)
    function animateNodePulse(
        nodeElement: HTMLElement,
        color: string = '#E74C3C',
        onComplete?: () => void
    ): string {
        const config = ANIMATION_CONFIG.node.pulse

        return createAnimation(
            `node-pulse-${nodeElement.id || Date.now()}`,
            nodeElement,
            config.duration,
            (progress, easedProgress) => {
                // 使用sin函数创建脉冲效果
                const pulseProgress = Math.sin(progress * Math.PI * 2)
                const scale = 1 + 0.1 * pulseProgress
                const opacity = 0.6 + 0.4 * Math.abs(pulseProgress)

                nodeElement.style.transform = `scale(${scale})`
                nodeElement.style.filter = `drop-shadow(0 0 15px ${color}) opacity(${opacity})`
            },
            {
                easing: 'linear',
                onComplete: () => {
                    // 脉冲动画循环
                    if (nodeElement.getAttribute('data-pulse-active') === 'true') {
                        animateNodePulse(nodeElement, color, onComplete)
                    }
                    onComplete?.()
                }
            }
        )
    }

    // 启动节点脉冲
    function startNodePulse(nodeElement: HTMLElement, color?: string): void {
        nodeElement.setAttribute('data-pulse-active', 'true')
        animateNodePulse(nodeElement, color)
    }

    // 停止节点脉冲
    function stopNodePulse(nodeElement: HTMLElement): void {
        nodeElement.setAttribute('data-pulse-active', 'false')
        nodeElement.style.transform = 'scale(1)'
        nodeElement.style.filter = 'none'
    }

    // 链路高亮动画
    function animateLinkHighlight(
        linkElement: SVGElement,
        isHighlighted: boolean,
        onComplete?: () => void
    ): string {
        const config = ANIMATION_CONFIG.link.highlight
        const targetWidth = isHighlighted ? 4 : 2
        const currentWidth = parseFloat(linkElement.getAttribute('stroke-width') || '2')

        return createAnimation(
            `link-highlight-${linkElement.id || Date.now()}`,
            linkElement,
            config.duration,
            (progress, easedProgress) => {
                const width = currentWidth + (targetWidth - currentWidth) * easedProgress
                linkElement.setAttribute('stroke-width', width.toString())

                if (isHighlighted) {
                    const opacity = easedProgress * 0.8
                    linkElement.style.filter = `drop-shadow(0 0 5px rgba(52, 152, 219, ${opacity}))`
                } else {
                    const opacity = (1 - easedProgress) * 0.8
                    linkElement.style.filter = `drop-shadow(0 0 5px rgba(52, 152, 219, ${opacity}))`
                }
            },
            {
                easing: 'easeInOut',
                onComplete
            }
        )
    }

    // 数据流动动画
    function animateDataFlow(
        linkElement: SVGElement,
        direction: 'forward' | 'backward' = 'forward',
        speed: number = 1,
        onComplete?: () => void
    ): string {
        const config = ANIMATION_CONFIG.link.flow
        const duration = config.duration / speed

        // 创建流动的点
        const flowDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
        flowDot.setAttribute('r', '3')
        flowDot.setAttribute('fill', '#64FFDA')
        flowDot.setAttribute('opacity', '0.8')

        // 添加到SVG父元素
        linkElement.parentElement?.appendChild(flowDot)

        // 获取路径长度
        const pathLength = (linkElement as SVGPathElement).getTotalLength?.() || 100

        return createAnimation(
            `flow-${linkElement.id || Date.now()}`,
            flowDot,
            duration,
            (progress, easedProgress) => {
                const position = direction === 'forward' ? easedProgress : 1 - easedProgress
                const point = (linkElement as SVGPathElement).getPointAtLength?.(pathLength * position)

                if (point) {
                    flowDot.setAttribute('cx', point.x.toString())
                    flowDot.setAttribute('cy', point.y.toString())
                }

                // 渐入渐出效果
                let opacity = 0.8
                if (progress < 0.1) opacity = progress * 8
                else if (progress > 0.9) opacity = (1 - progress) * 8

                flowDot.setAttribute('opacity', opacity.toString())
            },
            {
                easing: 'linear',
                onComplete: () => {
                    flowDot.remove()

                    // 循环动画
                    if (linkElement.getAttribute('data-flow-active') === 'true') {
                        setTimeout(() => {
                            animateDataFlow(linkElement, direction, speed, onComplete)
                        }, 200)
                    }
                    onComplete?.()
                }
            }
        )
    }

    // 启动数据流动画
    function startDataFlow(
        linkElement: SVGElement,
        direction?: 'forward' | 'backward',
        speed?: number
    ): void {
        linkElement.setAttribute('data-flow-active', 'true')
        animateDataFlow(linkElement, direction, speed)
    }

    // 停止数据流动画
    function stopDataFlow(linkElement: SVGElement): void {
        linkElement.setAttribute('data-flow-active', 'false')
    }

    // ===== 视图过渡动画 =====

    // 下钻动画
    function animateDrillDown(
        fromElement: HTMLElement,
        toContainer: HTMLElement,
        onComplete?: () => void
    ): string {
        const config = ANIMATION_CONFIG.transition.drillDown

        return createAnimation(
            `drill-down-${Date.now()}`,
            toContainer,
            config.duration,
            (progress, easedProgress) => {
                // 缩放效果
                const scale = 0.8 + 0.2 * easedProgress
                const opacity = easedProgress

                toContainer.style.transform = `scale(${scale})`
                toContainer.style.opacity = opacity.toString()

                // 从元素逐渐缩小
                if (fromElement) {
                    const fromScale = 1 + 0.2 * easedProgress
                    const fromOpacity = 1 - easedProgress
                    fromElement.style.transform = `scale(${fromScale})`
                    fromElement.style.opacity = fromOpacity.toString()
                }
            },
            {
                easing: 'easeInOut',
                onComplete: () => {
                    toContainer.style.transform = 'scale(1)'
                    toContainer.style.opacity = '1'
                    if (fromElement) {
                        fromElement.style.display = 'none'
                    }
                    onComplete?.()
                }
            }
        )
    }

    // 返回动画
    function animateDrillUp(
        fromContainer: HTMLElement,
        toElement: HTMLElement,
        onComplete?: () => void
    ): string {
        const config = ANIMATION_CONFIG.transition.drillUp

        return createAnimation(
            `drill-up-${Date.now()}`,
            fromContainer,
            config.duration,
            (progress, easedProgress) => {
                // 缩放效果
                const scale = 1 - 0.2 * easedProgress
                const opacity = 1 - easedProgress

                fromContainer.style.transform = `scale(${scale})`
                fromContainer.style.opacity = opacity.toString()

                // 目标元素逐渐显示
                if (toElement) {
                    toElement.style.display = 'block'
                    const toScale = 1.2 - 0.2 * easedProgress
                    const toOpacity = easedProgress
                    toElement.style.transform = `scale(${toScale})`
                    toElement.style.opacity = toOpacity.toString()
                }
            },
            {
                easing: 'easeOut',
                onComplete: () => {
                    fromContainer.style.display = 'none'
                    if (toElement) {
                        toElement.style.transform = 'scale(1)'
                        toElement.style.opacity = '1'
                    }
                    onComplete?.()
                }
            }
        )
    }

    // ===== 布局动画 =====

    // 节点位置动画
    function animateNodePosition(
        nodeElement: HTMLElement,
        fromPosition: Position,
        toPosition: Position,
        duration: number = 800,
        onComplete?: () => void
    ): string {
        return createAnimation(
            `node-position-${nodeElement.id || Date.now()}`,
            nodeElement,
            duration,
            (progress, easedProgress) => {
                const x = fromPosition.x + (toPosition.x - fromPosition.x) * easedProgress
                const y = fromPosition.y + (toPosition.y - fromPosition.y) * easedProgress

                nodeElement.style.transform = `translate(${x}px, ${y}px)`
            },
            {
                easing: 'easeInOut',
                onComplete
            }
        )
    }

    // 批量节点位置动画
    function animateNodesLayout(
        nodeElements: HTMLElement[],
        fromPositions: Position[],
        toPositions: Position[],
        duration: number = 800,
        onComplete?: () => void
    ): string[] {
        const animationIds: string[] = []
        let completedCount = 0

        nodeElements.forEach((element, index) => {
            if (fromPositions[index] && toPositions[index]) {
                const id = animateNodePosition(
                    element,
                    fromPositions[index],
                    toPositions[index],
                    duration,
                    () => {
                        completedCount++
                        if (completedCount === nodeElements.length) {
                            onComplete?.()
                        }
                    }
                )
                animationIds.push(id)
            }
        })

        return animationIds
    }

    // ===== 动画控制 =====

    // 启用/禁用动画
    function setAnimationsEnabled(enabled: boolean): void {
        animationsEnabled.value = enabled

        if (!enabled) {
            stopAllAnimations()
        }
    }

    // 暂停所有动画
    function pauseAllAnimations(): void {
        if (animationFrameId.value) {
            cancelAnimationFrame(animationFrameId.value)
            animationFrameId.value = null
        }
    }

    // 恢复所有动画
    function resumeAllAnimations(): void {
        if (activeAnimations.value.size > 0 && !animationFrameId.value) {
            startAnimationLoop()
        }
    }

    // ===== 性能监控 =====

    // 获取动画性能信息
    function getPerformanceInfo() {
        return {
            ...performanceStats.value,
            activeAnimations: animationCount.value,
            animationsEnabled: animationsEnabled.value
        }
    }

    // ===== 生命周期 =====

    onMounted(() => {
        // 监听页面可见性变化
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                pauseAllAnimations()
            } else {
                resumeAllAnimations()
            }
        })
    })

    onUnmounted(() => {
        stopAllAnimations()
    })

    // ===== 返回接口 =====

    return {
        // 状态
        hasActiveAnimations,
        animationCount,
        animationsEnabled,
        performanceStats,

        // 核心动画
        createAnimation,
        stopAnimation,
        stopAllAnimations,

        // 预定义动画
        animateNodeHover,
        animateNodeSelection,
        animateNodePulse,
        startNodePulse,
        stopNodePulse,
        animateLinkHighlight,
        animateDataFlow,
        startDataFlow,
        stopDataFlow,

        // 视图过渡
        animateDrillDown,
        animateDrillUp,

        // 布局动画
        animateNodePosition,
        animateNodesLayout,

        // 控制方法
        setAnimationsEnabled,
        pauseAllAnimations,
        resumeAllAnimations,

        // 监控
        getPerformanceInfo,

        // 缓动函数
        easingFunctions
    }
}