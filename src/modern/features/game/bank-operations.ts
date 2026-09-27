import type { GameState } from './types'
import type { FinanceActionResult } from './stock-trading'
import type { FinanceEntry } from './finance-types'
import type { RandomResult } from './random'
import { randomInt } from './random'
import { rejectFinance } from './stock-trading'

export type BankOperation = 'withdraw' | 'deposit' | 'borrow' | 'repay-loan' | 'apply-credit' | 'repay-credit'

export function applyBankOperation(source: GameState, playerId: number, operation: BankOperation, amount: number): FinanceActionResult {
  const player = source.players.find(value => value.id === playerId)
  const account = source.credit[playerId]
  if (!player || !account) return rejectFinance(source, '银行账户不存在')
  if (player.controller === 'human' && source.world.weekday === 0) return rejectFinance(source, '银行周日休息')
  if (!Number.isInteger(amount) || amount < 0) return rejectFinance(source, '银行金额必须是非负整数')
  if (operation === 'apply-credit') {
    if (account.score < 50 || account.used !== 0 || account.available !== 0 ||
        source.inventories[playerId] === undefined || source.inventories[playerId]!.length >= 24) {
      return rejectFinance(source, '不符合信用卡申请条件')
    }
    const credit = { ...source.credit, [playerId]: { ...account, available: 100000 } }
    const inventories = { ...source.inventories, [playerId]: [1, ...source.inventories[playerId]!] }
    const entry = { kind: 'credit-granted', playerId, sourceAmount: 100000 }
    const finance = { ...source.finance, entries: [...source.finance.entries, entry] }
    return { state: { ...source, credit, inventories, finance }, entry, error: null }
  }

  const loan = source.finance.loans[playerId] ?? 0
  const maximum = operation === 'withdraw' ? player.deposit :
    operation === 'deposit' ? player.cash :
    operation === 'borrow' ? (account.score > 0 && loan === 0 ? account.score * 1000 : -1) :
    operation === 'repay-loan' ? (loan > 0 && player.cash > 0 ? Math.min(loan, player.cash) : -1) :
    operation === 'repay-credit' ? ((account.used > 0 || account.available > 0) && player.cash > 0
      ? Math.min(account.used, player.cash) : -1) : -1
  if (maximum < 0 || (maximum === 0 && operation !== 'repay-credit') || amount > maximum) {
    return rejectFinance(source, '银行操作资格或余额不足')
  }
  if (amount === 0) return { state: source, entry: null, error: null }

  const cashDelta = operation === 'withdraw' || operation === 'borrow' ? amount : -amount
  const depositDelta = operation === 'withdraw' ? -amount : operation === 'deposit' ? amount : 0
  const loanDelta = operation === 'borrow' ? amount : operation === 'repay-loan' ? -amount : 0
  const players = source.players.map(value => value.id === playerId
    ? { ...value, cash: value.cash + cashDelta, deposit: value.deposit + depositDelta } : value)
  const credit = operation === 'repay-credit' ? { ...source.credit,
    [playerId]: { ...account, used: account.used - amount, available: account.available + amount } } : source.credit
  const loans = loanDelta === 0 ? source.finance.loans : { ...source.finance.loans, [playerId]: loan + loanDelta }
  const entry: FinanceEntry = { kind: ({ withdraw: 'bank-withdraw', deposit: 'bank-deposit',
    borrow: 'bank-borrow', 'repay-loan': 'bank-repay-loan', 'repay-credit': 'bank-repay-credit' } as Record<string, string>)[operation]!,
    playerId, sourceAmount: amount, cashDelta, depositDelta, loanDelta }
  const finance = { ...source.finance, loans, entries: [...source.finance.entries, entry] }
  return { state: { ...source, players, credit, finance }, entry, error: null }
}

export function applyAiBankVisit(
  source: GameState, playerId: number, level: number, priceId = 1,
  draw: (state: number, bound: number) => RandomResult = randomInt,
): { state: GameState; entries: FinanceEntry[]; error: string | null } {
  const original = source.players.find(value => value.id === playerId)
  if (!original || original.controller !== 'ai' || !Number.isInteger(level) || level < 0 ||
      !Number.isInteger(priceId) || priceId < 1) {
    return { state: source, entries: [], error: 'AI 银行参数无效' }
  }
  const player = { ...original }
  const players = source.players.map(value => value.id === playerId ? player : value)
  const account = { ...source.credit[playerId]! }
  const credit = { ...source.credit, [playerId]: account }
  const inventory = [...source.inventories[playerId]!]
  const inventories = { ...source.inventories, [playerId]: inventory }
  const loans = { ...source.finance.loans }
  const entries: FinanceEntry[] = []
  let rngState = source.rngState

  if (level > 2 && (loans[playerId] ?? 0) === 0) {
    loans[playerId] = 100000
    player.cash += 100000
    entries.push({ kind: 'bank-borrow', playerId, sourceAmount: 100000, cashDelta: 100000, loanDelta: 100000 })
  }
  if (level > 1 && inventory[0] !== 1 && inventory.length < 24) {
    inventory.unshift(1)
    account.available = 100000
    entries.push({ kind: 'credit-granted', playerId, sourceAmount: 100000 })
  }
  if (level > 0) {
    const total = player.cash + player.deposit
    let nextCash: number
    if (total > priceId * 300000) {
      const result = draw(rngState, 30000); rngState = result.nextState
      nextCash = priceId * 100000 + result.value
    } else if (total > priceId * 200000) {
      const result = draw(rngState, 20000); rngState = result.nextState
      nextCash = priceId * 80000 + result.value
    } else if (total > priceId * 100000) {
      const result = draw(rngState, 20000); rngState = result.nextState
      nextCash = priceId * 50000 + result.value
    } else if (total > priceId * 40000) {
      const result = draw(rngState, 10000); rngState = result.nextState
      nextCash = priceId * 30000 + result.value
    } else {
      nextCash = total
    }
    const cashDelta = nextCash - player.cash
    player.cash = nextCash
    player.deposit = total - nextCash
    if (cashDelta !== 0) entries.push({ kind: 'ai-bank-transfer', playerId, sourceAmount: total,
      cashDelta, depositDelta: -cashDelta })
  }
  const finance = { ...source.finance, loans, entries: [...source.finance.entries, ...entries] }
  return { state: { ...source, players, credit, inventories, finance, rngState }, entries, error: null }
}
