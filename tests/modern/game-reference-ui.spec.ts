// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createGame } from '../../src/modern/features/game/setup'
import GameReferencePanel from '../../src/modern/features/game/GameReferencePanel.vue'
import MapInfoPanel from '../../src/modern/features/game/MapInfoPanel.vue'
import { inspectMapCell } from '../../src/modern/features/game/queries'
import map from '../../src/modern/data/map.json'

let wrapper: VueWrapper | undefined
afterEach(() => { wrapper?.unmount(); document.body.innerHTML = '' })

it('资产页显示真实净资产、负债和排名而不改变对局', () => {
  const game = createGame([1, 2, 3, 4], 42)
  game.credit[1]!.used = 500; game.finance.loans[1] = 1000
  const before = structuredClone(game)
  wrapper = mount(GameReferencePanel, { props: { game, tab: 'assets' } })
  const rows = wrapper.get('[data-testid="asset-standings"]').findAll('tbody tr')
  expect(rows).toHaveLength(4)
  expect(rows[0]!.text()).toContain('阿牛')
  const player = wrapper.get('[data-testid="assets-player-1"]')
  expect(player.text()).toContain('258500')
  expect(player.text()).toContain('500')
  expect(player.text()).toContain('1000')
  expect(game).toEqual(before)
})

it('股票页可切换查询角色，显示12公司及其持股成本', async () => {
  const game = createGame([1, 2, 3, 4], 42)
  wrapper = mount(GameReferencePanel, { props: { game, tab: 'stocks' } })
  expect(wrapper.get('[data-testid="stock-overview"]').findAll('tbody tr')).toHaveLength(12)
  expect(wrapper.get('[data-testid="stock-row-1"]').text()).toContain('3000')
  await wrapper.get('select[aria-label="查询角色"]').setValue('2')
  expect(wrapper.get('[data-testid="stock-row-1"]').text()).not.toContain('3000')
  expect(wrapper.get('[data-testid="stock-row-2"]').text()).toContain('3000')
})

it('持股页显示全部15公司，包括非上市公司及全员股份', () => {
  const game = createGame([1, 2, 3, 4], 42)
  game.finance.stocks[13]!.holdings[2] = { shares: 30, averageCost: 12 }
  wrapper = mount(GameReferencePanel, { props: { game, tab: 'holdings' } })
  expect(wrapper.get('[data-testid="holdings-overview"]').findAll('tbody tr')).toHaveLength(15)
  expect(wrapper.get('[data-testid="holdings-row-13"]').text()).toContain('非上市')
  expect(wrapper.get('[data-testid="holdings-player-13-2"]').text()).toContain('30')
})

it('选人前无需对局即可打开帮助，列出实际可达17卡与操作及存档限制', () => {
  wrapper = mount(GameReferencePanel, { props: { tab: 'help' } })
  expect(wrapper.findAll('[data-testid="help-card"]')).toHaveLength(17)
  expect(wrapper.text()).toContain('信用卡')
  expect(wrapper.text()).toContain('↑')
  expect(wrapper.text()).toContain('稳定等待掷骰')
  expect(wrapper.find('[data-testid="reference-assets"]').exists()).toBe(false)
})

it('对话框关闭键与Escape发出关闭，Tab保持焦点在弹窗内', async () => {
  wrapper = mount(GameReferencePanel, { props: { tab: 'help' }, attachTo: document.body })
  const close = wrapper.get('[data-testid="reference-close"]')
  expect(document.activeElement).toBe(close.element)
  await close.trigger('keydown', { key: 'Tab', shiftKey: true })
  expect(wrapper.element.contains(document.activeElement)).toBe(true)
  await wrapper.get('[role="dialog"]').trigger('keydown', { key: 'Escape' })
  expect(wrapper.emitted('close')).toHaveLength(1)
  await close.trigger('click')
  expect(wrapper.emitted('close')).toHaveLength(2)
})

it('地图信息卡显示当前地块收费并可关闭', async () => {
  const game = createGame([1, 2, 3, 4], 42), parcel = map.parcels[0]!
  game.properties[parcel.id] = { ownerId: 2, level: 1 }
  wrapper = mount(MapInfoPanel, { props: { info: inspectMapCell(game, parcel.buildingCell)! } })
  expect(wrapper.text()).toContain('金星大道')
  expect(wrapper.text()).toContain('阿牛')
  expect(wrapper.text()).toContain('1200')
  await wrapper.get('button').trigger('click')
  expect(wrapper.emitted('close')).toHaveLength(1)
})
