import { describe, expect, it } from 'vitest'
import { createGameController, type GameScheduler } from '../../src/modern/features/game/controller'
import { createGame } from '../../src/modern/features/game/setup'
import { randomInt } from '../../src/modern/features/game/random'
import { buyStock } from '../../src/modern/features/game/stock-trading'
import { subscribeCompany as subscribeCompanyShares } from '../../src/modern/features/game/company'

class Clock implements GameScheduler {
  private time = 0
  private nextId = 1
  private jobs = new Map<number, { at: number; run: () => void }>()
  now = () => this.time
  setTimeout = (run: () => void, ms: number) => {
    const id = this.nextId++
    this.jobs.set(id, { at: this.time + ms, run })
    return id
  }
  clearTimeout = (id: unknown) => { this.jobs.delete(id as number) }
  advance(ms: number) {
    const until = this.time + ms
    while (true) {
      const next = [...this.jobs.entries()].filter(([, job]) => job.at <= until)
        .sort((left, right) => left[1].at - right[1].at || left[0] - right[0])[0]
      if (!next) break
      this.time = next[1].at
      this.jobs.delete(next[0])
      next[1].run()
    }
    this.time = until
  }
}

const options = (clock: Clock) => ({ scheduler: clock, stepDurationMs: 10,
  landingDurationMs: 10, aiThinkDurationMs: 10 })

describe('3B 银行与日期控制器', () => {
  it('银行途中命令只提交一次，提示确认后回菜单并继续原剩余路径', () => {
    const game = createGame([1, 2, 3, 4], 1)
    game.world.markers = {}
    game.players[0] = { ...game.players[0]!, position: { column: 18, row: 14 }, direction: 1,
      cash: 300, deposit: 700 }
    const clock = new Clock()
    const controller = createGameController(game, options(clock))
    expect(controller.roll(2)).toBe(true)
    clock.advance(10)
    expect(controller.state.interaction?.kind).toBe('bank')
    controller.setPaused(true)
    expect(controller.bankOperation('deposit', 250)).toBe(false)
    controller.setSpeed(2)
    controller.setPaused(false)
    expect(controller.bankOperation('deposit', 250)).toBe(true)
    expect(controller.state.players[0]).toMatchObject({ cash: 50, deposit: 950 })
    expect(controller.bankOperation('deposit', 250)).toBe(false)
    expect(controller.acknowledgeInteraction()).toBe(true)
    expect(controller.state.interaction?.kind).toBe('bank')
    expect(controller.leaveBank()).toBe(true)
    clock.advance(10)
    expect(controller.state.players[0]?.position).toEqual({ column: 20, row: 16 })
    expect(controller.state.finance.entries.filter(entry => entry.kind === 'bank-deposit')).toHaveLength(1)
  })

  it('月初最后一人结算一次，恢复确认后才换日和重定股票价格', () => {
    const game = createGame([1, 2, 3, 4], 1, 1, { year: 2026, month: 9, day: 1 })
    game.activePlayerIndex = 3
    game.phase = 'landed'
    game.continuation = 'finish-turn'
    game.players[0]!.deposit = 10000
    game.credit[1] = { score: 100, used: 2000, available: 98000 }
    const clock = new Clock()
    const controller = createGameController(game, options(clock))
    clock.advance(10)
    expect(controller.state.interaction).toMatchObject({ kind: 'monthly-settlement' })
    expect(controller.state.players[0]?.deposit).toBe(8800)
    expect(controller.state.world.day).toBe(1)
    const settled = structuredClone(controller.state)
    controller.dispose()

    const restoredClock = new Clock()
    const restored = createGameController(settled, options(restoredClock))
    expect(restored.state.players[0]?.deposit).toBe(8800)
    restored.setPaused(true)
    expect(restored.acknowledgeMonthly()).toBe(false)
    restored.setPaused(false)
    expect(restored.acknowledgeMonthly()).toBe(true)
    restoredClock.advance(10)
    expect(restored.acknowledgeMonthly()).toBe(false)
    expect(restored.state.world).toMatchObject({ year: 2026, month: 9, day: 2, elapsedDays: 1 })
    expect(restored.state.finance.entries.filter(entry => entry.kind === 'credit-monthly-payment')).toHaveLength(1)
    expect(restored.state.finance.entries.filter(entry => entry.kind === 'stock-price')).toHaveLength(12)
  })

  it('同局股票买入、公司认购与月初银行分配按顺序可逐项核算', () => {
    let game = createGame([1, 2, 3, 4], 1, 1, { year: 2026, month: 9, day: 1 })
    game = buyStock(game, 1, 2, 3).state
    game = subscribeCompanyShares(game, 1, 13, 10).state
    game.finance.stocks[13]!.profit = 10
    game.players[0]!.deposit = 10000
    game.credit[1] = { score: 100, used: 2000, available: 98000 }
    game.finance.loans[1] = 1000
    game.activePlayerIndex = 3
    game.phase = 'landed'
    game.continuation = 'finish-turn'
    const clock = new Clock()
    const controller = createGameController(game, options(clock))
    clock.advance(10)
    // ID 2 is a selected founder company, so opening price is 20: 100000-3*20-10*5.
    expect(controller.state.players[0]).toMatchObject({ cash: 99890, deposit: 7722 })
    expect(controller.state.finance.stocks[2]?.holdings[1]?.shares).toBe(3)
    expect(controller.state.finance.stocks[13]?.holdings[1]?.shares).toBe(10)
    expect(controller.state.finance.loans[1]).toBe(0)
    expect(controller.state.finance.entries.filter(entry => entry.playerId === 1).map(entry => entry.kind))
      .toEqual(['stock-buy', 'company-subscribe', 'company-distribution',
        'credit-monthly-payment', 'loan-monthly-payment', 'deposit-interest'])
    expect(controller.acknowledgeMonthly()).toBe(true)
    clock.advance(10)
    expect(controller.state.world.day).toBe(2)
    expect(controller.state.finance.entries.filter(entry => entry.kind === 'stock-price')).toHaveLength(12)
  })
})

describe('3B 股市和公司自然地图入口', () => {
  it('人类途中进入股市、成交后退出并继续余步且不重复交易', () => {
    const game = createGame([1, 2, 3, 4], 1, 1)
    game.world.markers = {}
    game.players[0] = { ...game.players[0]!, position: { column: 25, row: 21 }, direction: 4 }
    const clock = new Clock()
    const controller = createGameController(game, options(clock))
    expect(controller.roll(2)).toBe(true)
    clock.advance(10)
    expect(controller.state).toMatchObject({ phase: 'interaction', remainingSteps: 1,
      interaction: { kind: 'stock', playerId: 1 } })
    controller.setPaused(true)
    expect(controller.tradeStock('buy', 2, 3)).toBe(false)
    controller.setPaused(false)
    expect(controller.tradeStock('buy', 2, 3)).toBe(true)
    expect(controller.state.finance.stocks[2]?.holdings[1]?.shares).toBe(3)
    expect(controller.tradeStock('buy', 2, 3)).toBe(false)
    expect(controller.acknowledgeInteraction()).toBe(true)
    expect(controller.state.interaction?.kind).toBe('stock')
    expect(controller.leaveStock()).toBe(true)
    clock.advance(10)
    expect(controller.state.players[0]?.position).toEqual({ column: 27, row: 19 })
    expect(controller.state.finance.stocks[2]?.holdings[1]?.shares).toBe(3)
  })

  it.each([null, 1, 2])('公司董事为 %s 时，每次落地只能认购一次，结算恢复后直接结束回合', ceoId => {
    const game = createGame([1, 2, 3, 4], 1, 1)
    game.world.markers = {}
    game.players[0] = { ...game.players[0]!, position: { column: 25, row: 31 }, direction: 1 }
    game.finance.stocks[13]!.ceoId = ceoId
    const clock = new Clock()
    const controller = createGameController(game, options(clock))
    controller.roll(1)
    clock.advance(10)
    expect(controller.state.interaction).toMatchObject({ kind: 'company', companyId: 13 })
    controller.setPaused(true)
    expect(controller.subscribeCompany(1000)).toBe(false)
    controller.setPaused(false)
    controller.setSpeed(2)
    expect(controller.subscribeCompany(1000)).toBe(true)
    expect(controller.state.players[0]?.cash).toBe(95000)
    expect(controller.state.finance.stocks[13]?.holdings[1]?.shares).toBe(1000)
    expect(controller.subscribeCompany(1000)).toBe(false)
    const settled = structuredClone(controller.state)
    controller.dispose()
    const restored = createGameController(settled, options(new Clock()))
    restored.setPaused(true)
    expect(restored.acknowledgeInteraction()).toBe(false)
    restored.setPaused(false)
    expect(restored.acknowledgeInteraction()).toBe(true)
    expect(restored.subscribeCompany(1000)).toBe(false)
    expect(restored.acknowledgeInteraction()).toBe(false)
    expect(restored.state.activePlayerIndex).toBe(1)
    expect(restored.state.players[0]?.cash).toBe(95000)
    expect(restored.state.finance.stocks[13]?.holdings[1]?.shares).toBe(1000)
    expect(restored.state.finance.entries.filter(entry => entry.kind === 'company-subscribe')).toHaveLength(1)
    restored.dispose()
  })

  it('无效认购可修改或放弃，下次重新遇到同一公司仍可认购', () => {
    const game = createGame([1, 2, 3, 4], 1, 1)
    game.world.markers = {}
    game.players[0] = { ...game.players[0]!, position: { column: 25, row: 31 }, direction: 1 }
    const clock = new Clock()
    const controller = createGameController(game, options(clock))
    controller.roll(1); clock.advance(10)
    expect(controller.subscribeCompany(1001)).toBe(false)
    expect(controller.state.players[0]?.cash).toBe(100000)
    expect(controller.state.finance.entries.filter(entry => entry.kind === 'company-subscribe')).toHaveLength(0)
    expect(controller.subscribeCompany(1000)).toBe(true)
    expect(controller.acknowledgeInteraction()).toBe(true)
    const nextEncounter = structuredClone(controller.state)
    controller.dispose()
    // Explicit fixture for a later visit; preserve the previous cash and holdings.
    nextEncounter.activePlayerIndex = 0
    nextEncounter.phase = 'awaiting-roll'
    nextEncounter.interaction = null
    nextEncounter.continuation = null
    nextEncounter.players[0] = { ...nextEncounter.players[0]!, position: { column: 25, row: 31 }, direction: 1 }
    const nextClock = new Clock()
    const next = createGameController(nextEncounter, options(nextClock))
    next.roll(1); nextClock.advance(10)
    expect(next.subscribeCompany(1000)).toBe(true)
    expect(next.acknowledgeInteraction()).toBe(true)
    expect(next.state.players[0]?.cash).toBe(90000)
    expect(next.state.finance.stocks[13]?.holdings[1]?.shares).toBe(2000)
    expect(next.state.finance.entries.filter(entry => entry.kind === 'company-subscribe')).toHaveLength(2)
    next.dispose()

    const cancelClock = new Clock()
    const cancel = createGameController(game, options(cancelClock))
    cancel.roll(1); cancelClock.advance(10)
    expect(cancel.subscribeCompany(0)).toBe(false)
    expect(cancel.leaveCompany()).toBe(true)
    cancelClock.advance(10)
    expect(cancel.state.activePlayerIndex).toBe(1)
    expect(cancel.state.players[0]?.cash).toBe(100000)
    expect(cancel.state.finance.entries.filter(entry => entry.kind === 'company-subscribe')).toHaveLength(0)
    cancel.dispose()
  })

  it('股市周日关闭，AI 路过股市不随机交易', () => {
    const sunday = createGame([1, 2, 3, 4], 1, 0)
    sunday.world.markers = {}
    sunday.players[0] = { ...sunday.players[0]!, position: { column: 25, row: 21 }, direction: 4 }
    const clock = new Clock()
    const human = createGameController(sunday, options(clock))
    human.roll(1); clock.advance(10)
    expect(human.state.interaction).toMatchObject({ kind: 'notice', notice: { eventKind: 'stock-closed' } })
    expect(human.acknowledgeInteraction()).toBe(true)
    expect(human.state.finance.entries.filter(entry => entry.kind === 'stock-buy')).toHaveLength(0)

    const aiGame = createGame([1, 2, 3, 4], 1, 1)
    aiGame.world.markers = {}
    aiGame.players[0] = { ...aiGame.players[0]!, controller: 'ai', position: { column: 25, row: 21 }, direction: 4 }
    aiGame.forcedDice[1] = 1
    const aiClock = new Clock()
    const ai = createGameController(aiGame, options(aiClock))
    aiClock.advance(20)
    expect(ai.state.players[0]?.position).toEqual({ column: 26, row: 20 })
    expect(ai.state.interaction?.kind).not.toBe('stock')
    expect(ai.state.finance.entries.filter(entry => entry.kind === 'stock-buy')).toHaveLength(0)
  })

  it('公司费在落地时只记一次，恢复公司面板不重复扣款；AI 自动最大认购', () => {
    const game = createGame([1, 2, 3, 4], 1)
    game.world.markers = {}
    game.players[0] = { ...game.players[0]!, position: { column: 25, row: 31 }, direction: 1,
      cash: 100, deposit: 1000 }
    const parcelId = Number(Object.keys(game.properties)[0])
    game.properties[parcelId] = { ownerId: 1, level: 1 }
    game.finance.stocks[13]!.ceoId = 2
    const clock = new Clock()
    const controller = createGameController(game, options(clock))
    controller.roll(1); clock.advance(10)
    expect(controller.state.interaction).toMatchObject({ kind: 'company', companyId: 13,
      chargeEntry: { sourceAmount: 600, cashDelta: -100, depositDelta: -500 } })
    expect(controller.state.players[0]).toMatchObject({ cash: 0, deposit: 500 })
    const snapshot = structuredClone(controller.state)
    controller.dispose()
    const restored = createGameController(snapshot, options(new Clock()))
    expect(restored.state.players[0]).toMatchObject({ cash: 0, deposit: 500 })
    expect(restored.state.finance.entries.filter(entry => entry.kind === 'company-fee')).toHaveLength(1)

    const aiGame = createGame([1, 2, 3, 4], 1)
    aiGame.world.markers = {}
    aiGame.players[0] = { ...aiGame.players[0]!, controller: 'ai', position: { column: 25, row: 31 },
      direction: 1, cash: 1000 }
    aiGame.forcedDice[1] = 1
    const aiClock = new Clock()
    const ai = createGameController(aiGame, options(aiClock))
    aiClock.advance(20)
    expect(ai.state.finance.stocks[13]?.holdings[1]?.shares).toBe(200)
    expect(ai.state.players[0]?.cash).toBe(0)
    expect(ai.state.finance.stocks[13]?.ceoId).toBe(1)
  })

  it('普通公司经营费按原版动画六次随机、最终两枚骰子之和计费', () => {
    const game = createGame([1, 2, 3, 4], 1)
    expect(game.finance.stocks[1]?.mainRecordId).toBe(124)
    game.world.markers = {}
    game.activePlayerIndex = 1
    game.players[1] = { ...game.players[1]!, position: { column: 32, row: 6 }, direction: 1 }
    let expectedRng = game.rngState
    const finalDice: number[] = []
    for (let index = 0; index < 6; index++) {
      const drawn = randomInt(expectedRng, 6)
      expectedRng = drawn.nextState
      if (index >= 4) finalDice.push(drawn.value + 1)
    }
    const clock = new Clock()
    const controller = createGameController(game, options(clock))
    controller.roll(1); clock.advance(10)
    const interaction = controller.state.interaction
    expect(interaction).toMatchObject({ kind: 'company', companyId: 1 })
    if (interaction?.kind !== 'company') throw new Error('预期进入公司')
    expect(interaction.chargeEntry?.sourceAmount).toBe(500 * (finalDice[0]! + finalDice[1]!))
    expect(controller.state.rngState).toBe(expectedRng)
  })
})
