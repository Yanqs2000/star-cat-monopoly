// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import InteractionPanel from '../../src/modern/features/game/InteractionPanel.vue'
import { createGame } from '../../src/modern/features/game/setup'

describe('3B 银行和月结面板', () => {
  it('银行只提交业务和整数金额，显示贷款、现金和存款', async () => {
    const game = createGame([1, 2, 3, 4], 1)
    game.phase = 'interaction'
    game.interaction = { kind: 'bank', playerId: 1, resume: 'after-bank' }
    game.players[0]!.cash = 300
    game.players[0]!.deposit = 700
    const panel = mount(InteractionPanel, { props: { game, paused: false, cardAssets: [] } })
    expect(panel.text()).toContain('现金 300')
    expect(panel.text()).toContain('存款 700')
    expect(panel.text()).toContain('贷款 0')
    await panel.get('[data-testid="bank-operation"]').setValue('deposit')
    await panel.get('[data-testid="bank-amount"]').setValue('250')
    await panel.get('[data-testid="bank-form"]').trigger('submit')
    expect(panel.emitted('bank-operation')).toEqual([['deposit', 250]])
    expect(game.players[0]!.cash).toBe(300)
  })

  it('月结显示各项实际账户增减，并等待明确确认', async () => {
    const game = createGame([1, 2, 3, 4], 1)
    game.phase = 'interaction'
    game.interaction = { kind: 'monthly-settlement', playerId: 1, entries: [
      { kind: 'company-distribution', playerId: 1, companyId: 1, sourceAmount: 10, depositDelta: 9 },
      { kind: 'credit-monthly-payment', playerId: 1, sourceAmount: 6000, cashDelta: -3000, depositDelta: -3000 },
    ] }
    const panel = mount(InteractionPanel, { props: { game, paused: false, cardAssets: [] } })
    expect(panel.text()).toContain('公司分配')
    expect(panel.text()).toContain('存款 +9')
    expect(panel.text()).toContain('现金 -3000')
    expect(panel.text()).toContain('存款 -3000')
    await panel.get('[data-testid="monthly-acknowledge"]').trigger('click')
    expect(panel.emitted('acknowledge-monthly')).toEqual([[]])
  })
})
