import { describe, expect, it } from 'vitest'
import { advanceCalendar, assertCalendarDate } from '../../src/modern/features/game/calendar'
import { createGame } from '../../src/modern/features/game/setup'

describe('3D公历日历：B04原版遗漏已复现', () => {
  it('闰年二月28日进入29日，星期边界照常而不触发月界', () => {
    const game = createGame([1, 2, 3, 4], 1, 6, { year: 2028, month: 2, day: 28 })
    const next = advanceCalendar(game.world)
    expect(next).toMatchObject({ crossedMonth: false, crossedWeek: true })
    expect(next.world).toMatchObject({ year: 2028, month: 2, day: 29, weekday: 0, elapsedDays: 1 })
  })
  it.each([2000,2028])('公历%s年允许二月29日，之后跨月',year=>{
    expect(()=>assertCalendarDate({year,month:2,day:29})).not.toThrow()
    const game=createGame([1],1,0,{year,month:2,day:29})
    expect(advanceCalendar(game.world).world).toMatchObject({year,month:3,day:1,weekday:1})
  })
  it.each([1900,2026,2100])('公历%s年二月只有28日',year=>{
    expect(()=>assertCalendarDate({year,month:2,day:29})).toThrow()
    const game=createGame([1],1,1,{year,month:2,day:28})
    expect(advanceCalendar(game.world)).toMatchObject({crossedMonth:true,world:{month:3,day:1}})
  })

  it('十二月末跨年并只减少正数限制天数', () => {
    const game = createGame([1, 2, 3, 4], 1, 2, { year: 2026, month: 12, day: 31 })
    const statuses = { ...game.world.statuses, 1: { ...game.world.statuses[1]!, days: 2, godDays: 0 } }
    const next = advanceCalendar({ ...game.world, statuses })
    expect(next.world).toMatchObject({ year: 2027, month: 1, day: 1, weekday: 3, elapsedDays: 1 })
    expect(next.world.statuses[1]).toMatchObject({ days: 1, godDays: 0 })
  })
})
