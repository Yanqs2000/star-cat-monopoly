import cardBoard from '../../data/card-board.json'
import mapData from '../../data/map.json'
import type { GridPoint, Parcel, ScenePoint } from '../map/types'
import type { PlayerState } from './types'
import type { PropertyLedger, PropertyPrices } from './property'

export interface DirectCardSnapshot {
  players: PlayerState[]
  properties: PropertyLedger
  prices: PropertyPrices
  inventories: Record<number, number[]>
  credit: Record<number, { used: number; available: number; score: number }>
  forcedDice: Record<number, number | null>
  stayPlayerIds: number[]
  unownedOwnerDeposit: number
}

export type DirectCardChoice =
  | { kind: 'confirm' }
  | { kind: 'dice'; value: number }
  | { kind: 'credit'; amount: number }
  | { kind: 'cell'; position: GridPoint }

export interface CardCell {
  id: number
  type: number
  ordinal: number
  parcelId: number | null
}

export interface CardBoardRecord {
  id: number
  type: number
  ordinal: number
  streetId: number
  facing: number | number[]
  position: GridPoint
}

export interface PickedCardCell {
  position: GridPoint
  cell: CardCell
}

export interface DirectCardResult {
  snapshot: DirectCardSnapshot
  cardId: number
  consumed: boolean
  status: 'applied' | 'invalid-target'
  reason: string | null
  amount: number
  affectedParcelIds: number[]
  affectedPlayerIds: number[]
  insolventPlayerIds: number[]
}

const supportedCards = new Set([1, 5, 11, 14, 15, 18, 19, 20, 25, 26, 27, 33])
const parcels = mapData.parcels as Parcel[]
const parcelById = new Map(parcels.map(parcel => [parcel.id, parcel]))
const parcelByRecordId = new Map<number, number>()
for (const pair of cardBoard.parcelPairs) {
  parcelByRecordId.set(pair.roadRecordId, pair.parcelId)
  parcelByRecordId.set(pair.buildingRecordId, pair.parcelId)
}

function copyRecord(record: (typeof cardBoard.records)[number]): CardBoardRecord {
  return {
    id: record.id,
    type: record.type,
    ordinal: record.ordinal,
    streetId: record.streetId,
    facing: Array.isArray(record.facing) ? [...record.facing] : record.facing,
    position: { ...record.position },
  }
}

export function getCardBoardRecords(): CardBoardRecord[] {
  return cardBoard.records.map(copyRecord)
}

export function getCardRecord(id: number): CardBoardRecord | undefined {
  if (!Number.isInteger(id) || id < 0 || id >= cardBoard.records.length) return undefined
  return copyRecord(cardBoard.records[id]!)
}

export function getCardCell(position: GridPoint): CardCell | undefined {
  if (!Number.isInteger(position.column) || !Number.isInteger(position.row) ||
      position.column < 0 || position.column >= cardBoard.columns ||
      position.row < 0 || position.row >= cardBoard.rows) return undefined
  const id = cardBoard.grid[position.row]?.[position.column]
  const record = id === undefined ? undefined : cardBoard.records[id]
  if (record === undefined) return undefined
  return {
    id: record.id,
    type: record.type,
    ordinal: record.ordinal,
    parcelId: parcelByRecordId.get(record.id) ?? null,
  }
}

export function pickCardCell(scenePoint: ScenePoint): PickedCardCell | undefined {
  if (!Number.isFinite(scenePoint.x) || !Number.isFinite(scenePoint.y) ||
      scenePoint.x <= 0 || scenePoint.x >= cardBoard.columns * 56 ||
      scenePoint.y <= 0 || scenePoint.y >= cardBoard.rows * 40) return undefined
  const position = {
    column: Math.trunc(scenePoint.x / 56),
    row: Math.trunc(scenePoint.y / 40),
  }
  let cell = getCardCell(position)
  if (cell?.type === 0) {
    const horizontal = position.column * 56 + 28 - scenePoint.x
    const vertical = position.row * 40 + 20 - scenePoint.y
    const angle = -Math.atan2(horizontal, vertical) * 180 / Math.PI
    let direction = Math.trunc((angle + 225) / 90) + 1
    if (direction === 5) direction = 1
    const offsets = [undefined, [1, 0], [0, -1], [-1, 0], [0, 1]] as const
    const offset = offsets[direction]
    if (offset === undefined) return undefined
    position.row += offset[0]
    position.column += offset[1]
    cell = getCardCell(position)
  }
  return cell === undefined ? undefined : { position, cell }
}

function cloneSnapshot(snapshot: DirectCardSnapshot): DirectCardSnapshot {
  return {
    players: snapshot.players.map(player => ({ ...player, position: { ...player.position } })),
    properties: Object.fromEntries(Object.entries(snapshot.properties).map(([id, state]) => [id, { ...state }])),
    prices: { ...snapshot.prices },
    inventories: Object.fromEntries(Object.entries(snapshot.inventories).map(([id, cards]) => [id, [...cards]])),
    credit: Object.fromEntries(Object.entries(snapshot.credit).map(([id, credit]) => [id, { ...credit }])),
    forcedDice: { ...snapshot.forcedDice },
    stayPlayerIds: [...snapshot.stayPlayerIds],
    unownedOwnerDeposit: snapshot.unownedOwnerDeposit,
  }
}

function invalid(snapshot: DirectCardSnapshot, cardId: number, reason: string): DirectCardResult {
  return {
    snapshot,
    cardId,
    consumed: false,
    status: 'invalid-target',
    reason,
    amount: 0,
    affectedParcelIds: [],
    affectedPlayerIds: [],
    insolventPlayerIds: [],
  }
}

function finish(
  snapshot: DirectCardSnapshot,
  cardId: number,
  options: {
    consume?: boolean
    amount?: number
    affectedParcelIds?: number[]
    affectedPlayerIds?: number[]
  } = {},
): DirectCardResult {
  const consumed = options.consume ?? true
  return {
    snapshot,
    cardId,
    consumed,
    status: 'applied',
    reason: null,
    amount: options.amount ?? 0,
    affectedParcelIds: options.affectedParcelIds ?? [],
    affectedPlayerIds: options.affectedPlayerIds ?? [],
    insolventPlayerIds: snapshot.players
      .filter(player => player.cash + player.deposit <= 0)
      .map(player => player.id),
  }
}

function consume(snapshot: DirectCardSnapshot, playerId: number, inventoryIndex: number): void {
  snapshot.inventories[playerId]!.splice(inventoryIndex, 1)
}

function currentParcel(snapshot: DirectCardSnapshot, playerId: number): Parcel | undefined {
  const player = snapshot.players.find(value => value.id === playerId)
  const parcelId = player === undefined ? null : getCardCell(player.position)?.parcelId
  return parcelId === null || parcelId === undefined ? undefined : parcelById.get(parcelId)
}

function unique(values: Array<number | null>): number[] {
  return [...new Set(values.filter((value): value is number => value !== null))]
}

function targetPlayer(snapshot: DirectCardSnapshot, playerId: number, choice: DirectCardChoice): PlayerState | undefined {
  if (choice.kind !== 'cell') return undefined
  const cell = getCardCell(choice.position)
  if (cell === undefined || cell.ordinal % 2 === 0) return undefined
  const actor = snapshot.players.find(player => player.id === playerId)
  if (actor?.position.column === choice.position.column && actor.position.row === choice.position.row) return undefined
  return snapshot.players.find(player =>
    player.id !== playerId &&
    player.position.column === choice.position.column &&
    player.position.row === choice.position.row)
}

export function applyDirectCard(
  source: DirectCardSnapshot,
  playerId: number,
  inventoryIndex: number,
  choice: DirectCardChoice,
): DirectCardResult {
  const sourcePlayer = source.players.find(player => player.id === playerId)
  const inventory = source.inventories[playerId]
  if (sourcePlayer === undefined || inventory === undefined) throw new Error('玩家不存在')
  if (!Number.isInteger(inventoryIndex) || inventoryIndex < 0 || inventoryIndex >= inventory.length) throw new Error('无效手牌槽')
  const cardId = inventory[inventoryIndex]!
  if (!supportedCards.has(cardId)) throw new Error(`不支持直接使用卡片${cardId}`)

  if (cardId === 1) {
    const credit = source.credit[playerId]
    if (choice.kind !== 'credit' || credit === undefined || !Number.isInteger(choice.amount) ||
        choice.amount < 0 || choice.amount > credit.available) return invalid(source, cardId, '无效信用额度')
    const snapshot = cloneSnapshot(source)
    snapshot.players.find(player => player.id === playerId)!.cash += choice.amount
    snapshot.credit[playerId]!.used += choice.amount
    snapshot.credit[playerId]!.available -= choice.amount
    return finish(snapshot, cardId, { consume: false, amount: choice.amount, affectedPlayerIds: [playerId] })
  }

  if (cardId === 5) {
    if (choice.kind !== 'dice' || !Number.isInteger(choice.value) || choice.value < 1 || choice.value > 6) {
      return invalid(source, cardId, '骰子点数必须为1至6的整数')
    }
    const snapshot = cloneSnapshot(source)
    snapshot.forcedDice[playerId] = choice.value
    consume(snapshot, playerId, inventoryIndex)
    return finish(snapshot, cardId, { affectedPlayerIds: [playerId] })
  }

  if (cardId === 27) {
    if (choice.kind !== 'confirm') return invalid(source, cardId, '需要确认使用')
    const snapshot = cloneSnapshot(source)
    if (!snapshot.stayPlayerIds.includes(playerId)) snapshot.stayPlayerIds.push(playerId)
    consume(snapshot, playerId, inventoryIndex)
    return finish(snapshot, cardId, { affectedPlayerIds: [playerId] })
  }

  if (cardId === 11) {
    const parcel = currentParcel(source, playerId)
    const state = parcel === undefined ? undefined : source.properties[parcel.id]
    if (choice.kind !== 'confirm' || parcel === undefined || state === undefined || state.ownerId === playerId) {
      return invalid(source, cardId, '当前位置不是可收购住宅')
    }
    const snapshot = cloneSnapshot(source)
    const nextState = snapshot.properties[parcel.id]!
    const oldOwnerId = nextState.ownerId
    const amount = snapshot.prices[parcel.id]! + (nextState.level + 1) ** 2 * 100
    const payer = snapshot.players.find(player => player.id === playerId)!
    if (amount <= payer.cash) payer.cash -= amount
    else {
      payer.deposit -= amount - payer.cash
      payer.cash = 0
    }
    if (oldOwnerId === null) snapshot.unownedOwnerDeposit += amount
    else snapshot.players.find(player => player.id === oldOwnerId)!.deposit += amount
    nextState.ownerId = playerId
    consume(snapshot, playerId, inventoryIndex)
    return finish(snapshot, cardId, {
      amount,
      affectedParcelIds: [parcel.id],
      affectedPlayerIds: oldOwnerId === null ? [playerId] : [playerId, oldOwnerId],
    })
  }

  if (cardId === 14 || cardId === 18 || cardId === 19) {
    const parcel = currentParcel(source, playerId)
    if (choice.kind !== 'confirm' || parcel === undefined) return invalid(source, cardId, '当前位置不是住宅')
    const snapshot = cloneSnapshot(source)
    const streetParcels = parcels.filter(value => value.streetId === parcel.streetId)
    let amount = 0
    let affectedParcelIds: number[]
    if (cardId === 14) {
      amount = Math.floor(snapshot.prices[parcel.id]! * 1.2 / 10) * 10
      for (const target of streetParcels) snapshot.prices[target.id] = amount
      affectedParcelIds = streetParcels.map(value => value.id)
    } else {
      affectedParcelIds = []
      for (const target of streetParcels) {
        const state = snapshot.properties[target.id]!
        const nextLevel = cardId === 18 ? Math.min(5, state.level + 1) : Math.max(0, state.level - 1)
        if (nextLevel !== state.level) {
          state.level = nextLevel as typeof state.level
          affectedParcelIds.push(target.id)
        }
      }
    }
    consume(snapshot, playerId, inventoryIndex)
    return finish(snapshot, cardId, {
      amount,
      affectedParcelIds,
      affectedPlayerIds: unique(affectedParcelIds.map(id => snapshot.properties[id]!.ownerId)),
    })
  }

  if (cardId === 15 || cardId === 20) {
    if (choice.kind !== 'cell') return invalid(source, cardId, '需要选择住宅目标')
    const parcelId = getCardCell(choice.position)?.parcelId
    if (parcelId === null || parcelId === undefined) return invalid(source, cardId, '目标没有可拆除房屋')
    const state = source.properties[parcelId]
    if (state === undefined || state.level <= 0) return invalid(source, cardId, '目标没有可拆除房屋')
    const snapshot = cloneSnapshot(source)
    snapshot.properties[parcelId]!.level = cardId === 15 ? (state.level - 1) as typeof state.level : 0
    consume(snapshot, playerId, inventoryIndex)
    return finish(snapshot, cardId, {
      affectedParcelIds: [parcelId],
      affectedPlayerIds: state.ownerId === null ? [] : [state.ownerId],
    })
  }

  if (cardId === 25 || cardId === 26 || cardId === 33) {
    const target = targetPlayer(source, playerId, choice)
    if (target === undefined) return invalid(source, cardId, '目标必须是奇数序号格上的其他玩家')
    if ((cardId === 25 || cardId === 26) && sourcePlayer.cash >= target.cash) {
      return invalid(source, cardId, '使用者现金必须少于目标')
    }
    const snapshot = cloneSnapshot(source)
    const actor = snapshot.players.find(player => player.id === playerId)!
    const nextTarget = snapshot.players.find(player => player.id === target.id)!
    let amount: number
    if (cardId === 25) {
      amount = nextTarget.cash - actor.cash
      actor.cash = nextTarget.cash
    } else if (cardId === 26) {
      amount = nextTarget.cash - actor.cash
      nextTarget.cash = actor.cash
    } else {
      amount = Math.trunc(nextTarget.cash / 10)
      nextTarget.cash -= amount
      actor.cash += amount
    }
    consume(snapshot, playerId, inventoryIndex)
    return finish(snapshot, cardId, { amount, affectedPlayerIds: [playerId, target.id] })
  }

  throw new Error(`不支持直接使用卡片${cardId}`)
}
