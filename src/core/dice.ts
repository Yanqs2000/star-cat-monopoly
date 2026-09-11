import type { Rng } from './engine/rng'

/**
 * 骰子力度控制 —— 原版《星猫大富翁》最有辨识度的机制。
 *
 * 玩家按住骰子蓄力，松手时按力度换算点数：
 *   轻点 → 小步数（精细走位、避开坑格）
 *   重甩 → 大步数（冲圈、抢地）
 *
 * 设计目标：**有掌控感但不精确**。
 * 力度决定的是点数的**概率分布**，而不是点数本身：
 *   - 力度越大，期望点数越高、分布越集中（越可控）；
 *   - 但力度超过 80% 后会出现「手滑」风险，脱手乱飞（均匀分布）；
 *   - 永远保留 10% 的均匀底噪，所以任何点数都不是不可能。
 *
 * 结果是：满蓄力是**赌博**（可能 6，也可能摔成 1），
 * 中高力度才是稳妥的大步数。这让力度机制有技巧上限，又不会被算死。
 */

/** 蓄力条填满所需毫秒数 */
export const CHARGE_DURATION_MS = 900
/** 按下短于这个时长算「轻点」 */
export const TAP_MS = 150
/** 均匀底噪：保证每个点数永远都有可能 */
const UNIFORM_FLOOR = 0.1
/** 轻点的点数权重（明显偏向 1-2） */
const TAP_WEIGHTS = [0.62, 0.25, 0.08, 0.03, 0.015, 0.005] as const
/** 开始「手滑」的力度阈值 */
const OVERREACH_FROM = 0.8

export type DiceFace = 1 | 2 | 3 | 4 | 5 | 6

/** 力度 → 目标均值 */
function targetMean(power: number): number {
  return 1 + power * 5
}

/** 力度 → 分布标准差（力度越大越集中） */
function sigma(power: number): number {
  return 0.45 + 1.4 * (1 - power)
}

/** 该力度下的「手滑」概率 */
export function overreachChance(power: number): number {
  if (power <= OVERREACH_FROM) return 0
  return 0.05 + (0.25 * (power - OVERREACH_FROM)) / (1 - OVERREACH_FROM)
}

/**
 * 力度 → 点数概率分布，返回 [P(1), P(2), ..., P(6)]，总和为 1。
 * UI 用它画出实时的概率条，让「运气」变成看得见的风险。
 */
export function rollDistribution(power: number): number[] {
  const p = clamp01(power)

  if (p <= 0.15) return normalize(TAP_WEIGHTS.slice())

  const over = overreachChance(p)
  const mean = targetMean(p)
  const sd = sigma(p)

  const shaped = [1, 2, 3, 4, 5, 6].map(
    (face) => UNIFORM_FLOOR + Math.exp(-((face - mean) ** 2) / (2 * sd * sd)),
  )
  const normal = normalize(shaped)
  const uniform = [1 / 6, 1 / 6, 1 / 6, 1 / 6, 1 / 6, 1 / 6]

  // 按「手滑」概率把分布向均匀分布插值
  return normal.map((w, i) => w * (1 - over) + uniform[i]! * over)
}

/** 该力度下的期望点数 */
export function expectedValue(power: number): number {
  return rollDistribution(power).reduce((acc, w, i) => acc + w * (i + 1), 0)
}

/** 掷骰：按力度采样 */
export function rollWithPower(power: number, rng: Rng): DiceFace {
  const dist = rollDistribution(power)
  let roll = rng.next()
  for (let i = 0; i < dist.length; i++) {
    roll -= dist[i]!
    if (roll <= 0) return (i + 1) as DiceFace
  }
  return 6
}

/** 给定目标点数，反推最合适的力度（AI 用） */
export function powerForTarget(target: number): number {
  const clamped = Math.min(6, Math.max(1, target))
  return clamp01((clamped - 1) / 5)
}

/** 力度档位的中文标签，用于 HUD */
export function powerLabel(power: number): string {
  const p = clamp01(power)
  if (p <= 0.15) return '轻点'
  if (p <= 0.4) return '轻按'
  if (p <= 0.6) return '中按'
  if (p <= OVERREACH_FROM) return '重按'
  return '重甩·易手滑'
}

function clamp01(v: number): number {
  return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0
}

function normalize(weights: readonly number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0)
  return weights.map((w) => w / sum)
}
