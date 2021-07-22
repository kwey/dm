import { IConfig } from '..'
import Load, { IDM } from './load'

interface IRenderDm {
    dm: IDM
    dom: HTMLElement
    paused: boolean
    cssText: string
    width: number
    height: number
    /**
     * 弹幕速度
     */
    speed: number
    /**
     * 弹幕的运动时长
     */
    duration: number
    /**
     * 舞台 宽度
     */
    distance: number
    /**
     * 弹幕完全进入舞台时间
     */
    enter: number
    /**
     * 弹幕头部到边界的时间
     */
    middle: number
    /**
     * 弹幕完全出舞台的时间
     */
    end: number
    /**
     * 弹幕完顶部位置
     */
    top: number
    /**
     * 弹幕完底部位置
     */
    bottom: number
    /**
     * 弹幕剩余运动时间
     */
    rest: number
}

export default class Zero {
    private container: HTMLElement
    private config: Required<IConfig>
    private paused = true
    private width!: number
    private height!: number
    private animate!: number
    /**
     * 上一次取弹幕的时间 (ms)
     */
    private lastTime = 0
    /**
     * 上一帧时间 (ms)
     */
    private startTime = 0
    /**
     * 弹幕已播放时长  (ms)
     */
    private timeZero = 0
    /**
     * 所有弹幕，按时间排序
     */
    private dmArray: IDM[] = []
    /**
     * 已渲染的并开始运动的弹幕列表
     */
    private renderDm: IRenderDm[] = []
    /**
     * 已渲染的但未运动的弹幕列表
     */
    private hideDm: IRenderDm[] = []
    /**
     * 下一帧要渲染的弹幕列表
     */
    private searchDm: IDM[] = []

    constructor(config: Required<IConfig>) {
        this.config = config
        this.container = config.container
        this.init()
        this.resize()
    }

    private init() {
        this.addDm()

        setTimeout(() => {
            this.play()
        }, 1000)
    }

    /**
     * 添加一组弹幕
     * 暂未排序（因为生成弹幕已排序
     */
    addDm() {
        Array.prototype.push.apply(this.dmArray, Load.loadDm(performance.now() / 1000))
    }

    play() {
        if (!this.paused) return

        this.paused = false
        cancelAnimationFrame(this.animate)
        this.startTime = performance.now()
        this.nextFrame()
    }
    pause() {
        if (this.paused) return

        this.paused = true
    }
    toggle() {
        if (this.paused) {
            this.play()
        } else {
            this.pause()
        }
    }
    resize() {
        const rect = this.container.getBoundingClientRect()
        this.width = rect.width
        this.height = rect.height
    }

    /**
     * 每一帧执行一次
     */
    private nextFrame() {

        let currentTime: number = performance.now()
        const time = this.timeZero + currentTime - this.startTime

        // console.log(this.timeZero, currentTime, this.startTime)

        this.timeZero = time
        this.startTime = currentTime

        this.onTime(time)
        this.render(time, this.paused)

        if (this.paused) {
            return;
        }

        this.animate = requestAnimationFrame((t) => {
            this.nextFrame()
        })
        
    }

    /**
     * 查找下一帧要渲染的弹幕
     */
    private onTime(t: number) {
        if (!this.lastTime) {
            this.lastTime = t
            return;
        }
        // 查找要渲染的弹幕
        this.dmArray.some((dm) => {
            if (dm.stime > t) {
                return true
            }
            if (dm.on) {
                return false
            }

            if (dm.stime >= this.lastTime) {
                this.searchDm.push(dm)
            }

            return false
        })

        // 生成弹幕 并添加到页面
        this.searchDm.forEach((dm) => {
            this.createDm(dm)
        })
        this.searchDm.length = 0

        this.lastTime = t
    }

    /**
     * 渲染下一帧要渲染的弹幕
     */
    private render(time: number, paused: boolean) {
        // 已运动的弹幕
        this.renderDm.forEach((render, i) => {
            const stime = render.dm.stime
            render.rest = render.duration - (time - stime)

            if (paused) {
                // 如果暂停，暂停所有弹幕
                this.stopDm(render, time - stime)
                return
            }
            if (render.rest < 0 || time < stime) {
                // 如果弹幕不在运行时间内，则移除，（例如seek的时候，或者 运动结束
                this.remove(render)
                this.renderDm.splice(i, 1)
            } else {
                this.playDm(render)
            }
        })

        this.hideDm.forEach((render) => {
            if (render.end < time || render.dm.stime > time) {
                // 如果弹幕不在运行时间内，则移除，（例如seek的时候，
                this.remove(render)
            } else {
                // 吧隐藏的弹幕添加到运动列表，下一帧 开始执行动画（动画属性 必须隔帧 设置 才会执行
                this.renderDm.push(render)
            }
        })
        this.hideDm.length = 0
    }

    /**
     * 播放单条弹幕
     */
    private playDm(render: IRenderDm) {
        if (render.paused) {
            // 只给 上一帧刚 创建的弹幕 设置动画
            render.dom.style.cssText = render.cssText + this.transform(render.distance, render.rest)
            render.paused = false
        }
    }
    /**
     * 暂停单条弹幕
     */
    private stopDm(render: IRenderDm, runTime: number) {
        render.paused = true
        const range = render.speed * runTime
        render.dom.style.cssText = render.cssText + this.transform(range, 0)
    }

    /**
     * 创建弹幕
     */
    private createDm(dm: IDM) {
        const dom = document.createElement('div')

        const cssText = `left:${this.width}px;fontsize:${dm.fontsize};opacity:${dm.opacity};`
        dom.style.cssText = cssText
        dom.className = 'danmaku'
        dom.textContent = dm.text

        this.container.appendChild(dom)

        const { width, height } = dom.getBoundingClientRect()
        const speed = (this.width + width) / this.config.duration

        const render: IRenderDm = {
            cssText,
            dom,
            dm,
            speed,
            width,
            height,
            paused: true,
            enter: dm.stime + width / speed,
            middle: dm.stime + this.width / speed,
            end: dm.stime + this.config.duration,
            top: 0,
            bottom: height,
            distance: this.width + width,
            duration: this.config.duration,
            rest: this.config.duration,
        }

        this.space(render)

        if (render.rest > 0) {
            render.cssText += `top:${render.top}px;`
            dom.style.cssText = render.cssText + this.transform(0, 0)
            this.hideDm.push(render)
            dm.on = true
        } else {
            this.remove(render)
        }
    }

    /**
     * 排位置，做碰撞检测
     * 没有做大小混排碰撞检测
     */
    private space(render: IRenderDm) {
        let { top, bottom, height } = render

        while (bottom <= this.height) {
            // 每一个轨道做碰撞检测
            if (!this.check(render, top, bottom)) {
                render.top = top
                render.bottom = bottom
                return
            }
            top = bottom
            bottom += height
        }
        render.rest = -1
    }
    /**
     * 排位置，做碰撞检测
     * 没有做大小混排碰撞检测
     */
    private check(render: IRenderDm, top: number, bottom: number) {
        let { middle, dm } = render
        const list = [
            ...this.renderDm,
            ...this.hideDm
        ]
        return list.some((item) => {
            if (item.top === top && item.bottom === bottom) {
                // 同一轨道，做碰撞检测、
                if (item.enter >= dm.stime || item.end >= middle) {
                    return true
                }
            }
            return false
        })
    }

    /**
     * 删除已运动完的弹幕
     */
    private remove(dm: IRenderDm) {
        if (!dm.dom) {
            return
        }
        dm.dm.on = false
        try {
            this.container.removeChild(dm.dom)
        } catch (error) {
            console.log(error)
        }
    }

    private transform(position: number, rest: number) {
        return `transform: translateX(${-position}px) translateY(0px) translateZ(0px);transition: transform ${rest/1000}s linear;`
    }
}
