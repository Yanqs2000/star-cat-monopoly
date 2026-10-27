// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import PropertyPanel from '../../src/modern/features/game/PropertyPanel.vue'
import { createGame } from '../../src/modern/features/game/setup'

describe('2C 地产操作面板', () => {
  it('购买确认由用户发出，已结算结果显示实际资金且不能再次购买', async () => {
    const game = createGame([1], 1)
    game.phase = 'property-decision'
    game.propertyOffer = { kind: 'purchase', parcelId: 83, amount: 1800, ownerId: null }
    const wrapper = mount(PropertyPanel, { props: { game, paused: false } })
    expect(wrapper.text()).toContain('土星北路')
    expect(wrapper.text()).toContain('现金 100000')
    await wrapper.get('[data-testid="property-accept"]').trigger('click')
    expect(wrapper.emitted('decide')).toEqual([['accept']])

    const result = { ...game, phase: 'property-result' as const,
      players: game.players.map((player, index) => index === 0 ? { ...player, cash: 98200 } : player),
      properties: { ...game.properties, 83: { ownerId: 1, level: 0 as const } },
      lastPropertyEvent: { kind: 'purchased' as const, playerId: 1, parcelId: 83, amount: 1800, level: 0 } }
    await wrapper.setProps({ game: result })
    expect(wrapper.text()).toContain('98200')
    expect(wrapper.text()).toContain('产权：卷毛')
    expect(wrapper.find('[data-testid="property-accept"]').exists()).toBe(false)
    await wrapper.get('[data-testid="property-acknowledge"]').trigger('click')
    expect(wrapper.emitted('acknowledge')).toHaveLength(1)
  })

  it('租金只有付款确认；暂停时全部交易键不可用', () => {
    const game = createGame([1], 1)
    game.phase = 'property-decision'
    game.propertyOffer = { kind: 'rent', parcelId: 47, amount: 800, ownerId: 2 }
    const wrapper = mount(PropertyPanel, { props: { game, paused: true } })
    expect(wrapper.text()).toContain('必须支付')
    expect(wrapper.find('[data-testid="property-decline"]').exists()).toBe(false)
    expect((wrapper.get('[data-testid="property-accept"]').element as HTMLButtonElement).disabled).toBe(true)
  })
})
