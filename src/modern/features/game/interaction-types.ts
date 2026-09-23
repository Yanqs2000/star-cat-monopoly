import type { ShopState } from './card-economy'
import type { DirectCardChoice } from './direct-cards'
import type { LuckEvent } from './events'
import type { WorldEvent } from './world-cards'

export type InteractionResume =
  | 'await-roll'
  | 'after-bank'
  | 'after-marker'
  | 'after-god'
  | 'end-turn'
  | 'shop'
  | 'bank'

export type NoticeKind = 'card' | 'world' | 'bank' | 'shop' | 'card-draw' | 'luck' | 'tickets' | 'restriction'

export interface InteractionNotice {
  kind: NoticeKind
  message: string
  cardId?: number
  eventKind?: string
  amount?: number
  npcId?: number
  affectedPlayerIds?: number[]
  affectedCellIds?: number[]
  cardIds?: number[]
  luckEvent?: LuckEvent
}

interface CardInteractionBase {
  playerId: number
  cardId: number
  cardIndex: number
  resume: 'await-roll'
}

export type GameInteraction =
  | (CardInteractionBase & { kind: 'card-confirm'; choiceError: string | null })
  | (CardInteractionBase & { kind: 'dice-choice'; choiceError: string | null })
  | (CardInteractionBase & { kind: 'target-choice'; choiceError: string | null })
  | (CardInteractionBase & { kind: 'credit-choice'; choiceError: string | null })
  | { kind: 'shop'; playerId: number; shop: ShopState; resume: 'shop' }
  | { kind: 'bank'; playerId: number; resume: 'after-bank' }
  | {
      kind: 'notice'
      playerId: number
      notice: InteractionNotice
      resume: InteractionResume
      shop?: ShopState
    }

export interface InteractionEvent {
  kind: NoticeKind
  playerId: number
  cardId?: number
  consumed?: boolean
  status?: 'applied' | 'invalid-target'
  reason?: string | null
  amount?: number
  affectedPlayerIds?: number[]
  affectedCellIds?: number[]
  cardIds?: number[]
  worldEvent?: WorldEvent | null
  luckEvent?: LuckEvent
  shopAction?: 'bought' | 'sold' | 'sold-out' | 'insufficient-tickets' | 'inventory-full'
}

export type CardChoice = DirectCardChoice
