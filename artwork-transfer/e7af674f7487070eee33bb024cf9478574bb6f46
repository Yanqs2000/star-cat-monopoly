import { afterEach, expect, it, vi } from 'vitest'
import { createGame } from '../../src/modern/features/game/setup'
import { createGameController } from '../../src/modern/features/game/controller'
import { finishNpcEncounter, resolveWorldCell } from '../../src/modern/features/game/world-cards'
import { randomInt } from '../../src/modern/features/game/random'
afterEach(() => vi.useRealTimers())
const scheduler = { now: () => Date.now(), setTimeout: (f: () => void, ms: number) => setTimeout(f, ms), clearTimeout: (h: unknown) => clearTimeout(h as ReturnType<typeof setTimeout>) }

it.each(['submit', 'leave'] as const)('首个帐篷在烟雾尾段%s后，第二人正常走到同帐篷仍能启动新烟雾', action => {
  vi.useFakeTimers()
  const game = createGame([1, 2, 3, 4], 1, 1)
  game.players[0]!.position = { column: 6, row: 32 }
  game.players[1]!.position = { column: 31, row: 7 }; game.players[1]!.direction = 2
  game.world.markers = { 1: 1 }; game.phase = 'landed'; game.continuation = 'handle-landing'; game.rngState = 909
  // Source ordered candidates put the moved tent one step ahead of P2.
  expect(finishNpcEncounter(game, 1, 1).snapshot.world.markers[103]).toBe(1)
  const c = createGameController(game, { awaitActivityAssets: true, scheduler })
  expect(c.readyActivity('fog')).toBe(true); vi.advanceTimersByTime(510)
  expect(c.state.interaction).toMatchObject({ kind: 'ticket-exchange', presentation: { clipId: 'fog', frame: 16 } })
  if (action === 'submit') { expect(c.exchangeTickets(0)).toBe(true); expect(c.acknowledgeInteraction()).toBe(true) }
  else expect(c.leaveExchange()).toBe(true)
  expect(c.state.phase).toBe('property-decision'); c.decideProperty('decline'); c.acknowledgeProperty(); vi.advanceTimersByTime(550)
  expect(c.state.activePlayerIndex).toBe(1); expect(c.state.phase).toBe('awaiting-roll')
  expect(c.roll(1)).toBe(true); vi.advanceTimersByTime(550)
  expect(c.state.interaction).toMatchObject({ kind: 'ticket-exchange', presentation: { clipId: 'fog', frame: 1 } })
  expect(c.readyActivity('fog')).toBe(true); vi.advanceTimersByTime(1000)
  expect(c.state.interaction).toMatchObject({ kind: 'ticket-exchange' })
  expect(c.state.interaction && 'presentation' in c.state.interaction ? c.state.interaction.presentation : undefined).toBeUndefined()
  c.dispose()
})

function draws(seed: number, count: number) { for (let i = 0; i < count; i++) seed = randomInt(seed, 1000).nextState; return seed }
it.each([[12, 200, 4, 40000, 3], [13, 30, 4, 40000, 3], [13, 31, 4, 40000, 3], [14, 200, 3, 40000, 5], [14, 200, 4, 40000, 5], [15, 200, 4, 3000, 3], [15, 200, 4, 3001, 4], [9, 200, 4, 40000, 3]])(
  'NPC%s保留效果→原台词两次随机→重新放置顺序（券%s/卡%s/现金%s，共%s次）', (npc, tickets, cards, cash, count) => {
    const game = createGame([1, 2, 3, 4], 1, 1)
    game.players[0]!.position = { column: 6, row: 32 }; game.players[0]!.cash = cash
    game.tickets[1] = tickets; game.inventories[1] = [5, 6, 7, 9].slice(0, cards)
    game.world.markers = { 1: npc }; game.rngState = 1
    const result = resolveWorldCell(game, 1, game.players[0]!.position, 'landing')
    expect(result.snapshot.rngState).toBe(draws(1, count))
  },
)

it.each(['portal', 'lottery-submit', 'lottery-leave', 'lost-found'] as const)('%s收尾保留原mood_pg两次抽样，暂停/重复/恢复不再抽样', entry => {
  vi.useFakeTimers()
  const game = createGame([1, 2, 3, 4], 1, 1)
  game.world.markers = {}; game.phase = 'landed'; game.continuation = 'handle-landing'
  game.players[0]!.position = entry === 'portal' ? { column: 31, row: 7 } : entry === 'lost-found' ? { column: 4, row: 32 } : { column: 17, row: 19 }
  game.rngState = 1
  const c = createGameController(game, { scheduler })
  const before = entry === 'lost-found' ? game.rngState : c.state.rngState
  const closingHeads = c.state.interaction?.kind === 'portal' ? c.state.interaction.heads?.length ?? 0 : 0
  if (entry === 'portal') { expect(c.choosePortal(5)).toBe(true); expect(c.choosePortal(5)).toBe(false) }
  else if (entry === 'lottery-submit') { expect(c.exchangeTickets(0)).toBe(true); expect(c.exchangeTickets(0)).toBe(false) }
  else if (entry === 'lottery-leave') { expect(c.leaveExchange()).toBe(true); expect(c.leaveExchange()).toBe(false) }
  else expect(c.state.interaction).toMatchObject({ kind: 'notice', notice: { message: 'lost-found' } })
  expect(c.state.rngState).toBe(draws(before, closingHeads + 2))
  const saved = structuredClone(c.state); c.dispose()
  const restored = createGameController(saved, { scheduler }); restored.setPaused(true); vi.advanceTimersByTime(100)
  expect(restored.state.rngState).toBe(saved.rngState); restored.dispose()
})

it.each(['court', 'ludo', 'carnival'] as const)('%s原收尾台词仅推进两次随机，已收尾恢复不再抽样', entry => {
  vi.useFakeTimers()
  const game = createGame([1, 2, 3, 4], 1, 1)
  game.world.markers = {}; game.phase = 'landed'; game.continuation = 'handle-landing'
  game.players[0]!.position = entry === 'court' ? { column: 36, row: 10 } : entry === 'ludo' ? { column: 6, row: 24 } : { column: 38, row: 16 }
  const c = createGameController(game, { scheduler })
  if (entry === 'court') { c.chooseCourtTarget(2); c.chooseCourtCase(0) }
  if (entry === 'ludo') { c.placeWager(7); c.confirmWagers() }
  let priorRng = c.state.rngState
  for (let step = 0; step < 1500 && c.state.interaction?.kind !== 'notice'; step++) {
    priorRng = c.state.rngState; vi.advanceTimersToNextTimer()
  }
  expect(c.state.interaction?.kind).toBe('notice')
  expect(c.state.rngState).toBe(draws(priorRng, 2))
  const saved = structuredClone(c.state); c.dispose()
  const restored = createGameController(saved, { scheduler }); vi.advanceTimersByTime(100)
  expect(restored.state.rngState).toBe(saved.rngState); restored.dispose()
})
