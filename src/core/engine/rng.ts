/**
 * 可复现的伪随机数（mulberry32）。
 *
 * 整个引擎的随机性都走这里，并且随机状态存在 GameState.rngState 里，
 * 因此「同一个种子 + 同一串操作」必然得到同一局游戏 —— 单测和回放都靠这个。
 */
export class Rng {
  private s: number

  constructor(seed: number) {
    // 保证是 32 位无符号整数
    this.s = seed >>> 0
  }

  /** 当前内部状态，可写回 GameState */
  get state(): number {
    return this.s
  }

  /** [0, 1) */
  next(): number {
    this.s = (this.s + 0x6d2b79f5) >>> 0
    let t = this.s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  /** [min, max] 整数 */
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1))
  }

  /** [min, max) 浮点 */
  float(min: number, max: number): number {
    return min + this.next() * (max - min)
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error('pick() 不能用于空数组')
    return items[Math.floor(this.next() * items.length)]!
  }

  /** 概率 p 为真 */
  chance(p: number): boolean {
    return this.next() < p
  }

  shuffle<T>(items: readonly T[]): T[] {
    const out = items.slice()
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1))
      const a = out[i]!
      const b = out[j]!
      out[i] = b
      out[j] = a
    }
    return out
  }
}
