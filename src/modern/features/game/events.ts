import catalog from '../../data/events.json'
import type { GridPoint } from '../map/types'
import { randomInt } from './random'

export interface EventWallet {
  cash: number
  deposit: number
  tickets: number
}

export type LostAndFoundFunds = [number, number]

export interface LuckEvent {
  id: number
  kind: 'cash' | 'tickets'
  description: string
  sourceAmount: number
  amount: number
  correction?: 'B-01'
}

export interface SpecialLanding {
  id: number
  position: GridPoint
  kind: 'shop' | 'card' | 'luck' | 'tickets'
  ticketAmount?: number
}

const eventById = new Map((catalog.events as LuckEvent[]).map(event => [event.id, event]))
const landingByPosition = new Map((catalog.landings as SpecialLanding[])
  .map(landing => [`${landing.position.column},${landing.position.row}`, landing]))

export function getLuckEvent(id: number): LuckEvent {
  if (!Number.isInteger(id)) throw new Error('运气事件ID必须是整数')
  const event = eventById.get(id)
  if (!event) throw new Error(`不存在运气事件 ${id}`)
  return { ...event }
}

export function drawLuckEvent(rngState: number): { event: LuckEvent; rngState: number } {
  const draw = randomInt(rngState, 41)
  return { event: getLuckEvent(draw.value + 1), rngState: draw.nextState }
}

export function findSpecialLanding(position: GridPoint): SpecialLanding | undefined {
  const landing = landingByPosition.get(`${position.column},${position.row}`)
  return landing ? { ...landing, position: { ...landing.position } } : undefined
}

export function applyLuckEvent(wallet: EventWallet, eventId: number, funds: LostAndFoundFunds): {
  wallet: EventWallet
  lostAndFoundFunds: LostAndFoundFunds
  event: LuckEvent
  insolvent: boolean
} {
  const event = getLuckEvent(eventId)
  const nextWallet = { ...wallet }
  const lostAndFoundFunds: LostAndFoundFunds = [...funds]
  if (event.kind === 'cash') {
    nextWallet.cash += event.amount
    if (event.amount < 0) {
      const loss = -event.amount
      lostAndFoundFunds[0] += loss
      lostAndFoundFunds[1] += loss
    }
  } else {
    nextWallet.tickets += event.amount
  }
  return {
    wallet: nextWallet,
    lostAndFoundFunds,
    event,
    insolvent: nextWallet.cash + nextWallet.deposit <= 0,
  }
}

export function applyTicketLanding(wallet: EventWallet, position: GridPoint): { wallet: EventWallet; amount: number } {
  const landing = findSpecialLanding(position)
  if (landing?.kind !== 'tickets' || landing.ticketAmount === undefined) throw new Error('当前位置不是可达奖券格')
  return {
    wallet: { ...wallet, tickets: wallet.tickets + landing.ticketAmount },
    amount: landing.ticketAmount,
  }
}
