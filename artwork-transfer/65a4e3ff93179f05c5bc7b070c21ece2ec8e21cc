import { describe, expect, it } from 'vitest'
import { createGame } from '../../src/modern/features/game/setup'
import { buyStock, sellStock } from '../../src/modern/features/game/stock-trading'

describe('原版交易所现金与持股', () => {
  it('以现价买入按整数扣现金、两位均价，并分别减少日限额和池值', () => {
    const game = createGame([1, 2, 3, 4], 1)
    game.players[0]!.cash = 100
    const stock = game.finance.stocks[1]!
    Object.assign(stock, { price: 21.37, dailyBuyLimit: 10, poolBandValue: 5000 })
    stock.holdings[1] = { shares: 2, averageCost: 20.10 }
    const result = buyStock(game, 1, 1, 3)
    expect(result.error).toBeNull()
    expect(result.state.players[0]?.cash).toBe(36)
    expect(result.state.finance.stocks[1]?.holdings[1]).toEqual({ shares: 5, averageCost: 20.86 })
    expect(result.state.finance.stocks[1]).toMatchObject({ dailyBuyLimit: 7, poolBandValue: 4997 })
    expect(result.entry).toMatchObject({ kind: 'stock-buy', sourceAmount: 64.11,
      cashDelta: -64, sharesDelta: 3 })
    expect(game.players[0]?.cash).toBe(100)
  })

  it('卖出只增加现金和两种交易量，不重算剩余股均价', () => {
    const game = createGame([1, 2, 3, 4], 1)
    game.players[0]!.cash = 36
    const stock = game.finance.stocks[1]!
    Object.assign(stock, { price: 21.37, dailyBuyLimit: 7, poolBandValue: 4997 })
    stock.holdings[1] = { shares: 5, averageCost: 20.86 }
    const result = sellStock(game, 1, 1, 3)
    expect(result.state.players[0]?.cash).toBe(100)
    expect(result.state.finance.stocks[1]?.holdings[1]).toEqual({ shares: 2, averageCost: 20.86 })
    expect(result.state.finance.stocks[1]).toMatchObject({ dailyBuyLimit: 10, poolBandValue: 5000 })
    expect(result.entry).toMatchObject({ kind: 'stock-sell', sourceAmount: 64.11,
      cashDelta: 64, sharesDelta: -3 })
  })

  it('只可交易 1..12，现金不足、无持股和零股输入不改变状态', () => {
    const game = createGame([1, 2, 3, 4], 1)
    const before = structuredClone(game)
    expect(buyStock(game, 1, 13, 1).error).not.toBeNull()
    expect(sellStock(game, 1, 13, 1).error).not.toBeNull()
    expect(buyStock(game, 1, 2, 0).error).not.toBeNull()
    expect(sellStock(game, 2, 1, 1).error).not.toBeNull()
    game.players[0]!.cash = 0
    expect(buyStock(game, 1, 2, 1).error).not.toBeNull()
    expect(before.finance).toEqual(game.finance)
  })

  it('只在买者持股严格超过其余玩家时移交董事权', () => {
    const game = createGame([1, 2, 3, 4], 1)
    const stock = game.finance.stocks[1]!
    stock.holdings[1] = { shares: 100, averageCost: 10 }
    stock.holdings[2] = { shares: 99, averageCost: 10 }
    const tied = buyStock(game, 2, 1, 1)
    expect(tied.state.finance.stocks[1]?.ceoId).toBe(1)
    const leading = buyStock(tied.state, 2, 1, 1)
    expect(leading.state.finance.stocks[1]?.ceoId).toBe(2)
  })
})
