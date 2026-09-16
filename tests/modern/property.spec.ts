import { describe, expect, it } from 'vitest'
import mapData from '../../src/modern/data/map.json'
import {
  applyPropertyOffer,
  calculateStreetRent,
  createPropertyLedger,
  createPropertyPrices,
  findParcelAt,
  getPropertyOffer,
  getPropertySummary,
  type EconomySnapshot,
  type PropertyLedger,
} from '../../src/modern/features/game/property'
import type { PlayerState } from '../../src/modern/features/game/types'

function player(id: number, cash = 100_000, deposit = 100_000): PlayerState {
  return {
    id,
    characterId: id,
    name: `player-${id}`,
    controller: 'human',
    hometown: id as 1 | 2 | 3 | 4,
    position: { column: id, row: id },
    direction: 1,
    cash,
    deposit,
  }
}

function snapshot(
  players: PlayerState[] = [player(1), player(2)],
  properties: PropertyLedger = createPropertyLedger(),
  godIds?: Record<number, number | null>,
): EconomySnapshot {
  return { players, properties, godIds }
}

describe('住宅地账本与落点查询', () => {
  it('从真实地图初始化全部56块住宅地', () => {
    const properties = createPropertyLedger()
    expect(Object.keys(properties).map(Number)).toEqual(mapData.parcels.map(parcel => parcel.id))
    expect(Object.values(properties)).toHaveLength(56)
    expect(Object.values(properties).every(property => property.ownerId === null && property.level === 0)).toBe(true)
  })

  it('只按住宅道路格查找地块，不把配对建筑格或特殊格当作住宅', () => {
    expect(findParcelAt({ column: 6, row: 32 })?.id).toBe(1)
    expect(findParcelAt({ column: 5, row: 31 })).toBeUndefined()
    expect(findParcelAt({ column: 34, row: 8 })).toBeUndefined()
  })
})

describe('当前地块报价', () => {
  it('使用当前价格表报价并保留未传价格表时的原价行为', () => {
    const prices = createPropertyPrices()
    prices[1] = 1860
    expect(getPropertyOffer({ ...snapshot(), prices }, 1, 1)).toEqual({
      kind: 'purchase', parcelId: 1, amount: 1860, ownerId: null,
    })
    expect(getPropertyOffer(snapshot(), 1, 1).amount).toBe(1500)
  })

  it('无人地按地图地价报价，购买已有等级时仍保留该等级', () => {
    const properties = createPropertyLedger()
    properties[1] = { ownerId: null, level: 3 }
    expect(getPropertyOffer(snapshot(undefined, properties), 1, 1)).toEqual({
      kind: 'purchase', parcelId: 1, amount: 1500, ownerId: null,
    })
    const result = applyPropertyOffer(snapshot(undefined, properties), 1, 1, 'accept')
    expect(result.properties[1]).toEqual({ ownerId: 1, level: 3 })
    expect(result.event).toEqual({ kind: 'purchased', playerId: 1, parcelId: 1, amount: 1500, level: 3 })
  })

  it('自有地给出逐级升级报价，五级地给出满级结果', () => {
    const properties = createPropertyLedger()
    properties[1] = { ownerId: 1, level: 0 }
    properties[3] = { ownerId: 1, level: 4 }
    properties[5] = { ownerId: 1, level: 5 }
    expect(getPropertyOffer(snapshot(undefined, properties), 1, 1)).toEqual({
      kind: 'upgrade', parcelId: 1, amount: 100, ownerId: 1,
    })
    expect(getPropertyOffer(snapshot(undefined, properties), 1, 3)).toEqual({
      kind: 'upgrade', parcelId: 3, amount: 500, ownerId: 1,
    })
    expect(getPropertyOffer(snapshot(undefined, properties), 1, 5)).toEqual({
      kind: 'max-level', parcelId: 5, amount: 0, ownerId: 1,
    })
  })

  it('敌方地按地主在同街道的全部住宅计算租金', () => {
    const properties = createPropertyLedger()
    properties[1] = { ownerId: 1, level: 0 }
    properties[3] = { ownerId: 1, level: 1 }
    expect(getPropertyOffer(snapshot(undefined, properties), 2, 1)).toEqual({
      kind: 'rent', parcelId: 1, amount: 1800, ownerId: 1,
    })
  })

  it('拒绝无效玩家、地块和账本状态且不修改输入', () => {
    const source = snapshot()
    const before = structuredClone(source)
    expect(() => getPropertyOffer(source, 99, 1)).toThrow()
    expect(() => getPropertyOffer(source, 1, 2)).toThrow()

    const missing = snapshot(undefined, { ...source.properties })
    delete missing.properties[1]
    expect(() => getPropertyOffer(missing, 1, 1)).toThrow()

    const invalidLevel = snapshot(undefined, { ...source.properties, 1: { ownerId: null, level: 6 as 5 } })
    expect(() => getPropertyOffer(invalidLevel, 1, 1)).toThrow()

    const invalidOwner = snapshot(undefined, { ...source.properties, 1: { ownerId: 99, level: 0 } })
    expect(() => applyPropertyOffer(invalidOwner, 1, 1, 'accept')).toThrow()
    expect(source).toEqual(before)
  })
})

describe('街道租金', () => {
  it('用当前价格计算租金并保留三参数调用的原价结果', () => {
    const properties = createPropertyLedger()
    properties[1] = { ownerId: 1, level: 0 }
    properties[3] = { ownerId: 1, level: 1 }
    const prices = createPropertyPrices()
    prices[1] = 1860
    prices[3] = 1860
    expect(calculateStreetRent(properties, 1, 1, prices)).toBe(2232)
    expect(calculateStreetRent(properties, 1, 1)).toBe(1800)
  })

  it('使用原版整数十分比率，并只汇总同地主同街道地块', () => {
    const properties = createPropertyLedger()
    properties[1] = { ownerId: 1, level: 0 }
    properties[3] = { ownerId: 1, level: 1 }
    properties[5] = { ownerId: 2, level: 5 }
    properties[9] = { ownerId: 1, level: 5 }
    expect(calculateStreetRent(properties, 1, 1)).toBe(1800)
  })
})

describe('纯财产结算', () => {
  it('财神免租、穷神双倍租金，普通快照保持原租金', () => {
    const properties = createPropertyLedger()
    properties[1] = { ownerId: 1, level: 0 }
    const wealthy = snapshot([player(1), player(2)], properties, { 1: null, 2: 2 })
    const poor = snapshot([player(1), player(2)], properties, { 1: null, 2: 3 })
    expect(getPropertyOffer(wealthy, 2, 1).amount).toBe(0)
    expect(getPropertyOffer(poor, 2, 1).amount).toBe(1200)
    expect(getPropertyOffer(snapshot([player(1), player(2)], properties), 2, 1).amount).toBe(600)
  })

  it('福神付一次标准款升两级并封顶5，衰神付费但不升级', () => {
    const properties = createPropertyLedger()
    properties[1] = { ownerId: 1, level: 3 }
    properties[3] = { ownerId: 1, level: 2 }
    const fortunate = applyPropertyOffer(snapshot([player(1)], properties, { 1: 4 }), 1, 1, 'accept')
    expect(fortunate.players[0]!.cash).toBe(99_600)
    expect(fortunate.properties[1]!.level).toBe(5)
    expect(fortunate.event).toEqual({ kind: 'upgraded', playerId: 1, parcelId: 1, amount: 400, level: 5 })

    const unfortunate = applyPropertyOffer(snapshot([player(1)], properties, { 1: 5 }), 1, 3, 'accept')
    expect(unfortunate.players[0]!.cash).toBe(99_700)
    expect(unfortunate.properties[3]!.level).toBe(2)
    expect(unfortunate.event).toEqual({ kind: 'upgrade-failed', playerId: 1, parcelId: 3, amount: 300, level: 2 })
  })

  it('神力不改变无主地购买报价和购买结果', () => {
    for (const godId of [2, 3, 4, 5, 10, 11]) {
      const source = snapshot([player(1)], createPropertyLedger(), { 1: godId })
      expect(getPropertyOffer(source, 1, 1)).toEqual({ kind: 'purchase', parcelId: 1, amount: 1500, ownerId: null })
      expect(applyPropertyOffer(source, 1, 1, 'accept').properties[1]).toEqual({ ownerId: 1, level: 0 })
    }
  })

  it('接受事件留下的负现金并在租金结算时把现金债务一并转入存款', () => {
    const properties = createPropertyLedger()
    properties[1] = { ownerId: 1, level: 0 }
    const result = applyPropertyOffer(snapshot([player(1), player(2, -100, 2000)], properties), 2, 1, 'accept')
    expect(result.players.find(value => value.id === 2)).toMatchObject({ cash: 0, deposit: 1300 })
    expect(result.players.find(value => value.id === 1)?.deposit).toBe(100_600)
  })

  it('购买只扣现金，取消或现金不足不改变资金和产权', () => {
    const bought = applyPropertyOffer(snapshot([player(1)]), 1, 1, 'accept')
    expect(bought.players[0]).toMatchObject({ cash: 98_500, deposit: 100_000 })
    expect(bought.properties[1]).toEqual({ ownerId: 1, level: 0 })
    expect(bought.insolvent).toBe(false)

    const declinedSource = snapshot([player(1)])
    const declined = applyPropertyOffer(declinedSource, 1, 1, 'decline')
    expect(declined.event).toEqual({ kind: 'declined', playerId: 1, parcelId: 1, amount: 1500 })
    expect(declined.players).toEqual(declinedSource.players)
    expect(declined.properties).toEqual(declinedSource.properties)

    const poorSource = snapshot([player(1, 1499, 100_000)])
    const poor = applyPropertyOffer(poorSource, 1, 1, 'accept')
    expect(poor.event).toEqual({ kind: 'insufficient-cash', playerId: 1, parcelId: 1, amount: 1500 })
    expect(poor.players).toEqual(poorSource.players)
    expect(poor.properties).toEqual(poorSource.properties)
  })

  it('把0级升到1级扣100现金，把4级升到5级扣500现金', () => {
    const properties = createPropertyLedger()
    properties[1] = { ownerId: 1, level: 0 }
    properties[3] = { ownerId: 1, level: 4 }
    const first = applyPropertyOffer(snapshot([player(1)], properties), 1, 1, 'accept')
    expect(first.players[0]!.cash).toBe(99_900)
    expect(first.properties[1]!.level).toBe(1)
    expect(first.event).toEqual({ kind: 'upgraded', playerId: 1, parcelId: 1, amount: 100, level: 1 })
    const fifth = applyPropertyOffer(snapshot(first.players, first.properties), 1, 3, 'accept')
    expect(fifth.players[0]!.cash).toBe(99_400)
    expect(fifth.properties[3]!.level).toBe(5)
    expect(fifth.event).toEqual({ kind: 'upgraded', playerId: 1, parcelId: 3, amount: 500, level: 5 })
  })

  it('五级地不扣款，升级可取消且余额不足时只看现金', () => {
    const properties = createPropertyLedger()
    properties[1] = { ownerId: 1, level: 5 }
    properties[3] = { ownerId: 1, level: 0 }
    const full = applyPropertyOffer(snapshot([player(1)], properties), 1, 1, 'accept')
    expect(full.event).toEqual({ kind: 'max-level', playerId: 1, parcelId: 1, amount: 0, level: 5 })
    expect(full.players[0]!.cash).toBe(100_000)

    const declined = applyPropertyOffer(snapshot([player(1)], properties), 1, 3, 'decline')
    expect(declined.event.kind).toBe('declined')
    expect(declined.properties[3]!.level).toBe(0)

    const poor = applyPropertyOffer(snapshot([player(1, 99, 100_000)], properties), 1, 3, 'accept')
    expect(poor.event.kind).toBe('insufficient-cash')
    expect(poor.properties[3]!.level).toBe(0)
  })

  it('租金先扣现金再扣存款，并把完整租金计入地主存款', () => {
    const properties = createPropertyLedger()
    properties[1] = { ownerId: 1, level: 0 }
    properties[3] = { ownerId: 1, level: 1 }
    const result = applyPropertyOffer(snapshot([player(1), player(2, 100, 2000)], properties), 2, 1, 'accept')
    expect(result.event).toEqual({ kind: 'rent-paid', playerId: 2, parcelId: 1, amount: 1800, recipientId: 1 })
    expect(result.players.find(value => value.id === 2)).toMatchObject({ cash: 0, deposit: 300 })
    expect(result.players.find(value => value.id === 1)).toMatchObject({ cash: 100_000, deposit: 101_800 })
    expect(result.insolvent).toBe(false)
  })

  it('租金不可取消，资金耗尽时允许负存款并保持总额守恒', () => {
    const properties = createPropertyLedger()
    properties[1] = { ownerId: 1, level: 0 }
    properties[3] = { ownerId: 1, level: 1 }
    const source = snapshot([player(1), player(2, 100, 200)], properties)
    const totalBefore = source.players.reduce((sum, value) => sum + value.cash + value.deposit, 0)
    const result = applyPropertyOffer(source, 2, 1, 'decline')
    expect(result.event.kind).toBe('rent-paid')
    expect(result.players.find(value => value.id === 2)).toMatchObject({ cash: 0, deposit: -1500 })
    expect(result.players.reduce((sum, value) => sum + value.cash + value.deposit, 0)).toBe(totalBefore)
    expect(result.insolvent).toBe(true)
  })

  it('所有结果都不修改或复用输入玩家和账本对象', () => {
    const properties = createPropertyLedger()
    properties[1] = { ownerId: 1, level: 0 }
    properties[3] = { ownerId: 1, level: 1 }
    const source = snapshot([player(1), player(2, 100, 2000)], properties)
    const before = structuredClone(source)
    const result = applyPropertyOffer(source, 2, 1, 'accept')
    expect(source).toEqual(before)
    expect(result.players).not.toBe(source.players)
    expect(result.players.every((value, index) => value !== source.players[index])).toBe(true)
    expect(result.properties).not.toBe(source.properties)
    expect(Object.keys(result.properties).every(id => result.properties[Number(id)] !== source.properties[Number(id)])).toBe(true)
  })

  it('汇总地块数与有等级建筑数，不推导净资产', () => {
    const properties = createPropertyLedger()
    properties[1] = { ownerId: 1, level: 0 }
    properties[3] = { ownerId: 1, level: 1 }
    properties[5] = { ownerId: 2, level: 5 }
    expect(getPropertySummary(properties, 1)).toEqual({ landCount: 2, buildingCount: 1 })
  })
})
