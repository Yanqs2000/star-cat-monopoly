import { describe, expect, it } from 'vitest'
import { createGame } from '../../src/modern/features/game/setup'
import { settleMonth } from '../../src/modern/features/game/bank-settlement'

describe('原版月初结算', () => {
  it('先按股数和利润逐人分配到存款，再在最后计算 10% 利息', () => {
    const game = createGame([1, 2, 3, 4], 1, 1, { year: 2026, month: 9, day: 1 })
    const stock = game.finance.stocks[1]!
    stock.profit = 10
    for (const holding of Object.values(stock.holdings)) holding.shares = 0
    stock.holdings[1]!.shares = 3
    stock.holdings[2]!.shares = 2
    const result = settleMonth(game)
    expect(result.settled).toBe(true)
    expect(result.state.players[0]?.deposit).toBe(110009)
    expect(result.state.players[1]?.deposit).toBe(110006)
    expect(result.state.finance.stocks[1]?.profit).toBe(0)
    expect(result.entries).toContainEqual(expect.objectContaining({ kind: 'company-distribution',
      playerId: 1, companyId: 1, sourceAmount: 10, depositDelta: 9 }))
    expect(result.entries).toContainEqual(expect.objectContaining({ kind: 'deposit-interest',
      playerId: 1, sourceAmount: 10000, depositDelta: 10000 }))
    expect(game.players[0]?.deposit).toBe(100000)
  })

  it('信用、贷款依次存款优先扣款且允许现金为负；重复恢复不再结算', () => {
    const game = createGame([1, 2, 3, 4], 1, 1, { year: 2026, month: 9, day: 1 })
    game.players[0]!.cash = 5000
    game.players[0]!.deposit = 3000
    game.credit[1] = { score: 100, used: 12001, available: 87999 }
    game.finance.loans[1] = 12000
    const first = settleMonth(game)
    expect(first.state.players[0]).toMatchObject({ cash: -8000, deposit: 0 })
    expect(first.state.credit[1]).toMatchObject({ used: 6001, available: 93999 })
    expect(first.state.finance.loans[1]).toBe(2000)
    expect(first.entries.filter(entry => entry.playerId === 1).map(entry => entry.kind))
      .toEqual(['credit-monthly-payment', 'loan-monthly-payment'])
    const second = settleMonth(first.state)
    expect(second.settled).toBe(false)
    expect(second.state).toEqual(first.state)
    expect(second.entries).toEqual([])
  })
})
