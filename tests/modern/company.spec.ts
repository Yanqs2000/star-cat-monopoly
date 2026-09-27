import { describe, expect, it } from 'vitest'
import { createGame } from '../../src/modern/features/game/setup'
import { chargeCompany, subscribeCompany } from '../../src/modern/features/game/company'

describe('原版公司格', () => {
  it('认购使用承销价和现金，AI 最大认购不超过1000股或公司余量', () => {
    const game = createGame([1, 2, 4, 5], 1)
    game.players[0]!.cash = 1000
    game.finance.stocks[3]!.offerShares = 2000
    const result = subscribeCompany(game, 1, 3, 66)
    expect(result.error).toBeNull()
    expect(result.state.players[0]?.cash).toBe(10)
    expect(result.state.finance.stocks[3]?.holdings[1]).toEqual({ shares: 66, averageCost: 15 })
    expect(result.state.finance.stocks[3]?.offerShares).toBe(1934)
    expect(result.entry).toMatchObject({ kind: 'company-subscribe', sourceAmount: 990,
      cashDelta: -990, sharesDelta: 66 })
    expect(subscribeCompany(game, 1, 3, 67).error).not.toBeNull()
  })

  it('对方公司收费先扣现金再扣存款，费用只进入公司利润', () => {
    const game = createGame([1, 2, 3, 4], 1)
    game.players[0]!.cash = 100
    game.players[0]!.deposit = 1000
    game.finance.stocks[2]!.ceoId = 2
    const result = chargeCompany(game, 1, 2, 3)
    expect(result.error).toBeNull()
    expect(result.state.players[0]).toMatchObject({ cash: 0, deposit: -400 })
    expect(result.state.players[1]).toMatchObject({ cash: 100000, deposit: 100000 })
    expect(result.state.finance.stocks[2]?.profit).toBe(1500)
    expect(result.entry).toMatchObject({ kind: 'company-fee', sourceAmount: 1500,
      cashDelta: -100, depositDelta: -1400 })
  })

  it('公司认购在并列时保留原董事，严格领先才转移', () => {
    const game = createGame([1, 2, 3, 4], 1)
    const company = game.finance.stocks[13]!
    company.holdings[1] = { shares: 100, averageCost: 5 }
    company.holdings[2] = { shares: 99, averageCost: 5 }
    company.ceoId = 1
    const tied = subscribeCompany(game, 2, 13, 1)
    expect(tied.state.finance.stocks[13]?.ceoId).toBe(1)
    const leading = subscribeCompany(tied.state, 2, 13, 1)
    expect(leading.state.finance.stocks[13]?.ceoId).toBe(2)
  })
})
