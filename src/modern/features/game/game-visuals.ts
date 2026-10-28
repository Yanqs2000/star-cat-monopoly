import type { ReactionName } from '../characters/reactions'
import type { PlayerPose } from '../map/MapScene'
import type { InteractionEvent } from './interaction-types'
import type { GameState } from './types'
import type { GridPoint } from '../map/types'
import { getCardRecord } from './direct-cards'
import type { WorldState } from './world-cards'

export type EffectClipId = 'rocket' | 'explosion' | 'card-gain' | 'ticket-gain'

export interface InteractionVisualPlan {
  reactions: Array<{ playerId: number; name: ReactionName }>
  effects: Array<{ clipId: EffectClipId; cellId?: number; playerId?: number; position?: GridPoint; launchPosition?: GridPoint }>
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
    const court=state.interaction?.kind==='court'?state.interaction:null
    const stagedCourt=court?.jailedPlayerId===player.id && (court.stage==='judgement' || court.stage==='transfer' && (court.presentation?.frame ?? 1)<113)
    const atOrigin=stagedCourt && (court!.stage==='judgement' || (court!.presentation?.frame ?? 1)<56)
    const flying=state.interaction?.kind==='portal' && state.interaction.stage==='flight' && state.interaction.playerId===player.id
    const notice=state.interaction?.kind==='notice'?state.interaction:null
    const dog=notice?.playerId===player.id && notice.notice.npcId===9 && notice.presentation
    const dogOrigin=dog ? getCardRecord(notice!.notice.affectedCellIds?.[0] ?? -1)?.position : undefined
    const dogVisible=!!dog && (dog.clipId==='trait-9' || dog.clipId==='car2' && dog.frame<48)
    return {
      playerId: player.id,
      eliminated: state.eliminatedPlayerIds.includes(player.id),
      characterId: player.characterId,
      position: dogOrigin ?? (atOrigin && court?.transferOrigin ? court.transferOrigin : player.position),
      direction: player.direction,
      active: index === state.activePlayerIndex,
      moving: state.phase === 'moving' && index === state.activePlayerIndex,
      visible: !state.eliminatedPlayerIds.includes(player.id) && !flying && (dogVisible || stagedCourt || status?.state !== 2 && status?.state !== 3),
      godId: status?.godId ?? null,
    }
  })
}

export function activityCameraTarget(state: GameState): GridPoint | undefined {
  const interaction=state.interaction
  if(interaction?.kind==='portal' && interaction.stage==='flight' && interaction.flight) return {column:interaction.flight.x/56,row:interaction.flight.y/40}
  if(interaction?.kind==='court' && interaction.jailedPlayerId != null) {
    if(interaction.stage==='transfer') return (interaction.presentation?.frame ?? 1)<113 ? interaction.transferOrigin : state.players.find(player=>player.id===interaction.jailedPlayerId)?.position
    if(interaction.stage==='holding')return state.players.find(player=>player.id===interaction.jailedPlayerId)?.position
  }
  if(interaction?.kind==='notice') {
    if(interaction.notice.npcId===9 && interaction.notice.eventKind==='npc-encountered') {
      if(interaction.presentation)return getCardRecord(interaction.notice.affectedCellIds?.[0] ?? -1)?.position
      return state.players.find(player=>player.id===interaction.playerId)?.position
    }
    if(interaction.notice.message.startsWith('court-') || interaction.notice.message==='portal-arrived')return state.players.find(player=>player.id===interaction.playerId)?.position
  }
}

function hiddenWorldCells(state: GameState): Set<number> {
  const hidden=new Set<number>()
  const interaction=state.interaction
  if(interaction?.kind==='notice' && interaction.presentation && interaction.notice.eventKind==='npc-encountered' &&
      [9,12,13,14,15].includes(interaction.notice.npcId ?? 0)) {
    for(const [cellId,npcId] of Object.entries(state.world.markers))if(npcId===interaction.notice.npcId)hidden.add(Number(cellId))
  }
  if(interaction?.kind==='ticket-exchange' && interaction.npcCellId!==undefined &&
      (!interaction.presentation || interaction.presentation.frame>=15))hidden.add(interaction.npcCellId)
  if(interaction?.kind==='npc-opening' && interaction.presentation.frame>=16)hidden.add(interaction.cellId)
  return hidden
}
export function worldVisualKey(state: GameState): string { return [...hiddenWorldCells(state)].sort((a,b)=>a-b).join(',') }
export function buildWorldVisual(state: GameState): WorldState {
  const hidden=hiddenWorldCells(state)
  if(hidden.size===0)return state.world
  return {...state.world,markers:Object.fromEntries(Object.entries(state.world.markers).filter(([cellId])=>!hidden.has(Number(cellId))))}
}

export function visualForHandAssetFailure(
  state: GameState,
  cardId: number,
  currentVisual: InteractionVisualPlan | undefined,
): InteractionVisualPlan | undefined {
  if (currentVisual === undefined || state.interaction?.kind !== 'notice') return undefined
  const notice = state.interaction.notice
  if (notice.cardId !== cardId) return undefined
  if (notice.kind === 'card' && notice.message === 'received') return currentVisual
  if (notice.kind === 'shop' && notice.message === 'bought') return currentVisual
  return undefined
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

  if (event.sourceBrow !== undefined) {
    if (event.sourceBrow !== 0) react(event.playerId, event.sourceBrow === 1 ? 'neutral' : event.sourceBrow === 2 ? 'cheer' : 'sad')
  } else if (worldKind === 'npc-encountered' && [9,12,13,14,15].includes(event.worldEvent?.npcId ?? 0)) {
    const npcId=event.worldEvent!.npcId
    const receipt=event.receipt ?? event.worldEvent!.receipt
    const loss=npcId===9 || npcId===12 || (receipt?.ticketDelta ?? 0)<0 || (receipt?.cashDelta ?? 0)<0 || (receipt?.removedCardIds?.length ?? 0)>0
    react(event.playerId,loss?'sad':'neutral')
  } else if (event.receipt?.kind==='carnival') {
    react(event.playerId,'cheer')
  } else if (worldKind === 'missile-fired') {
    if (affectedPlayers.includes(event.playerId)) react(event.playerId, 'hurt')
    else react(event.playerId, 'happy')
    for (const playerId of affectedPlayers) if (playerId !== event.playerId) react(playerId, 'hurt')
    const position = event.worldEvent?.impactPosition
    if (position) effects.push({ clipId: 'rocket', position, ...(event.worldEvent?.launchPosition ? { launchPosition: event.worldEvent.launchPosition } : {}) }, { clipId: 'explosion', position })
    else {
      const cellId = affectedCells[0]
      if (cellId !== undefined) effects.push({ clipId: 'rocket', cellId }, { clipId: 'explosion', cellId })
    }
  } else if (worldKind === 'mine-triggered') {
    react(event.playerId, 'hurt')
    const cellId = affectedCells[0]
    if (cellId !== undefined) effects.push({ clipId: 'explosion', cellId })
  } else if (worldKind === 'god-encountered' && [3, 5].includes(event.worldEvent?.npcId ?? 0)) {
    // Source npc3/npc5 use brow_pg(5), even with no cash or cards to lose.
    react(event.playerId, 'sad')
  } else if (worldKind === 'restriction-released') {
    react(event.playerId, 'ready')
  } else if (worldKind === 'god-expired') {
    react(event.playerId, 'neutral')
  } else if (worldKind === 'barrier-placed' || worldKind === 'mine-placed') {
    react(event.playerId, 'ready')
  } else if (event.status === 'invalid-target' || worldKind === 'credit-declined' || worldKind === 'restriction-skipped') {
    react(event.playerId, 'sad')
  } else if(event.receipt?.kind==='ludo') {
    const delta=event.receipt.ticketDelta ?? 0
    react(event.playerId,delta>0?'cheer':delta<0?'sad':'neutral')
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
