import { ECONOMY } from '../config/economy'
import { STOCKS, getStock } from '../config/stocks'
import type { StockState, StockSymbol } from '../types'
import type { Rng } from '../engine/rng'

/**
 * 股市：带均值回归的随机游走。
 *
 *   新价 = 现价 × (1 + 回归项 + 随机波动)
 *
 * 回归项把价格往基准价拉，避免某只股票涨到天上或跌到归零；
 * 随机波动幅度由每只股票的 volatility 决定。
 */

export function initialStockState(): Record<StockSymbol, StockState> {
  return Object.fromEntries(
    STOCKS.map((s) => [s.symbol, { price: s.basePrice, prevPrice: s.basePrice }]),
  )
}

export interface PriceMove {
  symbol: StockSymbol
  name: string
  from: number
  to: number
  changeRatio: number
}

/** 推进一个交易日，就地修改 stocks */
export function advancePrices(stocks: Record<StockSymbol, StockState>, rng: Rng): PriceMove[] {
  const moves: PriceMove[] = []
  for (const def of STOCKS) {
    const state = stocks[def.symbol]
    if (!state) continue

    const from = state.price
    const meanReversion = ((def.basePrice - from) / def.basePrice) * 0.06
    const swing = rng.float(-def.volatility, def.volatility)

    let next = from * (1 + meanReversion + swing)
    // 价格护栏：不低于基准价的 20%，不高于 5 倍
    next = Math.min(def.basePrice * 5, Math.max(def.basePrice * 0.2, next))
    next = Math.max(1, Math.round(next * 100) / 100)

    state.prevPrice = from
    state.price = next
    moves.push({
      symbol: def.symbol,
      name: def.name,
      from,
      to: next,
      changeRatio: from === 0 ? 0 : (next - from) / from,
    })
  }
  return moves
}

/** 买入所需金额（含手续费） */
export function buyCost(shares: number, price: number): number {
  return Math.round(shares * price * (1 + ECONOMY.STOCK_FEE_RATE))
}

/** 卖出所得（扣手续费） */
export function sellProceeds(shares: number, price: number): number {
  return Math.round(shares * price * (1 - ECONOMY.STOCK_FEE_RATE))
}

/** 股价涨跌幅的展示格式 */
export function formatChange(ratio: number): string {
  const pct = (ratio * 100).toFixed(2)
  return `${ratio >= 0 ? '+' : ''}${pct}%`
}

export { getStock }
