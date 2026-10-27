import type { ReactionName } from '../characters/reactions'
import type { PlayerPose } from '../map/MapScene'
import type { InteractionEvent } from './interaction-types'
import type { GameState } from './types'

export type EffectClipId = 'rocket' | 'explosion' | 'card-gain' | 'ticket-gain'

export interface InteractionVisualPlan {
  reactions: Array<{ playerId: number; name: ReactionName }>
  effects: Array<{ clipId: EffectClipId; cellId?: number; playerId?: number }>
}

export class ReactionVisibility {
  #desired: boolean
  #reaction: ReactionName | null = null
  #loaded = false
  #generation = 0
  #finalFrameSeen = false
  #finalFrameElapsedMs = 0

  constructor(desiredVisible: boolean) { this.#desired = desiredVisible }
  get reaction(): ReactionName | null { return this.#reaction }
  get showReaction(): boolean { return this.#loaded && this.#reaction !== null }
  get desiredVisible(): boolean { return this.#desired }
  get visible(): boolean { return this.#desired || (this.#reaction === 'hurt' && !this.#desired) }
  setDesired(visible: boolean): void { this.#desired = visible }
  begin(reaction: ReactionName): number {
    this.#reaction = reaction
    this.#loaded = false
    this.#finalFrameSeen = false
    this.#finalFrameElapsedMs = 0
    return ++this.#generation
  }
  isCurrent(generation: number): boolean { return generation === this.#generation }
  loaded(): void { if (this.#reaction !== null) this.#loaded = true }
  clear(): void { this.#reaction = null; this.#loaded = false; this.#finalFrameSeen = false; this.#finalFrameElapsedMs = 0; this.#generation += 1 }
  advanceHiddenHurtFinished(deltaMs: number, frameDurationMs: number): boolean {
    if (this.#reaction !== 'hurt' || this.#desired) return false
    if (!this.#finalFrameSeen) {
      this.#finalFrameSeen = true
      return false
    }
    this.#finalFrameElapsedMs += deltaMs
    if (this.#finalFrameElapsedMs + Number.EPSILON < frameDurationMs) return false
    this.clear()
    return true
  }
}

export class VisualRecoveryTracker {
  #next = 1
  #plans = new Map<number, InteractionVisualPlan>()
  begin(plan: InteractionVisualPlan): number {
    const token = this.#next++
    this.#plans.set(token, plan)
    return token
  }
  complete(token: number): void { this.#plans.delete(token) }
  fail(token: number): InteractionVisualPlan | undefined {
    const plan = this.#plans.get(token)
    this.#plans.delete(token)
    return plan
  }
}

export function reactionManifestUrl(characterId: number): string {
  return `assets/characters/${characterId}/reactions/manifest.json`
}

export function buildPlayerPoses(state: GameState): PlayerPose[] {
  return state.players.map((player, index) => {
    const status = state.world.statuses[player.id]
    return {
      playerId: player.id,
      characterId: player.characterId,
      position: player.position,
      direction: player.direction,
      active: index === state.activePlayerIndex,
      moving: state.phase === 'moving' && index === state.activePlayerIndex,
      visible: status?.state !== 2 && status?.state !== 3,
      godId: status?.godId ?? null,
    }
  })
}

export function interactionVisualPlan(event: InteractionEvent): InteractionVisualPlan {
  const reactions: InteractionVisualPlan['reactions'] = []
  const effects: InteractionVisualPlan['effects'] = []
  const react = (playerId: number, name: ReactionName) => {
    if (!reactions.some(item => item.playerId === playerId)) reactions.push({ playerId, name })
  }
  const worldKind = event.worldEvent?.kind
  const affectedPlayers = event.affectedPlayerIds ?? event.worldEvent?.affectedPlayerIds ?? []
  const affectedCells = event.affectedCellIds ?? event.worldEvent?.affectedCellIds ?? []

  if (worldKind === 'missile-fired') {
    if (affectedPlayers.includes(event.playerId)) react(event.playerId, 'hurt')
    else react(event.playerId, 'happy')
    for (const playerId of affectedPlayers) if (playerId !== event.playerId) react(playerId, 'hurt')
    const cellId = affectedCells[0]
    if (cellId !== undefined) effects.push({ clipId: 'rocket', cellId }, { clipId: 'explosion', cellId })
  } else if (worldKind === 'mine-triggered') {
    react(event.playerId, 'hurt')
    const cellId = affectedCells[0]
    if (cellId !== undefined) effects.push({ clipId: 'explosion', cellId })
  } else if (worldKind === 'restriction-released' || worldKind === 'god-expired') {
    react(event.playerId, 'neutral')
  } else if (worldKind === 'barrier-placed' || worldKind === 'mine-placed') {
    react(event.playerId, 'ready')
  } else if (event.status === 'invalid-target' || worldKind === 'credit-declined' || worldKind === 'restriction-skipped') {
    react(event.playerId, 'sad')
  } else if (event.kind === 'luck') {
    react(event.playerId, (event.amount ?? 0) < 0 ? 'sad' : 'happy')
    if (event.luckEvent?.kind === 'tickets' && (event.amount ?? 0) > 0) effects.push({ clipId: 'ticket-gain', playerId: event.playerId })
  } else if (event.kind === 'card-draw') {
    if (event.cardId !== undefined || (event.cardIds?.length ?? 0) > 0) {
      react(event.playerId, 'happy')
      effects.push({ clipId: 'card-gain', playerId: event.playerId })
    }
  } else if (event.kind === 'tickets') {
    react(event.playerId, (event.amount ?? 0) < 0 ? 'sad' : 'happy')
    if ((event.amount ?? 0) > 0) effects.push({ clipId: 'ticket-gain', playerId: event.playerId })
  } else {
    react(event.playerId, 'happy')
    for (const playerId of affectedPlayers) {
      if (playerId !== event.playerId) react(playerId, event.cardId === 9 ? 'hurt' : 'sad')
    }
  }

  return { reactions, effects }
}
