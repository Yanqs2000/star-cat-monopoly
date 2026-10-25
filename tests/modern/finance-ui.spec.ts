// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import InteractionPanel from '../../src/modern/features/game/InteractionPanel.vue'
import GamePanel from '../../src/modern/features/game/GamePanel.vue'
import { createGame } from '../../src/modern/features/game/setup'
import { settleMonth } from '../../src/modern/features/game/bank-settlement'

describe('3B 银行和月结面板', () => {
  it('月结的实际账户变化后显示同一资产排名，不再次结算或消费随机', () => {
    const source = createGame([1, 2, 3, 4], 1)
    source.world.day = 1
    source.players[1]!.deposit = 200000
    const result = settleMonth(source), game = result.state
    game.phase = 'interaction'
    game.interaction = { kind: 'monthly-settlement', playerId: 1, entries: result.entries }
    const before = structuredClone(game)
    const panel = mount(InteractionPanel, { props: { game, paused: false, cardAssets: [] } })
    const rows = panel.get('[data-testid="monthly-standings"]').findAll('li')
    expect(rows).toHaveLength(4)
    expect(rows[0]!.text()).toContain('阿牛')
    expect(game).toEqual(before)
  })
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
      { kind: 'company-undistributed-profit', companyId: 13, sourceAmount: 10 },
      { kind: 'credit-monthly-payment', playerId: 1, sourceAmount: 6000, cashDelta: -3000, depositDelta: -3000 },
    ] }
    const panel = mount(InteractionPanel, { props: { game, paused: false, cardAssets: [] } })
    expect(panel.text()).toContain('公司分配')
    expect(panel.text()).toContain('未分配经营收入')
    expect(panel.text()).toContain('来源金额 10')
    expect(panel.text()).toContain('存款 +9')
    expect(panel.text()).toContain('现金 -3000')
    expect(panel.text()).toContain('存款 -3000')
    await panel.get('[data-testid="monthly-acknowledge"]').trigger('click')
    expect(panel.emitted('acknowledge-monthly')).toEqual([[]])
  })

  it('月结排名显示原版选中的台词而不额外抽随机数', () => {
    const game = createGame([1, 2, 3, 4], 1)
    game.phase = 'interaction'
    game.finance.monthlyQuoteIndex = 7
    game.interaction = { kind: 'monthly-settlement', playerId: 1, entries: [] }
    const panel = mount(InteractionPanel, { props: { game, paused: false, cardAssets: [] } })
    expect(panel.text()).toContain('玩游戏，要先看懂规则滴')
  })

  it('股市显示价格、日限额、持股和成交现金变化，只提交公司/数量/方向', async () => {
    const game = createGame([1, 2, 3, 4], 1)
    game.phase = 'interaction'
    game.interaction = { kind: 'stock', playerId: 1, resume: 'after-stock' }
    game.players[0]!.cash = 100
    game.finance.stocks[2]!.price = 21.37
    game.finance.stocks[2]!.dailyBuyLimit = 10
    game.finance.stocks[2]!.holdings[1] = { shares: 2, averageCost: 20.1 }
    const panel = mount(InteractionPanel, { props: { game, paused: false, cardAssets: [] } })
    await panel.get('[data-testid="stock-company"]').setValue('2')
    await panel.get('[data-testid="stock-shares"]').setValue('3')
    expect(panel.text()).toContain('中华饭店')
    expect(panel.text()).toContain('现价 21.37')
    expect(panel.text()).toContain('当日可买 10')
    expect(panel.text()).toContain('已持 2')
    expect(panel.text()).toContain('成交额 64.11')
    expect(panel.text()).toContain('现金 -64')
    await panel.get('[data-testid="stock-buy"]').trigger('click')
    expect(panel.emitted('trade-stock')).toEqual([['buy', 2, 3]])
  })

  it('公司格显示承销价、董事、待购股及收费实际扣款，并提交认购数量', async () => {
    const game = createGame([1, 2, 3, 4], 1)
    game.phase = 'interaction'
    game.finance.stocks[13]!.ceoId = 2
    game.interaction = { kind: 'company', playerId: 1, companyId: 13, resume: 'company',
      chargeEntry: { kind: 'company-fee', playerId: 1, companyId: 13, sourceAmount: 600,
        cashDelta: -100, depositDelta: -500 } }
    const panel = mount(InteractionPanel, { props: { game, paused: false, cardAssets: [] } })
    expect(panel.text()).toContain('电力公司')
    expect(panel.get('[data-testid="company-original-frame"]').attributes('src')).toMatch(/assets\/companies\/dialog.png$/)
    expect(panel.text()).toContain('承销价 5')
    expect(panel.text()).toContain('董事')
    expect(panel.text()).toContain('现金 -100')
    expect(panel.text()).toContain('存款 -500')
    await panel.get('[data-testid="company-original-frame"]').trigger('error')
    expect(panel.emitted('asset-error')?.[0]?.[0]).toBeInstanceOf(Error)
    await panel.get('[data-testid="company-subscribe"]').trigger('click')
    await panel.get('[aria-label="数字 1"]').trigger('click')
    await panel.get('[aria-label="数字 0"]').trigger('click')
    await panel.get('[aria-label="确定认购"]').trigger('click')
    expect(panel.emitted('subscribe-company')).toEqual([[10]])
  })

  it('普通公司收费显示最终两枚骰子与费用倍数', () => {
    const game = createGame([1, 2, 3, 4], 1)
    game.phase = 'interaction'
    game.interaction = { kind: 'company', playerId: 2, companyId: 1, resume: 'company',
      chargeEntry: { kind: 'company-fee', playerId: 2, companyId: 1, sourceAmount: 3000,
        cashDelta: -3000, depositDelta: 0, diceFaces: [3, 3] } }
    const panel = mount(InteractionPanel, { props: { game, paused: false, cardAssets: [] } })
    expect(panel.text()).toContain('骰子 3 + 3 = 6')
    expect(panel.text()).toContain('现金 -3000')
  })

  it('玩家面板显示完整日期、贷款与包含公共事业的持股市值', () => {
    const game = createGame([1, 2, 3, 4], 1, 2, { year: 2026, month: 9, day: 27 })
    game.finance.loans[1] = 12000
    game.finance.stocks[13]!.holdings[1] = { shares: 10, averageCost: 5 }
    const panel = mount(GamePanel, { props: { game, paused: false, speed: 1, history: [] } })
    expect(panel.text()).toContain('2026年9月27日')
    expect(panel.text()).toContain('贷款 12000')
    expect(panel.text()).toContain('股票市值')
  })

  it('授信结果显示中文业务和可用额度实际增加，不称资金到账', () => {
    const game = createGame([1, 2, 3, 4], 1)
    game.phase = 'interaction'
    game.credit[1]!.available = 100000
    game.interaction = { kind: 'notice', playerId: 1, resume: 'bank',
      notice: { kind: 'bank', message: 'credit-granted', eventKind: 'credit-granted', amount: 100000,
        financeEntry: { kind: 'credit-granted', playerId: 1, sourceAmount: 100000,
          creditAvailableDelta: 100000 } } }
    const panel = mount(InteractionPanel, { props: { game, paused: false, cardAssets: [] } })
    expect(panel.text()).toContain('信用申请通过')
    expect(panel.text()).toContain('可用信用 +100000')
    expect(panel.text()).not.toContain('账户无变化')
  })

  it('周日股市关闭和银行零金额完成提示均使用可读文案', async () => {
    const game = createGame([1, 2, 3, 4], 1)
    game.phase = 'interaction'
    game.interaction = { kind: 'notice', playerId: 1, resume: 'after-stock',
      notice: { kind: 'stock', message: 'stock-closed', eventKind: 'stock-closed' } }
    const panel = mount(InteractionPanel, { props: { game, paused: false, cardAssets: [] } })
    expect(panel.text()).toContain('股市周日休市')
    await panel.setProps({ game: { ...game,
      interaction: { kind: 'notice', playerId: 1, resume: 'bank',
        notice: { kind: 'bank', message: 'bank-deposit', eventKind: 'bank-deposit' } } } })
    expect(panel.text()).toContain('存款完成')
  })
})
