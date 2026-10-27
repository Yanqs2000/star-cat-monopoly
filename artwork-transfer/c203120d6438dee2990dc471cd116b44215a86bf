import type { FinanceEntry, StockCompany } from './finance-types'
import type { GameState } from './types'

export interface FinanceActionResult {
  state: GameState
  entry: FinanceEntry | null
  error: string | null
}

export function rejectFinance(source: GameState, error: string): FinanceActionResult {
  return { state: source, entry: null, error }
}

export function submitFinance(
  source: GameState, playerId: number, company: StockCompany, cashDelta: number,
  entry: FinanceEntry,
): FinanceActionResult {
  const players = source.players.map(player => player.id === playerId ? { ...player, cash: player.cash + cashDelta } : player)
  const stocks = source.finance.stocks.slice()
  stocks[company.id] = company
  const finance = { ...source.finance, stocks, entries: [...source.finance.entries, entry] }
  return { state: { ...source, players, finance }, entry, error: null }
}

export function buyCeo(stock: StockCompany, playerId: number): void {
  const shares = stock.holdings[playerId]?.shares ?? 0
  if (Object.entries(stock.holdings).every(([id, holding]) => Number(id) === playerId || shares > holding.shares)) {
    stock.ceoId = playerId
  }
}

export function maxStockBuy(source: GameState, playerId: number, companyId: number): number {
  const player = source.players.find(value => value.id === playerId)
  const stock = source.finance.stocks[companyId]
  if (!player || !stock || companyId < 1 || companyId > 12 || stock.price <= 0) return 0
  return Math.max(0, Math.min(Math.trunc(player.cash / stock.price), stock.dailyBuyLimit))
}

export function buyStock(source: GameState, playerId: number, companyId: number, shares: number): FinanceActionResult {
  const stock = source.finance.stocks[companyId]
  const player = source.players.find(value => value.id === playerId)
  if (!player || !stock || companyId < 1 || companyId > 12) return rejectFinance(source, '该公司不能在股市交易')
  if (!Number.isInteger(shares) || shares <= 0) return rejectFinance(source, '股数必须为正整数')
  if (shares > maxStockBuy(source, playerId, companyId)) return rejectFinance(source, '现金或当日可买量不足')
  const amount = stock.price * shares
  const cashDelta = -Math.trunc(amount)
  const company = { ...stock, holdings: { ...stock.holdings } }
  const old = stock.holdings[playerId]!
  const nextShares = old.shares + shares
  company.holdings[playerId] = {
    shares: nextShares,
    averageCost: Math.trunc(100 * (amount + old.shares * old.averageCost) / nextShares) / 100,
  }
  company.dailyBuyLimit -= shares
  company.poolBandValue -= shares
  buyCeo(company, playerId)
  const entry = { kind: 'stock-buy', playerId, companyId, sourceAmount: Math.round(amount * 100) / 100,
    cashDelta, sharesDelta: shares }
  return submitFinance(source, playerId, company, cashDelta, entry)
}

export function sellStock(source: GameState, playerId: number, companyId: number, shares: number): FinanceActionResult {
  const stock = source.finance.stocks[companyId]
  if (!source.players.some(value => value.id === playerId) || !stock || companyId < 1 || companyId > 12) {
    return rejectFinance(source, '该公司不能在股市交易')
  }
  if (!Number.isInteger(shares) || shares <= 0) return rejectFinance(source, '股数必须为正整数')
  const old = stock.holdings[playerId]!
  if (old.shares < shares) return rejectFinance(source, '持股不足')
  const amount = stock.price * shares
  const cashDelta = Math.trunc(amount)
  const company = { ...stock, holdings: { ...stock.holdings } }
  company.holdings[playerId] = { ...old, shares: old.shares - shares }
  company.dailyBuyLimit += shares
  company.poolBandValue += shares
  if (company.ceoId === playerId) {
    let maximum = company.holdings[playerId]!.shares
    let successor: number | null = null
    for (const [id, holding] of Object.entries(company.holdings)) {
      if (Number(id) !== playerId && holding.shares > maximum) {
        maximum = holding.shares
        successor = Number(id)
      }
    }
    if (successor !== null || maximum === 0) company.ceoId = successor
  }
  const entry = { kind: 'stock-sell', playerId, companyId, sourceAmount: Math.round(amount * 100) / 100,
    cashDelta, sharesDelta: -shares }
  return submitFinance(source, playerId, company, cashDelta, entry)
}
