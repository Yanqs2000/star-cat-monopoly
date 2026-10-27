// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { shallowMount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { readFileSync } from 'node:fs'
import ModernApp from '../../src/modern/ModernApp.vue'
import { createGame } from '../../src/modern/features/game/setup'
import type { GameState } from '../../src/modern/features/game/types'
import type { InteractionVisualPlan } from '../../src/modern/features/game/game-visuals'

const scene = vi.hoisted(() => ({
  transitionPlayer: vi.fn(), setPlayers: vi.fn(), setCompanies: vi.fn(), setProperties: vi.fn(), setRentHighlight: vi.fn(), setWorld: vi.fn(),
  setTargeting: vi.fn(), showMarkers: vi.fn(), setSpeed: vi.fn(), follow: vi.fn(),
  setPaused: vi.fn(), destroy: vi.fn(), resize: vi.fn(), getPortalDecorations: vi.fn(() => []),
  setActivity: vi.fn(async () => {}), playEffect: vi.fn(), playReaction: vi.fn(async () => {}),
}))
vi.mock('../../src/modern/features/map/MapScene', () => ({ createMapScene: vi.fn(async () => scene) }))

interface RecoverySetup {
  mode: string; paused: boolean; speed: number; controllerReady: boolean; loadState: string
  pending: { state: GameState; lineup: string; visual: InteractionVisualPlan }
  loadPendingGame(): Promise<void>
}
let wrapper: VueWrapper | undefined
afterEach(() => { wrapper?.unmount(); vi.unstubAllGlobals(); vi.clearAllMocks() })

it('已入账反馈在暂停时失败：重建先提供继续按钮，再重放及恢复控制器，不重复奖励', async () => {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => new Response(readFileSync(`public/modern/${url.replace(/^\//, '')}`), {status:200})))
  vi.stubGlobal('Image', class {src='';async decode(){}})
  const NativeURL=URL;let imageId=0
  vi.stubGlobal('URL', class extends NativeURL {static override createObjectURL(){return `blob:decoded-${++imageId}`}static override revokeObjectURL(){}})
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} })
  wrapper = shallowMount(ModernApp)
  await flushPromises()
  const state = (wrapper.vm.$ as unknown as { setupState: RecoverySetup }).setupState
  const game = createGame([1, 2, 3, 4], 1, 1)
  game.phase = 'interaction'
  game.tickets[1]! += 30
  game.interaction = { kind: 'notice', playerId: 1, resume: 'end-turn', notice: {
    kind: 'activity', message: 'carnival-result', receipt: { kind: 'carnival', sourceAmount: 30, ticketDelta: 30 },
  } }
  const saved = structuredClone(game)
  state.mode = 'game'; state.paused = true; state.speed = 2
  state.pending = { state: game, lineup: 'saved game', visual: { reactions: [{ playerId: 1, name: 'cheer' }], effects: [] } }
  await nextTick()
  let settled = false
  const recovery = state.loadPendingGame().finally(() => { settled = true })
  await flushPromises()
  expect(state.loadState).toBe('ready')
  expect(state.controllerReady).toBe(false)
  expect(settled).toBe(false)
  expect(scene.playReaction).not.toHaveBeenCalled()
  expect(wrapper.findComponent({ name: 'GamePanel' }).exists()).toBe(false)
  expect(wrapper.findComponent({ name: 'InteractionPanel' }).exists()).toBe(false)
  const resume = wrapper.findAll('button').find(button => button.text() === '继续对局')
  expect(resume, '控制器恢复之前仍需可操作的继续入口').toBeDefined()
  await resume!.trigger('click')
  await recovery
  await flushPromises()
  expect(settled).toBe(true)
  expect(scene.playReaction).toHaveBeenCalledExactlyOnceWith(1, 'cheer')
  expect(state.controllerReady).toBe(true)
  expect(state.paused).toBe(false)
  const panel = wrapper.findComponent({ name: 'GamePanel' })
  expect(panel.props('speed')).toBe(2)
  expect(panel.props('game')).toEqual(saved)
})
