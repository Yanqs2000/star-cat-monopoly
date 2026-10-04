import worldRules from '../../data/world-rules.json'
import { advanceCalendar, assertCalendarDate } from './calendar'
import type { CalendarDate } from './finance-types'
import type { GridPoint } from '../map/types'
import { drawCard } from './card-economy'
import { applyOrdinaryNpcEffect } from './npc-encounters'
import type { ActivityReceipt } from './activity-types'
import {
  getCardBoardRecords,
  getCardCell,
  getCardRecord,
  type DirectCardChoice,
  type DirectCardSnapshot,
} from './direct-cards'
import type { LostAndFoundFunds } from './events'
import { findParcelAt, type EconomySnapshot, type PropertyState } from './property'
import { randomInt } from './random'
import type { Direction, PlayerState } from './types'

export interface WorldPlayerStatus {
  state: 0 | 2 | 3 | 9
  days: number
  godId: number | null
  godDays: number
}

export interface WorldState {
  markers: Record<number, number>
  statuses: Record<number, WorldPlayerStatus>
  weekday: number
  elapsedDays: number
  year: number
  month: number
  day: number
}

export interface WorldSnapshot extends DirectCardSnapshot {
  rngState: number
  world: WorldState
  tickets: Record<number, number>
  lostAndFoundFunds: LostAndFoundFunds
}

export type WorldEventKind =
  | 'barrier-placed'
  | 'mine-placed'
  | 'missile-fired'
  | 'god-summoned'
  | 'god-dismissed'
  | 'barrier-triggered'
  | 'mine-triggered'
  | 'god-encountered'
  | 'npc-deferred'
  | 'npc-encountered'
  | 'god-property-adjusted'
  | 'restriction-skipped'
  | 'restriction-released'
  | 'god-expired'
  | 'credit-granted'
  | 'credit-declined'
  | 'bank-closed'

export interface WorldEvent {
  kind: WorldEventKind
  playerId: number
  cardId?: number
  npcId?: number
  amount?: number
  cashDelta?: number
  impactPosition?: GridPoint
  affectedCellIds: number[]
  affectedPlayerIds: number[]
  cardIds: number[]
  receipt?: ActivityReceipt
}

export interface WorldResult {
  snapshot: WorldSnapshot
  event: WorldEvent | null
  consumed: boolean
  stopMovement: boolean
  endTurn: boolean
  invalidReason: string | null
}

const supportedWorldCards = new Set([6, 7, 9, 21, 22])
const godIds = worldRules.godIds as number[]
const godIdSet = new Set(godIds)
const publicMissileTypes = new Set([13, 14, 15, 18, 19, 22, 31, 32])
const boardRecords = getCardBoardRecords()

export function cloneWorldSnapshot(source: WorldSnapshot): WorldSnapshot {
  return {
    eliminatedPlayerIds: [...(source.eliminatedPlayerIds ?? [])],
    players: source.players.map(value => ({ ...value, position: { ...value.position } })),
    properties: Object.fromEntries(Object.entries(source.properties).map(([id, value]) => [id, { ...value }])),
    prices: { ...source.prices },
    inventories: Object.fromEntries(Object.entries(source.inventories).map(([id, value]) => [id, [...value]])),
    credit: Object.fromEntries(Object.entries(source.credit).map(([id, value]) => [id, { ...value }])),
    forcedDice: { ...source.forcedDice },
    stayPlayerIds: [...source.stayPlayerIds],
    unownedOwnerDeposit: source.unownedOwnerDeposit,
    rngState: source.rngState,
    world: {
      markers: { ...source.world.markers },
      statuses: Object.fromEntries(Object.entries(source.world.statuses).map(([id, value]) => [id, { ...value }])),
      weekday: source.world.weekday,
      elapsedDays: source.world.elapsedDays,
      year: source.world.year,
      month: source.world.month,
      day: source.world.day,
    },
    tickets: { ...source.tickets },
    lostAndFoundFunds: [...source.lostAndFoundFunds],
  }
}

function event(
  kind: WorldEventKind,
  playerId: number,
  options: Partial<Omit<WorldEvent, 'kind' | 'playerId'>> = {},
): WorldEvent {
  return {
    kind,
    playerId,
    affectedCellIds: [],
    affectedPlayerIds: [],
    cardIds: [],
    ...options,
  }
}

function result(
  snapshot: WorldSnapshot,
  worldEvent: WorldEvent | null = null,
  options: Partial<Pick<WorldResult, 'consumed' | 'stopMovement' | 'endTurn' | 'invalidReason'>> = {},
): WorldResult {
  return {
    snapshot,
    event: worldEvent,
    consumed: options.consumed ?? false,
    stopMovement: options.stopMovement ?? false,
    endTurn: options.endTurn ?? false,
    invalidReason: options.invalidReason ?? null,
  }
}

function invalid(source: WorldSnapshot, reason: string): WorldResult {
  return result(source, null, { invalidReason: reason })
}

function consume(snapshot: WorldSnapshot, playerId: number, inventoryIndex: number): void {
  snapshot.inventories[playerId]!.splice(inventoryIndex, 1)
}

function samePoint(left: GridPoint, right: GridPoint): boolean {
  return left.column === right.column && left.row === right.row
}

function assertWorldSnapshot(source: WorldSnapshot, playerId: number): PlayerState {
  const player = source.players.find(value => value.id === playerId)
  if (player === undefined || source.world.statuses[playerId] === undefined || source.inventories[playerId] === undefined) {
    throw new Error('玩家世界状态不存在')
  }
  return player
}

function candidateRecordIds(snapshot: Pick<WorldSnapshot, 'players' | 'world' | 'eliminatedPlayerIds'>): number[] {
  const occupiedByPlayers = new Set(snapshot.players.filter(player => !(snapshot.eliminatedPlayerIds ?? []).includes(player.id)).map(value => getCardCell(value.position)?.id).filter((id): id is number => id !== undefined))
  return boardRecords
    .filter(record => record.id > 0 && record.type < 23 && typeof record.facing === 'number' && record.facing > 0 &&
      snapshot.world.markers[record.id] === undefined && !occupiedByPlayers.has(record.id))
    .map(record => record.id)
}

function ensureUniqueNpc(snapshot: WorldSnapshot, npcId: number, ignoredPlayerId?: number): void {
  if (Object.values(snapshot.world.markers).includes(npcId) || Object.entries(snapshot.world.statuses)
    .some(([playerId, status]) => Number(playerId) !== ignoredPlayerId && status.godId === npcId)) {
    throw new Error(`NPC ${npcId} 已存在于世界中`)
  }
}

function spawnNpc(snapshot: WorldSnapshot, npcId: number, ignoredPlayerId?: number, excludedRecordId?: number): void {
  ensureUniqueNpc(snapshot, npcId, ignoredPlayerId)
  const candidates = candidateRecordIds(snapshot).filter(id => id !== excludedRecordId)
  if (candidates.length === 0) throw new Error(`NPC ${npcId} 没有可用出生格`)
  const draw = randomInt(snapshot.rngState, candidates.length)
  snapshot.rngState = draw.nextState
  snapshot.world.markers[candidates[draw.value]!] = npcId
}

export function applyRestriction(
  snapshot: WorldSnapshot,
  playerId: number,
  location: { direction: number; position: GridPoint; days: number },
  state: 2 | 3,
): void {
  const player = snapshot.players.find(value => value.id === playerId)!
  player.position = { ...location.position }
  player.direction = location.direction as Direction
  const status = snapshot.world.statuses[playerId]!
  status.state = state
  status.days = location.days
}

export function createWorldState(
  players: PlayerState[],
  rngState: number,
  weekday: number,
  date: CalendarDate = { year: 2026, month: 1, day: 5 },
): { world: WorldState; rngState: number } {
  if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) throw new Error('星期必须为0至6')
  assertCalendarDate(date)
  const ids = new Set<number>()
  for (const player of players) {
    if (!Number.isInteger(player.id) || player.id <= 0 || ids.has(player.id)) throw new Error('玩家ID无效')
    ids.add(player.id)
  }
  const working = {
    players,
    rngState,
    world: {
      markers: {},
      statuses: Object.fromEntries(players.map(player => [player.id, { state: 0, days: 0, godId: null, godDays: 0 }])),
      weekday,
      elapsedDays: 0,
      ...date,
    },
  } as Pick<WorldSnapshot, 'players' | 'rngState' | 'world'> as WorldSnapshot
  for (const npcId of worldRules.initialNpcIds) spawnNpc(working, npcId)
  return {
    world: {
      markers: { ...working.world.markers },
      statuses: Object.fromEntries(Object.entries(working.world.statuses).map(([id, value]) => [id, { ...value }])),
      weekday,
      elapsedDays: 0,
      ...date,
    },
    rngState: working.rngState,
  }
}

function applyPlacementCard(
  source: WorldSnapshot,
  playerId: number,
  inventoryIndex: number,
  cardId: 6 | 7,
  choice: DirectCardChoice,
): WorldResult {
  if (choice.kind !== 'cell') return invalid(source, '需要选择放置格')
  const cell = getCardCell(choice.position)
  const record = cell === undefined ? undefined : getCardRecord(cell.id)
  if (cell === undefined || record === undefined || cell.type < 1 || cell.type > 29 ||
      (cell.type < 24 && !(typeof record.facing === 'number' && record.facing > 0)) ||
      source.world.markers[cell.id] !== undefined || source.players.some(value => getCardCell(value.position)?.id === cell.id)) {
    return invalid(source, '目标不能放置障碍')
  }
  const snapshot = cloneWorldSnapshot(source)
  snapshot.world.markers[cell.id] = cardId
  consume(snapshot, playerId, inventoryIndex)
  return result(snapshot, event(cardId === 6 ? 'barrier-placed' : 'mine-placed', playerId, {
    cardId,
    affectedCellIds: [cell.id],
  }), { consumed: true })
}

function missilePositions(center: GridPoint): GridPoint[] {
  return [
    { ...center },
    { column: center.column + 1, row: center.row + 1 },
    { column: center.column - 1, row: center.row + 1 },
    { column: center.column - 1, row: center.row - 1 },
    { column: center.column + 1, row: center.row - 1 },
  ]
}

function applyMissile(
  source: WorldSnapshot,
  playerId: number,
  inventoryIndex: number,
  choice: DirectCardChoice,
): WorldResult {
  if (choice.kind !== 'cell') return invalid(source, '需要选择飞弹中心')
  const positions = missilePositions(choice.position)
  const cells = positions.map(position => getCardCell(position))
  if (cells.some(cell => cell === undefined) || cells[0]!.type === 34) return invalid(source, '飞弹目标无效')
  const snapshot = cloneWorldSnapshot(source)
  const affectedCellIds: number[] = []
  const damagedParcels = new Set<number>()
  let publicDamage = false
  for (const cell of cells) {
    if (cell!.type === 16 && cell!.ordinal % 2 === 0 && cell!.parcelId !== null && !damagedParcels.has(cell!.parcelId)) {
      const property = snapshot.properties[cell!.parcelId]
      if (property !== undefined && property.level > 0) {
        property.level = (property.level - 1) as PropertyState['level']
        damagedParcels.add(cell!.parcelId)
        affectedCellIds.push(cell!.id)
      }
    }
    if (cell!.ordinal === 2 && publicMissileTypes.has(cell!.type)) {
      publicDamage = true
      if (!affectedCellIds.includes(cell!.id)) affectedCellIds.push(cell!.id)
    }
  }
  const affectedPlayerIds = snapshot.players.filter(player => !(snapshot.eliminatedPlayerIds ?? []).includes(player.id))
    .filter(player => positions.some(position => samePoint(player.position, position)) &&
      ![2, 3, 9].includes(snapshot.world.statuses[player.id]!.state))
    .map(player => player.id)
  for (const affectedPlayerId of affectedPlayerIds) {
    applyRestriction(snapshot, affectedPlayerId, worldRules.hospital, 3)
  }
  const casterHit = affectedPlayerIds.includes(playerId)
  if (!casterHit && publicDamage) applyRestriction(snapshot, playerId, worldRules.jail, 2)
  consume(snapshot, playerId, inventoryIndex)
  return result(snapshot, event('missile-fired', playerId, {
    cardId: 9,
    impactPosition: { ...choice.position },
    affectedCellIds,
    affectedPlayerIds,
  }), { consumed: true, endTurn: casterHit || publicDamage })
}

function visibleGodCell(snapshot: WorldSnapshot, godId: number): number | undefined {
  const ids = Object.entries(snapshot.world.markers)
    .filter(([, npcId]) => npcId === godId)
    .map(([cellId]) => Number(cellId))
  if (ids.length > 1) throw new Error(`神明 ${godId} 地图实例重复`)
  return ids[0]
}

function applySummon(
  source: WorldSnapshot,
  playerId: number,
  inventoryIndex: number,
  choice: DirectCardChoice,
): WorldResult {
  if (choice.kind !== 'confirm') return invalid(source, '需要确认招神')
  const player = assertWorldSnapshot(source, playerId)
  let selected: { godId: number; cellId: number; dx: number; dy: number; distance: number } | undefined
  for (const godId of godIds) {
    const cellId = visibleGodCell(source, godId)
    if (cellId === undefined) continue
    const record = getCardRecord(cellId)
    if (record === undefined) throw new Error(`神明 ${godId} 所在格不存在`)
    const dx = Math.abs(record.position.column - player.position.column)
    const dy = Math.abs(record.position.row - player.position.row)
    const distance = (dx * 56) ** 2 + (dy * 40) ** 2
    if (selected === undefined || distance < selected.distance) selected = { godId, cellId, dx, dy, distance }
  }
  if (selected === undefined || selected.dx * 56 > 352 || selected.dy * 40 > 280) {
    return invalid(source, '附近看不到神灵')
  }
  const snapshot = cloneWorldSnapshot(source)
  delete snapshot.world.markers[selected.cellId]
  const status = snapshot.world.statuses[playerId]!
  if (status.godId === selected.godId) throw new Error(`神明 ${selected.godId} 实例状态重复`)
  if (status.godId !== null) spawnNpc(snapshot, status.godId, playerId)
  status.godId = selected.godId
  status.godDays = 7
  consume(snapshot, playerId, inventoryIndex)
  return result(snapshot, event('god-summoned', playerId, {
    cardId: 21,
    npcId: selected.godId,
    affectedCellIds: [selected.cellId],
    affectedPlayerIds: [playerId],
  }), { consumed: true })
}

function applyDismiss(
  source: WorldSnapshot,
  playerId: number,
  inventoryIndex: number,
  choice: DirectCardChoice,
): WorldResult {
  if (choice.kind !== 'confirm') return invalid(source, '需要确认送神')
  const snapshot = cloneWorldSnapshot(source)
  const status = snapshot.world.statuses[playerId]!
  const dismissed = status.godId
  if (dismissed !== null) spawnNpc(snapshot, dismissed, playerId)
  status.godId = null
  status.godDays = 0
  consume(snapshot, playerId, inventoryIndex)
  return result(snapshot, event('god-dismissed', playerId, {
    cardId: 22,
    ...(dismissed === null ? {} : { npcId: dismissed }),
    affectedPlayerIds: [playerId],
  }), { consumed: true })
}

export function applyWorldCard(
  source: WorldSnapshot,
  playerId: number,
  inventoryIndex: number,
  choice: DirectCardChoice,
): WorldResult {
  assertWorldSnapshot(source, playerId)
  const inventory = source.inventories[playerId]!
  if (!Number.isInteger(inventoryIndex) || inventoryIndex < 0 || inventoryIndex >= inventory.length) throw new Error('无效手牌槽')
  const cardId = inventory[inventoryIndex]!
  if (!supportedWorldCards.has(cardId)) throw new Error(`不支持世界卡片${cardId}`)
  if (cardId === 6 || cardId === 7) return applyPlacementCard(source, playerId, inventoryIndex, cardId, choice)
  if (cardId === 9) return applyMissile(source, playerId, inventoryIndex, choice)
  if (cardId === 21) return applySummon(source, playerId, inventoryIndex, choice)
  return applyDismiss(source, playerId, inventoryIndex, choice)
}

function encounterGod(source: WorldSnapshot, playerId: number, cellId: number, godId: number): WorldResult {
  const snapshot = cloneWorldSnapshot(source)
  delete snapshot.world.markers[cellId]
  const status = snapshot.world.statuses[playerId]!
  if (status.godId === godId) throw new Error(`神明 ${godId} 实例状态重复`)
  if (status.godId !== null) spawnNpc(snapshot, status.godId, playerId)
  status.godId = godId
  status.godDays = 7
  const worldEvent = event('god-encountered', playerId, {
    npcId: godId,
    amount: 0,
    affectedCellIds: [cellId],
    affectedPlayerIds: [playerId],
  })
  const player = snapshot.players.find(value => value.id === playerId)!

  if (godId === 2) {
    let amount = 0
    for (let place = 0; place < 4; place += 1) {
      const draw = randomInt(snapshot.rngState, 10)
      snapshot.rngState = draw.nextState
      amount += draw.value * 10 ** place
    }
    const tenThousands = randomInt(snapshot.rngState, 3)
    snapshot.rngState = tenThousands.nextState
    amount += tenThousands.value * 10_000
    player.cash += amount
    worldEvent.amount = amount
  } else if (godId === 3 && player.cash > 0) {
    let amount = 0
    for (let place = 0; place < 4; place += 1) {
      const draw = randomInt(snapshot.rngState, 10)
      snapshot.rngState = draw.nextState
      amount += draw.value * 10 ** place
    }
    const cashBefore = player.cash
    player.cash = Math.max(0, player.cash - amount)
    snapshot.lostAndFoundFunds[0] += amount
    snapshot.lostAndFoundFunds[1] += amount
    worldEvent.amount = amount
    worldEvent.cashDelta = player.cash - cashBefore
  } else if (godId === 4) {
    const count = snapshot.inventories[playerId]!.length
    const draws = count < 23 ? 2 : count === 23 ? 1 : 0
    for (let index = 0; index < draws; index += 1) {
      const drawn = drawCard(snapshot.inventories[playerId]!, snapshot.rngState)
      snapshot.inventories[playerId] = drawn.inventory
      snapshot.rngState = drawn.rngState
      worldEvent.cardIds.push(drawn.cardId)
    }
  } else if (godId === 5) {
    const inventory = snapshot.inventories[playerId]!
    if (inventory.length > 2) {
      for (let index = 0; index < 2; index += 1) {
        const draw = randomInt(snapshot.rngState, inventory.length)
        snapshot.rngState = draw.nextState
        worldEvent.cardIds.push(inventory.splice(draw.value, 1)[0]!)
      }
    } else {
      worldEvent.cardIds.push(...inventory)
      inventory.splice(0)
    }
  }
  return result(snapshot, worldEvent)
}

export function finishNpcEncounter(source: WorldSnapshot, npcId: number, cellId: number): WorldResult {
  if (source.world.markers[cellId] !== npcId) return result(source)
  const snapshot = cloneWorldSnapshot(source)
  delete snapshot.world.markers[cellId]
  spawnNpc(snapshot, npcId, undefined, cellId)
  return result(snapshot)
}

export function resolveWorldCell(
  source: WorldSnapshot,
  playerId: number,
  position: GridPoint,
  mode: 'step' | 'landing',
): WorldResult {
  assertWorldSnapshot(source, playerId)
  const cell = getCardCell(position)
  if (cell === undefined) throw new Error('世界格不存在')
  const npcId = source.world.markers[cell.id]
  if (npcId === undefined) return result(source)
  if (mode === 'step') {
    if (npcId !== 6) return result(source)
    const snapshot = cloneWorldSnapshot(source)
    delete snapshot.world.markers[cell.id]
    return result(snapshot, event('barrier-triggered', playerId, {
      npcId,
      affectedCellIds: [cell.id],
      affectedPlayerIds: [playerId],
    }), { stopMovement: true })
  }
  if (npcId === 7) {
    const snapshot = cloneWorldSnapshot(source)
    delete snapshot.world.markers[cell.id]
    applyRestriction(snapshot, playerId, worldRules.hospital, 3)
    return result(snapshot, event('mine-triggered', playerId, {
      npcId,
      affectedCellIds: [cell.id],
      affectedPlayerIds: [playerId],
    }), { stopMovement: true, endTurn: true })
  }
  if (godIdSet.has(npcId)) return encounterGod(source, playerId, cell.id, npcId)
  if (npcId === 1) return result(source, event('npc-encountered', playerId, {
    npcId, affectedCellIds: [cell.id], affectedPlayerIds: [playerId],
  }))
  if ([9, 12, 13, 14, 15].includes(npcId)) {
    const snapshot = cloneWorldSnapshot(source)
    delete snapshot.world.markers[cell.id]
    const receipt = applyOrdinaryNpcEffect(snapshot, playerId, npcId)
    if (npcId === 9) applyRestriction(snapshot, playerId, worldRules.hospital, 3)
    spawnNpc(snapshot, npcId, undefined, cell.id)
    return result(snapshot, event('npc-encountered', playerId, {
      npcId, receipt, cashDelta: receipt.cashDelta,
      affectedCellIds: [cell.id], affectedPlayerIds: [playerId],
      cardIds: receipt.addedCardIds ?? receipt.removedCardIds ?? [],
    }), { endTurn: npcId === 9, stopMovement: npcId === 9 })
  }
  if (npcId !== 6) {
    return result(source, event('npc-deferred', playerId, {
      npcId,
      affectedCellIds: [cell.id],
      affectedPlayerIds: [playerId],
    }))
  }
  return result(source)
}

export function applyLandingGod(source: WorldSnapshot, playerId: number, position: GridPoint): WorldResult {
  assertWorldSnapshot(source, playerId)
  const godId = source.world.statuses[playerId]!.godId
  if (godId !== 10 && godId !== 11) return result(source)
  const parcel = findParcelAt(position)
  if (parcel === undefined) return result(source)
  const property = source.properties[parcel.id]
  if (property === undefined) throw new Error('住宅状态不存在')
  const level = godId === 10 ? Math.min(5, property.level + 1) : Math.max(0, property.level - 1)
  if (level === property.level) return result(source)
  const snapshot = cloneWorldSnapshot(source)
  snapshot.properties[parcel.id]!.level = level as PropertyState['level']
  return result(snapshot, event('god-property-adjusted', playerId, {
    npcId: godId,
    affectedCellIds: [parcel.id],
    affectedPlayerIds: property.ownerId === null || property.ownerId === playerId
      ? [playerId]
      : [playerId, property.ownerId],
  }))
}

export function advanceWorldDay(source: WorldState): WorldState {
  return advanceCalendar(source).world
}

export function prepareWorldTurn(source: WorldSnapshot, playerId: number): WorldResult & { skipTurn: boolean } {
  assertWorldSnapshot(source, playerId)
  const current = source.world.statuses[playerId]!
  if ((current.state === 2 || current.state === 3) && current.days > 0) {
    return {
      ...result(source, event('restriction-skipped', playerId, { affectedPlayerIds: [playerId] }), { endTurn: true }),
      skipTurn: true,
    }
  }
  if (current.state === 9) {
    return {
      ...result(source, event('restriction-skipped', playerId, { affectedPlayerIds: [playerId] }), { endTurn: true }),
      skipTurn: true,
    }
  }
  const snapshot = cloneWorldSnapshot(source)
  const status = snapshot.world.statuses[playerId]!
  let worldEvent: WorldEvent | null = null
  if (status.state === 2 || status.state === 3) {
    status.state = 0
    worldEvent = event('restriction-released', playerId, { affectedPlayerIds: [playerId] })
  }
  if (status.state === 0 && status.godId !== null && status.godDays === 0) {
    const expired = status.godId
    spawnNpc(snapshot, expired, playerId)
    status.godId = null
    status.godDays = 0
    worldEvent = event('god-expired', playerId, { npcId: expired, affectedPlayerIds: [playerId] })
  }
  return { ...result(worldEvent === null ? source : snapshot, worldEvent), skipTurn: false }
}

export function applyBankCredit(source: WorldSnapshot, playerId: number): WorldResult {
  const player = assertWorldSnapshot(source, playerId)
  const inventory = source.inventories[playerId]!
  const credit = source.credit[playerId]
  if (credit === undefined) throw new Error('玩家信用状态不存在')
  if (player.controller === 'human' && source.world.weekday === 0) {
    return result(source, event('bank-closed', playerId, { affectedPlayerIds: [playerId] }))
  }
  const eligible = player.controller === 'ai'
    ? (worldRules.aiLevels[player.id - 1] ?? 0) > 1 && inventory[0] !== 1 && inventory.length < 24
    : credit.score >= 50 && credit.used === 0 && credit.available === 0 && inventory.length < 24
  if (!eligible) return result(source, event('credit-declined', playerId, { affectedPlayerIds: [playerId] }))
  const snapshot = cloneWorldSnapshot(source)
  snapshot.inventories[playerId]!.unshift(1)
  snapshot.credit[playerId]!.available = worldRules.initialCredit.grant
  return result(snapshot, event('credit-granted', playerId, {
    amount: worldRules.initialCredit.grant,
    affectedPlayerIds: [playerId],
    cardIds: [1],
  }))
}

export function toPropertyEconomy(source: WorldSnapshot): EconomySnapshot {
  return {
    players: source.players,
    properties: source.properties,
    prices: source.prices,
    godIds: Object.fromEntries(Object.entries(source.world.statuses).map(([id, status]) => [id, status.godId])),
  }
}
