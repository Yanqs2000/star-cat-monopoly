import type { ActivityReceipt } from './activity-types'
import { cloneWorldSnapshot, type WorldSnapshot } from './world-cards'

export type TicketExchangeMode = 'buy' | 'sell'
export interface ActivityResult {
  snapshot: WorldSnapshot
  receipt: ActivityReceipt | null
  error: string | null
}

export function ticketExchangeMaximum(source: WorldSnapshot, playerId: number, mode: TicketExchangeMode): number {
  const player = source.players.find(value => value.id === playerId)
  if (!player) return 0
  return Math.max(0, Math.min(100, mode === 'buy' ? Math.trunc(player.cash / 100) : source.tickets[playerId]!))
}

export function exchangeTickets(source: WorldSnapshot, playerId: number, mode: TicketExchangeMode, quantity: number): ActivityResult {
  if (!source.players.some(value => value.id === playerId) || !['buy', 'sell'].includes(mode) ||
      !Number.isInteger(quantity) || quantity < 0 || quantity > ticketExchangeMaximum(source, playerId, mode)) {
    return { snapshot: source, receipt: null, error: '兑换数量必须为本次上限内的整数' }
  }
  if (quantity === 0) return { snapshot: source,
    receipt: { kind: `ticket-${mode}`, sourceAmount: 0, cashDelta: 0, ticketDelta: 0 }, error: null }
  const snapshot = cloneWorldSnapshot(source)
  const money = quantity * 100
  const sign = mode === 'buy' ? -1 : 1
  snapshot.players.find(value => value.id === playerId)!.cash += money * sign
  snapshot.tickets[playerId]! -= quantity * sign
  return { snapshot, receipt: { kind: `ticket-${mode}`, sourceAmount: money,
    cashDelta: money * sign, ticketDelta: -quantity * sign }, error: null }
}

export function claimLostFunds(source: WorldSnapshot, playerId: number): ActivityResult {
  const snapshot = cloneWorldSnapshot(source)
  const amount = snapshot.lostAndFoundFunds[0]
  const funds: [number, number] = [-snapshot.lostAndFoundFunds[0], -snapshot.lostAndFoundFunds[1]]
  const player = snapshot.players.find(value => value.id === playerId)
  if (!player) return { snapshot: source, receipt: null, error: '玩家不存在' }
  player.cash += amount
  snapshot.lostAndFoundFunds = [0, 0]
  return { snapshot, receipt: { kind: 'lost-found', sourceAmount: amount,
    cashDelta: amount, lostAndFoundDeltas: funds }, error: null }
}
