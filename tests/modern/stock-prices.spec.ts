import { describe, expect, it } from 'vitest'
import { createGame } from '../../src/modern/features/game/setup'
import { advanceStockPrices, drawStockRandom } from '../../src/modern/features/game/stock-prices'

describe('原版股票价格推进', () => {
  it('日更每家公司按因子、方向、可买量各抽一次，并按原版取整', () => {
    const game = createGame([1, 2, 3, 4], 1)
    const stock = game.finance.stocks[1]!
    Object.assign(stock, { basePrice: 20, previousPrice: 21, price: 21, high: 21,
      low: 20, factorA: 1, factorB: 1.5, poolBandValue: 5000 })
    const bounds: number[] = []
    const result = advanceStockPrices(game.finance, { crossedMonth: false, crossedWeek: false }, 0,
      (state, bound) => {
        bounds.push(bound)
        return { value: [25, 1, 999][bounds.length - 1] ?? 0, nextState: state + 1 }
      })
    expect(bounds).toHaveLength(36)
    expect(bounds.slice(0, 3)).toEqual([50, 2, 2000])
    expect(result.finance.stocks[1]).toMatchObject({ previousPrice: 21, price: 24,
      change: 3, high: 24, low: 20, dailyBuyLimit: 1499 })
    expect(result.rngState).toBe(36)
    expect(game.finance.stocks[1]?.price).toBe(21)
  })

  it('跨月且跨周时先月更 12 次、再周更 24 次、最后日更 36 次', () => {
    const game = createGame([1, 2, 3, 4], 1)
    const bounds: number[] = []
    const result = advanceStockPrices(game.finance, { crossedMonth: true, crossedWeek: true }, 0,
      (state, bound) => { bounds.push(bound); return { value: 0, nextState: state + 1 } })
    expect(bounds).toHaveLength(72)
    expect(bounds.slice(0, 12)).toEqual(Array(12).fill(2))
    expect(bounds[12]).toBe(75)
    expect(bounds[13]).toBe(2)
    expect(result.rngState).toBe(72)
    expect(result.finance.stocks[0]).toEqual(game.finance.stocks[0])
    expect(result.finance.stocks[13]).toEqual(game.finance.stocks[13])
  })

  it('负随机上界保持 0，不将区间反转或取绝对值', () => {
    expect(drawStockRandom(1, -50).value).toBe(0)
    expect(drawStockRandom(1, 0).value).toBe(0)
    const game = createGame([1, 2, 3, 4], 1)
    const stock = game.finance.stocks[7]!
    Object.assign(stock, { factorA: 1, factorB: 0.5, basePrice: 20, price: 20 })
    const result = advanceStockPrices(game.finance, { crossedMonth: false, crossedWeek: false }, 1)
    expect(result.finance.stocks[7]!.price).toBeGreaterThan(0)
  })
})
