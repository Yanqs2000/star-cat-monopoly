import type { CardDef, CardId } from '../types'

/**
 * 卡片道具。原版有路障卡、机器娃娃、抢夺卡、盖屋卡、拆屋卡、暂停卡、迎神送神卡，
 * 这里一一对应。价格是「卡片商店」的售价（按攻略重建）。
 */
export const CARDS: readonly CardDef[] = [
  {
    id: 'barrier',
    name: '路障卡',
    icon: '🚧',
    price: 3_000,
    desc: '在任意道路上放置路障，经过的玩家会被拦停',
    target: { kind: 'tile', filter: 'empty-road' },
  },
  {
    id: 'robot',
    name: '机器娃娃',
    icon: '🤖',
    price: 2_500,
    desc: '清除自己前方 10 步内的所有路障',
    target: { kind: 'none' },
  },
  {
    id: 'rob',
    name: '抢夺卡',
    icon: '🫳',
    price: 4_000,
    desc: '从指定对手手中抢走一张卡片',
    target: { kind: 'player' },
  },
  {
    id: 'build',
    name: '盖屋卡',
    icon: '🏗️',
    price: 5_000,
    desc: '免费为自己的一块地产加盖一层',
    target: { kind: 'tile', filter: 'own-property' },
  },
  {
    id: 'demolish',
    name: '拆屋卡',
    icon: '💣',
    price: 5_000,
    desc: '拆掉对手一块地产的一层建筑',
    target: { kind: 'tile', filter: 'opponent-property' },
  },
  {
    id: 'freeze',
    name: '暂停卡',
    icon: '⏸️',
    price: 6_000,
    desc: '指定一位对手跳过下一回合',
    target: { kind: 'player' },
  },
  {
    id: 'god',
    name: '迎神送神卡',
    icon: '🧧',
    price: 4_500,
    desc: '驱散身上的坏神明；若没有坏神明，则随机迎来一位好神明',
    target: { kind: 'none' },
  },
]

export const CARD_BY_ID: Readonly<Record<CardId, CardDef>> = Object.fromEntries(
  CARDS.map((c) => [c.id, c]),
)

export function getCard(id: CardId): CardDef {
  const c = CARD_BY_ID[id]
  if (!c) throw new Error(`未知卡片: ${id}`)
  return c
}
