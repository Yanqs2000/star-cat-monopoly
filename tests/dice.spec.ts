import { describe, expect, it } from 'vitest'
import {
  expectedValue,
  overreachChance,
  powerForTarget,
  rollDistribution,
  rollWithPower,
} from '../src/core/dice'
import { Rng } from '../src/core/engine/rng'

/**
 * 骰子力度是原版最有辨识度的机制，也是最容易调坏的地方：
 * 太确定就退化成「永远满蓄力」，太随机就失去掌控感。
 * 这组测试把「手感」的数学边界钉住。
 */
describe('骰子力度 → 点数分布', () => {
  const POWERS = [0, 0.1, 0.15, 0.3, 0.5, 0.7, 0.8, 0.9, 1]

  it('任何力度下分布都归一化，且每个点数都有可能出现', () => {
    for (const p of POWERS) {
      const d = rollDistribution(p)
      expect(d).toHaveLength(6)
      expect(d.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 9)
      for (const w of d) expect(w).toBeGreaterThan(0)
    }
  })

  it('轻点大概率只走 1~2 步（用来精细走位）', () => {
    const d = rollDistribution(0.05)
    expect(d[0]! + d[1]!).toBeGreaterThan(0.8)
    expect(d[5]!).toBeLessThan(0.02)
  })

  it('0~0.8 区间期望点数单调不减（力度越大走得越远）', () => {
    let prev = -Infinity
    for (let p = 0; p <= 0.8 + 1e-9; p += 0.05) {
      const e = expectedValue(Math.min(0.8, p))
      expect(e).toBeGreaterThanOrEqual(prev - 1e-9)
      prev = e
    }
  })

  it('满力度不会比中高力度更划算（手滑代价）', () => {
    // 这是有意的设计：满蓄力是赌博，不是严格更优
    expect(expectedValue(1)).toBeLessThanOrEqual(expectedValue(0.8) + 1e-6)
    expect(expectedValue(1)).toBeGreaterThan(expectedValue(0.5))
  })

  it('力度越大分布越集中（可控性随力度上升）', () => {
    const spread = (p: number) => {
      const d = rollDistribution(p)
      const mean = expectedValue(p)
      return d.reduce((acc, w, i) => acc + w * (i + 1 - mean) ** 2, 0)
    }
    expect(spread(0.7)).toBeLessThan(spread(0.3))
  })

  it('满力度是「赌博」而不是「必出 6」', () => {
    const d = rollDistribution(1)
    // 有相当机会出 6……
    expect(d[5]!).toBeGreaterThan(0.3)
    // ……但也有真实的翻车概率
    expect(d[0]! + d[1]! + d[2]!).toBeGreaterThan(0.1)
  })

  it('中高力度(0.8)比满力度更稳：出 5 的概率更高', () => {
    expect(rollDistribution(0.8)[4]!).toBeGreaterThan(rollDistribution(1)[4]!)
  })

  it('手滑概率随力度递增，0.8 以下为 0', () => {
    expect(overreachChance(0.5)).toBe(0)
    expect(overreachChance(0.8)).toBe(0)
    expect(overreachChance(0.9)).toBeGreaterThan(0)
    expect(overreachChance(1)).toBeGreaterThan(overreachChance(0.9))
  })

  it('采样结果落在 1..6，且频率贴合分布', () => {
    const rng = new Rng(20260909)
    const counts = [0, 0, 0, 0, 0, 0]
    const N = 30_000
    for (let i = 0; i < N; i++) counts[rollWithPower(0.5, rng) - 1]!++

    const dist = rollDistribution(0.5)
    for (let face = 0; face < 6; face++) {
      expect(Math.abs(counts[face]! / N - dist[face]!)).toBeLessThan(0.02)
    }
  })

  it('powerForTarget 能反推出符合目标点数的力度', () => {
    expect(expectedValue(powerForTarget(1))).toBeLessThan(2.2)
    expect(expectedValue(powerForTarget(3))).toBeGreaterThan(3)
    expect(expectedValue(powerForTarget(3))).toBeLessThan(4)
    expect(expectedValue(powerForTarget(6))).toBeGreaterThan(4.5)
  })

  it('越界力度被安全夹取', () => {
    expect(() => rollDistribution(-5)).not.toThrow()
    expect(() => rollDistribution(99)).not.toThrow()
    expect(rollDistribution(-5)).toEqual(rollDistribution(0))
    expect(rollDistribution(99)).toEqual(rollDistribution(1))
  })
})
