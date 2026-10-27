// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { expect, it } from 'vitest'
import InteractionPanel from '../../src/modern/features/game/InteractionPanel.vue'
import { createGame } from '../../src/modern/features/game/setup'

it('月结以真实冠军立绘和四人图文排名展示资产，素材失败可恢复且只由继续按钮发出确认', async () => {
  const game = createGame([1, 2, 3, 4], 1)
  game.players[1]!.deposit = 500000; game.finance.monthlyQuoteIndex = 7
  game.interaction = { kind: 'monthly-settlement', playerId: 4, entries: [{ kind: 'deposit-interest', playerId: 2, depositDelta: 50000 }] }
  const before = JSON.stringify(game)
  const panel = mount(InteractionPanel, { props: { game, paused: false, cardAssets: [], assetProfile: 'hd', preparedImages: { 'assets/monthly/champions/2.png': 'blob:prepared-aniu' } } })
  const champion = panel.get<HTMLImageElement>('[data-testid="monthly-champion"] img')
  expect(champion.attributes('alt')).toBe('本月冠军阿牛')
  expect(champion.attributes('src')).toBe('blob:prepared-aniu')
  expect(panel.get('[data-testid="monthly-champion"]').text()).toContain('玩游戏，要先看懂规则滴')
  const rankings = panel.get('[data-testid="monthly-standings"]')
  expect(rankings.findAll('img')).toHaveLength(4)
  expect(rankings.findAll('li')[0]!.text()).toContain('阿牛')
  expect(rankings.findAll('li')[0]!.attributes('data-player-id')).toBe('2')
  expect(panel.text()).toContain('存款 +50000')
  expect(JSON.stringify(game)).toBe(before)
  expect(panel.emitted('acknowledge-monthly')).toBeUndefined()
  await champion.trigger('error')
  expect(panel.emitted('asset-error')).toHaveLength(1)
  await panel.get('[data-testid="monthly-acknowledge"]').trigger('click')
  expect(panel.emitted('acknowledge-monthly')).toEqual([[]])
  await panel.setProps({ paused: true })
  expect(panel.get<HTMLButtonElement>('[data-testid="monthly-acknowledge"]').element.disabled).toBe(true)
})

it('已出局玩家保留其真实头像和出局标记，不显示为冠军', () => {
  const game = createGame([1, 2, 3, 4], 1)
  game.eliminatedPlayerIds = [1]; game.players[0]!.cash = 99999999
  game.interaction = { kind: 'monthly-settlement', playerId: 4, entries: [] }
  const panel = mount(InteractionPanel, { props: { game, paused: false, cardAssets: [] } })
  expect(panel.get('[data-testid="monthly-champion"] img').attributes('alt')).not.toBe('本月冠军卷毛')
  const last = panel.get('[data-testid="monthly-standings"]').findAll('li').at(-1)!
  expect(last.text()).toContain('出局'); expect(last.get('img').attributes('alt')).toBe('卷毛')
  expect(panel.text()).toContain('本月没有资金变化')
})
