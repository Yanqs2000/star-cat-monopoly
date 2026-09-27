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
