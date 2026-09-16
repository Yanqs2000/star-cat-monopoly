import type { GridPoint } from '../map/types'
import type { GameInteraction } from './interaction-types'
import type { PropertyEvent, PropertyOffer } from './property'
import type { WorldSnapshot } from './world-cards'

export type Direction = 1 | 2 | 3 | 4
export type Hometown = 1 | 2 | 3 | 4
export type PlayerController = 'human' | 'ai'
export type GamePhase = 'awaiting-roll' | 'moving' | 'landed' | 'property-decision' | 'property-result' | 'interaction' | 'insolvent'

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
}
