import type { GridPoint } from '../map/types'

export type Direction = 1 | 2 | 3 | 4
export type Hometown = 1 | 2 | 3 | 4
export type PlayerController = 'human' | 'ai'
export type GamePhase = 'awaiting-roll' | 'moving' | 'landed'

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
}
