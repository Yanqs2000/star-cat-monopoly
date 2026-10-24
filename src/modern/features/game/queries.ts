import type { GameState } from './types'
import type { GridPoint } from '../map/types'
import map from '../../data/map.json'
import { getCardCell } from './direct-cards'
import { calculateStreetRent, getPropertySummary } from './property'

export interface AssetStanding {
  playerId: number; name: string; rank: number | null; eliminated: boolean
  cash: number; deposit: number; stockValue: number; propertyValue: number
  usedCredit: number; loan: number; netWorth: number
  landCount: number; buildingCount: number; cards: number; tickets: number
}

/** Original frame4 asset_pg. Residential [9] is zero and has no reachable writer;
 * buying/炒地 changes [8], which is deliberately absent from this valuation.
 * Keep this derived: reading statistics must never change GameState or RNG. */
export function getAssetStandings(state: GameState): AssetStanding[] {
  const rows = state.players.map(player => {
    const eliminated = state.eliminatedPlayerIds.includes(player.id)
    const summary = getPropertySummary(state.properties, player.id)
    const propertyValue = Object.values(state.properties).reduce((sum, property) =>
      sum + (property.ownerId === player.id ? 100 * property.level * (property.level + 1) / 2 : 0), 0)
    const rawStockValue = state.finance.stocks.slice(1, 16).reduce((sum, stock) =>
      sum + (stock.holdings[player.id]?.shares ?? 0) * stock.price, 0)
    const stockValue = Math.trunc(rawStockValue)
    const usedCredit = state.credit[player.id]!.used
    const loan = state.finance.loans[player.id] ?? 0
    return {
      playerId: player.id, name: player.name, rank: null as number | null, eliminated,
      cash: player.cash, deposit: player.deposit, stockValue, propertyValue, usedCredit, loan,
      netWorth: eliminated ? 0 : Math.trunc(player.cash + player.deposit + rawStockValue + propertyValue - usedCredit - loan) || 0,
      ...summary, cards: state.inventories[player.id]!.length, tickets: state.tickets[player.id]!,
    }
  })
  // Stable sort retains original seat order for equal assets.
  rows.sort((a, b) => Number(a.eliminated) - Number(b.eliminated) || (a.eliminated ? 0 : b.netWorth - a.netWorth))
  let rank = 0
  for (const row of rows) if (!row.eliminated) row.rank = ++rank
  return rows
}

export function getStockOverview(state: GameState, playerId: number) {
  return state.finance.stocks.slice(1, 13).map(stock => ({
    companyId: stock.id, name: stock.name, previousPrice: stock.previousPrice,
    price: stock.price, change: stock.change, high: stock.high, low: stock.low,
    dailyBuyLimit: stock.dailyBuyLimit, ceoId: stock.ceoId,
    ceoName: state.players.find(player => player.id === stock.ceoId)?.name ?? '暂无',
    shares: stock.holdings[playerId]?.shares ?? 0,
    averageCost: stock.holdings[playerId]?.averageCost ?? 0,
  }))
}

export function getHoldingsOverview(state: GameState) {
  return state.finance.stocks.slice(1, 16).map(stock => ({
    companyId: stock.id, name: stock.name, listed: stock.id <= 12,
    price: stock.price, high: stock.high, low: stock.low, basePrice: stock.basePrice,
    offerShares: stock.offerShares, profit: stock.profit, ceoId: stock.ceoId,
    ceoName: state.players.find(player => player.id === stock.ceoId)?.name ?? '暂无',
    holdings: state.players.map(player => ({
      playerId: player.id, name: player.name, shares: stock.holdings[player.id]?.shares ?? 0,
      averageCost: stock.holdings[player.id]?.averageCost ?? 0,
    })),
  }))
}

export type MapInspection =
  | { kind: 'property'; name: string; position: GridPoint; parcelId: number; level: number; price: number
      ownerId: number | null; ownerName: string; baseToll: number; toll: number }
  | { kind: 'company'; name: string; position: GridPoint; companyId: number; ceoName: string
      profit: number; offerShares: number; basePrice: number }
  | { kind: 'place'; name: string; position: GridPoint; amount?: number }

const samePoint = (a: GridPoint, b: GridPoint) => a.column === b.column && a.row === b.row
const placeNames: Record<number, string> = {
  0: '道路', 17: '魔法门', 18: '银行', 19: '股市', 20: '卡片屋', 21: '彩票公司',
  22: '法院', 23: '失物招领', 27: '彩票投注', 28: '游乐场', 31: '医院', 32: '监狱',
  24: '卡片格', 25: '运气格', 26: '奖券格',
}

export function inspectMapCell(state: GameState, position: GridPoint): MapInspection | null {
  if (!Number.isInteger(position.column) || !Number.isInteger(position.row) ||
      position.column < 0 || position.column >= map.columns || position.row < 0 || position.row >= map.rows) return null
  const parcel = map.parcels.find(item => samePoint(item.roadCell, position) || samePoint(item.buildingCell, position))
  if (parcel) {
    const property = state.properties[parcel.id]!
    const active = state.players[state.activePlayerIndex]!
    const god = state.world.statuses[active.id]?.godId
    const baseToll = property.ownerId === null ? 0 : calculateStreetRent(state.properties, property.ownerId, parcel.streetId, state.prices)
    return {
      kind: 'property', name: parcel.streetName, position: { ...position }, parcelId: parcel.id,
      price: state.prices[parcel.id]!, level: property.level, ownerId: property.ownerId,
      ownerName: state.players.find(player => player.id === property.ownerId)?.name ?? '无主', baseToll,
      toll: property.ownerId === active.id || god === 2 ? 0 : baseToll * (god === 3 ? 2 : 1),
    }
  }
  const cell = getCardCell(position)
  if (!cell) return null
  if (cell.id >= 113 && cell.id <= 133) {
    const mainRecordId = 115 + 3 * Math.floor((cell.id - 113) / 3)
    const company = state.finance.stocks.slice(1).find(stock => stock.mainRecordId === mainRecordId)
    if (company) return {
      kind: 'company', name: company.name, position: { ...position }, companyId: company.id,
      ceoName: state.players.find(player => player.id === company.ceoId)?.name ?? '暂无',
      profit: company.profit, offerShares: company.offerShares, basePrice: company.basePrice,
    }
  }
  return {
    kind: 'place', name: placeNames[cell.type] ?? '明日天空城', position: { ...position },
    ...(cell.id === 159 || cell.id === 160 ? { amount: state.lostAndFoundFunds[cell.id - 159] } : {}),
  }
}
