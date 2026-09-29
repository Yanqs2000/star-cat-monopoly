import type { CarnivalGame } from './carnival'
import type { LudoGame } from './ludo'
import type { ShopState } from './card-economy'
import type { DirectCardChoice } from './direct-cards'
import type { LuckEvent } from './events'
import type { WorldEvent } from './world-cards'
import type { FinanceEntry } from './finance-types'
import type { ActivityReceipt, ActivityPresentation } from './activity-types'
import type { TicketExchangeMode } from './ticket-exchange'
import type { PortalFlight, PortalHead } from './portal'
import type { CourtVerdict } from './court'
import type { GridPoint } from '../map/types'

export type InteractionResume =
  | 'await-roll'
  | 'after-bank'
  | 'after-stock'
  | 'after-marker'
  | 'after-god'
  | 'end-turn'
  | 'shop'
  | 'bank'
  | 'stock'
  | 'company'

export type NoticeKind = 'card' | 'world' | 'bank' | 'stock' | 'company' | 'shop' | 'card-draw' | 'luck' | 'tickets' | 'restriction' | 'activity'

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
  financeEntry?: FinanceEntry
  receipt?: ActivityReceipt
}

interface CardInteractionBase {
  playerId: number
  cardId: number
  cardIndex: number
  resume: 'await-roll'
}

export type GameInteraction =
  | { kind:'carnival';playerId:number;game:CarnivalGame }
  | { kind:'ludo';playerId:number;game:LudoGame }
  | { kind: 'npc-opening'; playerId: number; npcId: 1; cellId: number; presentation: ActivityPresentation }
  | { kind: 'portal'; playerId: number; stage: 'choice' | 'flight'; destination?: number; flight?: PortalFlight; heads?: PortalHead[]; choiceFrames?: number; error?: string | null; presentation?: ActivityPresentation }
  | { kind: 'court'; playerId: number; stage: 'target' | 'case' | 'judgement' | 'transfer' | 'holding'; targetId?: number; caseId?: number; verdict?: CourtVerdict; roll?: number; jailedPlayerId?: number | null; transferOrigin?: GridPoint; waitFrames?: number; verdictFrame?: number; error?: string | null; presentation?: ActivityPresentation }
  | (CardInteractionBase & { kind: 'card-confirm'; choiceError: string | null })
  | (CardInteractionBase & { kind: 'dice-choice'; choiceError: string | null })
  | (CardInteractionBase & { kind: 'target-choice'; choiceError: string | null })
  | (CardInteractionBase & { kind: 'credit-choice'; choiceError: string | null })
  | { kind: 'shop'; playerId: number; shop: ShopState; resume: 'shop' }
  | { kind: 'bank'; playerId: number; resume: 'after-bank'; error?: string | null }
  | { kind: 'stock'; playerId: number; resume: 'after-stock'; error?: string | null }
  | { kind: 'company'; playerId: number; companyId: number; resume: 'company'; chargeEntry?: FinanceEntry | null; error?: string | null }
  | { kind: 'monthly-settlement'; playerId: number; entries: FinanceEntry[] }
  | { kind: 'ticket-exchange'; playerId: number; mode: TicketExchangeMode; npcCellId?: number; error?: string | null; presentation?: ActivityPresentation }
  | {
      kind: 'notice'
      playerId: number
      notice: InteractionNotice
      resume: InteractionResume
      shop?: ShopState
      presentation?: ActivityPresentation
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
  financeEntry?: FinanceEntry
  receipt?: ActivityReceipt
}

export type CardChoice = DirectCardChoice
