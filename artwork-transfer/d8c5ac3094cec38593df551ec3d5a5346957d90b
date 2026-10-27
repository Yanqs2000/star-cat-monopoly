import { afterEach, expect, it, vi } from 'vitest'
import { createGame } from '../../src/modern/features/game/setup'
import { resolveWorldCell } from '../../src/modern/features/game/world-cards'
import { interactionVisualPlan } from '../../src/modern/features/game/game-visuals'
import { createGameController } from '../../src/modern/features/game/controller'
import { randomInt } from '../../src/modern/features/game/random'
import type { InteractionEvent } from '../../src/modern/features/game/interaction-types'
afterEach(() => vi.useRealTimers())
const scheduler = { now: () => Date.now(), setTimeout: (f: () => void, ms: number) => setTimeout(f, ms), clearTimeout: (h: unknown) => clearTimeout(h as ReturnType<typeof setTimeout>) }

it.each([[9, 200, 4, 40000, 'sad'], [12, 200, 4, 40000, 'sad'], [13, 31, 4, 40000, 'sad'], [13, 30, 4, 40000, 'neutral'], [14, 200, 4, 40000, 'sad'], [14, 200, 3, 40000, 'neutral'], [15, 200, 4, 3001, 'sad'], [15, 200, 4, 3000, 'neutral']] as const)(
  'NPC%s券%s卡%s现金%s的实际规则事件选择原%s反馈', (npc, tickets, cards, cash, name) => {
    const game = createGame([1, 2, 3, 4], 1, 1)
    game.players[0]!.position = { column: 6, row: 32 }; game.players[0]!.cash = cash
    game.tickets[1] = tickets; game.inventories[1] = [5, 6, 7, 9].slice(0, cards); game.world.markers = { 1: npc }
    const result = resolveWorldCell(game, 1, game.players[0]!.position, 'landing')
    expect(interactionVisualPlan({ kind: 'world', playerId: 1, worldEvent: result.event, receipt: result.event!.receipt }).reactions).toEqual([{ playerId: 1, name }])
  },
)
it.each([['win', 'neutral'], ['settle', 'cheer'], ['lose', 'sad']] as const)('法院%s真实完成事件给原%s动作，不以默认happy替代', (verdict, name) => {
  vi.useFakeTimers(); let seed = 0
  while (true) { const draw = randomInt(seed, 101).value; if ((draw < 60 ? 'win' : draw <= 80 ? 'settle' : 'lose') === verdict) break; seed++ }
  const game = createGame([1, 2, 3, 4], 1, 1)
  game.players[0]!.position = { column: 36, row: 10 }; game.world.markers = {}; game.rngState = seed
  game.phase = 'landed'; game.continuation = 'handle-landing'
  const events: InteractionEvent[] = [], c = createGameController(game, { scheduler, onInteractionEvent: event => events.push(event) })
  c.chooseCourtTarget(2); c.chooseCourtCase(0); vi.advanceTimersByTime(10000)
  expect(events).toHaveLength(1); expect(interactionVisualPlan(events[0]!).reactions).toEqual([{ playerId: 1, name }]); c.dispose()
})
it.each([[2, 'neutral'], [5, null]] as const)('魔法门目的地%s遵循原brow或无brow分支', (destination, name) => {
  vi.useFakeTimers(); const game = createGame([1, 2, 3, 4], 1, 1)
  game.players[0]!.position = { column: 31, row: 7 }; game.world.markers = {}; game.phase = 'landed'; game.continuation = 'handle-landing'
  const events: InteractionEvent[] = [], c = createGameController(game, { scheduler, onInteractionEvent: event => events.push(event) })
  c.choosePortal(destination); vi.advanceTimersByTime(10000)
  expect(events).toHaveLength(1); expect(interactionVisualPlan(events[0]!).reactions).toEqual(name === null ? [] : [{ playerId: 1, name }]); c.dispose()
})
