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
import { getCardCell } from '../../src/modern/features/game/direct-cards'
import { resolveWorldCell } from '../../src/modern/features/game/world-cards'
import { interactionVisualPlan } from '../../src/modern/features/game/game-visuals'

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
  it('真实商店买卖结果分别显示奖券支出和收入及结算后余额', async () => {
    const game = gameWithCards([1])
    game.phase = 'interaction'
    game.interaction = { kind: 'shop', playerId: 1, resume: 'shop', shop: { stock: [5, 6, 7, 5, 9, 6, null, null, null, null, null, null] } }
    const controller = createGameController(game)
    const wrapper = mountInteraction(controller)
    expect(controller.state.tickets[1]).toBe(200)
    await wrapper.get('[data-testid="shop-slot"]').trigger('click')
    expect(controller.state.tickets[1]).toBe(170)
    expect(wrapper.text()).toContain('购买成功')
    expect(wrapper.text()).toContain('奖券 -30')
    await wrapper.get('[data-testid="interaction-acknowledge"]').trigger('click')
    await wrapper.findAll('.sell-list button')[0]!.trigger('click')
    expect(controller.state.tickets[1]).toBe(270)
    expect(wrapper.text()).toContain('出售成功')
    expect(wrapper.text()).toContain('奖券 +100')
    controller.dispose()
  })

  it('穷神真实事件以实际现金损失和悲伤反馈呈现，低余额按归零额显示', () => {
    const game = createGame([1], 153, 1)
    const position = game.players[0]!.position
    const cell = getCardCell(position)!
    game.world.markers = { [cell.id]: 3 }
    game.players[0]!.cash = 100
    const result = resolveWorldCell(game, 1, position, 'landing')
    const event = result.event!
    expect(event).toMatchObject({ kind: 'god-encountered', npcId: 3 })
    expect(event.amount).toBeGreaterThan(100)
    expect(result.snapshot.players[0]!.cash).toBe(0)
    expect(interactionVisualPlan({ kind: 'world', playerId: 1, worldEvent: event }).reactions).toEqual([{ playerId: 1, name: 'sad' }])
    game.phase = 'landed'
    game.continuation = 'handle-landing'
    const controller = createGameController(game)
    expect(controller.state.interaction).toMatchObject({ kind: 'notice', notice: { eventKind: 'god-encountered', npcId: 3, amount: -100 } })
    const wrapper = mount(InteractionPanel, { props: { game: controller.state, paused: false, cardAssets: assets } })
    expect(wrapper.text()).toContain('穷神')
    expect(wrapper.text()).toContain('现金 -100')
    expect(wrapper.text()).toContain('现金 0')
    controller.dispose()
  })

  it('现金已经为零时穷神提示不声称又损失了现金', () => {
    const game = createGame([1], 153, 1)
    const position = game.players[0]!.position
    game.world.markers = { [getCardCell(position)!.id]: 3 }
    game.players[0]!.cash = 0
    game.phase = 'landed'
    game.continuation = 'handle-landing'
    const controller = createGameController(game)
    const wrapper = mount(InteractionPanel, { props: { game: controller.state, paused: false, cardAssets: assets } })
    expect(wrapper.text()).toContain('遇见穷神')
    expect(wrapper.text()).not.toContain('现金减少')
    expect(wrapper.text()).not.toContain('现金 -')
    controller.dispose()
  })
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
  it('外层拒绝速度变更时，菜单恢复实际速度', async () => {
    const wrapper = mount(GamePanel, { props: { game: gameWithCards([5]), paused: false, speed: 1, history: [] } })
    const speed = wrapper.get<HTMLSelectElement>('select[aria-label="速度"]')
    await speed.setValue('2')
    expect(speed.element.value).toBe('1')
    await wrapper.setProps({ speed: 2 })
    expect(speed.element.value).toBe('2')
  })

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
  it.each(['original', 'hd'] as const)('%s 卡片弹窗复用已解码卡面，不再次请求图片', profile => {
    const controller = createGameController(gameWithCards([5]))
    controller.beginCard(0)
    const url = profile === 'hd' ? 'hd-static/interactions/cards/5.webp' : 'assets/interactions/cards/5.png'
    const wrapper = mount(InteractionPanel, { props: {
      game: controller.state, paused: false, cardAssets: assets, assetProfile: profile,
      preparedImages: { [url]: 'blob:prepared-dice-card' },
    } })
    expect(wrapper.get('.card-head img').attributes('src')).toBe('blob:prepared-dice-card')
    controller.dispose()
  })

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

  it('卡片格按真实 card notice 显示获得或满24张且不泄露内部消息', async () => {
    const received = gameWithCards([5])
    received.phase = 'interaction'
    received.interaction = { kind: 'notice', playerId: 1, resume: 'end-turn', notice: {
      kind: 'card', message: 'received', cardId: 6, cardIds: [6],
    } }
    const wrapper = mount(InteractionPanel, { props: { game: received, paused: false, cardAssets: assets } })
    expect(wrapper.text()).toContain('获得障碍卡')
    expect(wrapper.text()).not.toContain('received')

    const full = structuredClone(received)
    full.inventories[1] = Array(24).fill(5)
    full.interaction = { kind: 'notice', playerId: 1, resume: 'end-turn', notice: {
      kind: 'card', message: 'full', cardIds: [],
    } }
    await wrapper.setProps({ game: full })
    expect(wrapper.text()).toContain('手牌已满，未抽取新卡')
    expect(wrapper.text()).not.toContain('full')
  })

  it('手牌与运气图加载失败向上报告可恢复素材错误', async () => {
    const game = gameWithCards([5])
    const hand = mount(HandPanel, { props: { game, paused: false, cardAssets: assets } })
    await hand.get('[data-testid="hand-card"] img').trigger('error')
    expect(hand.emitted('asset-error')?.[0]?.[0]).toBeInstanceOf(Error)
    expect(hand.emitted('asset-error')?.[0]?.[1]).toBe(5)

    game.phase = 'interaction'
    game.interaction = { kind: 'notice', playerId: 1, resume: 'end-turn', notice: {
      kind: 'luck', message: '捐款', amount: -1000,
      luckEvent: { id: 28, kind: 'cash', description: '捐款', sourceAmount: 1000, amount: -1000, correction: 'B-01' },
    } }
    const panel = mount(InteractionPanel, { props: { game, paused: false, cardAssets: assets } })
    await panel.get('[data-testid="luck-image"]').trigger('error')
    expect(panel.emitted('asset-error')?.[0]?.[0]).toBeInstanceOf(Error)
  })
})
