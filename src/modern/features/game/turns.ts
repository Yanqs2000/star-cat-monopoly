import rules from '../../data/rules.json'
import { randomInt } from './random'
import type { Direction, GameState } from './types'

const MOVEMENT: Record<Direction, { column: number; row: number }> = {
  1: { column: 1, row: 1 },
  2: { column: -1, row: 1 },
  3: { column: -1, row: -1 },
  4: { column: 1, row: -1 },
}
const REVERSE: Record<Direction, Direction> = { 1: 3, 2: 4, 3: 1, 4: 2 }
const ROAD_BY_COORDINATE = new Map(
  rules.roadCells.map(cell => [`${cell.coordinate.column},${cell.coordinate.row}`, cell]),
)
const JUNCTIONS = rules.junctions as Record<string, Direction[]>

export function roll(state: GameState, fixedDie?: number): GameState {
  if (state.phase !== 'awaiting-roll') throw new Error('当前阶段不能掷骰')
  if (fixedDie !== undefined && (!Number.isInteger(fixedDie) || fixedDie < 1 || fixedDie > 6)) {
    throw new Error('固定骰必须是1..6整数')
  }
  const draw = fixedDie === undefined ? randomInt(state.rngState, 6) : undefined
  const die = fixedDie ?? draw!.value + 1
  const position = state.players[state.activePlayerIndex]!.position
  return {
    ...state,
    phase: 'moving',
    remainingSteps: die,
    lastRoll: die,
    rngState: draw?.nextState ?? state.rngState,
    turnPath: [{ ...position }],
  }
}

export function step(state: GameState): GameState {
  if (state.phase !== 'moving' || state.remainingSteps < 1) throw new Error('当前阶段不能移动')
  const player = state.players[state.activePlayerIndex]!
  const delta = MOVEMENT[player.direction]
  const position = {
    column: player.position.column + delta.column,
    row: player.position.row + delta.row,
  }
  const road = ROAD_BY_COORDINATE.get(`${position.column},${position.row}`)
  if (!road) throw new Error(`移动目标不是道路格：${position.column},${position.row}`)

  let direction = player.direction
  let rngState = state.rngState
  const exits = JUNCTIONS[road.id]
  if (exits) {
    const allowed = exits.filter(candidate => candidate !== REVERSE[player.direction])
    if (allowed.length === 0) throw new Error(`路口 ${road.id} 没有合法出口`)
    const draw = randomInt(rngState, allowed.length)
    direction = allowed[draw.value]!
    rngState = draw.nextState
  }

  const remainingSteps = state.remainingSteps - 1
  const players = state.players.map((current, index) =>
    index === state.activePlayerIndex ? { ...current, position, direction } : current)
  return {
    ...state,
    players,
    phase: remainingSteps === 0 ? 'landed' : 'moving',
    remainingSteps,
    rngState,
    turnPath: [...state.turnPath, position],
  }
}

export function nextTurn(state: GameState): GameState {
  if (state.phase !== 'landed') throw new Error('当前阶段不能结束回合')
  let activePlayerIndex = state.activePlayerIndex
  let wrapped = false
  for (let tried = 0; tried < state.players.length; tried++) {
    activePlayerIndex = (activePlayerIndex + 1) % state.players.length
    if (activePlayerIndex === 0) wrapped = true
    if (!state.eliminatedPlayerIds.includes(state.players[activePlayerIndex]!.id)) break
  }
  return {
    ...state,
    activePlayerIndex,
    round: wrapped ? state.round + 1 : state.round,
    phase: 'awaiting-roll',
    remainingSteps: 0,
  }
}
