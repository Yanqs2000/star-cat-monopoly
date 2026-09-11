import type { GodDef, GodId } from '../types'

/**
 * 神明系统：附身后持续若干回合，期间改变玩家的费用与投资成功率。
 *
 * 原版四大神明：财神（减免过路费）、福神（便宜买地、投资加倍成功）、
 * 衰神（买地投资失败）、穷神（多付过路费）。
 */
export const GODS: Readonly<Record<GodId, GodDef>> = {
  caishen: {
    id: 'caishen',
    name: '财神',
    icon: '💰',
    good: true,
    desc: '过路费减半，且立即获得一笔进账',
    duration: 5,
    tollMultiplier: 0.5,
    purchaseSuccessRate: 1,
  },
  fushen: {
    id: 'fushen',
    name: '福神',
    icon: '🍀',
    good: true,
    desc: '买地与投资必定成功，且立刻获得 1 张卡片',
    duration: 5,
    tollMultiplier: 1,
    purchaseSuccessRate: 1,
  },
  shuaishen: {
    id: 'shuaishen',
    name: '衰神',
    icon: '💀',
    good: false,
    desc: '买地与投资会失败，并损失 1 张卡片',
    duration: 4,
    tollMultiplier: 1,
    purchaseSuccessRate: 0,
  },
  qiongshen: {
    id: 'qiongshen',
    name: '穷神',
    icon: '🕳️',
    good: false,
    desc: '过路费增加 50%，且立刻损失一笔钱',
    duration: 4,
    tollMultiplier: 1.5,
    purchaseSuccessRate: 1,
  },
}

export const GOOD_GODS: readonly GodId[] = ['caishen', 'fushen']
export const BAD_GODS: readonly GodId[] = ['shuaishen', 'qiongshen']
export const ALL_GODS: readonly GodId[] = [...GOOD_GODS, ...BAD_GODS]

export function getGod(id: GodId): GodDef {
  const god = GODS[id]
  if (!god) throw new Error(`未知神明: ${id}`)
  return god
}
