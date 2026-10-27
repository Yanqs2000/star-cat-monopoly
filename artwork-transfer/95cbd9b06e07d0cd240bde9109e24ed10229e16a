import { describe, expect, it } from 'vitest'
import { createGame } from '../../src/modern/features/game/setup'
import { getCardCell } from '../../src/modern/features/game/direct-cards'
import { resolveWorldCell } from '../../src/modern/features/game/world-cards'

function encounter(npcId: number) {
  const game = createGame([1, 2, 3, 4], 1)
  game.players[0]!.position = { column: 6, row: 32 }
  for (const [id, npc] of Object.entries(game.world.markers)) {
    if (npc === npcId) delete game.world.markers[Number(id)]
  }
  game.world.markers[1] = npcId
  game.rngState = 1
  return game
}

describe('原版普通NPC落地效果', () => {
  it('警察罚1000现金优先存款补足，两条招领各记1000且源状态不修改', () => {
    const game = encounter(12)
    game.players[0]!.cash = 300
    game.players[0]!.deposit = 700
    const before = structuredClone(game)
    const result = resolveWorldCell(game, 1, game.players[0]!.position, 'landing')
    expect(result.snapshot.players[0]).toMatchObject({ cash: 0, deposit: 0 })
    expect(result.snapshot.lostAndFoundFunds).toEqual([1000, 1000])
    expect(result.event).toMatchObject({ kind: 'npc-encountered', npcId: 12,
      receipt: { sourceAmount: 1000, cashDelta: -300, depositDelta: -700 } })
    expect(Object.values(result.snapshot.world.markers).filter(id => id === 12)).toHaveLength(1)
    expect(result.snapshot.world.markers[1]).toBeUndefined()
    expect(game).toEqual(before)
  })

  it.each([[30, 130, 100, 0], [31, 25, -6, 600]])('流氓在%s券时执行源分支', (tickets, after, delta, funds) => {
    const game = encounter(13)
    game.tickets[1] = tickets
    const result = resolveWorldCell(game, 1, game.players[0]!.position, 'landing')
    expect(result.snapshot.tickets[1]).toBe(after)
    expect(result.snapshot.lostAndFoundFunds).toEqual([funds, funds])
    expect(result.event).toMatchObject({ receipt: { ticketDelta: delta } })
  })

  it('小偷在4卡时按缩短后的长度顺序抽走两卡，不扣现金，招领各加5000', () => {
    const game = encounter(14)
    game.inventories[1] = [5, 6, 7, 9]
    const result = resolveWorldCell(game, 1, game.players[0]!.position, 'landing')
    expect(result.snapshot.inventories[1]).toEqual([6, 9])
    expect(result.snapshot.players[0]?.cash).toBe(100000)
    expect(result.snapshot.lostAndFoundFunds).toEqual([5000, 5000])
    expect(result.event).toMatchObject({ receipt: { removedCardIds: [5, 7] } })
  })

  it('小偷在3卡时赠原池两卡并且不增加招领', () => {
    const game = encounter(14)
    game.inventories[1] = [5, 6, 7]
    const result = resolveWorldCell(game, 1, game.players[0]!.position, 'landing')
    expect(result.snapshot.inventories[1]).toEqual([5, 6, 7, 9, 14])
    expect(result.snapshot.lostAndFoundFunds).toEqual([0, 0])
    expect(result.event).toMatchObject({ receipt: { addedCardIds: [9, 14] } })
  })

  it('乞丐在3000现金时赠20000，无百分比抽样', () => {
    const game = encounter(15)
    game.players[0]!.cash = 3000
    const result = resolveWorldCell(game, 1, game.players[0]!.position, 'landing')
    expect(result.snapshot.players[0]?.cash).toBe(23000)
    expect(result.snapshot.lostAndFoundFunds).toEqual([0, 0])
    expect(result.event).toMatchObject({ receipt: { cashDelta: 20000 } })
    expect(result.snapshot.rngState).toBe(1015568748)
  })

  it('乞丐在3001现金按源随机6%扣整数180并记两条招领', () => {
    const game = encounter(15)
    game.players[0]!.cash = 3001
    game.rngState = 0
    const result = resolveWorldCell(game, 1, game.players[0]!.position, 'landing')
    expect(result.snapshot.players[0]?.cash).toBe(2821)
    expect(result.snapshot.lostAndFoundFunds).toEqual([180, 180])
    expect(result.event).toMatchObject({ receipt: { sourceAmount: 180, cashDelta: -180, rate: 6 } })
  })

  it('恶犬送医3天并终止移动，重新放置不能选旧遭遇格或任何玩家格', () => {
    const game = encounter(9)
    const result = resolveWorldCell(game, 1, game.players[0]!.position, 'landing')
    expect(result.snapshot.players[0]).toMatchObject({ position: { column: 19, row: 1 }, direction: 2 })
    expect(result.snapshot.world.statuses[1]).toMatchObject({ state: 3, days: 3 })
    expect(result).toMatchObject({ endTurn: true, stopMovement: true })
    const newCell = Number(Object.entries(result.snapshot.world.markers).find(([, value]) => value === 9)?.[0])
    expect(newCell).not.toBe(1)
    expect(result.snapshot.players.map(player => getCardCell(player.position)?.id)).not.toContain(newCell)
  })

  it('途经普通NPC没有落地效果或随机消耗', () => {
    const game = encounter(12)
    const result = resolveWorldCell(game, 1, game.players[0]!.position, 'step')
    expect(result.snapshot).toBe(game)
    expect(result.event).toBeNull()
  })
})
