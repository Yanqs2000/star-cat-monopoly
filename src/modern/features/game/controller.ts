import { buyShopCard, createCardShop, drawCard, sellInventoryCard } from './card-economy'
import { applyDirectCard, getCardCell, type DirectCardChoice } from './direct-cards'
import { applyLuckEvent, applyTicketLanding, drawLuckEvent, findSpecialLanding } from './events'
import type { GameInteraction, InteractionEvent, InteractionNotice, InteractionResume } from './interaction-types'
import { applyPropertyOffer, findParcelAt, getPropertyOffer } from './property'
import { nextTurn, roll as rollState, step } from './turns'
import type { Direction, GameState } from './types'
import {
  advanceWorldDay,
  applyBankCredit,
  applyLandingGod,
  applyWorldCard,
  prepareWorldTurn,
  resolveWorldCell,
  toPropertyEconomy,
  type WorldResult,
  type WorldSnapshot,
} from './world-cards'
import type { GridPoint } from '../map/types'

export type { InteractionEvent } from './interaction-types'

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
  onInteractionEvent?: (event: InteractionEvent) => void
}

export interface GameController {
  readonly state: GameState
  readonly paused: boolean
  readonly speed: number
  roll(fixedDie?: number): boolean
  beginCard(index: number): boolean
  confirmCard(): boolean
  chooseCard(choice: DirectCardChoice): boolean
  cancelInteraction(): boolean
  acknowledgeInteraction(): boolean
  buyCard(slot: number): boolean
  sellCard(index: number): boolean
  leaveShop(): boolean
  requestCredit(): boolean
  leaveBank(): boolean
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

const directCardIds = new Set([1, 5, 11, 14, 15, 18, 19, 20, 25, 26, 27, 33])
const worldCardIds = new Set([6, 7, 9, 21, 22])
const targetCardIds = new Set([6, 7, 9, 15, 20, 25, 26, 33])
const confirmCardIds = new Set([11, 14, 18, 19, 21, 22, 27])

function projectWorld(state: GameState): WorldSnapshot {
  return {
    players: state.players,
    properties: state.properties,
    prices: state.prices,
    inventories: state.inventories,
    credit: state.credit,
    forcedDice: state.forcedDice,
    stayPlayerIds: state.stayPlayerIds,
    unownedOwnerDeposit: state.unownedOwnerDeposit,
    rngState: state.rngState,
    world: state.world,
    tickets: state.tickets,
    lostAndFoundFunds: state.lostAndFoundFunds,
  }
}

function mergeWorld(state: GameState, snapshot: WorldSnapshot): GameState {
  return {
    ...state,
    players: snapshot.players,
    properties: snapshot.properties,
    prices: snapshot.prices,
    inventories: snapshot.inventories,
    credit: snapshot.credit,
    forcedDice: snapshot.forcedDice,
    stayPlayerIds: snapshot.stayPlayerIds,
    unownedOwnerDeposit: snapshot.unownedOwnerDeposit,
    rngState: snapshot.rngState,
    world: snapshot.world,
    tickets: snapshot.tickets,
    lostAndFoundFunds: snapshot.lostAndFoundFunds,
  }
}

function mergeDirect(state: GameState, snapshot: ReturnType<typeof applyDirectCard>['snapshot']): GameState {
  return {
    ...state,
    players: snapshot.players,
    properties: snapshot.properties,
    prices: snapshot.prices,
    inventories: snapshot.inventories,
    credit: snapshot.credit,
    forcedDice: snapshot.forcedDice,
    stayPlayerIds: snapshot.stayPlayerIds,
    unownedOwnerDeposit: snapshot.unownedOwnerDeposit,
  }
}

function worldNotice(result: WorldResult): InteractionNotice {
  const event = result.event!
  return {
    kind: event.kind.startsWith('bank-') || event.kind.startsWith('credit-') ? 'bank' :
      event.kind.startsWith('restriction-') || event.kind === 'god-expired' ? 'restriction' : 'world',
    message: event.kind,
    eventKind: event.kind,
    amount: event.amount,
    affectedPlayerIds: [...event.affectedPlayerIds],
    affectedCellIds: [...event.affectedCellIds],
    cardIds: [...event.cardIds],
  }
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
  const activePlayer = () => current.players[current.activePlayerIndex]!
  const isHuman = () => activePlayer().controller === 'human'
  const canCommand = () => !disposed && !paused && pending === undefined && isHuman()
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

  let startStep: () => void
  let processAfterBank: () => void
  let handleLanding: () => void
  let processGodThenTerrain: () => void
  let continueTerrain: () => void
  let finishTurn: () => void
  let beginTurn: () => void
  let acknowledgeNotice: () => void
  let acknowledgePropertyResult: () => void

  const showNotice = (
    notice: InteractionNotice,
    event: InteractionEvent,
    resume: InteractionResume,
    shop?: Extract<GameInteraction, { kind: 'shop' }>,
  ) => {
    const playerId = activePlayer().id
    current = {
      ...current,
      phase: 'interaction',
      interaction: { kind: 'notice', playerId, notice, resume, ...(shop === undefined ? {} : { shop: shop.shop }) },
    }
    options.onInteractionEvent?.(event)
    notify()
    if (!isHuman()) schedule(acknowledgeNotice, aiThinkDurationMs)
  }

  const showWorldResult = (result: WorldResult, resume: InteractionResume) => {
    current = mergeWorld(current, result.snapshot)
    if (result.stopMovement) current = { ...current, remainingSteps: 0, phase: 'landed' }
    if (result.event === null) return false
    const notice = worldNotice(result)
    showNotice(notice, {
      kind: notice.kind,
      playerId: activePlayer().id,
      amount: result.event.amount,
      affectedPlayerIds: [...result.event.affectedPlayerIds],
      affectedCellIds: [...result.event.affectedCellIds],
      cardIds: [...result.event.cardIds],
      worldEvent: result.event,
    }, result.endTurn ? 'end-turn' : resume)
    return true
  }

  const settleProperty = (choice: 'accept' | 'decline') => {
    const player = activePlayer()
    const offer = current.propertyOffer!
    const result = applyPropertyOffer(toPropertyEconomy(projectWorld(current)), player.id, offer.parcelId, choice)
    current = {
      ...current,
      players: result.players,
      properties: result.properties,
      lastPropertyEvent: result.event,
      phase: 'property-result',
    }
    notify()
    if (!isHuman()) schedule(acknowledgePropertyResult, aiThinkDurationMs)
  }

  acknowledgePropertyResult = () => {
    current = { ...current, phase: 'landed', propertyOffer: null }
    notify()
    if (activePlayer().cash + activePlayer().deposit <= 0) {
      current = { ...current, phase: 'insolvent' }
      notify()
      return
    }
    schedule(finishTurn, landingDurationMs)
  }

  continueTerrain = () => {
    const player = activePlayer()
    const parcel = findParcelAt(player.position)
    if (parcel) {
      const offer = getPropertyOffer(toPropertyEconomy(projectWorld(current)), player.id, parcel.id)
      current = { ...current, phase: 'property-decision', propertyOffer: offer }
      notify()
      if (offer.kind === 'max-level') settleProperty('accept')
      else if (!isHuman()) schedule(() => settleProperty('accept'), aiThinkDurationMs)
      return
    }

    const special = findSpecialLanding(player.position)
    if (special?.kind === 'shop') {
      if (!isHuman()) {
        schedule(finishTurn, landingDurationMs)
        return
      }
      const created = createCardShop(current.rngState)
      current = {
        ...current,
        rngState: created.rngState,
        phase: 'interaction',
        interaction: { kind: 'shop', playerId: player.id, shop: created.shop, resume: 'shop' },
      }
      notify()
      return
    }
    if (special?.kind === 'card') {
      const drawn = drawCard(current.inventories[player.id]!, current.rngState)
      const receivedCardId = drawn.kind === 'received' ? drawn.cardId : undefined
      current = {
        ...current,
        rngState: drawn.rngState,
        inventories: { ...current.inventories, [player.id]: drawn.inventory },
      }
      showNotice({ kind: 'card', message: drawn.kind, cardId: receivedCardId, cardIds: receivedCardId === undefined ? [] : [receivedCardId] }, {
        kind: 'card-draw', playerId: player.id, cardId: receivedCardId, cardIds: receivedCardId === undefined ? [] : [receivedCardId],
      }, 'end-turn')
      return
    }
    if (special?.kind === 'luck') {
      const drawn = drawLuckEvent(current.rngState)
      const applied = applyLuckEvent({ cash: player.cash, deposit: player.deposit, tickets: current.tickets[player.id]! }, drawn.event.id, current.lostAndFoundFunds)
      current = {
        ...current,
        rngState: drawn.rngState,
        players: current.players.map(value => value.id === player.id
          ? { ...value, cash: applied.wallet.cash, deposit: applied.wallet.deposit }
          : value),
        tickets: { ...current.tickets, [player.id]: applied.wallet.tickets },
        lostAndFoundFunds: applied.lostAndFoundFunds,
      }
      showNotice({ kind: 'luck', message: applied.event.description, amount: applied.event.amount, luckEvent: applied.event }, {
        kind: 'luck', playerId: player.id, amount: applied.event.amount, luckEvent: applied.event,
      }, 'end-turn')
      return
    }
    if (special?.kind === 'tickets') {
      const applied = applyTicketLanding({ cash: player.cash, deposit: player.deposit, tickets: current.tickets[player.id]! }, player.position)
      current = { ...current, tickets: { ...current.tickets, [player.id]: applied.wallet.tickets } }
      showNotice({ kind: 'tickets', message: `tickets-${applied.amount}`, amount: applied.amount }, {
        kind: 'tickets', playerId: player.id, amount: applied.amount,
      }, 'end-turn')
      return
    }
    schedule(finishTurn, landingDurationMs)
  }

  processGodThenTerrain = () => {
    const player = activePlayer()
    const god = applyLandingGod(projectWorld(current), player.id, player.position)
    if (god.event !== null) {
      showWorldResult(god, 'after-god')
      return
    }
    current = mergeWorld(current, god.snapshot)
    continueTerrain()
  }

  handleLanding = () => {
    const player = activePlayer()
    if (!current.skipLandingMarker) {
      const marker = resolveWorldCell(projectWorld(current), player.id, player.position, 'landing')
      if (marker.event !== null || marker.endTurn) {
        showWorldResult(marker, 'after-god')
        return
      }
      current = mergeWorld(current, marker.snapshot)
    }
    processGodThenTerrain()
  }

  processAfterBank = () => {
    const player = activePlayer()
    const marker = resolveWorldCell(projectWorld(current), player.id, player.position, 'step')
    current = mergeWorld(current, marker.snapshot)
    if (marker.stopMovement) current = { ...current, remainingSteps: 0, phase: 'landed' }
    if (marker.event !== null) {
      showWorldResult(marker, 'after-marker')
      return
    }
    if (current.remainingSteps > 0) startStep()
    else handleLanding()
  }

  const processArrivedStep = () => {
    const player = activePlayer()
    if (getCardCell(player.position)?.type === 18) {
      if (isHuman() && current.world.weekday !== 0) {
        current = { ...current, phase: 'interaction', interaction: { kind: 'bank', playerId: player.id, resume: 'after-bank' } }
        notify()
        return
      }
      const bank = applyBankCredit(projectWorld(current), player.id)
      if (showWorldResult(bank, 'after-bank')) return
      current = mergeWorld(current, bank.snapshot)
    }
    processAfterBank()
  }

  startStep = () => {
    const player = activePlayer()
    const arrived = step(current)
    const nextPlayer = arrived.players[current.activePlayerIndex]!
    options.onTransition?.({
      playerIndex: current.activePlayerIndex,
      from: { ...player.position },
      to: { ...nextPlayer.position },
      direction: player.direction,
      durationMs: stepDurationMs,
    })
    schedule(() => {
      current = arrived
      options.onTransition?.(null)
      notify()
      processArrivedStep()
    }, stepDurationMs)
  }

  const performRoll = (requestedDie?: number) => {
    const player = activePlayer()
    const forced = Object.values(current.forcedDice).find((value): value is number => value !== null)
    const die = requestedDie ?? forced
    const rolled = rollState(current, die)
    current = {
      ...rolled,
      forcedDice: forced === undefined ? rolled.forcedDice : Object.fromEntries(rolled.players.map(value => [value.id, null])),
      lastPropertyEvent: null,
      propertyOffer: null,
      interaction: null,
      skipLandingMarker: false,
    }
    if (player.controller === 'human' && current.stayPlayerIds.length > 0) {
      current = {
        ...current,
        phase: 'landed',
        remainingSteps: 0,
        stayPlayerIds: [],
        skipLandingMarker: true,
        turnPath: [{ ...player.position }],
      }
      notify()
      handleLanding()
      return
    }
    notify()
    startStep()
  }

  finishTurn = () => {
    if (activePlayer().cash + activePlayer().deposit <= 0) {
      current = { ...current, phase: 'insolvent', interaction: null, propertyOffer: null }
      notify()
      return
    }
    const endingIndex = current.activePlayerIndex
    const landed = { ...current, phase: 'landed' as const, interaction: null, propertyOffer: null, skipLandingMarker: false }
    current = nextTurn(landed)
    if (endingIndex === landed.players.length - 1) current = { ...current, world: advanceWorldDay(current.world) }
    notify()
    beginTurn()
  }

  beginTurn = () => {
    const player = activePlayer()
    const prepared = prepareWorldTurn(projectWorld(current), player.id)
    current = mergeWorld(current, prepared.snapshot)
    if (prepared.event !== null) {
      showWorldResult(prepared, prepared.skipTurn ? 'end-turn' : 'await-roll')
      return
    }
    current = { ...current, phase: 'awaiting-roll', interaction: null }
    if (!isHuman()) schedule(() => performRoll(), aiThinkDurationMs)
  }

  acknowledgeNotice = () => {
    const interaction = current.interaction
    if (interaction?.kind !== 'notice') return
    const resume = interaction.resume
    const eventKind = interaction.notice.eventKind
    if (resume === 'shop' && interaction.shop) {
      current = { ...current, phase: 'interaction', interaction: { kind: 'shop', playerId: interaction.playerId, shop: interaction.shop, resume: 'shop' } }
      notify()
      return
    }
    if (resume === 'bank') {
      current = { ...current, phase: 'interaction', interaction: { kind: 'bank', playerId: interaction.playerId, resume: 'after-bank' } }
      notify()
      return
    }
    current = { ...current, phase: resume === 'await-roll' ? 'awaiting-roll' : 'landed', interaction: null }
    notify()
    if (resume === 'after-bank') processAfterBank()
    else if (resume === 'after-marker') {
      if (current.remainingSteps > 0) startStep()
      else handleLanding()
    } else if (resume === 'after-god') {
      if (eventKind === 'god-property-adjusted') continueTerrain()
      else processGodThenTerrain()
    }
    else if (resume === 'end-turn') finishTurn()
    else if (resume === 'await-roll' && !isHuman()) schedule(() => performRoll(), aiThinkDurationMs)
  }

  const applyChosenCard = (interaction: Extract<GameInteraction, { cardId: number }>, choice: DirectCardChoice) => {
    const snapshot = projectWorld(current)
    if (directCardIds.has(interaction.cardId)) {
      const result = applyDirectCard(snapshot, interaction.playerId, interaction.cardIndex, choice)
      if (result.status === 'invalid-target') {
        current = { ...current, interaction: { ...interaction, choiceError: result.reason } }
        notify()
        return
      }
      let nextSnapshot = result.snapshot
      if (interaction.cardId === 5) {
        const value = nextSnapshot.forcedDice[interaction.playerId]
        nextSnapshot = {
          ...nextSnapshot,
          forcedDice: Object.fromEntries(nextSnapshot.players.map(player => [player.id, player.id === interaction.playerId ? value : null])),
        }
      } else if (interaction.cardId === 27) {
        nextSnapshot = { ...nextSnapshot, stayPlayerIds: [interaction.playerId] }
      }
      current = mergeDirect(current, nextSnapshot)
      const event: InteractionEvent = {
        kind: 'card', playerId: interaction.playerId, cardId: interaction.cardId,
        consumed: result.consumed, status: result.status, reason: result.reason, amount: result.amount,
        affectedPlayerIds: [...result.affectedPlayerIds], cardIds: [],
      }
      showNotice({
        kind: 'card', message: 'applied', cardId: interaction.cardId, amount: result.amount,
        affectedPlayerIds: [...result.affectedPlayerIds], affectedCellIds: [...result.affectedParcelIds],
      }, event, 'await-roll')
      return
    }

    const result = applyWorldCard(snapshot, interaction.playerId, interaction.cardIndex, choice)
    if (result.invalidReason !== null) {
      if (interaction.kind === 'target-choice') {
        current = { ...current, interaction: { ...interaction, choiceError: result.invalidReason } }
        notify()
      } else {
        showNotice({ kind: 'card', message: result.invalidReason, cardId: interaction.cardId }, {
          kind: 'card', playerId: interaction.playerId, cardId: interaction.cardId,
          consumed: false, status: 'invalid-target', reason: result.invalidReason,
        }, 'await-roll')
      }
      return
    }
    current = mergeWorld(current, result.snapshot)
    const worldEvent = result.event
    showNotice({
      kind: 'card', message: worldEvent?.kind ?? 'applied', cardId: interaction.cardId,
      eventKind: worldEvent?.kind, amount: worldEvent?.amount,
      affectedPlayerIds: [...(worldEvent?.affectedPlayerIds ?? [])],
      affectedCellIds: [...(worldEvent?.affectedCellIds ?? [])],
      cardIds: [...(worldEvent?.cardIds ?? [])],
    }, {
      kind: 'card', playerId: interaction.playerId, cardId: interaction.cardId,
      consumed: result.consumed, status: 'applied', reason: null, amount: worldEvent?.amount,
      affectedPlayerIds: [...(worldEvent?.affectedPlayerIds ?? [])],
      affectedCellIds: [...(worldEvent?.affectedCellIds ?? [])],
      cardIds: [...(worldEvent?.cardIds ?? [])], worldEvent,
    }, result.endTurn ? 'end-turn' : 'await-roll')
  }

  const controller: GameController = {
    get state() { return current },
    get paused() { return paused },
    get speed() { return speed },
    roll(fixedDie) {
      if (!canCommand() || current.phase !== 'awaiting-roll') return false
      performRoll(fixedDie)
      return true
    },
    beginCard(index) {
      if (!canCommand() || current.phase !== 'awaiting-roll' || !Number.isInteger(index)) return false
      const player = activePlayer()
      const cardId = current.inventories[player.id]?.[index]
      if (cardId === undefined || (!directCardIds.has(cardId) && !worldCardIds.has(cardId))) return false
      current = { ...current, phase: 'interaction', interaction: { kind: 'card-confirm', playerId: player.id, cardId, cardIndex: index, resume: 'await-roll', choiceError: null } }
      notify()
      return true
    },
    confirmCard() {
      if (!canCommand() || current.phase !== 'interaction' || current.interaction?.kind !== 'card-confirm') return false
      const interaction = current.interaction
      if (current.inventories[interaction.playerId]?.[interaction.cardIndex] !== interaction.cardId) return false
      if (interaction.cardId === 1) current = { ...current, interaction: { ...interaction, kind: 'credit-choice', choiceError: null } }
      else if (interaction.cardId === 5) current = { ...current, interaction: { ...interaction, kind: 'dice-choice', choiceError: null } }
      else if (targetCardIds.has(interaction.cardId)) current = { ...current, interaction: { ...interaction, kind: 'target-choice', choiceError: null } }
      else if (confirmCardIds.has(interaction.cardId)) {
        applyChosenCard(interaction, { kind: 'confirm' })
        return true
      } else return false
      notify()
      return true
    },
    chooseCard(choice) {
      if (!canCommand() || current.phase !== 'interaction' ||
          (current.interaction?.kind !== 'dice-choice' && current.interaction?.kind !== 'target-choice' && current.interaction?.kind !== 'credit-choice')) return false
      const interaction = current.interaction
      if (current.inventories[interaction.playerId]?.[interaction.cardIndex] !== interaction.cardId) return false
      applyChosenCard(interaction, choice)
      return true
    },
    cancelInteraction() {
      if (!canCommand() || current.phase !== 'interaction' || current.interaction === null ||
          !['card-confirm', 'dice-choice', 'target-choice', 'credit-choice'].includes(current.interaction.kind)) return false
      current = { ...current, phase: 'awaiting-roll', interaction: null }
      notify()
      return true
    },
    acknowledgeInteraction() {
      if (!canCommand() || current.phase !== 'interaction' || current.interaction?.kind !== 'notice') return false
      acknowledgeNotice()
      return true
    },
    buyCard(slot) {
      if (!canCommand() || current.phase !== 'interaction' || current.interaction?.kind !== 'shop') return false
      const interaction = current.interaction
      let result: ReturnType<typeof buyShopCard>
      try {
        result = buyShopCard(current.inventories[interaction.playerId]!, current.tickets[interaction.playerId]!, interaction.shop, slot)
      } catch {
        return false
      }
      current = {
        ...current,
        inventories: { ...current.inventories, [interaction.playerId]: result.inventory },
        tickets: { ...current.tickets, [interaction.playerId]: result.tickets },
      }
      showNotice({ kind: 'shop', message: result.kind, cardId: result.cardId ?? undefined, amount: result.amount }, {
        kind: 'shop', playerId: interaction.playerId, cardId: result.cardId ?? undefined,
        amount: result.amount, shopAction: result.kind,
      }, 'shop', { ...interaction, shop: result.shop })
      return true
    },
    sellCard(index) {
      if (!canCommand() || current.phase !== 'interaction' || current.interaction?.kind !== 'shop') return false
      const interaction = current.interaction
      let result: ReturnType<typeof sellInventoryCard>
      try {
        result = sellInventoryCard(current.inventories[interaction.playerId]!, current.tickets[interaction.playerId]!, index)
      } catch {
        return false
      }
      current = {
        ...current,
        inventories: { ...current.inventories, [interaction.playerId]: result.inventory },
        tickets: { ...current.tickets, [interaction.playerId]: result.tickets },
      }
      showNotice({ kind: 'shop', message: 'sold', cardId: result.cardId, amount: result.amount }, {
        kind: 'shop', playerId: interaction.playerId, cardId: result.cardId,
        amount: result.amount, shopAction: 'sold',
      }, 'shop', interaction)
      return true
    },
    leaveShop() {
      if (!canCommand() || current.phase !== 'interaction' || current.interaction?.kind !== 'shop') return false
      current = { ...current, phase: 'landed', interaction: null }
      notify()
      schedule(finishTurn, landingDurationMs)
      return true
    },
    requestCredit() {
      if (!canCommand() || current.phase !== 'interaction' || current.interaction?.kind !== 'bank') return false
      const playerId = current.interaction.playerId
      const result = applyBankCredit(projectWorld(current), playerId)
      current = mergeWorld(current, result.snapshot)
      const notice = worldNotice(result)
      showNotice(notice, {
        kind: 'bank', playerId, amount: result.event?.amount,
        affectedPlayerIds: [...(result.event?.affectedPlayerIds ?? [])],
        cardIds: [...(result.event?.cardIds ?? [])], worldEvent: result.event,
      }, 'bank')
      return true
    },
    leaveBank() {
      if (!canCommand() || current.phase !== 'interaction' || current.interaction?.kind !== 'bank') return false
      current = { ...current, phase: current.remainingSteps > 0 ? 'moving' : 'landed', interaction: null }
      notify()
      processAfterBank()
      return true
    },
    decideProperty(choice) {
      if (!canCommand() || current.phase !== 'property-decision' ||
          (choice !== 'accept' && choice !== 'decline') ||
          (choice === 'decline' && current.propertyOffer?.kind === 'rent')) return false
      settleProperty(choice)
      return true
    },
    acknowledgeProperty() {
      if (!canCommand() || current.phase !== 'property-result') return false
      acknowledgePropertyResult()
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
      beginTurn()
    },
    dispose() {
      disposed = true
      generation += 1
      cancelPending()
      options.onTransition?.(null)
    },
  }
  notify()
  beginTurn()
  return controller
}
