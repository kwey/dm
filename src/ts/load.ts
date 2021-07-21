
export interface IDM {
    text: string
    /**
     * 弹幕开始时间（ms
     */
    stime: number
    opacity: number
    fontsize: number
    color: string
    on?: boolean
}
export default class Load {
    static lastTime = 0
    static lastNum = 0

    static reset() {
        Load.lastTime = 0
        Load.lastNum = 0
    }
    /**
     * stime: 添加的弹幕 第一条开始时间(s)
     * num: 添加多少条弹幕
     * duration: 添加的弹幕 最后一条开始时间(s)
     */
    static loadDm(stime = Load.lastTime, num = 1000, duration = 300) {
        const list: IDM[] = []
        for (let i = 0; i < num; i++) {
            list.push({
                text: i + '我是一条弹幕',
                stime: (stime + i* duration/num) * 1000,
                fontsize: 25,
                color: Load.color(),
                opacity: Math.random() * 0.4 + 0.6,
            })
        }
        Load.lastNum += num
        Load.lastTime = stime + duration
        return list
    }

    static color() {
        const r = Math.floor(Math.random() * 255)
        const g = Math.floor(Math.random() * 255)
        const b = Math.floor(Math.random() * 255)
        return 'rgb(' + r + ',' + g + ',' + b + ')'
    }
}
