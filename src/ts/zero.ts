import { IConfig } from '..'
import Load, { IDM } from './load'

interface IRenderDm extends IDM {
    dm: IDM
}

export default class Zero {
    private config: Required<IConfig>
    private paused = false
    private animate!: number
    /**
     * 上一次取弹幕的时间 (ms)
     */
    private lastTime!: number
    /**
     * 上一帧时间 (ms)
     */
    private startTime!: number
    /**
     * 弹幕已播放时长  (ms)
     */
    private timeZero!: number
    /**
     * 所有弹幕，按时间排序
     */
    private dmArray!: IDM[]
    /**
     * 已渲染的弹幕列表
     */
    private renderDm: IRenderDm[] = []
    /**
     * 下一帧要渲染的弹幕列表
     */
    private searchDm: IDM[] = []

    constructor(config: Required<IConfig>) {
        this.config = config
        this.init()
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
        this.nextFrame()
    }
    pause() {
        if (this.paused) return

        this.paused = true
    }

    /**
     * 每一帧执行一次
     */
    private nextFrame() {
        if (this.paused) return

        let currentTime: number = performance.now()
        const time = this.timeZero + currentTime - this.startTime

        this.timeZero = time
        this.startTime = currentTime

        this.onTime(time)
        this.render()

        this.animate = requestAnimationFrame((t) => {
            this.nextFrame()
        })
    }

    /**
     * 查找下一帧要渲染的弹幕
     */
    private onTime(t: number) {
        this.dmArray.some((dm) => {
            if (dm.stime > t) {
                return true
            }

            if (dm.stime >= this.lastTime) {
                this.searchDm.push(dm)
            }

            return false
        })

        this.lastTime = t
    }

    /**
     * 渲染下一帧要渲染的弹幕
     */
    private render() {
        this.searchDm.forEach((dm) => {
            console.log(dm.text)
        })
    }

    private tpl(prefix: string) {
        return `<div class="${prefix}-async">动态加载模块</div>`
    }
}
