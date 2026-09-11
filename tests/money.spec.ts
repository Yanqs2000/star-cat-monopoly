import { describe, expect, it } from 'vitest'
import { ECONOMY } from '../src/core/config/economy'
import { accruedInterest } from '../src/core/rules/bank'
import { spend, transfer } from '../src/core/rules/money'
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

describe('扣款规则', () => {
  it('优先扣现金，不动存款', () => {
    const p = makePlayer({ cash: 10_000, deposit: 50_000, depositDay: 1 })
    const r = spend(p, 6_000, 1)
    expect(r.cashUsed).toBe(6_000)
    expect(r.depositUsed).toBe(0)
    expect(r.forfeitedInterest).toBe(0)
    expect(p.cash).toBe(4_000)
    expect(p.deposit).toBe(50_000)
  })

  it('现金不足时强制支取存款，并损失未结算利息', () => {
    const p = makePlayer({ cash: 2_000, deposit: 50_000, depositDay: 1 })
    const pendingInterest = accruedInterest(p, 11)
    expect(pendingInterest).toBeGreaterThan(0)

    const r = spend(p, 12_000, 11)
    expect(r.cashUsed).toBe(2_000)
    expect(r.depositUsed).toBe(10_000)
    expect(r.forfeitedInterest).toBe(pendingInterest)
    expect(r.shortfall).toBe(0)
    expect(p.cash).toBe(0)
    expect(p.deposit).toBe(40_000)
  })

  it('存款也不够时返回 shortfall，且不会扣成负数', () => {
    const p = makePlayer({ cash: 1_000, deposit: 2_000, depositDay: 1 })
    const r = spend(p, 10_000, 1)
    expect(r.shortfall).toBe(7_000)
    expect(p.cash).toBe(0)
    expect(p.deposit).toBe(0)
  })

  it('金额为负或非数字时不会造成异常', () => {
    const p = makePlayer({ cash: 1_000 })
    expect(spend(p, -500, 1).shortfall).toBe(0)
    expect(p.cash).toBe(1_000)
    expect(spend(p, Number.NaN, 1).shortfall).toBe(0)
    expect(p.cash).toBe(1_000)
  })

  it('转账：付出方实际支付的部分才进收款方口袋', () => {
    const a = makePlayer({ id: 0, cash: 3_000, deposit: 0 })
    const b = makePlayer({ id: 1, cash: 0, deposit: 0 })
    const { paid, spend: r } = transfer(a, b, 10_000, 1)
    expect(paid).toBe(3_000)
    expect(r.shortfall).toBe(7_000)
    expect(b.cash).toBe(3_000)
  })

  it('开局资金能覆盖一份中等地产', () => {
    const p = makePlayer({ cash: ECONOMY.START_CASH, deposit: ECONOMY.START_DEPOSIT })
    expect(p.cash + p.deposit).toBeGreaterThan(2_000)
  })
})
