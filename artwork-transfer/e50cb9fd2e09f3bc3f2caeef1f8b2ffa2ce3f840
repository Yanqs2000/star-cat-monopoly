import type { FinanceEntry, FinanceState } from './finance-types'
import { randomInt, type RandomResult } from './random'

export function drawStockRandom(state: number, bound: number): RandomResult {
  if (!Number.isFinite(bound)) throw new Error('股票随机上界无效')
  // The controlled AVM1 probe returned zero for nonpositive bounds. A draw still
  // advances the modern deterministic stream so each source call has one slot.
  return randomInt(state, Math.max(1, Math.trunc(bound)))
}

export function advanceStockPrices(
  source: FinanceState,
  cadence: { crossedMonth: boolean; crossedWeek: boolean },
  rngState: number,
  draw: (state: number, bound: number) => RandomResult = drawStockRandom,
): { finance: FinanceState; rngState: number; entries: FinanceEntry[] } {
  const stocks = source.stocks.map(stock => ({ ...stock }))
  const entries: FinanceEntry[] = []
  const take = (bound: number) => {
    const result = draw(rngState, bound)
    rngState = result.nextState
    return result.value
  }

  if (cadence.crossedMonth) {
    for (let id = 1; id <= 12; id += 1) {
      const stock = stocks[id]!
      const value = stock.factorB + (take(2) !== 0 ? -0.25 : 0.25)
      stock.factorB = value < 0.5 ? 0.68 : value > 2 ? 1.68 : value
    }
  }
  if (cadence.crossedWeek) {
    for (let id = 1; id <= 12; id += 1) {
      const stock = stocks[id]!
      const value = stock.factorA + take(100 * (stock.factorB - stock.factorA)) / 100 +
        (take(2) !== 0 ? -0.1 : 0.1)
      stock.factorA = value < 0.5 ? 0.68 : value > 2 ? 1.68 : value
    }
  }
  for (let id = 1; id <= 12; id += 1) {
    const stock = stocks[id]!
    const previous = stock.price
    const factor = stock.factorA + take(100 * (stock.factorB - stock.factorA)) / 100 +
      (take(2) !== 0 ? -0.05 : 0.01)
    stock.previousPrice = previous
    stock.price = Math.trunc(stock.basePrice * factor * 100) / 100
    stock.change = Math.trunc(100 * (stock.price - previous)) / 100
    if (stock.price > stock.high) stock.high = stock.price
    else if (stock.price < stock.low) stock.low = stock.price
    stock.dailyBuyLimit = stock.poolBandValue >= 2000 ? 500 + take(2000) :
      stock.poolBandValue > 200 ? 300 + take(1200) : take(200)
    entries.push({ kind: 'stock-price', companyId: id, priceBefore: previous, priceAfter: stock.price })
  }
  return {
    finance: { ...source, stocks, entries: [...source.entries, ...entries] },
    rngState,
    entries,
  }
}
