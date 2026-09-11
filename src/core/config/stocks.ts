import type { StockDef, StockSymbol } from '../types'

/**
 * 股市。原版攻略提到的股票名有「中华饭店」「娱乐周刊」「鹊桥纺织」，
 * 这里沿用同名并补齐到 6 只，波动率拉开档次。
 */
export const STOCKS: readonly StockDef[] = [
  { symbol: 'ZHHF', name: '中华饭店', basePrice: 120, volatility: 0.06 },
  { symbol: 'YLZK', name: '娱乐周刊', basePrice: 45, volatility: 0.12 },
  { symbol: 'QQFZ', name: '鹊桥纺织', basePrice: 68, volatility: 0.09 },
  { symbol: 'XMDT', name: '星猫地产', basePrice: 210, volatility: 0.05 },
  { symbol: 'YHTX', name: '银河通信', basePrice: 95, volatility: 0.1 },
  { symbol: 'JGTY', name: '极光体育', basePrice: 33, volatility: 0.15 },
]

export const STOCK_BY_SYMBOL: Readonly<Record<StockSymbol, StockDef>> = Object.fromEntries(
  STOCKS.map((s) => [s.symbol, s]),
)

export function getStock(symbol: StockSymbol): StockDef {
  const s = STOCK_BY_SYMBOL[symbol]
  if (!s) throw new Error(`未知股票: ${symbol}`)
  return s
}
