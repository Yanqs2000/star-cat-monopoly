import { describe, expect, it } from 'vitest'
import { createGame } from '../../src/modern/features/game/setup'
import { applyAiBankVisit, applyBankOperation } from '../../src/modern/features/game/bank-operations'

describe('原版银行业务', () => {
  it('取款和存款仅在现金/存款间转移，0 是有效无变化提交', () => {
    const game = createGame([1, 2, 3, 4], 1)
    game.players[0]!.cash = 300
    game.players[0]!.deposit = 700
    const withdrawn = applyBankOperation(game, 1, 'withdraw', 250)
    expect(withdrawn.state.players[0]).toMatchObject({ cash: 550, deposit: 450 })
    expect(withdrawn.entry).toMatchObject({ kind: 'bank-withdraw', sourceAmount: 250,
      cashDelta: 250, depositDelta: -250 })
    const deposited = applyBankOperation(game, 1, 'deposit', 300)
    expect(deposited.state.players[0]).toMatchObject({ cash: 0, deposit: 1000 })
    const zero = applyBankOperation(game, 1, 'deposit', 0)
    expect(zero.error).toBeNull()
    expect(zero.state).toEqual(game)
    expect(applyBankOperation(game, 1, 'withdraw', 701).error).not.toBeNull()
    expect(applyBankOperation(game, 1, 'deposit', -1).error).not.toBeNull()
  })

  it('贷款以信用分乘1000为上限且必须先还清旧贷，现金还款不动存款', () => {
    const game = createGame([1, 2, 3, 4], 1)
    game.players[0]!.cash = 100
    game.credit[1]!.score = 37
    const borrowed = applyBankOperation(game, 1, 'borrow', 12000)
    expect(borrowed.state.players[0]?.cash).toBe(12100)
    expect(borrowed.state.finance.loans[1]).toBe(12000)
    expect(applyBankOperation(borrowed.state, 1, 'borrow', 1).error).not.toBeNull()
    const repaid = applyBankOperation(borrowed.state, 1, 'repay-loan', 4000)
    expect(repaid.state.players[0]).toMatchObject({ cash: 8100, deposit: 100000 })
    expect(repaid.state.finance.loans[1]).toBe(8000)
    expect(repaid.entry).toMatchObject({ cashDelta: -4000, loanDelta: -4000 })
  })

  it('信用卡申请和主动还款按原版资格、手牌容量与现金上限结算', () => {
    const game = createGame([1, 2, 3, 4], 1)
    game.credit[1]!.score = 49
    expect(applyBankOperation(game, 1, 'apply-credit', 0).error).not.toBeNull()
    game.credit[1]!.score = 50
    game.inventories[1] = Array(23).fill(5)
    const granted = applyBankOperation(game, 1, 'apply-credit', 0)
    expect(granted.state.inventories[1]).toHaveLength(24)
    expect(granted.state.inventories[1]?.[0]).toBe(1)
    expect(granted.state.credit[1]?.available).toBe(100000)
    expect(applyBankOperation(granted.state, 1, 'apply-credit', 0).error).not.toBeNull()
    const debt = createGame([1, 2, 3, 4], 1)
    debt.players[0]!.cash = 3000
    debt.credit[1] = { score: 100, used: 5000, available: 95000 }
    const paid = applyBankOperation(debt, 1, 'repay-credit', 3000)
    expect(paid.state.players[0]?.cash).toBe(0)
    expect(paid.state.credit[1]).toMatchObject({ used: 2000, available: 98000 })
  })

  it('人类周日关闭，AI 仍按等级先借款、领卡、再资金重分配且只抽一次', () => {
    const game = createGame([1, 2, 3, 4], 1, 0)
    expect(applyBankOperation(game, 1, 'deposit', 100).error).not.toBeNull()
    game.players[0] = { ...game.players[0]!, controller: 'ai', cash: 200001, deposit: 100000 }
    const bounds: number[] = []
    const result = applyAiBankVisit(game, 1, 3, 1, (state, bound) => {
      bounds.push(bound)
      return { value: 29999, nextState: state + 1 }
    })
    expect(result.state.finance.loans[1]).toBe(100000)
    expect(result.state.inventories[1]?.[0]).toBe(1)
    expect(result.state.players[0]).toMatchObject({ cash: 129999, deposit: 270002 })
    expect(bounds).toEqual([30000])
    expect(result.state.rngState).toBe(game.rngState + 1)
    expect(result.entries.map(entry => entry.kind)).toEqual(['bank-borrow', 'credit-granted', 'ai-bank-transfer'])
  })
})
