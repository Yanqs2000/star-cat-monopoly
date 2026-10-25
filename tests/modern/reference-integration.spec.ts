// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { shallowMount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { readFileSync } from 'node:fs'
import ModernApp from '../../src/modern/ModernApp.vue'
import GameReferencePanel from '../../src/modern/features/game/GameReferencePanel.vue'
import MapInfoPanel from '../../src/modern/features/game/MapInfoPanel.vue'
import { createGame } from '../../src/modern/features/game/setup'
import type { MapSceneOptions } from '../../src/modern/features/map/MapScene'

const scene = vi.hoisted(() => ({
  transitionPlayer: vi.fn(), setPlayers: vi.fn(), setCompanies: vi.fn(), setProperties: vi.fn(), setWorld: vi.fn(),
  setTargeting: vi.fn(), showMarkers: vi.fn(), setSpeed: vi.fn(), follow: vi.fn(),
  setPaused: vi.fn(), destroy: vi.fn(), resize: vi.fn(), getPortalDecorations: vi.fn(() => []),
  setActivity: vi.fn(async () => {}), playEffect: vi.fn(), playReaction: vi.fn(async () => {}),
}))
const captured = vi.hoisted(() => ({ options: undefined as MapSceneOptions | undefined }))
vi.mock('../../src/modern/features/map/MapScene', () => ({ createMapScene: vi.fn(async (_host, _map, _manifest, options) => { captured.options = options; return scene }) }))
let wrapper: VueWrapper
beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => new Response(readFileSync(`public/modern/${url.replace(/^\//, '')}`), { status: 200 })))
  vi.stubGlobal('Image', class { src = ''; async decode() {} })
  const NativeURL = URL
  vi.stubGlobal('URL', class extends NativeURL { static override createObjectURL() { return 'blob:query-test' } static override revokeObjectURL() {} })
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} })
})
afterEach(() => { wrapper?.unmount(); vi.unstubAllGlobals(); vi.clearAllMocks() })

async function loaded(paused = false) {
  wrapper = shallowMount(ModernApp, { global: { renderStubDefaultSlot: true } })
  await flushPromises()
  const state = (wrapper.vm.$ as unknown as { setupState: {
    mode: string; paused: boolean; pending: unknown; loadPendingGame(): Promise<void>
  } }).setupState
  state.mode = 'game'; state.paused = paused
  state.pending = { state: createGame([1, 2, 3, 4], 42), lineup: 'four humans' }
  await nextTick(); await state.loadPendingGame(); await flushPromises()
  return state
}

it('选人页直接提供帮助，关闭后保留选人状态', async () => {
  wrapper = shallowMount(ModernApp, { global: { renderStubDefaultSlot: true } }); await flushPromises()
  await wrapper.get('[data-testid="open-help"]').trigger('click')
  const panel = wrapper.getComponent(GameReferencePanel)
  expect(panel.props('tab')).toBe('help')
  panel.vm.$emit('close'); await nextTick()
  expect(wrapper.findComponent(GameReferencePanel).exists()).toBe(false)
  expect(wrapper.find('[data-testid="character-grid"]').exists()).toBe(true)
})

for (const initiallyPaused of [false, true]) it(`打开查询隔离键盘和背景，关闭恢复原暂停${initiallyPaused}`, async () => {
  const state = await loaded(initiallyPaused)
  const control = wrapper.getComponent({ name: 'GamePanel' })
  const before = JSON.stringify(control.props('game'))
  control.vm.$emit('reference', 'assets'); await nextTick()
  expect(state.paused).toBe(true)
  expect(wrapper.getComponent(GameReferencePanel).props('tab')).toBe('assets')
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }))
  await nextTick()
  expect(JSON.stringify(control.props('game'))).toBe(before)
  wrapper.getComponent(GameReferencePanel).vm.$emit('tab', 'holdings'); await nextTick()
  expect(state.paused).toBe(true)
  wrapper.getComponent(GameReferencePanel).vm.$emit('close'); await nextTick()
  expect(state.paused).toBe(initiallyPaused)
  expect(JSON.stringify(control.props('game'))).toBe(before)
})

it('地图普通查询回调展示真实地点信息，不改变对局', async () => {
  await loaded()
  expect(captured.options?.onInspectCell).toBeTypeOf('function')
  captured.options!.onInspectCell!({ column: 6, row: 32 })
  await nextTick()
  expect(wrapper.getComponent(MapInfoPanel).props('info')).toMatchObject({ kind: 'property', name: '金星大道', price: 1500 })
})

it('从暂停对局返回选人后，帮助不会把旧暂停状态恢复给选人音乐', async () => {
  const state = await loaded(true)
  wrapper.getComponent({ name: 'GamePanel' }).vm.$emit('restart')
  await nextTick()
  expect(state.mode).toBe('selection')
  await wrapper.get('[data-testid="open-help"]').trigger('click')
  wrapper.getComponent(GameReferencePanel).vm.$emit('close')
  await nextTick()
  expect(state.paused).toBe(false)
})

it('存档窗口打开时，底层终局操作同样被隔离', async () => {
  await loaded()
  await wrapper.get('[data-testid="open-saves"]').trigger('click')
  await flushPromises()
  const endgame = wrapper.getComponent({ name: 'EndgamePanel' })
  expect(endgame.element.closest('[inert]:not([inert="false"])'), '终局按钮不能在存档窗口下面通过键盘触发').not.toBeNull()
  expect(wrapper.getComponent({ name: 'SavePanel' }).element.closest('[inert]:not([inert="false"])')).toBeNull()
})
