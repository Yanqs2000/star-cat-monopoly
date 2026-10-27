import type { GameState } from './types'

export interface BankruptcyReceipt {
  playerId: number
  cashBefore: number
  depositBefore: number
  loanBefore: number
  creditUsedBefore: number
  sharesReturned: Record<number, number>
  propertyIds: number[]
  round: number
}
export interface GameOutcome { kind: 'victory' | 'defeat'; winnerId: number | null }

/** Original delplayer: discard funds/cards; return stock supply; release land without demolishing. */
export function settleBankruptcy(source: GameState, playerId: number): GameState {
  const player = source.players.find(player => player.id === playerId)
  if (!player || source.eliminatedPlayerIds.includes(playerId) || player.cash + player.deposit > 0) return source
  const receipt: BankruptcyReceipt = { playerId, cashBefore: player.cash, depositBefore: player.deposit,
    loanBefore: source.finance.loans[playerId]!, creditUsedBefore: source.credit[playerId]!.used,
    sharesReturned: {}, propertyIds: [], round: source.round }
  const stocks = source.finance.stocks.map(stock => {
    if (stock.id === 0) return stock
    const holding = stock.holdings[playerId]!
    receipt.sharesReturned[stock.id] = holding.shares
    const updated = { ...stock, holdings: { ...stock.holdings, [playerId]: { shares: 0, averageCost: 0 } } }
    if (stock.ceoId === playerId) {
      let largest = 0
      updated.ceoId = null
      for (const candidate of source.players) {
        if (candidate.id === playerId || source.eliminatedPlayerIds.includes(candidate.id)) continue
        const shares = stock.holdings[candidate.id]!.shares
        if (shares > largest) { largest = shares; updated.ceoId = candidate.id }
      }
    }
    if (stock.id >= 13) updated.offerShares += holding.shares
    else if (stock.kind === 2) {
      const capacity = 5000 - stock.offerShares
      updated.offerShares = Math.min(5000, stock.offerShares + holding.shares)
      updated.poolBandValue += Math.max(0, holding.shares - capacity)
    } else updated.poolBandValue += holding.shares
    return updated
  })
  const properties = { ...source.properties }
  for (const [id, property] of Object.entries(properties)) if (property.ownerId === playerId) {
    properties[Number(id)] = { ...property, ownerId: null }; receipt.propertyIds.push(Number(id))
  }
  const finance = { ...source.finance, stocks, loans: { ...source.finance.loans, [playerId]: 0 },
    entries: [...source.finance.entries, { kind: 'bankruptcy', playerId, cashDelta: -player.cash,
      depositDelta: -player.deposit, loanDelta: -receipt.loanBefore, creditUsedDelta: -receipt.creditUsedBefore }] }
  const pendingControl = { ...source.pendingControl }; delete pendingControl[playerId]
  return { ...source, finance, properties, pendingControl,
    players: source.players.map(value => value.id === playerId ? { ...value, cash: 0, deposit: 0 } : value),
    inventories: { ...source.inventories, [playerId]: [] }, tickets: { ...source.tickets, [playerId]: 0 },
    credit: { ...source.credit, [playerId]: { used: 0, available: 0, score: 0 } },
    forcedDice: { ...source.forcedDice, [playerId]: null }, stayPlayerIds: source.stayPlayerIds.filter(id => id !== playerId),
    eliminatedPlayerIds: [...source.eliminatedPlayerIds, playerId], bankruptcyReceipts: [...source.bankruptcyReceipts, receipt] }
}

export function getOutcome(source: GameState): GameOutcome | null {
  const living = source.players.filter(player => !source.eliminatedPlayerIds.includes(player.id))
  if (living.every(player => player.controller === 'ai')) return { kind: 'defeat', winnerId: null }
  if (living.length === 1) return { kind: 'victory', winnerId: living[0]!.id }
  return null
}

export function applyPendingControl(source: GameState): GameState {
  if (Object.keys(source.pendingControl).length === 0) return source
  return { ...source, pendingControl: {}, players: source.players.map(player => {
    const requested = source.pendingControl[player.id]
    return requested && !source.eliminatedPlayerIds.includes(player.id) ? { ...player, controller: requested } : player
  }) }
}
