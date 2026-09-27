import type { CalendarDate } from './finance-types'
import type { WorldState } from './world-cards'

const monthLengths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const

export function assertCalendarDate(date: CalendarDate): void {
  if (!Number.isInteger(date.year) || date.year < 1 || !Number.isInteger(date.month) ||
      date.month < 1 || date.month > 12 || !Number.isInteger(date.day) ||
      date.day < 1 || date.day > monthLengths[date.month - 1]!) {
    throw new Error('日期不符合原版固定月份长度')
  }
}

export function advanceCalendar(source: WorldState): {
  world: WorldState
  crossedWeek: boolean
  crossedMonth: boolean
} {
  let { year, month, day } = source
  day += 1
  const crossedMonth = day > monthLengths[month - 1]!
  if (crossedMonth) {
    day = 1
    month += 1
    if (month > 12) { month = 1; year += 1 }
  }
  const weekday = (source.weekday + 1) % 7
  return {
    world: {
      ...source,
      year,
      month,
      day,
      weekday,
      elapsedDays: source.elapsedDays + 1,
      markers: { ...source.markers },
      statuses: Object.fromEntries(Object.entries(source.statuses).map(([id, status]) => [id, {
        ...status,
        days: status.days > 0 ? status.days - 1 : 0,
        godDays: status.godDays > 0 ? status.godDays - 1 : 0,
      }])),
    },
    crossedWeek: weekday === 0,
    crossedMonth,
  }
}
