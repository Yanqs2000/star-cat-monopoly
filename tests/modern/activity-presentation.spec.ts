import { afterEach, expect, it, vi } from 'vitest'
import { createGameController, type GameController } from '../../src/modern/features/game/controller'
import { createGame } from '../../src/modern/features/game/setup'

afterEach(() => vi.useRealTimers())
const clock = {
  now: () => Date.now(), setTimeout: (callback: () => void, ms: number) => setTimeout(callback, ms),
  clearTimeout: (handle: unknown) => clearTimeout(handle as ReturnType<typeof setTimeout>),
}
function encounter(npcId: number) {
  const game = createGame([1,2,3,4], 1)
  game.players[0]!.position = { column: 6, row: 32 }
  game.world.markers = {1: npcId}
  game.phase = 'landed'
  game.continuation = 'handle-landing'
  return game
}
type VisualController = GameController & { readyActivity(clipId: string): boolean; skipActivityPresentation(): boolean }
const create = (game: ReturnType<typeof createGame>) => createGameController(game, {
  scheduler: clock, ...{ awaitActivityAssets: true },
}) as VisualController

it('帐篷入口等待素材，15原帧前不能兑换；暂停及恢复不会重复触发入口', () => {
  vi.useFakeTimers()
  const controller = create(encounter(1))
  expect('readyActivity' in controller).toBe(true)
  expect(controller.state.interaction).toMatchObject({ presentation: { clipId: 'fog', frame: 1 } })
  expect(controller.exchangeTickets(10)).toBe(false)
  vi.advanceTimersByTime(1000)
  expect(controller.state.interaction).toMatchObject({ presentation: { frame: 1 } })
  expect(controller.readyActivity('car2')).toBe(false)
  expect(controller.readyActivity('fog')).toBe(true)
  vi.advanceTimersByTime(180)
  controller.setPaused(true)
  const saved = structuredClone(controller.state)
  vi.advanceTimersByTime(1000)
  expect(controller.state).toEqual(saved)
  controller.dispose()
  const restored = create(saved)
  expect(restored.state).toEqual(saved)
  restored.readyActivity('fog')
  vi.advanceTimersByTime(500)
  expect(restored.exchangeTickets(10)).toBe(true)
  expect(restored.state.players[0]?.cash).toBe(101000)
  expect(restored.exchangeTickets(10)).toBe(false)
  restored.dispose()
})

it('帐篷第15帧已开放兑换时仍保留19帧烟雾尾段，确认会取消旧动画续办', () => {
  vi.useFakeTimers()
  const controller = create(encounter(1))
  controller.readyActivity('fog')
  vi.advanceTimersByTime(510)
  expect(controller.state.interaction).toMatchObject({ presentation: { clipId: 'fog', frame: 16 } })
  expect(controller.exchangeTickets(10)).toBe(true)
  vi.advanceTimersByTime(500)
  expect(controller.state.players[0]?.cash).toBe(101000)
  expect(controller.state.interaction).toMatchObject({ kind: 'notice', notice: { receipt: { ticketDelta: -10 } } })
  controller.dispose()
})

it('恶犬先原NPC说明后111帧送医，重建时保留帧位和唯一结算', () => {
  vi.useFakeTimers()
  const controller = create(encounter(9))
  expect('readyActivity' in controller).toBe(true)
  expect(controller.state.interaction).toMatchObject({ presentation: { clipId: 'trait-9', frame: 1 } })
  controller.readyActivity('trait-9')
  vi.advanceTimersByTime(400)
  const saved = structuredClone(controller.state)
  const markers = saved.world.markers
  controller.dispose()
  const restored = create(saved)
  expect(restored.acknowledgeInteraction()).toBe(false)
  restored.readyActivity('trait-9')
  vi.advanceTimersByTime(1800)
  expect(restored.state.interaction).toMatchObject({ presentation: { clipId: 'car2', frame: 1 } })
  vi.advanceTimersByTime(5000)
  expect(restored.state.interaction).toMatchObject({ presentation: { clipId: 'car2', frame: 1 } })
  restored.readyActivity('car2')
  vi.advanceTimersByTime(3800)
  expect(restored.state.interaction).not.toHaveProperty('presentation')
  expect(restored.state.world.markers).toEqual(markers)
  expect(restored.state.world.statuses[1]).toMatchObject({ state: 3, days: 3 })
  restored.dispose()
})

it('小偷双卡结果按原第15帧快进到40，键鼠跳到45并保留已抽到的卡片', () => {
  vi.useFakeTimers()
  const controller = create(encounter(14))
  controller.setSpeed(2)
  controller.readyActivity('trait-14')
  vi.advanceTimersByTime(1400)
  expect(controller.state.interaction).toMatchObject({ presentation: { clipId: 'show-npc4', frame: 1 } })
  controller.readyActivity('show-npc4')
  vi.advanceTimersByTime(510)
  expect(controller.state.interaction).toMatchObject({ presentation: { frame: 41 } })
  const cards = [...controller.state.inventories[1]!]
  expect(controller.skipActivityPresentation()).toBe(true)
  expect(controller.state.interaction).toMatchObject({ presentation: { frame: 45 } })
  vi.advanceTimersByTime(220)
  expect(controller.state.inventories[1]).toEqual(cards)
  controller.dispose()
})
