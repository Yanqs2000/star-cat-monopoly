import { describe, expect, it } from 'vitest'
import { createGameController, type GameScheduler } from '../../src/modern/features/game/controller'
import { createGame } from '../../src/modern/features/game/setup'
import type { GameState } from '../../src/modern/features/game/types'

class FakeScheduler implements GameScheduler {
  private time = 0
  private nextId = 1
  private jobs = new Map<number, { at: number; callback: () => void }>()

  now = () => this.time
  setTimeout = (callback: () => void, delayMs: number) => {
    const id = this.nextId++
    this.jobs.set(id, { at: this.time + delayMs, callback })
    return id
  }
  clearTimeout = (id: unknown) => { this.jobs.delete(id as number) }
  advance(ms: number): void {
    const target = this.time + ms
    while (true) {
      const next = [...this.jobs.entries()]
        .filter(([, job]) => job.at <= target)
        .sort((a, b) => a[1].at - b[1].at || a[0] - b[0])[0]
      if (!next) break
      this.time = next[1].at
      this.jobs.delete(next[0])
      next[1].callback()
    }
    this.time = target
  }
  pendingCount(): number { return this.jobs.size }
}

function driveToHumanTurn(controller: ReturnType<typeof createGameController>, scheduler: FakeScheduler): void {
  for (let guard = 0; guard < 100 && controller.state.activePlayerIndex !== 0; guard += 1) scheduler.advance(1_000)
}

describe('现代对局控制器', () => {
  it('默认逐格时长对应原逻辑16次30fps更新', () => {
    const scheduler = new FakeScheduler()
    const controller = createGameController(createGame([1, 2, 3, 4], 1), { scheduler })
    controller.roll(1)
    scheduler.advance(533)
    expect(controller.state.remainingSteps).toBe(1)
    scheduler.advance(1)
    expect(controller.state).toMatchObject({ phase: 'landed', remainingSteps: 0 })
  })

  it('以字面fixture初始化且连续两次掷骰只消耗一次规则状态', () => {
    const scheduler = new FakeScheduler()
    const game = createGame([1], 0)
    expect(game.players.map(player => [player.characterId, player.hometown, player.direction, player.position.column, player.position.row])).toEqual([
      [1, 3, 3, 6, 34],
      [4, 2, 4, 30, 32],
      [5, 4, 4, 11, 9],
      [11, 1, 3, 33, 7],
    ])
    expect(game.rngState).toBe(3421909937)

    const controller = createGameController(game, { scheduler, stepDurationMs: 100 })
    expect(controller.roll(2)).toBe(true)
    const once = structuredClone(controller.state)
    expect(controller.roll(6)).toBe(false)
    expect(controller.state).toEqual(once)
    expect(controller.state).toMatchObject({ phase: 'moving', remainingSteps: 2, lastRoll: 2 })
    expect(scheduler.pendingCount()).toBe(1)
  })

  it('抵达路口前保持来向，提交到达后才采用路口出向', () => {
    const scheduler = new FakeScheduler()
    const source = createGame([1, 2, 3, 4], 1)
    const game: GameState = {
      ...source,
      rngState: 1000,
      players: source.players.map((player, index) => index === 0
        ? { ...player, position: { column: 34, row: 8 }, direction: 1 }
        : player),
    }
    const transitionDirections: number[] = []
    const controller = createGameController(game, {
      scheduler,
      stepDurationMs: 10,
      onTransition: transition => { if (transition) transitionDirections.push(transition.direction) },
    })
    controller.roll(1)
    expect(transitionDirections).toEqual([1])
    scheduler.advance(10)
    expect(controller.state.players[0]).toMatchObject({
      position: { column: 35, row: 9 },
      direction: 2,
    })
  })

  it('完整执行人类回合、三个AI回合，再停在下一轮人类掷骰前', () => {
    const scheduler = new FakeScheduler()
    const controller = createGameController(createGame([1], 0), { scheduler, stepDurationMs: 10, landingDurationMs: 10, aiThinkDurationMs: 10 })

    expect(controller.roll(1)).toBe(true)
    scheduler.advance(20)
    expect(controller.state).toMatchObject({ activePlayerIndex: 1, phase: 'awaiting-roll' })
    driveToHumanTurn(controller, scheduler)
    expect(controller.state).toMatchObject({ activePlayerIndex: 0, round: 2, phase: 'awaiting-roll' })
    expect(controller.state.players.map(player => player.controller)).toEqual(['human', 'ai', 'ai', 'ai'])
    expect(scheduler.pendingCount()).toBe(0)
  })

  it('移动中切换速度只改变呈现时长，不改变最终对局和随机状态', () => {
    const finish = (switchSpeed: boolean): GameState => {
      const scheduler = new FakeScheduler()
      const controller = createGameController(createGame([1, 2, 3, 4], 42), { scheduler, stepDurationMs: 100, landingDurationMs: 20 })
      controller.roll(4)
      scheduler.advance(50)
      if (switchSpeed) controller.setSpeed(4)
      scheduler.advance(2_000)
      return structuredClone(controller.state)
    }
    expect(finish(true)).toEqual(finish(false))
  })

  it('暂停冻结待执行步骤，恢复后从剩余时长继续', () => {
    const scheduler = new FakeScheduler()
    const controller = createGameController(createGame([1, 2, 3, 4], 7), { scheduler, stepDurationMs: 100 })
    controller.roll(1)
    scheduler.advance(40)
    controller.setPaused(true)
    scheduler.advance(1_000)
    expect(controller.state).toMatchObject({ phase: 'moving', remainingSteps: 1 })
    controller.setPaused(false)
    scheduler.advance(59)
    expect(controller.state.remainingSteps).toBe(1)
    scheduler.advance(1)
    expect(controller.state).toMatchObject({ phase: 'landed', remainingSteps: 0 })
  })

  it('重开和销毁使旧回调无法修改新对局', () => {
    const scheduler = new FakeScheduler()
    const oldGame = createGame([1], 0)
    const newGame = createGame([2, 3], 99)
    const controller = createGameController(oldGame, { scheduler, stepDurationMs: 100 })
    controller.roll(6)
    controller.restart(newGame)
    scheduler.advance(10_000)
    expect(controller.state).toEqual(newGame)
    expect(scheduler.pendingCount()).toBe(0)

    controller.roll(1)
    controller.dispose()
    const disposed = structuredClone(controller.state)
    scheduler.advance(10_000)
    expect(controller.state).toEqual(disposed)
  })
})
