import { describe, expect, it } from 'vitest'
import { createGame } from '../../src/modern/features/game/setup'

describe('原版金融初态', () => {
  it('按角色而非玩家座次分配 3000 股与出生区公司', () => {
    const game = createGame([3, 1, 2, 4], 17, 1, { year: 2026, month: 2, day: 28 })
    expect(game.finance.stocks).toHaveLength(16)
    expect(game.finance.stocks[0]?.kind).toBe(0)
    expect(game.finance.stocks[13]?.kind).toBe(3)
    const founder = game.players[0]!
    const company = game.finance.stocks[3]!
    expect(company.holdings[founder.id]).toEqual({ shares: 3000, averageCost: 10 })
    expect(company.ceoId).toBe(founder.id)
    expect(company.kind).toBe(2)
    expect(company.mainRecordId).toBe([124, 127, 130, 133][founder.hometown - 1])
    expect(company.offerShares).toBe(2000)
    expect(company.basePrice).toBe(20)
    expect(company.price).toBe(20)
    expect(company.factorA).toBe(1)
    expect(company.factorB).toBe(0.8)
    expect(company.dailyBuyLimit).toBe(2000)
    expect(company.poolBandValue).toBe(10000)
    expect(game.world).toMatchObject({ year: 2026, month: 2, day: 28, weekday: 1 })
  })
})
