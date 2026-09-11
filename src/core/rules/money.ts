import { ECONOMY } from '../config/economy'
import type { Player } from '../types'
import { accruedInterest, settleDeposit } from './bank'

/**
 * 金钱流转。
 *
 * 扣款规则对齐原版：**优先扣现金，现金不足时强制动用存款**。
 * 但强制动用存款会损失尚未结算的利息（相当于定期存款提前支取按活期计息），
 * 这样「钱放银行吃利息」和「留现金保流动性」之间才有真正的取舍。
 */

export interface SpendResult {
  /** 实际扣掉的现金 */
  cashUsed: number
  /** 实际动用的存款 */
  depositUsed: number
  /** 因为强制动用存款而损失的未结算利息 */
  forfeitedInterest: number
  /** 仍然付不起的部分（> 0 表示需要变卖资产或破产） */
  shortfall: number
}

/** 玩家当前可用于支付的总资产（现金 + 存款） */
export function liquidAssets(player: Player, day: number): number {
  return player.cash + player.deposit + accruedInterest(player, day)
}

/**
 * 扣款。会就地修改 player（调用方需先克隆状态）。
 */
export function spend(player: Player, amount: number, day: number): SpendResult {
  // 非有限数一律视为 0，避免 NaN 污染玩家余额
  const need = Number.isFinite(amount) ? Math.max(0, Math.round(amount)) : 0
  let left = need

  const cashUsed = Math.min(player.cash, left)
  player.cash -= cashUsed
  left -= cashUsed

  let depositUsed = 0
  let forfeitedInterest = 0
  if (left > 0) {
    // 强制支取：损失未结算利息
    forfeitedInterest = accruedInterest(player, day)
    player.depositDay = day
    depositUsed = Math.min(player.deposit, left)
    player.deposit -= depositUsed
    left -= depositUsed
  }

  return { cashUsed, depositUsed, forfeitedInterest, shortfall: left }
}

/** 收款（存款不会自动增值，直接进现金） */
export function receive(player: Player, amount: number): number {
  const gain = Math.max(0, Math.round(amount))
  player.cash += gain
  return gain
}

/** 转账：from 付给 to */
export function transfer(
  from: Player,
  to: Player,
  amount: number,
  day: number,
): { paid: number; spend: SpendResult } {
  const want = Math.max(0, Math.round(amount))
  const result = spend(from, want, day)
  const paid = want - result.shortfall
  receive(to, paid)
  return { paid, spend: result }
}

/**
 * 玩家是否已经无力偿付：现金 + 存款 + 可变卖的地产都不够。
 * 破产判定用。
 */
export function totalAssets(player: Player, day: number, propertyValue: number): number {
  return liquidAssets(player, day) + propertyValue
}

/** 把存款连本带息取出 */
export function withdrawAll(player: Player, day: number): number {
  const interest = settleDeposit(player, day)
  const amount = player.deposit
  player.cash += amount
  player.deposit = 0
  return amount + interest
}

/** 存取款的最小额度校验 */
export function isValidBankAmount(amount: number): boolean {
  return Number.isFinite(amount) && Math.round(amount) >= ECONOMY.MIN_BANK_AMOUNT
}
