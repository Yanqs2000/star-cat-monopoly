import { nextTurn, roll as rollState, step } from './turns'
import { applyPropertyOffer, findParcelAt, getPropertyOffer } from './property'
import type { Direction, GameState } from './types'
import type { GridPoint } from '../map/types'

export interface GameScheduler {
  now(): number
  setTimeout(callback: () => void, delayMs: number): unknown
  clearTimeout(handle: unknown): void
}

export interface PlayerTransition {
  playerIndex: number
  from: GridPoint
  to: GridPoint
  direction: Direction
  durationMs: number
}

export interface GameControllerOptions {
  scheduler?: GameScheduler
  stepDurationMs?: number
  landingDurationMs?: number
  aiThinkDurationMs?: number
  onState?: (state: GameState) => void
  onTransition?: (transition: PlayerTransition | null) => void
}

export interface GameController {
  readonly state: GameState
  readonly paused: boolean
  readonly speed: number
  roll(fixedDie?: number): boolean
  decideProperty(choice: 'accept' | 'decline'): boolean
  acknowledgeProperty(): boolean
  setPaused(paused: boolean): void
  setSpeed(speed: number): void
  restart(state: GameState): void
  dispose(): void
}

const browserScheduler: GameScheduler = {
  now: () => performance.now(),
  setTimeout: (callback, delayMs) => window.setTimeout(callback, delayMs),
  clearTimeout: handle => window.clearTimeout(handle as number),
}

export function createGameController(initialState: GameState, options: GameControllerOptions = {}): GameController {
  const scheduler = options.scheduler ?? browserScheduler
  const stepDurationMs = options.stepDurationMs ?? 16_000 / 30
  const landingDurationMs = options.landingDurationMs ?? 520
  const aiThinkDurationMs = options.aiThinkDurationMs ?? 650
  let current = initialState
  let speed = 1
  let paused = false
  let disposed = false
  let generation = 0
  let pending: {
    handle?: unknown
    callback: () => void
    remainingBaseMs: number
    startedAt: number
    speed: number
  } | undefined

  const notify = () => options.onState?.(current)
  const cancelPending = () => {
    if (pending?.handle !== undefined) scheduler.clearTimeout(pending.handle)
    pending = undefined
  }
  const runPending = (scheduledGeneration: number) => {
    if (disposed || scheduledGeneration !== generation || !pending) return
    const callback = pending.callback
    pending = undefined
    callback()
  }
  const armPending = () => {
    if (!pending || paused || disposed) return
    pending.startedAt = scheduler.now()
    pending.speed = speed
    const scheduledGeneration = generation
    pending.handle = scheduler.setTimeout(() => runPending(scheduledGeneration), pending.remainingBaseMs / speed)
  }
  const schedule = (callback: () => void, baseDelayMs: number) => {
    cancelPending()
    pending = { callback, remainingBaseMs: baseDelayMs, startedAt: scheduler.now(), speed }
    armPending()
  }
  const preserveRemaining = () => {
    if (pending?.handle === undefined) return
    scheduler.clearTimeout(pending.handle)
    pending.handle = undefined
    pending.remainingBaseMs = Math.max(0, pending.remainingBaseMs - (scheduler.now() - pending.startedAt) * pending.speed)
  }
  const startStep = () => {
    const player = current.players[current.activePlayerIndex]!
    const arrived = step(current)
    const nextPlayer = arrived.players[current.activePlayerIndex]!
    const transition: PlayerTransition = {
      playerIndex: current.activePlayerIndex,
      from: { ...player.position },
      to: { ...nextPlayer.position },
      direction: player.direction,
      durationMs: stepDurationMs,
    }
    options.onTransition?.(transition)
    schedule(() => {
      current = arrived
      options.onTransition?.(null)
      notify()
      if (current.phase === 'moving') startStep()
      else handleLanding()
    }, stepDurationMs)
  }
  const performRoll = (fixedDie?: number) => {
    current = { ...rollState(current, fixedDie), lastPropertyEvent: null, propertyOffer: null }
    notify()
    startStep()
  }
  const handleLanding = () => {
    const player = current.players[current.activePlayerIndex]!
    const parcel = findParcelAt(player.position)
    if (!parcel) {
      schedule(finishTurn, landingDurationMs)
      return
    }
    const offer = getPropertyOffer(current, player.id, parcel.id)
    current = { ...current, phase: 'property-decision', propertyOffer: offer }
    notify()
    if (offer.kind === 'max-level') {
      settleProperty('accept')
    } else if (player.controller === 'ai') {
      schedule(() => settleProperty('accept'), aiThinkDurationMs)
    }
  }
  const settleProperty = (choice: 'accept' | 'decline') => {
    const player = current.players[current.activePlayerIndex]!
    const offer = current.propertyOffer!
    const result = applyPropertyOffer(current, player.id, offer.parcelId, choice)
    current = { ...current, players: result.players, properties: result.properties,
      lastPropertyEvent: result.event, phase: 'property-result' }
    notify()
    if (player.controller === 'ai') schedule(acknowledgeResult, aiThinkDurationMs)
  }
  const acknowledgeResult = () => {
    const player = current.players[current.activePlayerIndex]!
    if (current.lastPropertyEvent?.kind === 'rent-paid' && player.cash + player.deposit <= 0) {
      current = { ...current, phase: 'insolvent', propertyOffer: null }
      notify()
      return
    }
    current = { ...current, phase: 'landed', propertyOffer: null }
    notify()
    schedule(finishTurn, landingDurationMs)
  }
  const ensureProgress = () => {
    const active = current.players[current.activePlayerIndex]!
    if (current.phase === 'awaiting-roll' && active.controller === 'ai') schedule(() => performRoll(), aiThinkDurationMs)
  }
  const finishTurn = () => {
    current = nextTurn(current)
    notify()
    ensureProgress()
  }

  const controller: GameController = {
    get state() { return current },
    get paused() { return paused },
    get speed() { return speed },
    roll(fixedDie) {
      if (disposed || paused || pending || current.phase !== 'awaiting-roll' || current.players[current.activePlayerIndex]!.controller !== 'human') return false
      performRoll(fixedDie)
      return true
    },
    decideProperty(choice) {
      if (disposed || paused || pending || current.phase !== 'property-decision' ||
          current.players[current.activePlayerIndex]!.controller !== 'human' ||
          (choice !== 'accept' && choice !== 'decline') ||
          (choice === 'decline' && current.propertyOffer?.kind === 'rent')) return false
      settleProperty(choice)
      return true
    },
    acknowledgeProperty() {
      if (disposed || paused || pending || current.phase !== 'property-result' ||
          current.players[current.activePlayerIndex]!.controller !== 'human') return false
      acknowledgeResult()
      return true
    },
    setPaused(value) {
      if (disposed || paused === value) return
      if (value) preserveRemaining()
      paused = value
      if (!paused) armPending()
    },
    setSpeed(value) {
      if (!Number.isFinite(value) || value <= 0 || speed === value) return
      preserveRemaining()
      speed = value
      armPending()
    },
    restart(state) {
      generation += 1
      cancelPending()
      options.onTransition?.(null)
      current = state
      paused = false
      notify()
      ensureProgress()
    },
    dispose() {
      disposed = true
      generation += 1
      cancelPending()
      options.onTransition?.(null)
    },
  }
  notify()
  ensureProgress()
  return controller
}
