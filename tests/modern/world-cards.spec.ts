import { describe, expect, it } from 'vitest'
import worldRules from '../../src/modern/data/world-rules.json'
import { createPropertyLedger, createPropertyPrices, getPropertyOffer } from '../../src/modern/features/game/property'
import { getCardBoardRecords, getCardCell } from '../../src/modern/features/game/direct-cards'
import {
  advanceWorldDay,
  applyBankCredit,
  applyLandingGod,
  applyWorldCard,
  createWorldState,
  prepareWorldTurn,
  resolveWorldCell,
  toPropertyEconomy,
  type WorldSnapshot,
} from '../../src/modern/features/game/world-cards'
import type { GridPoint } from '../../src/modern/features/map/types'
import type { PlayerState } from '../../src/modern/features/game/types'

function player(
  id: number,
  position: GridPoint = { column: 6, row: 32 },
  controller: 'human' | 'ai' = 'human',
  cash = 100_000,
): PlayerState {
  return {
    id,
    characterId: id,
    name: `player-${id}`,
    controller,
    hometown: id as 1 | 2 | 3 | 4,
    position: { ...position },
    direction: 1,
    cash,
    deposit: 100_000,
  }
}

function snapshot(
  cards: number[] = [],
  players: PlayerState[] = [player(1)],
): WorldSnapshot {
  return {
    players,
    properties: createPropertyLedger(),
    prices: createPropertyPrices(),
    inventories: Object.fromEntries(players.map(value => [value.id, value.id === 1 ? [...cards] : []])),
    credit: Object.fromEntries(players.map(value => [value.id, { used: 0, available: 0, score: 100 }])),
    forcedDice: Object.fromEntries(players.map(value => [value.id, null])),
    stayPlayerIds: [],
    unownedOwnerDeposit: 100_000,
    rngState: 0,
    world: {
      markers: {},
      statuses: Object.fromEntries(players.map(value => [value.id, { state: 0, days: 0, godId: null, godDays: 0 }])),
      weekday: 1,
      elapsedDays: 0,
      year: 2026,
      month: 1,
      day: 5,
    },
    tickets: Object.fromEntries(players.map(value => [value.id, 200])),
    lostAndFoundFunds: [0, 0],
  }
}

function markerAt(source: WorldSnapshot, position: GridPoint, npcId: number): void {
  const cell = getCardCell(position)
  if (cell === undefined) throw new Error('test marker position must exist')
  source.world.markers[cell.id] = npcId
}

describe('世界规则来源与初始占位', () => {
  it('保留12个源启用NPC、六神、槽位AI等级和医院监狱元数据', () => {
    expect(worldRules.initialNpcIds).toEqual([1, 2, 3, 4, 5, 9, 10, 11, 12, 13, 14, 15])
    expect(worldRules.godIds).toEqual([2, 3, 4, 5, 10, 11])
    expect(worldRules.aiLevels).toEqual([1, 2, 2, 3])
    expect(worldRules.initialCredit).toEqual({ score: 100, used: 0, available: 0, grant: 100000 })
    expect(worldRules.initialTickets).toBe(200)
    expect(worldRules.hospital).toEqual({ direction: 2, position: { column: 19, row: 1 }, days: 3 })
    expect(worldRules.jail).toEqual({ direction: 4, position: { column: 21, row: 41 }, days: 5 })
  })

  it('按源顺序单次抽样放置全部NPC，排除玩家格并保持唯一实例', () => {
    const players = [player(1, { column: 6, row: 32 }), player(2, { column: 7, row: 31 })]
    const result = createWorldState(players, 123, 4)
    const cellsByNpc = worldRules.initialNpcIds.map(npcId =>
      Number(Object.entries(result.world.markers).find(([, value]) => value === npcId)?.[0]))
    expect(cellsByNpc).toEqual([53, 81, 11, 43, 69, 111, 71, 63, 19, 120, 114, 154])
    expect(new Set(cellsByNpc).size).toBe(12)
    expect(cellsByNpc).not.toContain(1)
    expect(cellsByNpc).not.toContain(3)
    expect(result.rngState).toBe(4163809639)
    expect(result.world.statuses).toEqual({
      1: { state: 0, days: 0, godId: null, godDays: 0 },
      2: { state: 0, days: 0, godId: null, godDays: 0 },
    })
  })
})

describe('障碍卡、地雷卡与触发时序', () => {
  it.each([[6, 'barrier-placed'], [7, 'mine-placed']] as const)(
    '卡%s只在合法无人无标记格放置并消耗',
    (cardId, kind) => {
      const source = snapshot([cardId])
      const before = structuredClone(source)
      const result = applyWorldCard(source, 1, 0, { kind: 'cell', position: { column: 18, row: 2 } })
      expect(result).toMatchObject({ consumed: true, invalidReason: null, event: { kind, playerId: 1, cardId } })
      expect(result.snapshot.world.markers[165]).toBe(cardId)
      expect(result.snapshot.inventories[1]).toEqual([])
      expect(source).toEqual(before)
    },
  )

  it('占位、玩家占格和低类型无方向格拒绝放置且保留卡', () => {
    const occupied = snapshot([6], [player(1, { column: 9, row: 29 })])
    occupied.world.markers[165] = 9
    const marker = applyWorldCard(occupied, 1, 0, { kind: 'cell', position: { column: 18, row: 2 } })
    const playerOccupied = applyWorldCard(snapshot([6]), 1, 0, { kind: 'cell', position: { column: 6, row: 32 } })
    const noFacing = applyWorldCard(snapshot([6]), 1, 0, { kind: 'cell', position: { column: 31, row: 25 } })
    for (const result of [marker, playerOccupied, noFacing]) {
      expect(result.consumed).toBe(false)
      expect(result.snapshot.inventories[1]).toEqual([6])
      expect(result.invalidReason).not.toBeNull()
    }
  })

  it('路障逐步清除并停止余步，地雷和神灵经过不触发而地雷落点送医', () => {
    const barrier = snapshot()
    markerAt(barrier, { column: 6, row: 32 }, 6)
    expect(resolveWorldCell(barrier, 1, { column: 6, row: 32 }, 'step')).toMatchObject({
      stopMovement: true, endTurn: false, event: { kind: 'barrier-triggered' }, snapshot: { world: { markers: {} } },
    })

    const mine = snapshot()
    markerAt(mine, { column: 6, row: 32 }, 7)
    expect(resolveWorldCell(mine, 1, { column: 6, row: 32 }, 'step')).toMatchObject({
      event: null, stopMovement: false, snapshot: { world: { markers: { 1: 7 } } },
    })
    const landed = resolveWorldCell(mine, 1, { column: 6, row: 32 }, 'landing')
    expect(landed).toMatchObject({ stopMovement: true, endTurn: true, event: { kind: 'mine-triggered' } })
    expect(landed.snapshot.players[0]).toMatchObject({ position: { column: 19, row: 1 }, direction: 2 })
    expect(landed.snapshot.world.statuses[1]).toMatchObject({ state: 3, days: 3 })

    const god = snapshot()
    markerAt(god, { column: 6, row: 32 }, 2)
    expect(resolveWorldCell(god, 1, { column: 6, row: 32 }, 'step').event).toBeNull()
    expect(god.world.markers[1]).toBe(2)
  })
})

describe('飞弹卡', () => {
  it('只降低五格内住宅偶数ordinal建筑侧，住宅道路侧不重复降级', () => {
    const source = snapshot([9], [player(1, { column: 6, row: 32 })])
    source.properties[99]!.level = 3
    source.properties[101]!.level = 3
    source.properties[103]!.level = 3
    const result = applyWorldCard(source, 1, 0, { kind: 'cell', position: { column: 30, row: 8 } })
    expect(result).toMatchObject({ consumed: true, event: { kind: 'missile-fired', affectedCellIds: [104] } })
    expect(result.snapshot.properties[99]!.level).toBe(3)
    expect(result.snapshot.properties[101]!.level).toBe(3)
    expect(result.snapshot.properties[103]!.level).toBe(2)
  })

  it('有效空弹仍消耗；公共建筑使发射者入狱，但自身中弹时住院优先', () => {
    const empty = applyWorldCard(snapshot([9]), 1, 0, { kind: 'cell', position: { column: 17, row: 1 } })
    expect(empty).toMatchObject({ consumed: true, endTurn: false, event: { kind: 'missile-fired', affectedCellIds: [] } })

    const publicHit = applyWorldCard(snapshot([9]), 1, 0, { kind: 'cell', position: { column: 24, row: 32 } })
    expect(publicHit.snapshot.players[0]).toMatchObject({ position: { column: 21, row: 41 }, direction: 4 })
    expect(publicHit.snapshot.world.statuses[1]).toMatchObject({ state: 2, days: 5 })
    expect(publicHit).toMatchObject({ endTurn: true, event: { kind: 'missile-fired' } })

    const selfHitSource = snapshot([9], [player(1, { column: 24, row: 32 })])
    const selfHit = applyWorldCard(selfHitSource, 1, 0, { kind: 'cell', position: { column: 24, row: 32 } })
    expect(selfHit.snapshot.players[0]).toMatchObject({ position: { column: 19, row: 1 }, direction: 2 })
    expect(selfHit.snapshot.world.statuses[1]).toMatchObject({ state: 3, days: 3 })
    expect(selfHit.event?.affectedPlayerIds).toEqual([1])
  })

  it('越界和type34中心发射失败并保留卡', () => {
    const edge = applyWorldCard(snapshot([9]), 1, 0, { kind: 'cell', position: { column: 0, row: 0 } })
    const type34 = applyWorldCard(snapshot([9]), 1, 0, { kind: 'cell', position: { column: 1, row: 1 } })
    expect(edge.consumed).toBe(false)
    expect(type34.consumed).toBe(false)
  })
})

describe('招神卡与送神卡', () => {
  it('先选全局最近神再做矩形校验，矩形内另有神也不改选且失败保留卡', () => {
    const source = snapshot([21], [player(1, { column: 9, row: 29 })])
    source.world.markers = { 23: 2, 146: 3 }
    const result = applyWorldCard(source, 1, 0, { kind: 'confirm' })
    expect(result.consumed).toBe(false)
    expect(result.invalidReason).not.toBeNull()
    expect(result.snapshot).toBe(source)
  })

  it('等距按固定神ID顺序附身7日、无自然奖励，并清神标记后放回旧神', () => {
    const source = snapshot([21, 5], [player(1, { column: 6, row: 32 }, 'human', 321)])
    source.world.markers = { 7: 3, 136: 2 }
    source.world.statuses[1] = { state: 0, days: 0, godId: 10, godDays: 4 }
    const result = applyWorldCard(source, 1, 0, { kind: 'confirm' })
    expect(result).toMatchObject({ consumed: true, event: { kind: 'god-summoned', npcId: 2 } })
    expect(result.snapshot.world.statuses[1]).toEqual({ state: 0, days: 0, godId: 2, godDays: 7 })
    expect(result.snapshot.players[0]!.cash).toBe(321)
    expect(result.snapshot.inventories[1]).toEqual([5])
    expect(Object.values(result.snapshot.world.markers).filter(id => id === 2)).toHaveLength(0)
    expect(Object.values(result.snapshot.world.markers).filter(id => id === 10)).toHaveLength(1)
  })

  it('无附身也消耗送神卡；有附身时只放回一个实例并清期限', () => {
    const none = applyWorldCard(snapshot([22]), 1, 0, { kind: 'confirm' })
    expect(none).toMatchObject({ consumed: true, event: { kind: 'god-dismissed' } })
    expect(none.event?.npcId).toBeUndefined()
    expect(none.snapshot.inventories[1]).toEqual([])

    const attached = snapshot([22])
    attached.world.statuses[1] = { state: 0, days: 0, godId: 11, godDays: 7 }
    const result = applyWorldCard(attached, 1, 0, { kind: 'confirm' })
    expect(result.snapshot.world.statuses[1]).toEqual({ state: 0, days: 0, godId: null, godDays: 0 })
    expect(Object.values(result.snapshot.world.markers).filter(id => id === 11)).toHaveLength(1)
  })
})

describe('六神自然遭遇', () => {
  it('财神五次抽数的万位上界为2且可得到29999', () => {
    const source = snapshot([], [player(1, { column: 6, row: 32 }, 'human', 1)])
    source.rngState = 84458
    source.world.markers[1] = 2
    const result = resolveWorldCell(source, 1, { column: 6, row: 32 }, 'landing')
    expect(result.event).toMatchObject({ kind: 'god-encountered', npcId: 2, amount: 29999 })
    expect(result.snapshot.players[0]!.cash).toBe(30000)
    expect(result.snapshot.rngState).toBe(3398504197)
    expect(result.snapshot.world.statuses[1]).toMatchObject({ godId: 2, godDays: 7 })
  })

  it('穷神现金不足仍把完整抽额同时记入两处，现金为0则不走RNG', () => {
    const poor = snapshot([], [player(1, { column: 6, row: 32 }, 'human', 100)])
    poor.world.markers[1] = 3
    const result = resolveWorldCell(poor, 1, { column: 6, row: 32 }, 'landing')
    expect(result.event).toMatchObject({ npcId: 3, amount: 6822 })
    expect(result.snapshot.players[0]!.cash).toBe(0)
    expect(result.snapshot.lostAndFoundFunds).toEqual([6822, 6822])
    expect(result.snapshot.rngState).toBe(2868466484)

    const zero = snapshot([], [player(1, { column: 6, row: 32 }, 'human', 0)])
    zero.rngState = 777
    zero.world.markers[1] = 3
    const noDraw = resolveWorldCell(zero, 1, { column: 6, row: 32 }, 'landing')
    expect(noDraw.snapshot.rngState).toBe(777)
    expect(noDraw.snapshot.lostAndFoundFunds).toEqual([0, 0])
  })

  it('福神在22/23/24张手牌时分别抽2/1/0次，衰神按边界消牌', () => {
    for (const [count, added] of [[22, 2], [23, 1], [24, 0]] as const) {
      const source = snapshot(Array(count).fill(5))
      source.world.markers[1] = 4
      const result = resolveWorldCell(source, 1, { column: 6, row: 32 }, 'landing')
      expect(result.snapshot.inventories[1]).toHaveLength(count + added)
      expect(result.event?.cardIds).toHaveLength(added)
      expect(result.snapshot.rngState).toBe(count === 22 ? 1196435762 : count === 23 ? 1013904223 : 0)
    }

    const many = snapshot([5, 6, 7, 9])
    many.world.markers[1] = 5
    const removed = resolveWorldCell(many, 1, { column: 6, row: 32 }, 'landing')
    expect(removed.snapshot.inventories[1]).toHaveLength(2)
    expect(removed.event?.cardIds).toHaveLength(2)
    expect(removed.snapshot.rngState).toBe(1196435762)

    const two = snapshot([5, 6])
    two.rngState = 999
    two.world.markers[1] = 5
    const cleared = resolveWorldCell(two, 1, { column: 6, row: 32 }, 'landing')
    expect(cleared.snapshot.inventories[1]).toEqual([])
    expect(cleared.snapshot.rngState).toBe(999)
  })

  it('天使恶魔没有即时奖励，未开放定时炸弹保留标记并返回deferred', () => {
    for (const godId of [10, 11]) {
      const source = snapshot([5])
      source.world.markers[1] = godId
      const result = resolveWorldCell(source, 1, { column: 6, row: 32 }, 'landing')
      expect(result.event).toMatchObject({ kind: 'god-encountered', npcId: godId, amount: 0, cardIds: [] })
      expect(result.snapshot.players[0]!.cash).toBe(100_000)
      expect(result.snapshot.inventories[1]).toEqual([5])
    }

    const deferred = snapshot()
    deferred.world.markers[1] = 8
    const before = structuredClone(deferred)
    const result = resolveWorldCell(deferred, 1, { column: 6, row: 32 }, 'landing')
    expect(result.event).toMatchObject({ kind: 'npc-deferred', npcId: 8 })
    expect(result.snapshot).toEqual(before)
  })
})

describe('神力地产前置和物业适配', () => {
  it('天使与恶魔先无视房主升降一级，后续报价读取新等级', () => {
    const angel = snapshot()
    angel.properties[1] = { ownerId: 1, level: 2 }
    angel.world.statuses[1]!.godId = 10
    const raised = applyLandingGod(angel, 1, { column: 6, row: 32 })
    expect(raised.snapshot.properties[1]!.level).toBe(3)
    expect(getPropertyOffer(toPropertyEconomy(raised.snapshot), 1, 1)).toMatchObject({ kind: 'upgrade', amount: 400 })

    const devil = snapshot([], [player(1), player(2, { column: 7, row: 31 })])
    devil.properties[1] = { ownerId: 2, level: 1 }
    devil.world.statuses[1]!.godId = 11
    const lowered = applyLandingGod(devil, 1, { column: 6, row: 32 })
    expect(lowered.snapshot.properties[1]!.level).toBe(0)
    expect(getPropertyOffer(toPropertyEconomy(lowered.snapshot), 1, 1)).toMatchObject({ kind: 'rent', amount: 600 })
  })
})

describe('日期、限制释放、神到期与信用申请', () => {
  it('日期仅把正的3/5/7计数各减一次，0保持0并推进星期', () => {
    const source = snapshot([], [player(1), player(2, { column: 7, row: 31 })])
    source.world.weekday = 6
    source.world.statuses[1] = { state: 3, days: 3, godId: 2, godDays: 7 }
    source.world.statuses[2] = { state: 2, days: 0, godId: 3, godDays: 0 }
    expect(advanceWorldDay(source.world)).toEqual({
      markers: {}, weekday: 0, elapsedDays: 1, year: 2026, month: 1, day: 6,
      statuses: {
        1: { state: 3, days: 2, godId: 2, godDays: 6 },
        2: { state: 2, days: 0, godId: 3, godDays: 0 },
      },
    })
  })

  it('限制剩余时跳回合且延后到期神释放；0日同坐标释放后再放回神', () => {
    const held = snapshot()
    held.world.statuses[1] = { state: 3, days: 2, godId: 2, godDays: 0 }
    const skipped = prepareWorldTurn(held, 1)
    expect(skipped).toMatchObject({ skipTurn: true, event: { kind: 'restriction-skipped' } })
    expect(skipped.snapshot.world.statuses[1]!.godId).toBe(2)

    const released = snapshot()
    released.players[0]!.position = { column: 19, row: 1 }
    released.players[0]!.direction = 2
    released.world.statuses[1] = { state: 3, days: 0, godId: 2, godDays: 0 }
    const ready = prepareWorldTurn(released, 1)
    expect(ready.skipTurn).toBe(false)
    expect(ready.snapshot.players[0]).toMatchObject({ position: { column: 19, row: 1 }, direction: 2 })
    expect(ready.snapshot.world.statuses[1]).toEqual({ state: 0, days: 0, godId: null, godDays: 0 })
    expect(Object.values(ready.snapshot.world.markers).filter(id => id === 2)).toHaveLength(1)
  })

  it('AI和人类正常状态都在0日回合开始释放神', () => {
    for (const controller of ['human', 'ai'] as const) {
      const source = snapshot([], [player(1, { column: 6, row: 32 }, controller)])
      source.world.statuses[1] = { state: 0, days: 0, godId: 10, godDays: 0 }
      const result = prepareWorldTurn(source, 1)
      expect(result.skipTurn).toBe(false)
      expect(result.event).toMatchObject({ kind: 'god-expired', npcId: 10 })
      expect(result.snapshot.world.statuses[1]!.godId).toBeNull()
    }
  })

  it('到期神没有空闲出生格时显式报错而不生成重复实例', () => {
    const source = snapshot()
    source.world.statuses[1] = { state: 0, days: 0, godId: 10, godDays: 0 }
    for (const record of getCardBoardRecords()) source.world.markers[record.id] = 6
    expect(() => prepareWorldTurn(source, 1)).toThrow('没有可用出生格')
    expect(source.world.statuses[1]!.godId).toBe(10)
  })

  it('人类周日关闭且需评分/空额度/空间；AI只按槽位等级、首牌和空间', () => {
    const sunday = snapshot()
    sunday.world.weekday = 0
    expect(applyBankCredit(sunday, 1).event?.kind).toBe('bank-closed')

    const human = snapshot([5])
    const granted = applyBankCredit(human, 1)
    expect(granted).toMatchObject({ event: { kind: 'credit-granted', cardIds: [1], amount: 100000 } })
    expect(granted.snapshot.inventories[1]).toEqual([1, 5])
    expect(granted.snapshot.credit[1]).toEqual({ used: 0, available: 100000, score: 100 })
    for (const mutate of [
      (value: WorldSnapshot) => { value.credit[1]!.score = 49 },
      (value: WorldSnapshot) => { value.credit[1]!.used = 1 },
      (value: WorldSnapshot) => { value.credit[1]!.available = 1 },
      (value: WorldSnapshot) => { value.inventories[1] = Array(24).fill(5) },
    ]) {
      const source = snapshot([5])
      mutate(source)
      expect(applyBankCredit(source, 1).event?.kind).toBe('credit-declined')
    }

    const players = [player(1), player(2, { column: 7, row: 31 }, 'ai')]
    const ai = snapshot([], players)
    ai.world.weekday = 0
    ai.inventories[2] = [5]
    ai.credit[2] = { used: 77, available: 88, score: 1 }
    const aiGranted = applyBankCredit(ai, 2)
    expect(aiGranted.event?.kind).toBe('credit-granted')
    expect(aiGranted.snapshot.inventories[2]).toEqual([1, 5])
    expect(aiGranted.snapshot.credit[2]).toEqual({ used: 77, available: 100000, score: 1 })

    ai.inventories[2] = [1, 5]
    expect(applyBankCredit(ai, 2).event?.kind).toBe('credit-declined')
  })
})

it.each([6,7] as const)('淘汰玩家原位置不阻挡障碍卡%d，存活玩家仍阻挡',card=>{
 const source=snapshot([card],[player(1,{column:34,row:8}),player(2)])
 const choice={kind:'cell' as const,position:{column:6,row:32}}
 expect(applyWorldCard(source,1,0,choice).consumed).toBe(false)
 source.eliminatedPlayerIds=[2]
 expect(applyWorldCard(source,1,0,choice).consumed).toBe(true)
})
