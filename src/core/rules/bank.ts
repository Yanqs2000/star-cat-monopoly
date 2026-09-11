import { ECONOMY } from '../config/economy'
import type { Player } from '../types'

/**
 * 银行：存款按「存了多少天」计单利。
 *
 *   利息 = 存款余额 × 日利率 × 存放天数
 *
 * 利息是**惰性结算**的：只有当你再次存取款、或者被强制扣款时才会真正入账。
 * 这让「什么时候把钱放进银行」变成一个真实的决策。
 */

/** 尚未结算的利息 */
export function accruedInterest(player: Player, day: number): number {
  const days = Math.max(0, day - player.depositDay)
  if (days === 0 || player.deposit <= 0) return 0
  return Math.round(player.deposit * ECONOMY.INTEREST_RATE * days)
}

/** 把利息结清并入本金，重置计息起点；返回本次结算的利息 */
export function settleDeposit(player: Player, day: number): number {
  const interest = accruedInterest(player, day)
  if (interest !== 0) player.deposit += interest
  player.depositDay = day
  return interest
}

/** 存款。先结息，再存入 */
export function deposit(player: Player, amount: number, day: number): { interest: number; added: number } {
  const interest = settleDeposit(player, day)
  const added = Math.min(Math.max(0, Math.round(amount)), player.cash)
  player.cash -= added
  player.deposit += added
  return { interest, added }
}

/** 取款。先结息，再取出 */
export function withdraw(player: Player, amount: number, day: number): { interest: number; taken: number } {
  const interest = settleDeposit(player, day)
  const taken = Math.min(Math.max(0, Math.round(amount)), player.deposit)
  player.deposit -= taken
  player.cash += taken
  return { interest, taken }
}

/** 下一个自然日：把所有玩家的存款结息 */
export function accrueDailyInterest(players: Player[], day: number): { playerId: number; interest: number }[] {
  const credits: { playerId: number; interest: number }[] = []
  for (const p of players) {
    if (p.out) continue
    const interest = settleDeposit(p, day)
    if (interest > 0) credits.push({ playerId: p.id, interest })
  }
  return credits
}
