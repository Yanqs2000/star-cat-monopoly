import { describe, expect, it } from 'vitest'
import { advanceCalendar } from '../../src/modern/features/game/calendar'
import { createGame } from '../../src/modern/features/game/setup'

describe('原版固定月份日历', () => {
  it('二月 28 日换到三月并先触发月界和周界', () => {
    const game = createGame([1, 2, 3, 4], 1, 6, { year: 2028, month: 2, day: 28 })
    const next = advanceCalendar(game.world)
    expect(next).toMatchObject({ crossedMonth: true, crossedWeek: true })
    expect(next.world).toMatchObject({ year: 2028, month: 3, day: 1, weekday: 0, elapsedDays: 1 })
  })

  it('十二月末跨年并只减少正数限制天数', () => {
    const game = createGame([1, 2, 3, 4], 1, 2, { year: 2026, month: 12, day: 31 })
    const statuses = { ...game.world.statuses, 1: { ...game.world.statuses[1]!, days: 2, godDays: 0 } }
    const next = advanceCalendar({ ...game.world, statuses })
    expect(next.world).toMatchObject({ year: 2027, month: 1, day: 1, weekday: 3, elapsedDays: 1 })
    expect(next.world.statuses[1]).toMatchObject({ days: 1, godDays: 0 })
  })
})
