import './static/index.less'

import metadata, { IData } from './metadata'
import Zero from './ts/zero'

export interface IConfig {
    container: HTMLElement
    duration?: number
    prefix?: string
    metadata?: IData
}

export default class Dm {
    static metadata = metadata
    private config: Required<IConfig>
    private zero!: Zero

    constructor(config: IConfig) {
        if (!config.container) {
            throw new Error("no container");
        }
        this.config = {
            metadata,
            duration: 10000,
            prefix: 'dm',
            ...config
        }
        this.init()
    }

    private init() {
        this.zero = new Zero(this.config)
    }

    /**
     * 添加一组弹幕
     * 暂未排序（因为生成弹幕已排序
     */
     addDm() {
        this.zero.addDm()
    }

    play() {
        this.zero.play()
    }
    pause() {
        this.zero.pause()
    }
    toggle() {
        this.zero.toggle()
    }
}
