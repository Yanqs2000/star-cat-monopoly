import { expect, it } from 'vitest'
import { createGame } from '../../src/modern/features/game/setup'
import { createGameController } from '../../src/modern/features/game/controller'

// These tests inspect immediate commits; future turn timers are not advanced.
const dormantClock = { scheduler: { now: () => 0, setTimeout: () => 0, clearTimeout: () => {} } }

function landed(position = { column: 6, row: 32 }) {
  const game = createGame([1, 2, 3, 4], 1)
  game.players[0]!.position = position
  game.world.markers = {}
  game.phase = 'landed'
  game.continuation = 'handle-landing'
  return game
}

it('帐篷暂停时拒绝兑换，确认10券只到账一次，恢复通知后继续原地块', () => {
  const game = landed()
  game.world.markers = { 1: 1 }
  const controller = createGameController(game, dormantClock)
  expect(controller.state.interaction).toMatchObject({ kind: 'ticket-exchange', mode: 'sell', npcCellId: 1 })
  controller.setPaused(true)
  expect(controller.exchangeTickets(10)).toBe(false)
  controller.setPaused(false)
  expect(controller.exchangeTickets(10)).toBe(true)
  expect(controller.state.players[0]?.cash).toBe(101000)
  expect(controller.state.tickets[1]).toBe(190)
  expect(controller.exchangeTickets(10)).toBe(false)
  const saved = structuredClone(controller.state)
  controller.dispose()
  const restored = createGameController(saved, dormantClock)
  expect(restored.state.players[0]?.cash).toBe(101000)
  expect(restored.acknowledgeInteraction()).toBe(true)
  expect(restored.state.propertyOffer).toMatchObject({ parcelId: 1, kind: 'purchase' })
  expect(restored.state.world.markers[1]).toBeUndefined()
  expect(Object.values(restored.state.world.markers).filter(value => value === 1)).toHaveLength(1)
  restored.dispose()
})

it('彩票公司人类买券，超限不改变余额；未办理离开不扣款', () => {
  const controller = createGameController(landed({ column: 17, row: 19 }), dormantClock)
  expect(controller.state.interaction).toMatchObject({ kind: 'ticket-exchange', mode: 'buy' })
  expect(controller.exchangeTickets(101)).toBe(false)
  expect(controller.state.players[0]?.cash).toBe(100000)
  expect(controller.exchangeTickets(20)).toBe(true)
  expect(controller.state.players[0]?.cash).toBe(98000)
  expect(controller.state.tickets[1]).toBe(220)
  controller.dispose()
  const canceled = createGameController(landed({ column: 17, row: 19 }), dormantClock)
  expect(canceled.leaveExchange()).toBe(true)
  expect(canceled.state.players[0]?.cash).toBe(100000)
  expect(canceled.state.tickets[1]).toBe(200)
  canceled.dispose()
})

it('招领一次提交、重复确认和恢复都不重复入账', () => {
  const game = landed({ column: 4, row: 32 })
  game.lostAndFoundFunds = [1234, 1234]
  const controller = createGameController(game, dormantClock)
  expect(controller.state.players[0]?.cash).toBe(101234)
  expect(controller.state.lostAndFoundFunds).toEqual([0, 0])
  expect(controller.state.interaction).toMatchObject({ kind: 'notice', notice: {
    receipt: { kind: 'lost-found', sourceAmount: 1234, cashDelta: 1234 },
  } })
  const saved = structuredClone(controller.state)
  controller.dispose()
  const restored = createGameController(saved, dormantClock)
  restored.acknowledgeInteraction()
  expect(restored.acknowledgeInteraction()).toBe(false)
  expect(restored.state.players[0]?.cash).toBe(101234)
  restored.dispose()
})

it('普通NPC通知保留实际现金、存款和奖券变化以便恢复展示', () => {
  const game = landed()
  game.world.markers = { 1: 12 }
  game.players[0]!.cash = 300
  const controller = createGameController(game, dormantClock)
  expect(controller.state.interaction).toMatchObject({ kind: 'notice', notice: {
    eventKind: 'npc-encountered', npcId: 12, receipt: { cashDelta: -300, depositDelta: -700 },
  } })
  controller.dispose()
})

it('AI帐篷仅重新放置NPC，彩票公司空分支不兑换资金或奖券', () => {
  const tent = landed()
  tent.players[0]!.controller = 'ai'
  tent.world.markers = { 1: 1 }
  const controller = createGameController(tent, dormantClock)
  expect(controller.state.players[0]?.cash).toBe(100000)
  expect(controller.state.tickets[1]).toBe(200)
  expect(controller.state.world.markers[1]).toBeUndefined()
  expect(controller.state.interaction?.kind).not.toBe('ticket-exchange')
  controller.dispose()
  const lottery = landed({ column: 17, row: 19 })
  lottery.players[0]!.controller = 'ai'
  const skipped = createGameController(lottery, dormantClock)
  expect(skipped.state.players[0]?.cash).toBe(100000)
  expect(skipped.state.tickets[1]).toBe(200)
  expect(skipped.state.rngState).toBe(lottery.rngState)
  skipped.dispose()
})
