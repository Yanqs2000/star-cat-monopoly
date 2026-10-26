// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { expect, it } from 'vitest'
import InteractionPanel from '../../src/modern/features/game/InteractionPanel.vue'
import { createGame } from '../../src/modern/features/game/setup'
import { getLuckEvent } from '../../src/modern/features/game/events'
import { createGameController } from '../../src/modern/features/game/controller'
import { getCardCell } from '../../src/modern/features/game/direct-cards'

it('末位AI玩家的月结确认按钮允许观察者点击，暂停时禁用', async () => {
  const game = createGame([1], 1)
  game.activePlayerIndex = 3
  game.interaction = { kind: 'monthly-settlement', playerId: 4, entries: [] }
  const panel = mount(InteractionPanel, { props: { game, paused: false, cardAssets: [] } })
  const button = panel.get<HTMLButtonElement>('[data-testid="monthly-acknowledge"]')
  expect(button.element.disabled).toBe(false)
  await button.trigger('click')
  expect(panel.emitted('acknowledge-monthly')).toEqual([[]])
  await panel.setProps({ paused: true })
  expect(button.element.disabled).toBe(true)
  panel.unmount()
})

it.each([[41, '奖券 +150'], [21, '奖券 +100'], [28, '现金 -1000']] as const)('运气事件%i显示实际资金单位', (id, label) => {
  const game = createGame([1], 0, 1)
  const luckEvent = getLuckEvent(id)
  game.interaction = { kind: 'notice', playerId: 1, resume: 'end-turn', notice: {
    kind: 'luck', message: luckEvent.description, amount: luckEvent.amount, luckEvent,
  } }
  const panel = mount(InteractionPanel, { props: { game, paused: false, cardAssets: [] } })
  expect(panel.get('.amount').text()).toBe(label)
  panel.unmount()
})

it.each(['original', 'hd'] as const)('%s 获得卡片时展示对应卡面并复用已准备的图片', profile => {
  const game = createGame([1], 0, 1)
  game.interaction = { kind: 'notice', playerId: 1, resume: 'end-turn', notice: {
    kind: 'card', message: 'received', cardId: 22, cardIds: [22],
  } }
  const url = profile === 'hd' ? 'hd-static/interactions/cards/22.webp' : 'assets/interactions/cards/22.png'
  const panel = mount(InteractionPanel, { props: { game, paused: false, cardAssets: [], assetProfile: profile,
    preparedImages: { [url]: 'blob:prepared-dismiss-card' },
  } })
  expect(panel.get('img[alt="送神卡"]').attributes('src')).toBe('blob:prepared-dismiss-card')
  panel.unmount()
})


it('财神现金奖励明确显示现金单位', () => {
  const game = createGame([1], 0, 1)
  game.interaction = { kind: 'notice', playerId: 1, resume: 'end-turn', notice: {
    kind: 'world', message: 'god-encountered', eventKind: 'god-encountered', npcId: 2, amount: 12000,
  } }
  const panel = mount(InteractionPanel, { props: { game, paused: false, cardAssets: [] } })
  expect(panel.get('.amount').text()).toBe('现金 +12000')
  panel.unmount()
})

it.each([[0, 2], [23, 1], [24, 0]])('福神遇见前手牌%i张，显示实际获得的%i张卡面', (count, received) => {
  const game = createGame([1], 153, 1)
  game.inventories[1] = Array(count).fill(5)
  game.world.markers = { [getCardCell(game.players[0]!.position)!.id]: 4 }
  game.phase = 'landed'; game.continuation = 'handle-landing'
  const controller = createGameController(game)
  const panel = mount(InteractionPanel, { props: { game: controller.state, paused: false, cardAssets: [], assetProfile: 'hd' } })
  expect(panel.get('h2').text()).toContain('福神')
  expect(panel.get('.notice-body').text()).toContain('福神（7天）')
  expect(panel.findAll('.reward-card')).toHaveLength(received)
  if (received) {
    expect(panel.get('img[alt="飞弹卡"]').attributes('src')).toContain('hd-static/interactions/cards/9.webp')
    expect(panel.text()).toContain('飞弹卡')
    if (received === 2) expect(panel.get('img[alt="查税卡"]').attributes('src')).toContain('hd-static/interactions/cards/33.webp')
  } else expect(panel.text()).toContain('手牌已满')
  expect(controller.state.inventories[1]).toHaveLength(count + received)
  controller.dispose(); panel.unmount()
})
