import { describe, expect, it } from 'vitest'
import { GROUP_TILES } from '../src/core/config/board'
import { ECONOMY } from '../src/core/config/economy'
import { GameEngine } from '../src/core/engine/GameEngine'
import { baseRent, buildCost, monopoliesOf, rentBreakdown, rentFor, sellValue } from '../src/core/rules/rent'

const IDS = ['juanmao', 'aniu', 'jiajia', 'dapai'] as const

function newEngine(seed = 1) {
  return new GameEngine(seed, [...IDS], { humanId: 0 })
}

describe('过路费', () => {
  it('基础租金 = 地价 × 租金系数 × 等级倍率', () => {
    const s = newEngine().getState()
    const tile = s.tiles[1]! // 草莓街 2000
    for (const level of [0, 1, 2, 3]) {
      tile.level = level
      expect(baseRent(tile)).toBeCloseTo(2_000 * ECONOMY.RENT_RATE * ECONOMY.LEVEL_MULTIPLIER[level]!, 6)
    }
  })

  it('自己的地不用付钱，无主地也不用付钱', () => {
    const s = newEngine().getState()
    expect(rentFor(s, 1, 0)).toBe(0) // 无主
    s.tiles[1]!.owner = 0
    expect(rentFor(s, 1, 0)).toBe(0) // 自己的
  })

  it('垄断整组后过路费翻倍', () => {
    const s = newEngine().getState()
    const berry = GROUP_TILES['berry']!
    expect(berry).toHaveLength(3)

    // 只拥有一块
    s.tiles[berry[0]]!.owner = 1
    s.tiles[berry[0]]!.level = 1
    const single = rentFor(s, berry[0]!, 0)

    // 集齐整组
    s.tiles[berry[1]]!.owner = 1
    s.tiles[berry[2]]!.owner = 1
    const monopoly = rentFor(s, berry[0]!, 0)

    expect(monopoliesOf(s, 1)).toContain('berry')
    expect(monopoly).toBe(Math.round(single * (1 + ECONOMY.MONOPOLY_RENT_BONUS)))
  })

  it('穷神让付款方多付 50%', () => {
    const s = newEngine().getState()
    s.tiles[1]!.owner = 1
    s.tiles[1]!.level = 0
    const plain = rentFor(s, 1, 0)
    s.players[0]!.god = { id: 'qiongshen', turnsLeft: 3 }
    expect(rentFor(s, 1, 0)).toBe(Math.round(plain * 1.5))
  })

  it('财神让付款方少付一半', () => {
    const s = newEngine().getState()
    s.tiles[1]!.owner = 1
    const plain = rentFor(s, 1, 0)
    s.players[0]!.god = { id: 'caishen', turnsLeft: 3 }
    expect(rentFor(s, 1, 0)).toBe(Math.round(plain * 0.5))
  })

  it('金牛护体与神明修正是叠乘的', () => {
    const s = newEngine().getState()
    s.tiles[1]!.owner = 1
    const plain = rentFor(s, 1, 0)
    s.players[0]!.god = { id: 'qiongshen', turnsLeft: 3 }
    s.players[0]!.tollHalfTurns = 2
    expect(rentFor(s, 1, 0)).toBe(Math.round(plain * 1.5 * 0.5))
  })

  it('rentBreakdown 的明细能对上总额', () => {
    const s = newEngine().getState()
    const berry = GROUP_TILES['berry']!
    berry.forEach((id) => {
      s.tiles[id]!.owner = 1
      s.tiles[id]!.level = 2
    })
    s.players[0]!.god = { id: 'qiongshen', turnsLeft: 1 }

    const bd = rentBreakdown(s, berry[0]!, 0)
    expect(bd.monopolyBonus).toBeGreaterThan(0)
    expect(bd.godMultiplier).toBe(1.5)
    expect(bd.total).toBe(rentFor(s, berry[0]!, 0))
  })

  it('盖房越盖越贵，卖地返还按投入折算', () => {
    const s = newEngine().getState()
    const tile = s.tiles[1]!
    const c0 = buildCost(tile)
    tile.level = 1
    const c1 = buildCost(tile)
    expect(c1).toBeGreaterThan(c0)

    const v = sellValue(tile)
    expect(v).toBeGreaterThan(tile.price)
    expect(v).toBeLessThan(tile.price + c0 + c1)
  })
})
