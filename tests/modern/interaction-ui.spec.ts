// @vitest-environment jsdom
import { mount, type VueWrapper } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import HandPanel from '../../src/modern/features/game/HandPanel.vue'
import InteractionPanel from '../../src/modern/features/game/InteractionPanel.vue'
import GamePanel from '../../src/modern/features/game/GamePanel.vue'
import { createGameController, type GameController } from '../../src/modern/features/game/controller'
import type { DirectCardChoice } from '../../src/modern/features/game/direct-cards'
import { createGame } from '../../src/modern/features/game/setup'
import type { GameState } from '../../src/modern/features/game/types'
import type { InteractionAsset } from '../../src/modern/features/game/interaction-assets'

const CARD_IDS = [1, 5, 6, 7, 9, 11, 14, 15, 18, 19, 20, 21, 22, 25, 26, 27, 33]
const assets: InteractionAsset[] = CARD_IDS.map(id => ({
  id, sourceFrame: id + 1, url: `assets/interactions/cards/${id}.png`,
  width: 65, height: 67, offsetX: -25, offsetY: -32,
}))

function gameWithCards(cards: number[]): GameState {
  const game = createGame([1, 2, 3, 4], 0, 1)
  game.inventories[1] = [...cards]
  game.world.markers = {}
  return game
}

function mountInteraction(controller: GameController): VueWrapper {
  let wrapper: VueWrapper
  const sync = () => wrapper.setProps({ game: controller.state })
  wrapper = mount(InteractionPanel, {
    props: {
      game: controller.state,
      paused: false,
      cardAssets: assets,
      onConfirm: () => { controller.confirmCard(); void sync() },
      onCancel: () => { controller.cancelInteraction(); void sync() },
      onChoose: (choice: DirectCardChoice) => { controller.chooseCard(choice); void sync() },
      onAcknowledge: () => { controller.acknowledgeInteraction(); void sync() },
      onBuy: (slot: number) => { controller.buyCard(slot); void sync() },
      onSell: (index: number) => { controller.sellCard(index); void sync() },
      onLeaveShop: () => { controller.leaveShop(); void sync() },
      onRequestCredit: () => { controller.requestCredit(); void sync() },
      onLeaveBank: () => { controller.leaveBank(); void sync() },
    },
  })
  return wrapper
}

describe('3A 手牌面板', () => {
  it('24 张手牌按每页 8 张分页，并用名称区分同图的均富卡和均贫卡', async () => {
    const game = gameWithCards([
      5, 6, 7, 9, 11, 14, 15, 18,
      19, 20, 21, 22, 25, 26, 27, 33,
      5, 6, 7, 9, 11, 14, 25, 26,
    ])
    const wrapper = mount(HandPanel, { props: { game, paused: false, cardAssets: assets } })
    expect(wrapper.findAll('[data-testid="hand-card"]')).toHaveLength(8)
    expect(wrapper.get('[data-testid="hand-page"]').text()).toContain('1 / 3')

    await wrapper.get('[data-testid="hand-next"]').trigger('click')
    expect(wrapper.get('[data-testid="hand-page"]').text()).toContain('2 / 3')
    expect(wrapper.text()).toContain('均富卡')
    expect(wrapper.text()).toContain('均贫卡')
    const images = wrapper.findAll('[data-testid="hand-card"] img')
    expect(images.find(image => image.attributes('alt') === '均富卡')?.attributes('src')).toContain('/25.png')
    expect(images.find(image => image.attributes('alt') === '均贫卡')?.attributes('src')).toContain('/26.png')

    await wrapper.get('[data-card-index="12"]').trigger('click')
    expect(wrapper.emitted('begin-card')).toEqual([[12]])
  })
})

describe('3A 对局状态面板', () => {
  it('显示四名玩家的真实奖券、信用、住院或拘留及神灵剩余天数', () => {
    const game = gameWithCards([5])
    game.tickets[1] = -30
    game.credit[1] = { score: 88, used: 1200, available: 3400 }
    game.world.statuses[1] = { state: 3, days: 2, godId: 10, godDays: 6 }
    const wrapper = mount(GamePanel, { props: { game, paused: false, speed: 1, history: [] } })
    const first = wrapper.get('[data-testid="player-list"]').findAll('li')[0]!
    expect(first.text()).toContain('奖券 -30')
    expect(first.text()).toContain('信用 3400 / 已用 1200')
    expect(first.text()).toContain('住院 2天')
    expect(first.text()).toContain('天使 6天')
    expect(wrapper.text()).toContain('失物招领 0 / 0')
  })
})

describe('3A 真实控制器交互面板', () => {
  it.each(CARD_IDS)('卡 %i 使用真实控制器打开原卡面，取消后保留原手牌', async cardId => {
    const controller = createGameController(gameWithCards([cardId]))
    expect(controller.beginCard(0)).toBe(true)
    const wrapper = mountInteraction(controller)
    const definition = wrapper.get('[data-testid="interaction-panel"]')
    expect(definition.find('img').attributes('src')).toContain(`/cards/${cardId}.png`)
    expect(definition.text()).toContain('确认使用')
    await wrapper.get('[data-testid="interaction-cancel"]').trigger('click')
    expect(controller.state.inventories[1]).toEqual([cardId])
    expect(controller.state.phase).toBe('awaiting-roll')
  })

  it('确认、取消和暂停守卫不提前消耗手牌', async () => {
    const controller = createGameController(gameWithCards([5]))
    controller.beginCard(0)
    const wrapper = mountInteraction(controller)
    expect(wrapper.text()).toContain('控骰卡')
    await wrapper.get('[data-testid="interaction-confirm"]').trigger('click')
    expect(controller.state.interaction?.kind).toBe('dice-choice')
    expect(controller.state.inventories[1]).toEqual([5])
    await wrapper.get('[data-testid="interaction-cancel"]').trigger('click')
    expect(controller.state.phase).toBe('awaiting-roll')
    expect(controller.state.inventories[1]).toEqual([5])

    controller.beginCard(0)
    await wrapper.setProps({ game: controller.state, paused: true })
    expect((wrapper.get('[data-testid="interaction-confirm"]').element as HTMLButtonElement).disabled).toBe(true)
    expect((wrapper.get('[data-testid="interaction-cancel"]').element as HTMLButtonElement).disabled).toBe(true)
  })

  it('点数、信用额度和玩家目标均提交最小选择值，并显示控制器失败原因', async () => {
    const dice = createGameController(gameWithCards([5]))
    dice.beginCard(0); dice.confirmCard()
    const dicePanel = mountInteraction(dice)
    await dicePanel.get('[data-testid="dice-6"]').trigger('click')
    expect(dice.state.forcedDice[1]).toBe(6)
    expect(dice.state.inventories[1]).toEqual([])

    const creditGame = gameWithCards([1])
    creditGame.credit[1] = { used: 0, available: 900, score: 100 }
    const credit = createGameController(creditGame)
    credit.beginCard(0); credit.confirmCard()
    const creditPanel = mountInteraction(credit)
    await creditPanel.get('[data-testid="credit-amount"]').setValue('901')
    await creditPanel.get('[data-testid="credit-form"]').trigger('submit')
    expect(credit.state.interaction).toMatchObject({ kind: 'credit-choice', choiceError: '无效信用额度' })
    await creditPanel.get('[data-testid="credit-amount"]').setValue('400')
    await creditPanel.get('[data-testid="credit-form"]').trigger('submit')
    expect(credit.state.players[0]!.cash).toBe(100_400)

    const targetGame = gameWithCards([33])
    targetGame.players[1] = { ...targetGame.players[1]!, position: { column: 27, row: 33 } }
    const target = createGameController(targetGame)
    target.beginCard(0); target.confirmCard()
    const targetPanel = mountInteraction(target)
    await targetPanel.get('[data-testid="target-player-2"]').trigger('click')
    expect(target.state.interaction).toMatchObject({ kind: 'notice', notice: { cardId: 33, affectedPlayerIds: [1, 2] } })
  })

  it('卡片成功通知显示真实卡名且不把零结算误写成金额', () => {
    const controller = createGameController(gameWithCards([5]))
    controller.beginCard(0); controller.confirmCard(); controller.chooseCard({ kind: 'dice', value: 2 })
    const wrapper = mountInteraction(controller)
    expect(wrapper.text()).toContain('控骰卡已生效')
    expect(wrapper.text()).not.toContain('数值 0')
  })

  it('商店、银行和运气结果显示真实库存、奖券、信用与原图', async () => {
    const game = gameWithCards([5, 6])
    game.phase = 'interaction'
    game.interaction = { kind: 'shop', playerId: 1, resume: 'shop', shop: { stock: [5, 6, 7, 9, 11, 14, 15, 18, 19, 20, 21, null] } }
    const shop = mount(InteractionPanel, { props: { game, paused: false, cardAssets: assets } })
    expect(shop.findAll('[data-testid="shop-slot"]')).toHaveLength(12)
    expect(shop.text()).toContain('奖券 200')
    expect(shop.text()).toContain('售罄')
    expect(shop.text()).toContain('售价 30')

    const bank = structuredClone(game)
    bank.interaction = { kind: 'bank', playerId: 1, resume: 'after-bank' }
    bank.credit[1] = { score: 100, used: 20, available: 80 }
    await shop.setProps({ game: bank })
    expect(shop.text()).toContain('信用评分 100')
    expect(shop.text()).toContain('已用 20')
    expect(shop.text()).toContain('可用 80')

    const luck = structuredClone(bank)
    luck.interaction = { kind: 'notice', playerId: 1, resume: 'end-turn', notice: {
      kind: 'luck', message: '捐款给慈善机构', amount: -1000,
      luckEvent: { id: 28, kind: 'cash', description: '捐款给慈善机构', sourceAmount: 1000, amount: -1000, correction: 'B-01' },
    } }
    await shop.setProps({ game: luck })
    expect(shop.text()).toContain('捐款给慈善机构')
    expect(shop.text()).toContain('现金 -1000')
    expect(shop.get('[data-testid="luck-image"]').attributes('src')).toContain('/luck/28.png')
  })
})
