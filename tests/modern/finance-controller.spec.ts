import { describe, expect, it } from 'vitest'
import { createGameController, type GameScheduler } from '../../src/modern/features/game/controller'
import { createGame } from '../../src/modern/features/game/setup'

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

  it('人类最终落在公共事业公司格，认购后再确认离开只扣款一次', () => {
    const game = createGame([1, 2, 3, 4], 1, 1)
    game.world.markers = {}
    game.players[0] = { ...game.players[0]!, position: { column: 25, row: 31 }, direction: 1 }
    const clock = new Clock()
    const controller = createGameController(game, options(clock))
    controller.roll(1)
    clock.advance(10)
    expect(controller.state.interaction).toMatchObject({ kind: 'company', companyId: 13 })
    expect(controller.subscribeCompany(10)).toBe(true)
    expect(controller.state.players[0]?.cash).toBe(99950)
    expect(controller.state.finance.stocks[13]?.holdings[1]?.shares).toBe(10)
    expect(controller.subscribeCompany(10)).toBe(false)
    expect(controller.acknowledgeInteraction()).toBe(true)
    expect(controller.state.interaction?.kind).toBe('company')
    expect(controller.leaveCompany()).toBe(true)
    clock.advance(10)
    expect(controller.state.activePlayerIndex).toBe(1)
    expect(controller.state.finance.stocks[13]?.holdings[1]?.shares).toBe(10)
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
})
