import { describe, expect, it } from 'vitest'
import { ECONOMY } from '../src/core/config/economy'
import { accruedInterest, deposit, settleDeposit, withdraw } from '../src/core/rules/bank'
import type { Player } from '../src/core/types'

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 0,
    characterId: 'juanmao',
    name: '测试猫',
    isAI: false,
    cash: 0,
    deposit: 0,
    depositDay: 1,
    tickets: 0,
    shares: {},
    pos: 0,
    cards: [],
    god: null,
    jailTurns: 0,
    laps: 0,
    out: false,
    skillCooldown: 0,
    extraMove: 0,
    extraRoll: false,
    tollHalfTurns: 0,
    skipTurns: 0,
    ...overrides,
  }
}

describe('银行利息', () => {
  it('利息 = 存款 × 日利率 × 存放天数', () => {
    const p = makePlayer({ deposit: 100_000, depositDay: 1 })
    expect(accruedInterest(p, 1)).toBe(0)
    expect(accruedInterest(p, 2)).toBe(Math.round(100_000 * ECONOMY.INTEREST_RATE * 1))
    expect(accruedInterest(p, 11)).toBe(Math.round(100_000 * ECONOMY.INTEREST_RATE * 10))
  })

  it('月息明显低于一份薪水（避免「躺银行」成为唯一解）', () => {
    const p = makePlayer({ deposit: ECONOMY.START_DEPOSIT, depositDay: 1 })
    const monthly = accruedInterest(p, 31)
    expect(monthly).toBeLessThan(ECONOMY.SALARY)
    expect(monthly).toBeGreaterThan(0)
  })

  it('结算后利息入本金，计息起点重置', () => {
    const p = makePlayer({ deposit: 100_000, depositDay: 1 })
    const interest = settleDeposit(p, 11)
    expect(interest).toBe(Math.round(100_000 * ECONOMY.INTEREST_RATE * 10))
    expect(p.deposit).toBe(100_000 + interest)
    expect(p.depositDay).toBe(11)
    // 立刻再结一次，天数为 0，不再计息
    expect(settleDeposit(p, 11)).toBe(0)
  })

  it('存款：先结息再入账，且不会超过手上现金', () => {
    const p = makePlayer({ cash: 5_000, deposit: 100_000, depositDay: 1 })
    const { interest, added } = deposit(p, 999_999, 11)
    expect(interest).toBe(Math.round(100_000 * ECONOMY.INTEREST_RATE * 10))
    expect(added).toBe(5_000)
    expect(p.cash).toBe(0)
    expect(p.deposit).toBe(100_000 + interest + 5_000)
  })

  it('取款：先结息再取出，且不会超过存款余额', () => {
    const p = makePlayer({ cash: 0, deposit: 100_000, depositDay: 1 })
    const { interest, taken } = withdraw(p, 999_999, 11)
    expect(interest).toBe(Math.round(100_000 * ECONOMY.INTEREST_RATE * 10))
    expect(taken).toBe(100_000 + interest)
    expect(p.deposit).toBe(0)
    expect(p.cash).toBe(100_000 + interest)
  })

  it('同一天存取不产生利息', () => {
    const p = makePlayer({ cash: 50_000, deposit: 0, depositDay: 5 })
    deposit(p, 50_000, 5)
    expect(settleDeposit(p, 5)).toBe(0)
  })
})
