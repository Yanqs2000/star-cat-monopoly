import type { GridPoint } from '../map/types'
import type { GameInteraction } from './interaction-types'
import type { PropertyEvent, PropertyOffer } from './property'
import type { FinanceState } from './finance-types'
import type { WorldSnapshot } from './world-cards'

export type Direction = 1 | 2 | 3 | 4
export type Hometown = 1 | 2 | 3 | 4
export type PlayerController = 'human' | 'ai' | 'autoplay'
export type GamePhase = 'awaiting-roll' | 'moving' | 'landed' | 'property-decision' | 'property-result' | 'interaction' | 'insolvent' | 'ended'
export type GameContinuation =
  | 'start-step'
  | 'process-arrival'
  | 'after-bank'
  | 'after-stock'
  | 'handle-landing'
  | 'process-god'
  | 'continue-terrain'
  | 'finish-turn'
  | 'after-monthly'

export interface PlayerState {
  id: number
  characterId: number
  name: string
  controller: PlayerController
  hometown: Hometown
  position: GridPoint
  direction: Direction
  cash: number
  deposit: number
}

export interface GameState extends WorldSnapshot {
  eliminatedPlayerIds: number[]
  bankruptcyReceipts: import('./lifecycle').BankruptcyReceipt[]
  outcome: import('./lifecycle').GameOutcome | null
  pendingControl: Record<number, 'human' | 'autoplay'>
  finance: FinanceState
  activePlayerIndex: number
  round: number
  phase: GamePhase
  remainingSteps: number
  lastRoll: number | null
  turnPath: GridPoint[]
  propertyOffer: PropertyOffer | null
  lastPropertyEvent: PropertyEvent | null
  interaction: GameInteraction | null
  skipLandingMarker: boolean
  continuation: GameContinuation | null
}
