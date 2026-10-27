import { describe, expect, it } from 'vitest'
import cardBoard from '../../src/modern/data/card-board.json'
import {
  applyDirectCard,
  getCardBoardRecords,
  getCardCell,
  getCardRecord,
  pickCardCell,
  type DirectCardSnapshot,
} from '../../src/modern/features/game/direct-cards'
import {
  calculateStreetRent,
  createPropertyLedger,
  createPropertyPrices,
  getPropertyOffer,
  type PropertyLedger,
} from '../../src/modern/features/game/property'
import type { GridPoint } from '../../src/modern/features/map/types'
import type { PlayerState } from '../../src/modern/features/game/types'

function player(id: number, position: GridPoint, cash = 10_000, deposit = 20_000): PlayerState {
  return {
    id,
    characterId: id,
    name: `player-${id}`,
    controller: 'human',
    hometown: id as 1 | 2 | 3 | 4,
    position,
    direction: 1,
    cash,
    deposit,
  }
}

function snapshot(
  cards: number[],
  options: {
    players?: PlayerState[]
    properties?: PropertyLedger
    prices?: ReturnType<typeof createPropertyPrices>
    inventories?: Record<number, number[]>
    unownedOwnerDeposit?: number
  } = {},
): DirectCardSnapshot {
  const players = options.players ?? [
    player(1, { column: 6, row: 32 }),
    player(2, { column: 27, row: 33 }, 20_000, 30_000),
  ]
  return {
    players,
    properties: options.properties ?? createPropertyLedger(),
    prices: options.prices ?? createPropertyPrices(),
    inventories: options.inventories ?? Object.fromEntries(players.map(value => [value.id, value.id === 1 ? cards : []])),
    credit: Object.fromEntries(players.map(value => [value.id, { used: 1000, available: 5000, score: 100 }])),
    forcedDice: Object.fromEntries(players.map(value => [value.id, null])),
    stayPlayerIds: [],
    unownedOwnerDeposit: options.unownedOwnerDeposit ?? 100_000,
  }
}

function actor(result: ReturnType<typeof applyDirectCard>): PlayerState {
  return result.snapshot.players.find(value => value.id === 1)!
}

describe('原网格卡牌目标元数据', () => {
  it('保留完整43×41源网格、235条源记录、住宅配对与医院监狱元数据', () => {
    expect(cardBoard).toMatchObject({
      rows: 43,
      columns: 41,
      sourceSha256: '790ac003dfe627d8d9cc0a929740d2240e18f23a98d6606ecd614804063d71ba',
      hospital: [2, 19, 1],
      jail: [4, 21, 41],
      initialOwnerZeroDeposit: 100_000,
    })
    expect(cardBoard.grid).toHaveLength(43)
    expect(cardBoard.records).toHaveLength(235)
    expect(cardBoard.parcelPairs).toHaveLength(56)
    expect(getCardCell({ column: 6, row: 32 })).toEqual({ id: 1, type: 16, ordinal: 1, parcelId: 1 })
    expect(getCardCell({ column: 5, row: 31 })).toEqual({ id: 2, type: 16, ordinal: 2, parcelId: 1 })
    expect(getCardCell({ column: -1, row: 0 })).toBeUndefined()
  })

  it('按原getpoint象限从0型格选择相邻源格', () => {
    const picked = pickCardCell({ x: 17 * 56 + 54, y: 20 })
    expect(picked).toEqual({
      position: { column: 18, row: 0 },
      cell: getCardCell({ column: 18, row: 0 }),
    })
  })

  it('向世界卡模块提供含坐标和方向的完整源记录副本', () => {
    const records = getCardBoardRecords()
    expect(records).toHaveLength(235)
    expect(getCardRecord(1)).toEqual({
      id: 1,
      type: 16,
      ordinal: 1,
      streetId: 1,
      facing: 3,
      position: { column: 6, row: 32 },
    })
    records[1]!.position.column = 99
    expect(getCardRecord(1)?.position).toEqual({ column: 6, row: 32 })
    expect(getCardRecord(999)).toBeUndefined()
  })
})

describe('直接卡牌结算', () => {
  it('信用卡接受0和剩余额度内有限金额，重复使用且从不消耗手牌', () => {
    const source = snapshot([1, 5])
    const zero = applyDirectCard(source, 1, 0, { kind: 'credit', amount: 0 })
    expect(zero).toMatchObject({ cardId: 1, consumed: false, status: 'applied', amount: 0 })
    expect(zero.snapshot.inventories[1]).toEqual([1, 5])
    expect(zero.snapshot.credit[1]).toEqual({ used: 1000, available: 5000, score: 100 })
    const borrowed = applyDirectCard(zero.snapshot, 1, 0, { kind: 'credit', amount: 1250.5 })
    expect(actor(borrowed).cash).toBe(11_250.5)
    expect(borrowed.snapshot.credit[1]).toEqual({ used: 2250.5, available: 3749.5, score: 100 })
    expect(borrowed.snapshot.inventories[1]).toEqual([1, 5])

    const invalid = applyDirectCard(source, 1, 0, { kind: 'credit', amount: 5001 })
    expect(invalid).toMatchObject({ consumed: false, status: 'invalid-target' })
    expect(invalid.snapshot).toEqual(source)
  })

  it('控骰卡只接受1至6整数并只删除选中的重复卡', () => {
    const source = snapshot([5, 11, 5])
    const invalid = applyDirectCard(source, 1, 2, { kind: 'dice', value: 2.5 })
    expect(invalid).toMatchObject({ cardId: 5, consumed: false, status: 'invalid-target' })
    expect(invalid.snapshot).toEqual(source)
    const result = applyDirectCard(source, 1, 2, { kind: 'dice', value: 6 })
    expect(result.snapshot.forcedDice[1]).toBe(6)
    expect(result.snapshot.inventories[1]).toEqual([5, 11])
  })

  it('停留卡设置一次标记，重复使用仍再次耗卡', () => {
    const first = applyDirectCard(snapshot([27, 27]), 1, 0, { kind: 'confirm' })
    expect(first.snapshot.stayPlayerIds).toEqual([1])
    expect(first.snapshot.inventories[1]).toEqual([27])
    const second = applyDirectCard(first.snapshot, 1, 0, { kind: 'confirm' })
    expect(second.snapshot.stayPlayerIds).toEqual([1])
    expect(second.snapshot.inventories[1]).toEqual([])
  })

  it('购地卡使用当前价格和保留等级，现金不足继续扣存款并足额给原屋主', () => {
    const properties = createPropertyLedger()
    properties[1] = { ownerId: 2, level: 2 }
    const prices = createPropertyPrices()
    prices[1] = 1800
    const source = snapshot([11], {
      properties,
      prices,
      players: [player(1, { column: 6, row: 32 }, 500, 1000), player(2, { column: 27, row: 33 }, 20_000, 30_000)],
    })
    const before = structuredClone(source)
    const result = applyDirectCard(source, 1, 0, { kind: 'confirm' })
    expect(result).toMatchObject({ amount: 2700, affectedParcelIds: [1], affectedPlayerIds: [1, 2], insolventPlayerIds: [1] })
    expect(result.snapshot.properties[1]).toEqual({ ownerId: 1, level: 2 })
    expect(actor(result)).toMatchObject({ cash: 0, deposit: -1200 })
    expect(result.snapshot.players.find(value => value.id === 2)?.deposit).toBe(32_700)
    expect(source).toEqual(before)
  })

  it('购地卡收购无主地时把全款存入初始10万元备用账户', () => {
    const properties = createPropertyLedger()
    properties[1] = { ownerId: null, level: 1 }
    const result = applyDirectCard(snapshot([11], { properties }), 1, 0, { kind: 'confirm' })
    expect(result.amount).toBe(1900)
    expect(result.snapshot.unownedOwnerDeposit).toBe(101_900)
    expect(result.snapshot.properties[1]).toEqual({ ownerId: 1, level: 1 })
  })

  it('炒地卡从当前地块价格计算整条街的新价，后续购买和租金使用新价', () => {
    const prices = createPropertyPrices()
    prices[1] = 1555
    const inflated = applyDirectCard(snapshot([14], { prices }), 1, 0, { kind: 'confirm' })
    expect(inflated.amount).toBe(1860)
    expect([1, 3, 5, 7].map(id => inflated.snapshot.prices[id])).toEqual([1860, 1860, 1860, 1860])
    expect(getPropertyOffer(inflated.snapshot, 1, 1).amount).toBe(1860)
    const owned = structuredClone(inflated.snapshot.properties)
    owned[1] = { ownerId: 1, level: 0 }
    owned[3] = { ownerId: 1, level: 1 }
    expect(calculateStreetRent(owned, 1, 1, inflated.snapshot.prices)).toBe(2232)
  })

  it('拆屋卡可从配对建筑格把任意屋主房屋降一级', () => {
    const properties = createPropertyLedger()
    properties[1] = { ownerId: 2, level: 2 }
    const result = applyDirectCard(snapshot([15], { properties }), 1, 0, {
      kind: 'cell', position: { column: 5, row: 31 },
    })
    expect(result.snapshot.properties[1]).toEqual({ ownerId: 2, level: 1 })
    expect(result).toMatchObject({ consumed: true, affectedParcelIds: [1], affectedPlayerIds: [2] })
  })

  it('怪兽卡可从道路格把任意屋主房屋直接清零', () => {
    const properties = createPropertyLedger()
    properties[1] = { ownerId: 2, level: 4 }
    const result = applyDirectCard(snapshot([20], { properties }), 1, 0, {
      kind: 'cell', position: { column: 6, row: 32 },
    })
    expect(result.snapshot.properties[1]).toEqual({ ownerId: 2, level: 0 })
    expect(result.affectedParcelIds).toEqual([1])
  })

  it('天使卡把当前街道所有住宅各升一级且无主0级只到1级', () => {
    const properties = createPropertyLedger()
    properties[1] = { ownerId: 1, level: 4 }
    properties[3] = { ownerId: null, level: 0 }
    properties[5] = { ownerId: 2, level: 5 }
    const result = applyDirectCard(snapshot([18], { properties }), 1, 0, { kind: 'confirm' })
    expect([1, 3, 5, 7].map(id => result.snapshot.properties[id]?.level)).toEqual([5, 1, 5, 1])
    expect(result.affectedParcelIds).toEqual([1, 3, 7])
  })

  it('恶魔卡把当前街道所有住宅各降一级并保留无主产权', () => {
    const properties = createPropertyLedger()
    properties[1] = { ownerId: 1, level: 1 }
    properties[3] = { ownerId: null, level: 2 }
    const result = applyDirectCard(snapshot([19], { properties }), 1, 0, { kind: 'confirm' })
    expect([1, 3, 5, 7].map(id => result.snapshot.properties[id]?.level)).toEqual([0, 1, 0, 0])
    expect(result.snapshot.properties[3]?.ownerId).toBeNull()
    expect(result.affectedParcelIds).toEqual([1, 3])
  })

  it('均富卡按源ordinal奇数目标把较穷玩家现金直接设为对方现金', () => {
    const result = applyDirectCard(snapshot([25]), 1, 0, {
      kind: 'cell', position: { column: 27, row: 33 },
    })
    expect(getCardCell({ column: 27, row: 33 })).toMatchObject({ id: 114, ordinal: 1 })
    expect(actor(result)).toMatchObject({ cash: 20_000, deposit: 20_000 })
    expect(result.snapshot.players.find(value => value.id === 2)).toMatchObject({ cash: 20_000, deposit: 30_000 })
    expect(result.amount).toBe(10_000)
  })

  it('均贫卡按源ordinal奇数目标把较富玩家现金直接设为使用者现金', () => {
    const result = applyDirectCard(snapshot([26]), 1, 0, {
      kind: 'cell', position: { column: 27, row: 33 },
    })
    expect(result.snapshot.players.find(value => value.id === 2)).toMatchObject({ cash: 10_000, deposit: 30_000 })
    expect(actor(result)).toMatchObject({ cash: 10_000, deposit: 20_000 })
    expect(result.amount).toBe(10_000)
  })

  it('查税卡对负现金也按Math.trunc的原语义转移负金额', () => {
    const source = snapshot([33], {
      players: [player(1, { column: 6, row: 32 }, 50, 20_000), player(2, { column: 27, row: 33 }, -105, 30_000)],
    })
    const result = applyDirectCard(source, 1, 0, { kind: 'cell', position: { column: 27, row: 33 } })
    expect(result.amount).toBe(-10)
    expect(actor(result).cash).toBe(40)
    expect(result.snapshot.players.find(value => value.id === 2)?.cash).toBe(-95)
  })

  it('所有需要目标的卡在选择类型或目标无效时不改变状态且不耗卡', () => {
    const cases = [
      { cardId: 11, choice: { kind: 'cell', position: { column: 6, row: 32 } } as const },
      { cardId: 14, choice: { kind: 'confirm' } as const, position: { column: 34, row: 8 } },
      { cardId: 15, choice: { kind: 'cell', position: { column: 6, row: 32 } } as const },
      { cardId: 18, choice: { kind: 'confirm' } as const, position: { column: 34, row: 8 } },
      { cardId: 19, choice: { kind: 'confirm' } as const, position: { column: 34, row: 8 } },
      { cardId: 20, choice: { kind: 'cell', position: { column: 6, row: 32 } } as const },
      { cardId: 25, choice: { kind: 'cell', position: { column: 27, row: 33 } } as const, cash: 30_000 },
      { cardId: 26, choice: { kind: 'cell', position: { column: 27, row: 33 } } as const, cash: 30_000 },
      { cardId: 33, choice: { kind: 'cell', position: { column: 26, row: 33 } } as const },
    ]
    for (const item of cases) {
      const properties = createPropertyLedger()
      const source = snapshot([item.cardId], {
        properties,
        players: [
          player(1, item.position ?? { column: 6, row: 32 }, item.cash ?? 10_000),
          player(2, { column: 27, row: 33 }, 20_000),
        ],
      })
      const before = structuredClone(source)
      const result = applyDirectCard(source, 1, 0, item.choice)
      expect(result.status, `card ${item.cardId}`).toBe('invalid-target')
      expect(result.consumed, `card ${item.cardId}`).toBe(false)
      expect(result.reason, `card ${item.cardId}`).not.toBeNull()
      expect(result.snapshot, `card ${item.cardId}`).toEqual(before)
      expect(source, `card ${item.cardId}`).toEqual(before)
    }
  })

  it('拒绝不支持的卡和无效手牌槽', () => {
    expect(() => applyDirectCard(snapshot([6]), 1, 0, { kind: 'confirm' })).toThrow()
    expect(() => applyDirectCard(snapshot([5]), 1, 1, { kind: 'dice', value: 1 })).toThrow()
  })
})
