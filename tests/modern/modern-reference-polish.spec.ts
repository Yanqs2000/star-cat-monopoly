// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import GameReferencePanel from '../../src/modern/features/game/GameReferencePanel.vue'
import MapInfoPanel from '../../src/modern/features/game/MapInfoPanel.vue'
import { createGame } from '../../src/modern/features/game/setup'
let wrapper: VueWrapper | undefined
afterEach(() => wrapper?.unmount())
it('资产摘要按席位找到实际角色立绘，保留出局状态而且不改写对局', () => {
  const game = createGame([12, 2, 7, 4], 42)
  game.eliminatedPlayerIds.push(1)
  const before = structuredClone(game)
  wrapper = mount(GameReferencePanel, { props: { game, tab: 'assets' } })
  const player = wrapper.get('[data-testid="reference-summary-player-1"]')
  expect(player.get('img').attributes('src')).toMatch(/champions\/12.png$/)
  expect(player.text()).toContain('已出局')
  expect(game).toEqual(before)
})
it('行情摘要随查询角色显示实际持股，不把全场持股当作个人持股', async () => {
  const game = createGame([12, 2, 7, 4], 42)
  game.finance.stocks[1]!.holdings[1] = { shares: 45, averageCost: 12 }
  game.finance.stocks[1]!.holdings[2] = { shares: 70, averageCost: 10 }
  wrapper = mount(GameReferencePanel, { props: { game, tab: 'stocks' } })
  expect(wrapper.get('[data-testid="reference-stock-shares"]').text()).toBe('3,045 股 · 2 家公司')
  await wrapper.get('select').setValue(2)
  expect(wrapper.get('[data-testid="reference-stock-shares"]').text()).toBe('3,070 股 · 2 家公司')
})
it('地图等级图形保留实际费用与地主，并显示五级中的三级', () => {
  wrapper = mount(MapInfoPanel, { props: { info: { kind: 'property', name: '金星大道', position: { column: 7, row: 31 }, parcelId: 1, level: 3, price: 1500, ownerId: 2, ownerName: '阿牛', baseToll: 1200, toll: 2400 } } })
  expect(wrapper.get('[data-testid="map-property-level"]').attributes('aria-label')).toBe('建筑等级 3 / 5')
  expect(wrapper.findAll('.level-step.is-built')).toHaveLength(3)
  expect(wrapper.text()).toContain('2400')
  expect(wrapper.text()).toContain('阿牛')
})
