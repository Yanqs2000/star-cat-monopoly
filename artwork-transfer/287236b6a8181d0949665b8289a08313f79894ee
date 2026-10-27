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

class ZeroHandleScheduler implements GameScheduler {
  private time = 0
  private job: { at: number; callback: () => void } | undefined
  clearCount = 0

  now = () => this.time
  setTimeout = (callback: () => void, delayMs: number) => {
    this.job = { at: this.time + delayMs, callback }
    return 0
  }
  clearTimeout = (id: unknown) => {
    expect(id).toBe(0)
    this.clearCount += 1
    this.job = undefined
  }
  advance(ms: number): void {
    this.time += ms
    if (this.job && this.job.at <= this.time) {
      const callback = this.job.callback
      this.job = undefined
      callback()
    }
  }
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
    expect(game.rngState).toBe(1719328701)

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

  it('调度器返回句柄0时切速和暂停仍取消已安排的步骤', () => {
    const scheduler = new ZeroHandleScheduler()
    const controller = createGameController(createGame([1, 2, 3, 4], 7), {
      scheduler,
      stepDurationMs: 100,
    })
    controller.roll(1)
    controller.setSpeed(2)
    expect(scheduler.clearCount).toBe(1)
    controller.setPaused(true)
    expect(scheduler.clearCount).toBe(2)
    scheduler.advance(1_000)
    expect(controller.state).toMatchObject({ phase: 'moving', remainingSteps: 1 })
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

function arrivingAt(parcelId: 1 | 47 | 83, humans: number[] = [1, 2, 3, 4]): GameState {
  const game = createGame(humans, 1)
  const before = {
    1: { position: { column: 7, row: 31 }, direction: 2 as const },
    47: { position: { column: 26, row: 32 }, direction: 3 as const },
    83: { position: { column: 31, row: 27 }, direction: 3 as const },
  }[parcelId]
  return { ...game, players: game.players.map((player, index) => index === 0 ? { ...player, ...before } : player) }
}

function land(controller: ReturnType<typeof createGameController>, scheduler: FakeScheduler): void {
  expect(controller.roll(1)).toBe(true)
  scheduler.advance(10)
}

describe('2C 地产控制器', () => {
  const options = (scheduler: FakeScheduler) => ({ scheduler, stepDurationMs: 10, landingDurationMs: 10, aiThinkDurationMs: 10 })

  it('住宅落地先等待人类购买决定和结果确认，只结算一次', () => {
    const scheduler = new FakeScheduler()
    const controller = createGameController(arrivingAt(83), options(scheduler))
    land(controller, scheduler)
    scheduler.advance(100)
    expect(controller.state).toMatchObject({ phase: 'property-decision', activePlayerIndex: 0, propertyOffer: { kind: 'purchase', parcelId: 83, amount: 1800 } })
    expect(controller.decideProperty('accept')).toBe(true)
    expect(controller.decideProperty('accept')).toBe(false)
    expect(controller.state).toMatchObject({ phase: 'property-result', lastPropertyEvent: { kind: 'purchased', parcelId: 83, amount: 1800 } })
    expect(controller.state.players[0]).toMatchObject({ cash: 98200, deposit: 100000 })
    expect(controller.state.properties[83]).toEqual({ ownerId: 1, level: 0 })
    scheduler.advance(100)
    expect(controller.state.activePlayerIndex).toBe(0)
    expect(controller.acknowledgeProperty()).toBe(true)
    expect(controller.acknowledgeProperty()).toBe(false)
    scheduler.advance(10)
    expect(controller.state.activePlayerIndex).toBe(1)
  })

  it('放弃购买和现金不足均不动存款或产权', () => {
    for (const [cash, choice, kind] of [[100000, 'decline', 'declined'], [1799, 'accept', 'insufficient-cash']] as const) {
      const scheduler = new FakeScheduler()
      const game = arrivingAt(83)
      game.players[0]!.cash = cash
      const controller = createGameController(game, options(scheduler))
      land(controller, scheduler)
      expect(controller.decideProperty(choice)).toBe(true)
      expect(controller.state.lastPropertyEvent?.kind).toBe(kind)
      expect(controller.state.players[0]).toMatchObject({ cash, deposit: 100000 })
      expect(controller.state.properties[83]).toEqual({ ownerId: null, level: 0 })
    }
  })

  it('自有地产升级扣现金，满级仅通知且不扣费', () => {
    for (const [level, expectedKind, expectedCash, expectedLevel] of [[0, 'upgraded', 99900, 1], [5, 'max-level', 100000, 5]] as const) {
      const scheduler = new FakeScheduler()
      const game = arrivingAt(83)
      game.properties[83] = { ownerId: 1, level }
      const controller = createGameController(game, options(scheduler))
      land(controller, scheduler)
      if (level === 0) expect(controller.decideProperty('accept')).toBe(true)
      expect(controller.state).toMatchObject({ phase: 'property-result', lastPropertyEvent: { kind: expectedKind } })
      expect(controller.state.players[0]!.cash).toBe(expectedCash)
      expect(controller.state.properties[83]!.level).toBe(expectedLevel)
    }
  })

  it('租金先扣现金后扣存款，地主收到完整存款；耗尽时确认后停局', () => {
    for (const [cash, deposit, remainingDeposit, insolvent] of [[100, 2000, 1300, false], [100, 400, -300, true]] as const) {
      const scheduler = new FakeScheduler()
      const game = arrivingAt(47)
      game.properties[47] = { ownerId: 2, level: 0 }
      game.players[0]!.cash = cash
      game.players[0]!.deposit = deposit
      const controller = createGameController(game, options(scheduler))
      land(controller, scheduler)
      expect(controller.state).toMatchObject({ phase: 'property-decision', propertyOffer: { kind: 'rent', amount: 800 } })
      expect(controller.decideProperty('decline')).toBe(false)
      expect(controller.decideProperty('accept')).toBe(true)
      expect(controller.state.players[0]).toMatchObject({ cash: 0, deposit: remainingDeposit })
      expect(controller.state.players[1]!.deposit).toBe(100800)
      expect(controller.state.lastPropertyEvent).toMatchObject({ kind: 'rent-paid', amount: 800, recipientId: 2 })
      expect(controller.acknowledgeProperty()).toBe(true)
      if (insolvent) {
        expect(controller.state.phase).toBe('insolvent')
        scheduler.advance(10_000)
        expect(controller.state.activePlayerIndex).toBe(0)
      } else {
        scheduler.advance(10)
        expect(controller.state.activePlayerIndex).toBe(1)
      }
    }
  })

  it('暂停挡住决定，恢复后可确认；重开使旧交易及计时失效', () => {
    const scheduler = new FakeScheduler()
    const controller = createGameController(arrivingAt(83), options(scheduler))
    land(controller, scheduler)
    controller.setPaused(true)
    expect(controller.decideProperty('accept')).toBe(false)
    const fresh = createGame([2], 99)
    controller.restart(fresh)
    scheduler.advance(10_000)
    expect(controller.state).toEqual(fresh)
    expect(controller.decideProperty('accept')).toBe(false)
    expect(controller.acknowledgeProperty()).toBe(false)
  })

  it('AI 到住宅默认买入或升级并自动确认结果', () => {
    for (const [level, expectedCash, expectedLevel] of [[null, 98200, 0], [0, 99900, 1]] as const) {
      const scheduler = new FakeScheduler()
      const game = createGame([1], 1)
      game.activePlayerIndex = 1
      game.rngState = 1972 // 下次骰子为 1
      game.players[1] = { ...game.players[1]!, position: { column: 31, row: 27 }, direction: 3 }
      if (level !== null) game.properties[83] = { ownerId: 2, level }
      const controller = createGameController(game, options(scheduler))
      scheduler.advance(20)
      expect(controller.state).toMatchObject({ phase: 'property-decision', propertyOffer: { parcelId: 83 } })
      scheduler.advance(10)
      expect(controller.state.phase).toBe('property-result')
      expect(controller.state.players[1]!.cash).toBe(expectedCash)
      expect(controller.state.properties[83]).toEqual({ ownerId: 2, level: expectedLevel })
      scheduler.advance(20)
      expect(controller.state.activePlayerIndex).toBe(2)
    }
  })
})
