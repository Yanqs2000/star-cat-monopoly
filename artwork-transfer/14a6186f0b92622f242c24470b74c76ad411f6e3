import { describe, expect, it } from 'vitest'
import { createGame } from '../../src/modern/features/game/setup'
import { getAssetStandings, getStockOverview, getHoldingsOverview, inspectMapCell } from '../../src/modern/features/game/queries'
import map from '../../src/modern/data/map.json'
import { getCardRecord } from '../../src/modern/features/game/direct-cards'

const game = () => createGame([1, 2, 3, 4], 42)

describe('原版资产与排名查询', () => {
  it('开局每人260000，资产相同按原席位排序', () => {
    const state = game()
    expect(getAssetStandings(state).map(row => [row.playerId, row.rank, row.netWorth])).toEqual([
      [1, 1, 260000], [2, 2, 260000], [3, 3, 260000], [4, 4, 260000],
    ])
  })
  it('按asset_pg扣已用信用和贷款，仅计建筑投入，不把地价/可用信用重复加入', () => {
    const state = game()
    state.players[0]!.cash = 1000
    state.players[0]!.deposit = 2000
    state.credit[1] = { used: 500, available: 99999, score: 100 }
    state.finance.loans[1] = 700
    state.properties[map.parcels[0]!.id] = { ownerId: 1, level: 2 }
    state.properties[map.parcels[1]!.id] = { ownerId: 1, level: 0 }
    state.prices[map.parcels[0]!.id] = 999999
    expect(getAssetStandings(state).find(row => row.playerId === 1)).toMatchObject({
      cash: 1000, deposit: 2000, stockValue: 60000, propertyValue: 300,
      usedCredit: 500, loan: 700, netWorth: 62100, landCount: 2, buildingCount: 1, rank: 4,
      cards: 5, tickets: 200,
    })
  })
  it('零或负净资产仍可查询，淘汰者无排名且不会成为资产冠军', () => {
    const state = game()
    state.players[0]!.cash = -300000
    state.eliminatedPlayerIds = [2]
    const rows = getAssetStandings(state)
    expect(rows.map(row => [row.playerId, row.rank])).toEqual([[3, 1], [4, 2], [1, 3], [2, null]])
    expect(rows.find(row => row.playerId === 1)!.netWorth).toBe(-140000)
    expect(rows.find(row => row.playerId === 2)!.netWorth).toBe(0)
  })
  it('股票市值的小数在合计净资产后截断，负余额时不提前损失小数', () => {
    const state = game()
    state.players[0]!.cash = -1; state.players[0]!.deposit = 0
    for (const stock of state.finance.stocks) stock.holdings[1]!.shares = 0
    state.finance.stocks[1]!.price = 0.75
    state.finance.stocks[1]!.holdings[1]!.shares = 1
    expect(getAssetStandings(state).find(row => row.playerId === 1)).toMatchObject({ stockValue: 0, netWorth: 0 })
  })
})

describe('原版地图信息查询', () => {
  it('住宅的道路格和建筑格都能查到同一地块当前地价', () => {
    const state = game(), parcel = map.parcels[0]!
    state.prices[parcel.id] = 3000
    for (const point of [parcel.roadCell, parcel.buildingCell]) {
      expect(inspectMapCell(state, point)).toMatchObject({ kind: 'property', parcelId: parcel.id, name: parcel.streetName, price: 3000, ownerId: null, toll: 0 })
    }
  })
  it('收费查询合计同街同地主房屋，查询人的财神/穷神影响应付金额', () => {
    const state = game(), first = map.parcels[0]!, second = map.parcels[1]!
    state.properties[first.id] = { ownerId: 2, level: 0 }
    state.properties[second.id] = { ownerId: 2, level: 1 }
    expect(inspectMapCell(state, first.buildingCell)).toMatchObject({ ownerId: 2, ownerName: '阿牛', baseToll: 1800, toll: 1800 })
    state.world.statuses[1]!.godId = 3
    expect(inspectMapCell(state, first.roadCell)).toMatchObject({ baseToll: 1800, toll: 3600 })
    state.world.statuses[1]!.godId = 2
    expect(inspectMapCell(state, first.roadCell)).toMatchObject({ toll: 0 })
    state.activePlayerIndex = 1
    expect(inspectMapCell(state, first.roadCell)).toMatchObject({ toll: 0 })
  })
  it('公司按当前局出生区查动态董事、累计盈利与认购股数', () => {
    const state = game(), stock = state.finance.stocks[1]!
    stock.profit = 3500; stock.offerShares = 1234; stock.ceoId = 2
    // The main record is an off-map ledger row (0,0); its two preceding
    // records are the actual company entrance/building cells.
    const record = getCardRecord(stock.mainRecordId - 2)!
    expect(inspectMapCell(state, record.position)).toMatchObject({ kind: 'company', companyId: 1, name: stock.name, ceoName: '阿牛', profit: 3500, offerShares: 1234 })
    expect(inspectMapCell(state, getCardRecord(stock.mainRecordId - 1)!.position)).toMatchObject({ kind: 'company', companyId: 1 })
  })
  it('失物招领入口显示当前可领金额，台账占位记录不成为地图地点', () => {
    const state = game(); state.lostAndFoundFunds = [1200, 3400]
    expect(inspectMapCell(state, getCardRecord(159)!.position)).toMatchObject({ kind: 'place', amount: 1200 })
    expect(inspectMapCell(state, getCardRecord(160)!.position)).not.toMatchObject({ kind: 'place', amount: 3400 })
    expect(inspectMapCell(state, { column: -1, row: 10 })).toBeNull()
    expect(inspectMapCell(state, { column: NaN, row: 10 })).toBeNull()
  })
  it('卡片、运气、奖券格和天空使用原地图地点类别', () => {
    const state = game()
    for (const [id, name] of [[165, '卡片格'], [171, '运气格'], [177, '奖券格']] as const) {
      expect(inspectMapCell(state, getCardRecord(id)!.position)).toMatchObject({ name })
    }
    expect(inspectMapCell(state, { column: 0, row: 0 })).toMatchObject({ name: '明日天空城' })
  })
})

describe('股票行情与全员持股', () => {
  it('行情只有12家上市公司，包含当前价格、峰谷、持股成本和董事', () => {
    const state = game()
    expect(getStockOverview(state, 1)).toHaveLength(12)
    expect(getStockOverview(state, 1)[0]).toMatchObject({ companyId: 1, price: 20, previousPrice: 19, high: 25, low: 15, shares: 3000, averageCost: 10, ceoId: 1 })
    expect(getStockOverview(state, 2)[0]).toMatchObject({ shares: 0, averageCost: 0 })
  })
  it('全员持股包括三家非上市公共事业，各角色列顺序稳定', () => {
    const state = game()
    state.finance.stocks[13]!.holdings[2] = { shares: 30, averageCost: 12 }
    const rows = getHoldingsOverview(state)
    expect(rows).toHaveLength(15)
    expect(rows[12]).toMatchObject({ companyId: 13, listed: false })
    expect(rows[12]!.holdings.map(row => [row.playerId, row.shares])).toEqual([[1, 0], [2, 30], [3, 0], [4, 0]])
  })
  it('所有查询都是只读，不改变完整对局或随机状态', () => {
    const state = game(), before = structuredClone(state)
    getAssetStandings(state); getStockOverview(state, 1); getHoldingsOverview(state)
    for (const parcel of map.parcels) inspectMapCell(state, parcel.buildingCell)
    expect(state).toEqual(before)
  })
})
