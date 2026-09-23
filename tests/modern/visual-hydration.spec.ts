import { describe, expect, it, vi } from 'vitest'
import { replayBeforeHydration, restoreControllerAfterVisual } from '../../src/modern/features/game/visual-recovery'
import type { GameScheduler } from '../../src/modern/features/game/controller'
import { createGame } from '../../src/modern/features/game/setup'

class ManualScheduler implements GameScheduler {
  time = 0
  jobs: Array<{ at: number; callback: () => void }> = []
  now = () => this.time
  setTimeout = (callback: () => void, delayMs: number) => { this.jobs.push({ at: this.time + delayMs, callback }); return callback }
  clearTimeout = (handle: unknown) => { this.jobs = this.jobs.filter(job => job.callback !== handle) }
  advance(ms: number) {
    this.time += ms
    const ready = this.jobs.filter(job => job.at <= this.time)
    this.jobs = this.jobs.filter(job => job.at > this.time)
    for (const job of ready) job.callback()
  }
}

describe('恢复视觉与AI控制器顺序', () => {
  it('2倍速恢复AI通知时控制器定时器从载入前就是2倍速', async () => {
    const game = createGame([1], 153, 1)
    game.activePlayerIndex = 1
    game.phase = 'interaction'
    game.interaction = { kind: 'notice', playerId: 2, resume: 'await-roll', notice: { kind: 'restriction', message: 'restriction-released' } }
    const scheduler = new ManualScheduler()
    const controller = await restoreControllerAfterVisual(game, { scheduler, aiThinkDurationMs: 650 }, undefined, 2)
    expect(controller.speed).toBe(2)
    expect(scheduler.jobs).toHaveLength(1)
    expect(scheduler.jobs[0]!.at).toBe(325)
    scheduler.advance(324)
    expect(controller.state.interaction?.kind).toBe('notice')
    scheduler.advance(1)
    expect(controller.state.interaction).toBeNull()
    controller.dispose()
  })

  it('2倍速恢复移动中状态时首个步进定时器按2倍速排程', async () => {
    const game = createGame([1], 153, 1)
    game.activePlayerIndex = 1
    game.phase = 'moving'
    game.remainingSteps = 2
    game.continuation = 'start-step'
    const scheduler = new ManualScheduler()
    const controller = await restoreControllerAfterVisual(game, { scheduler, stepDurationMs: 100 }, undefined, 2)
    expect(controller.speed).toBe(2)
    expect(scheduler.jobs).toHaveLength(1)
    expect(scheduler.jobs[0]!.at).toBe(50)
    controller.dispose()
  })
  it('AI notice恢复必须等待失败视觉重放完成才创建会自动确认的控制器', async () => {
    let finishReplay!: () => void
    const replay = vi.fn(() => new Promise<void>(resolve => { finishReplay = resolve }))
    const hydrate = vi.fn(() => ({ controller: true }))
    const pending = replayBeforeHydration(replay, hydrate)
    expect(replay).toHaveBeenCalledOnce()
    expect(hydrate).not.toHaveBeenCalled()
    finishReplay()
    await expect(pending).resolves.toEqual({ controller: true })
    expect(hydrate).toHaveBeenCalledOnce()
  })

  it('ModernApp使用的恢复边界以真实AI notice控制器证明重放前不会自动ack', async () => {
    const game = createGame([1], 0, 1)
    game.activePlayerIndex = 1
    game.phase = 'interaction'
    game.interaction = {
      kind: 'notice', playerId: 2, resume: 'await-roll',
      notice: { kind: 'restriction', message: 'restriction-released', eventKind: 'restriction-released' },
    }
    let finishReplay!: () => void
    const scheduler = new ManualScheduler()
    const pending = restoreControllerAfterVisual(game, {
      scheduler, stepDurationMs: 10, landingDurationMs: 10, aiThinkDurationMs: 10,
    }, () => new Promise<void>(resolve => { finishReplay = resolve }))

    scheduler.advance(100)
    expect(scheduler.jobs).toHaveLength(0)
    finishReplay()
    const controller = await pending
    expect(controller.state.interaction?.kind).toBe('notice')
    expect(scheduler.jobs).toHaveLength(1)
    scheduler.advance(10)
    expect(controller.state.interaction).toBeNull()
    expect(controller.state.phase).toBe('awaiting-roll')
    controller.dispose()
  })
})
