import mapData from '../../data/map.json'
import type { GridPoint, Parcel } from '../map/types'
import type { PlayerState } from './types'

export interface PropertyState {
  ownerId: number | null
  level: 0 | 1 | 2 | 3 | 4 | 5
}

export type PropertyLedger = Record<number, PropertyState>
export type PropertyPrices = Record<number, number>

export interface EconomySnapshot {
  players: PlayerState[]
  properties: PropertyLedger
  prices?: PropertyPrices
  godIds?: Record<number, number | null>
}

export interface PropertyOffer {
  kind: 'purchase' | 'upgrade' | 'rent' | 'max-level'
  parcelId: number
  amount: number
  ownerId: number | null
}

export interface PropertyEvent {
  kind: 'purchased' | 'upgraded' | 'upgrade-failed' | 'rent-paid' | 'declined' | 'insufficient-cash' | 'max-level'
  playerId: number
  parcelId: number
  amount: number
  recipientId?: number
  level?: number
}

const parcels = mapData.parcels as Parcel[]
const parcelById = new Map(parcels.map(parcel => [parcel.id, parcel]))
const parcelIds = new Set(parcelById.keys())
const streetIds = new Set(parcels.map(parcel => parcel.streetId))
const rentTenths = [4, 8, 15, 30, 60, 100] as const

function assertLedger(properties: PropertyLedger, playerIds?: Set<number>): void {
  if (properties === null || typeof properties !== 'object') throw new Error('无效地产账本')
  const ids = Object.keys(properties).map(Number)
  if (ids.length !== parcels.length || ids.some(id => !parcelIds.has(id))) throw new Error('地产账本与地图不一致')
  for (const parcel of parcels) {
    const state = properties[parcel.id]
    if (state === null || typeof state !== 'object' ||
        !Number.isInteger(state.level) || state.level < 0 || state.level > 5 ||
        (state.ownerId !== null && (!Number.isInteger(state.ownerId) || state.ownerId <= 0)) ||
        (state.ownerId !== null && playerIds !== undefined && !playerIds.has(state.ownerId))) {
      throw new Error(`地块${parcel.id}状态无效`)
    }
  }
}

function assertSnapshot(snapshot: EconomySnapshot): Map<number, PlayerState> {
  if (!Array.isArray(snapshot.players)) throw new Error('无效玩家列表')
  const players = new Map<number, PlayerState>()
  for (const player of snapshot.players) {
    if (!Number.isInteger(player.id) || player.id <= 0 || players.has(player.id) ||
        !Number.isFinite(player.cash) || !Number.isFinite(player.deposit)) {
      throw new Error('无效玩家状态')
    }
    players.set(player.id, player)
  }
  assertLedger(snapshot.properties, new Set(players.keys()))
  if (snapshot.prices !== undefined) assertPrices(snapshot.prices)
  if (snapshot.godIds !== undefined) {
    for (const player of snapshot.players) {
      const godId = snapshot.godIds[player.id]
      if (godId !== null && godId !== undefined && ![2, 3, 4, 5, 10, 11].includes(godId)) {
        throw new Error(`玩家${player.id}神明状态无效`)
      }
    }
  }
  return players
}

function assertPrices(prices: PropertyPrices): void {
  if (prices === null || typeof prices !== 'object') throw new Error('无效地产价格表')
  const ids = Object.keys(prices).map(Number)
  if (ids.length !== parcels.length || ids.some(id => !parcelIds.has(id))) throw new Error('地产价格表与地图不一致')
  for (const parcel of parcels) {
    if (!Number.isFinite(prices[parcel.id]) || prices[parcel.id]! < 0) throw new Error(`地块${parcel.id}价格无效`)
  }
}

function clonePlayers(players: PlayerState[]): PlayerState[] {
  return players.map(player => ({ ...player, position: { ...player.position } }))
}

function cloneProperties(properties: PropertyLedger): PropertyLedger {
  return Object.fromEntries(Object.entries(properties).map(([id, state]) => [id, { ...state }]))
}

export function createPropertyLedger(): PropertyLedger {
  return Object.fromEntries(parcels.map(parcel => [parcel.id, { ownerId: null, level: 0 }]))
}

export function createPropertyPrices(): PropertyPrices {
  return Object.fromEntries(parcels.map(parcel => [parcel.id, parcel.basePrice]))
}

export function findParcelAt(point: GridPoint): Parcel | undefined {
  return parcels.find(parcel => parcel.roadCell.column === point.column && parcel.roadCell.row === point.row)
}

export function calculateStreetRent(
  properties: PropertyLedger,
  ownerId: number,
  streetId: number,
  prices: PropertyPrices = createPropertyPrices(),
): number {
  assertLedger(properties)
  assertPrices(prices)
  if (!Number.isInteger(ownerId) || ownerId <= 0 || !streetIds.has(streetId)) throw new Error('无效地主或街道')
  return parcels.reduce((total, parcel) => {
    const state = properties[parcel.id]!
    if (parcel.streetId !== streetId || state.ownerId !== ownerId) return total
    return total + prices[parcel.id]! * rentTenths[state.level] / 10
  }, 0)
}

export function getPropertyOffer(snapshot: EconomySnapshot, playerId: number, parcelId: number): PropertyOffer {
  const players = assertSnapshot(snapshot)
  if (!players.has(playerId)) throw new Error('玩家不存在')
  const parcel = parcelById.get(parcelId)
  if (parcel === undefined) throw new Error('住宅地块不存在')
  const state = snapshot.properties[parcelId]!
  const price = snapshot.prices?.[parcelId] ?? parcel.basePrice
  if (state.ownerId === null) return { kind: 'purchase', parcelId, amount: price, ownerId: null }
  if (state.ownerId !== playerId) {
    const godId = snapshot.godIds?.[playerId]
    const multiplier = godId === 2 ? 0 : godId === 3 ? 2 : 1
    return {
      kind: 'rent',
      parcelId,
      amount: calculateStreetRent(snapshot.properties, state.ownerId, parcel.streetId, snapshot.prices) * multiplier,
      ownerId: state.ownerId,
    }
  }
  if (state.level === 5) return { kind: 'max-level', parcelId, amount: 0, ownerId: playerId }
  return { kind: 'upgrade', parcelId, amount: 100 * (state.level + 1), ownerId: playerId }
}

export function applyPropertyOffer(
  snapshot: EconomySnapshot,
  playerId: number,
  parcelId: number,
  choice: 'accept' | 'decline',
): { players: PlayerState[]; properties: PropertyLedger; event: PropertyEvent; insolvent: boolean } {
  const offer = getPropertyOffer(snapshot, playerId, parcelId)
  const players = clonePlayers(snapshot.players)
  const properties = cloneProperties(snapshot.properties)
  const player = players.find(value => value.id === playerId)!
  const result = (event: PropertyEvent) => ({
    players,
    properties,
    event,
    insolvent: player.cash + player.deposit <= 0,
  })

  if ((offer.kind === 'purchase' || offer.kind === 'upgrade') && choice === 'decline') {
    return result({ kind: 'declined', playerId, parcelId, amount: offer.amount })
  }
  if (offer.kind === 'max-level') {
    return result({ kind: 'max-level', playerId, parcelId, amount: 0, level: 5 })
  }
  if (offer.kind === 'purchase' || offer.kind === 'upgrade') {
    if (player.cash < offer.amount) {
      return result({ kind: 'insufficient-cash', playerId, parcelId, amount: offer.amount })
    }
    player.cash -= offer.amount
    if (offer.kind === 'purchase') {
      properties[parcelId]!.ownerId = playerId
      return result({
        kind: 'purchased', playerId, parcelId, amount: offer.amount, level: properties[parcelId]!.level,
      })
    }
    const godId = snapshot.godIds?.[playerId]
    if (godId === 5) {
      return result({
        kind: 'upgrade-failed', playerId, parcelId, amount: offer.amount, level: properties[parcelId]!.level,
      })
    }
    const increment = godId === 4 ? 2 : 1
    const level = Math.min(5, properties[parcelId]!.level + increment) as PropertyState['level']
    properties[parcelId]!.level = level
    return result({ kind: 'upgraded', playerId, parcelId, amount: offer.amount, level })
  }

  const recipient = players.find(value => value.id === offer.ownerId)!
  const cashPaid = Math.min(player.cash, offer.amount)
  player.cash -= cashPaid
  player.deposit -= offer.amount - cashPaid
  recipient.deposit += offer.amount
  return result({ kind: 'rent-paid', playerId, parcelId, amount: offer.amount, recipientId: recipient.id })
}

export function getPropertySummary(
  properties: PropertyLedger,
  playerId: number,
): { landCount: number; buildingCount: number } {
  assertLedger(properties)
  if (!Number.isInteger(playerId) || playerId <= 0) throw new Error('无效玩家')
  return parcels.reduce((summary, parcel) => {
    const state = properties[parcel.id]!
    if (state.ownerId === playerId) {
      summary.landCount += 1
      if (state.level > 0) summary.buildingCount += 1
    }
    return summary
  }, { landCount: 0, buildingCount: 0 })
}
