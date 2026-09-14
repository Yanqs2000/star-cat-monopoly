import type { GridPoint } from '../map/types'
import type { PropertyEvent, PropertyLedger, PropertyOffer } from './property'

export type Direction = 1 | 2 | 3 | 4
export type Hometown = 1 | 2 | 3 | 4
export type PlayerController = 'human' | 'ai'
export type GamePhase = 'awaiting-roll' | 'moving' | 'landed' | 'property-decision' | 'property-result' | 'insolvent'

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

export interface GameState {
  players: PlayerState[]
  activePlayerIndex: number
  round: number
  phase: GamePhase
  remainingSteps: number
  lastRoll: number | null
  rngState: number
  turnPath: GridPoint[]
  properties: PropertyLedger
  propertyOffer: PropertyOffer | null
  lastPropertyEvent: PropertyEvent | null
}
