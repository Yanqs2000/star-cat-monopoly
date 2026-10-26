// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import InteractionPanel from '../../src/modern/features/game/InteractionPanel.vue'
import { createGame } from '../../src/modern/features/game/setup'

function setup(cash = 100000, offerShares = 10000) {
  const game = createGame([1, 2, 3, 4], 16)
  game.players[0]!.cash = cash
  game.finance.stocks[13]!.offerShares = offerShares
  game.phase = 'interaction'
  game.interaction = { kind: 'company', playerId: 1, companyId: 13, resume: 'company' }
  const panel = mount(InteractionPanel, { props: { game, paused: false, cardAssets: [] } })
  const open = () => panel.get('[data-testid="company-subscribe"]').trigger('click')
  const key = (label: string) => panel.get(`[aria-label="${label}"]`).trigger('click')
  return { game, panel, open, key }
}

describe('原版公司认购计算器', () => {
  it('先打开零值计算器，数字键确认后才提交，不需要下方数字输入框', async () => {
    const { game, panel, open, key } = setup()
    const before = structuredClone(game)
    await open()
    expect(panel.find('input[type="number"]').exists()).toBe(false)
    expect(panel.get('[data-testid="company-shares"]').text()).toBe('0')
    expect(panel.emitted('subscribe-company')).toBeUndefined()
    await key('数字 1'); await key('数字 2'); await key('数字 3')
    expect(panel.text()).toContain('成交额 615')
    await key('确定认购')
    expect(panel.emitted('subscribe-company')).toEqual([[123]])
    expect(game).toEqual(before)
  })
  it('滑块与数字显示双向同步，归零、退格、最大按原版规则工作', async () => {
    const { panel, open, key } = setup()
    await open()
    await panel.get('input[type="range"]').setValue('678')
    expect(panel.get('[data-testid="company-shares"]').text()).toBe('678')
    await key('退格'); await key('数字 9')
    expect(panel.get('input[type="range"]').element).toHaveProperty('value', '679')
    await key('归零'); await key('数字 4'); await key('数字 0')
    expect(panel.get('[data-testid="company-shares"]').text()).toBe('40')
    await key('最大')
    expect(panel.get('[data-testid="company-shares"]').text()).toBe('1000')
  })
  it.each([[332, 10000, 66], [100000, 37, 37]])('现金 %s、余股 %s 限制输入上限 %s，超限追加被忽略', async (cash, offer, maximum) => {
    const { panel, open, key } = setup(cash, offer)
    await open(); await key('最大'); await key('数字 9')
    expect(panel.get('[data-testid="company-shares"]').text()).toBe(String(maximum))
    expect(panel.get('input[type="range"]').attributes('max')).toBe(String(maximum))
    await key('确定认购')
    expect(panel.emitted('subscribe-company')).toEqual([[maximum]])
  })
  it('键盘数字、退格、方向快捷键和回车可完成认购', async () => {
    const { panel, open } = setup()
    await open()
    const calculator = panel.get('[data-testid="company-calculator"]')
    for (const key of ['1', '2', 'Backspace', '0', 'Enter']) await calculator.trigger('keydown', { key })
    expect(panel.emitted('subscribe-company')).toEqual([[10]])
  })
  it('焦点在取消按钮时回车保留按钮原生操作，不意外提交认购', async () => {
    const { panel, open, key } = setup()
    await open(); await key('数字 5')
    const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
    panel.get('[aria-label="取消认购"]').element.dispatchEvent(event)
    expect(panel.emitted('subscribe-company')).toBeUndefined()
    expect(event.defaultPrevented).toBe(false)
  })
  it('取消不提交且重新打开从零开始', async () => {
    const { panel, open, key } = setup()
    await open(); await key('最大'); await key('取消认购')
    expect(panel.emitted('subscribe-company')).toBeUndefined()
    expect(panel.find('[data-testid="company-calculator"]').exists()).toBe(false)
    await open()
    expect(panel.get('[data-testid="company-shares"]').text()).toBe('0')
  })
  it('暂停阻止滑块、数字键和确认，恢复后保留已选股数', async () => {
    const { panel, open, key } = setup()
    await open(); await key('数字 4')
    await panel.setProps({ paused: true })
    await key('数字 9')
    await panel.get('[data-testid="company-calculator"]').trigger('keydown', { key: 'Enter' })
    expect(panel.get('input[type="range"]').attributes('disabled')).toBeDefined()
    expect(panel.get('[data-testid="company-shares"]').text()).toBe('4')
    expect(panel.emitted('subscribe-company')).toBeUndefined()
    await panel.setProps({ paused: false }); await key('确定认购')
    expect(panel.emitted('subscribe-company')).toEqual([[4]])
  })
  it('按原版确认零股时放弃认购并离开公司，不提交零股交易', async () => {
    const { panel, open, key } = setup()
    await open(); await key('确定认购')
    expect(panel.emitted('subscribe-company')).toBeUndefined()
    expect(panel.emitted('leave-company')).toEqual([[]])
  })
  it('现金不足一股时不可发起认购，仍能离开公司', async () => {
    const { panel } = setup(4)
    expect(panel.get('[data-testid="company-subscribe"]').attributes('disabled')).toBeDefined()
    await panel.get('[data-testid="company-leave"]').trigger('click')
    expect(panel.emitted('leave-company')).toEqual([[]])
  })
})
