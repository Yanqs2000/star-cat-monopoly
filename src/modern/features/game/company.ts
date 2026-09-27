import { buyCeo, rejectFinance, submitFinance, type FinanceActionResult } from './stock-trading'
import type { GameState } from './types'
import type { FinanceState } from './finance-types'
import type { GridPoint } from '../map/types'
import { getCardCell } from './direct-cards'

export function companyAtPosition(finance: FinanceState, position: GridPoint): number | null {
  const recordId = getCardCell(position)?.id
  if (recordId === undefined || recordId < 113 || recordId > 133 || (recordId - 113) % 3 === 2) return null
  const mainRecordId = 115 + 3 * Math.floor((recordId - 113) / 3)
  return finance.stocks.find(stock => stock.mainRecordId === mainRecordId)?.id ?? null
}

export function maxCompanySubscription(source: GameState, playerId: number, companyId: number): number {
  const player = source.players.find(value => value.id === playerId)
  const company = source.finance.stocks[companyId]
  if (!player || !company || companyId < 1 || companyId > 15 || company.basePrice <= 0) return 0
  return Math.max(0, Math.min(1000, company.offerShares, Math.trunc(player.cash / company.basePrice)))
}

export function subscribeCompany(source: GameState, playerId: number, companyId: number, shares: number): FinanceActionResult {
  const company = source.finance.stocks[companyId]
  if (!company || companyId < 1 || companyId > 15) return rejectFinance(source, '公司不存在')
  if (!Number.isInteger(shares) || shares <= 0) return rejectFinance(source, '股数必须为正整数')
  if (shares > maxCompanySubscription(source, playerId, companyId)) return rejectFinance(source, '现金或公司待认购股数不足')
  const amount = company.basePrice * shares
  const old = company.holdings[playerId]!
  const nextShares = old.shares + shares
  const updated = { ...company, holdings: { ...company.holdings }, offerShares: company.offerShares - shares }
  updated.holdings[playerId] = {
    shares: nextShares,
    averageCost: Math.trunc(100 * (amount + old.shares * old.averageCost) / nextShares) / 100,
  }
  buyCeo(updated, playerId)
  const entry = { kind: 'company-subscribe', playerId, companyId, sourceAmount: amount,
    cashDelta: -amount, sharesDelta: shares }
  return submitFinance(source, playerId, updated, -amount, entry)
}

export function chargeCompany(source: GameState, playerId: number, companyId: number, multiplier: number): FinanceActionResult {
  const player = source.players.find(value => value.id === playerId)
  const company = source.finance.stocks[companyId]
  if (!player || !company || companyId < 1 || companyId > 15) return rejectFinance(source, '公司不存在')
  if (!Number.isInteger(multiplier) || multiplier < 0) return rejectFinance(source, '公司费用倍数无效')
  if (company.ceoId === null || company.ceoId === playerId || multiplier === 0) {
    return { state: source, entry: null, error: null }
  }
  const fee = company.mainRecordId === 115 ? 600 : company.mainRecordId === 121 ? 700 : 500
  const amount = fee * multiplier
  const cashPaid = Math.min(player.cash, amount)
  const cashDelta = -cashPaid
  const depositDelta = -(amount - cashPaid)
  const players = source.players.map(value => value.id === playerId
    ? { ...value, cash: value.cash + cashDelta, deposit: value.deposit + depositDelta } : value)
  const stocks = source.finance.stocks.slice()
  stocks[companyId] = { ...company, profit: company.profit + amount }
  const entry = { kind: 'company-fee', playerId, companyId, sourceAmount: amount, cashDelta, depositDelta }
  const finance = { ...source.finance, stocks, entries: [...source.finance.entries, entry] }
  return { state: { ...source, players, finance }, entry, error: null }
}
