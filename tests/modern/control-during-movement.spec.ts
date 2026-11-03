import { afterEach, expect, it, vi } from 'vitest'
import { createGameController, type GameController } from '../../src/modern/features/game/controller'
import { createGame } from '../../src/modern/features/game/setup'

const controllers: GameController[] = []
const scheduler = { now: () => Date.now(), setTimeout: (f: () => void, ms: number) => setTimeout(f, ms), clearTimeout: (h: unknown) => clearTimeout(h as ReturnType<typeof setTimeout>) }
function start() {
  vi.useFakeTimers()
  const state = createGame([1, 2, 3, 4], 153, 1)
  state.players[1]!.controller = 'autoplay'
  const controller = createGameController(state, { scheduler, stepDurationMs: 100, landingDurationMs: 10, aiThinkDurationMs: 10000 })
  controllers.push(controller)
  expect(controller.roll(1)).toBe(true)
  return controller
}
afterEach(() => { for (const c of controllers.splice(0)) c.dispose(); vi.useRealTimers() })

it.each([{ playerId: 1, control: 'autoplay' }, { playerId: 2, control: 'human' }] as const)('移动期间玩家 $playerId 请求 $control，到达后保留并在回合末应用', ({ playerId, control }) => {
  const c = start()
  const before = c.state.players[playerId - 1]!.controller
  expect(c.requestControl(playerId, control)).toBe(true)
  vi.advanceTimersByTime(100)
  expect(c.state.phase).toBe('landed')
  expect(c.state.pendingControl[playerId]).toBe(control)
  expect(c.state.players[playerId - 1]!.controller).toBe(before)
  // This fixture takes one junction draw; control changes must add no draws.
  expect(c.state.rngState).toBe(1121689320)
  expect(c.state.turnPath).toHaveLength(2)
  vi.advanceTimersByTime(10)
  expect(c.state.players[playerId - 1]!.controller).toBe(control)
  expect(c.state.pendingControl).toEqual({})
  expect(c.state.activePlayerIndex).toBe(1)
})

it('移动期间全体托管，四个请求跨到达保留且只在回合末生效', () => {
  const c = start()
  for (const player of c.state.players) expect(c.requestControl(player.id, 'autoplay')).toBe(true)
  vi.advanceTimersByTime(100)
  expect(c.state.pendingControl).toEqual({ 1: 'autoplay', 2: 'autoplay', 3: 'autoplay', 4: 'autoplay' })
  expect(c.state.players[0]!.controller).toBe('human')
  vi.advanceTimersByTime(10)
  expect(c.state.players.map(p => p.controller)).toEqual(['autoplay', 'autoplay', 'autoplay', 'autoplay'])
  expect(c.state.pendingControl).toEqual({})
  expect(c.state.outcome).toBeNull()
})

it('移动中暂停、变速和重复切换保留最后请求，不重复移动或推进随机', () => {
  const c = start()
  const rng = c.state.rngState
  vi.advanceTimersByTime(40)
  c.setPaused(true)
  c.requestControl(1, 'autoplay')
  c.requestControl(1, 'human')
  c.requestControl(1, 'autoplay')
  c.setSpeed(2)
  vi.advanceTimersByTime(1000)
  expect(c.state.turnPath).toHaveLength(1)
  expect(c.state.rngState).toBe(rng)
  c.setPaused(false)
  vi.advanceTimersByTime(30)
  expect(c.state.pendingControl).toEqual({ 1: 'autoplay' })
  expect(c.state.turnPath).toHaveLength(2)
  expect(c.state.rngState).toBe(1121689320)
  vi.advanceTimersByTime(5)
  expect(c.state.players[0]!.controller).toBe('autoplay')
  expect(c.state.pendingControl).toEqual({})
  expect(c.state.turnPath).toHaveLength(2)
})
