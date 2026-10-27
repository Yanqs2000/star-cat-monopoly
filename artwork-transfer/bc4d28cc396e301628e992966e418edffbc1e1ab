import type { FinanceEntry } from './finance-types'
import type { GameState } from './types'
import { randomInt, type RandomResult } from './random'

export function settleMonth(
  source: GameState,
  draw: (state: number, bound: number) => RandomResult = randomInt,
): { state: GameState; settled: boolean; entries: FinanceEntry[] } {
  const key = `${source.world.year}-${source.world.month}`
  if (source.world.day !== 1 || source.finance.lastSettledMonth === key) {
    return { state: source, settled: false, entries: [] }
  }
  const players = source.players.map(player => ({ ...player }))
  const credit = Object.fromEntries(Object.entries(source.credit).map(([id, value]) => [id, { ...value }]))
  const finance = {
    ...source.finance,
    stocks: source.finance.stocks.map(stock => ({ ...stock })),
    loans: { ...source.finance.loans },
    lastSettledMonth: key,
  }
  const entries: FinanceEntry[] = []
  const pay = (player: typeof players[number], amount: number) => {
    const depositPaid = Math.min(player.deposit, amount)
    player.deposit -= depositPaid
    player.cash -= amount - depositPaid
    return { cashDelta: -(amount - depositPaid), depositDelta: -depositPaid }
  }

  for (let id = 1; id <= 15; id += 1) {
    const stock = finance.stocks[id]!
    if (stock.profit <= 0) continue
    const profit = stock.profit
    const totalShares = players.reduce((sum, player) => sum + (stock.holdings[player.id]?.shares ?? 0), 0)
    if (totalShares === 0) {
      entries.push({ kind: 'company-undistributed-profit', companyId: id, sourceAmount: profit })
      stock.profit = 0
      continue
    }
    for (const player of players) {
      const shares = stock.holdings[player.id]?.shares ?? 0
      const dividend = Math.trunc(profit * shares / totalShares)
      const amount = shares + Math.max(0, dividend)
      if (amount > 0) {
        player.deposit += amount
        entries.push({ kind: 'company-distribution', playerId: player.id, companyId: id,
          sourceAmount: profit, depositDelta: amount })
      }
    }
    stock.profit = 0
  }

  for (const player of players) {
    const account = credit[player.id]!
    if (account.used <= 0) continue
    const amount = account.used <= 10000 ? account.used : Math.trunc(account.used / 2)
    const availableBefore = account.available
    account.used -= amount
    account.available = account.used === 0 ? 100000 : account.available + amount
    entries.push({ kind: 'credit-monthly-payment', playerId: player.id, sourceAmount: amount,
      creditUsedDelta: -amount, creditAvailableDelta: account.available - availableBefore,
      ...pay(player, amount) })
  }
  for (const player of players) {
    const loan = finance.loans[player.id] ?? 0
    if (loan <= 0) continue
    const amount = Math.min(loan, 10000)
    finance.loans[player.id] = loan - amount
    entries.push({ kind: 'loan-monthly-payment', playerId: player.id, sourceAmount: amount,
      loanDelta: -amount, ...pay(player, amount) })
  }
  for (const player of players) {
    if (player.deposit <= 0) continue
    const amount = Math.trunc(player.deposit / 10)
    player.deposit += amount
    entries.push({ kind: 'deposit-interest', playerId: player.id, sourceAmount: amount,
      depositDelta: amount })
  }
  finance.entries = [...source.finance.entries, ...entries]
  const quote = draw(source.rngState, 15)
  finance.monthlyQuoteIndex = quote.value
  return { state: { ...source, players, credit, finance, rngState: quote.nextState }, settled: true, entries }
}
