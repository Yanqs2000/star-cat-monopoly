import { GROUP_TILES } from '../config/board'
import { ECONOMY } from '../config/economy'
import { GODS } from '../config/gods'
import type { GameState, GroupId, PlayerId, Tile, TileId } from '../types'

/**
 * 过路费计算。
 *
 *   过路费 = 地价 × 租金系数 × 等级倍率 × 垄断加成 × 付款方神明修正
 */

/** 不含任何修正的基础租金 */
export function baseRent(tile: Tile): number {
  if (tile.kind !== 'property') return 0
  return tile.price * ECONOMY.RENT_RATE * ECONOMY.LEVEL_MULTIPLIER[tile.level]!
}

/** 某玩家是否集齐了整个色组 */
export function ownsWholeGroup(state: GameState, playerId: PlayerId, group: GroupId): boolean {
  const ids = GROUP_TILES[group]
  if (!ids || ids.length === 0) return false
  return ids.every((id) => state.tiles[id]?.owner === playerId)
}

/** 某玩家当前垄断的色组列表 */
export function monopoliesOf(state: GameState, playerId: PlayerId): GroupId[] {
  return Object.keys(GROUP_TILES).filter((g) => ownsWholeGroup(state, playerId, g))
}

/** 盖一层的费用 */
export function buildCost(tile: Tile): number {
  return Math.round(tile.price * ECONOMY.BUILD_COST_RATE * (tile.level + 1))
}

/** 卖地返还金额 */
export function sellValue(tile: Tile): number {
  const buildInvestment = Array.from({ length: tile.level }, (_, i) =>
    Math.round(tile.price * ECONOMY.BUILD_COST_RATE * (i + 1)),
  ).reduce((a, b) => a + b, 0)
  return Math.round((tile.price + buildInvestment) * ECONOMY.SELL_REFUND)
}

/**
 * 完整过路费：包含垄断加成与付款方的神明 / 护体修正。
 * 返回 0 表示不用付（无主地或自己的地）。
 */
export function rentFor(state: GameState, tileId: TileId, payerId: PlayerId): number {
  const tile = state.tiles[tileId]
  if (!tile || tile.kind !== 'property' || tile.owner === null || tile.owner === payerId) return 0

  let rent = baseRent(tile)

  if (tile.group && ownsWholeGroup(state, tile.owner, tile.group)) {
    rent *= 1 + ECONOMY.MONOPOLY_RENT_BONUS
  }

  const payer = state.players[payerId]
  if (payer) {
    if (payer.god) rent *= GODS[payer.god.id]!.tollMultiplier
    if (payer.tollHalfTurns > 0) rent *= 0.5
  }

  return Math.max(0, Math.round(rent))
}

/** 租金明细，用于 UI 展示「为什么是这个数」 */
export interface RentBreakdown {
  base: number
  monopolyBonus: number
  godMultiplier: number
  tollHalf: boolean
  total: number
}

export function rentBreakdown(state: GameState, tileId: TileId, payerId: PlayerId): RentBreakdown {
  const tile = state.tiles[tileId]!
  const base = baseRent(tile)
  const monopolized = !!tile.group && tile.owner !== null && ownsWholeGroup(state, tile.owner, tile.group)
  const monopolyBonus = monopolized ? base * ECONOMY.MONOPOLY_RENT_BONUS : 0
  const payer = state.players[payerId]
  const godMultiplier = payer?.god ? GODS[payer.god.id]!.tollMultiplier : 1
  const tollHalf = (payer?.tollHalfTurns ?? 0) > 0
  return {
    base,
    monopolyBonus,
    godMultiplier,
    tollHalf,
    total: rentFor(state, tileId, payerId),
  }
}
