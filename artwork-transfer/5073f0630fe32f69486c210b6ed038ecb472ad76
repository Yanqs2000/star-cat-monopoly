import { expect, it } from 'vitest'
import { createGame } from '../../src/modern/features/game/setup'
import { exchangeTickets, claimLostFunds } from '../../src/modern/features/game/ticket-exchange'
import { finishNpcEncounter } from '../../src/modern/features/game/world-cards'

it('帐篷卖31券按100/券到账，彩票公司买13券仅扣现金；原状态不改', () => {
  const game = createGame([1, 2, 3, 4], 1)
  game.players[0]!.cash = 2500
  game.tickets[1] = 95
  const before = structuredClone(game)
  const sold = exchangeTickets(game, 1, 'sell', 31)
  expect(sold.snapshot.players[0]?.cash).toBe(5600)
  expect(sold.snapshot.tickets[1]).toBe(64)
  expect(sold.receipt).toMatchObject({ cashDelta: 3100, ticketDelta: -31 })
  const bought = exchangeTickets(game, 1, 'buy', 13)
  expect(bought.snapshot.players[0]).toMatchObject({ cash: 1200, deposit: 100000 })
  expect(bought.snapshot.tickets[1]).toBe(108)
  expect(bought.receipt).toMatchObject({ sourceAmount: 1300, cashDelta: -1300, ticketDelta: 13 })
  expect(game).toEqual(before)
})

it('兑换0有效、上限100；现金/奖券不足、负数、小数和超限不动状态与RNG', () => {
  const game = createGame([1, 2, 3, 4], 1)
  expect(exchangeTickets(game, 1, 'buy', 0).error).toBeNull()
  expect(exchangeTickets(game, 1, 'buy', 0).snapshot).toEqual(game)
  expect(exchangeTickets(game, 1, 'buy', 100).snapshot.tickets[1]).toBe(300)
  for (const quantity of [101, -1, 1.5]) {
    const rejected = exchangeTickets(game, 1, 'buy', quantity)
    expect(rejected.error).not.toBeNull()
    expect(rejected.snapshot).toBe(game)
  }
  game.players[0]!.cash = 99
  game.tickets[1] = 0
  expect(exchangeTickets(game, 1, 'buy', 1).snapshot).toBe(game)
  expect(exchangeTickets(game, 1, 'sell', 1).snapshot).toBe(game)
})

it('招领只领取第一条并清空两条；重复调用无第二次收入', () => {
  const game = createGame([1, 2, 3, 4], 1)
  game.players[0]!.cash = 100
  game.lostAndFoundFunds = [1200, 1300]
  const claimed = claimLostFunds(game, 1)
  expect(claimed.snapshot.players[0]?.cash).toBe(1300)
  expect(claimed.snapshot.lostAndFoundFunds).toEqual([0, 0])
  expect(claimed.receipt).toMatchObject({ sourceAmount: 1200, cashDelta: 1200,
    lostAndFoundDeltas: [-1200, -1300] })
  expect(claimLostFunds(claimed.snapshot, 1).snapshot.players[0]?.cash).toBe(1300)
  expect(game.lostAndFoundFunds).toEqual([1200, 1300])
})

it('帐篷业务结束才迁移原NPC；重复结束不再次抽样', () => {
  const game = createGame([1, 2, 3, 4], 1)
  game.world.markers = { 1: 1 }
  const finished = finishNpcEncounter(game, 1, 1)
  expect(finished.snapshot.world.markers[1]).toBeUndefined()
  expect(Object.values(finished.snapshot.world.markers)).toEqual([1])
  const duplicate = finishNpcEncounter(finished.snapshot, 1, 1)
  expect(duplicate.snapshot).toBe(finished.snapshot)
  expect(duplicate.snapshot.rngState).toBe(finished.snapshot.rngState)
})
