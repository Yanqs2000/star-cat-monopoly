import type { GroupId, TileDef } from '../types'

/**
 * 棋盘：11×11 网格的外围一圈 = 40 格（4 个角落 + 每边 9 格）。
 *
 * 索引 0 在右下角，逆时针推进：
 *   0..10   底边（右 → 左）
 *   11..20  左边（下 → 上）
 *   21..30  顶边（左 → 右）
 *   31..39  右边（上 → 下）
 *
 * 四角：0 起点 / 10 监狱 / 20 游乐场 / 30 星猫公园
 */

export const BOARD_SIZE = 11
export const TILE_COUNT = 40

export interface GroupDef {
  readonly id: GroupId
  readonly name: string
  /** 主色（地块色带 / 卡牌描边） */
  readonly color: string
  /** 浅色底 */
  readonly tint: string
}

export const GROUPS: Record<GroupId, GroupDef> = {
  berry: { id: 'berry', name: '草莓', color: '#ff6b6b', tint: '#ffe3e3' },
  mango: { id: 'mango', name: '蜜柑', color: '#ffa94d', tint: '#ffe8cc' },
  mint: { id: 'mint', name: '薄荷', color: '#51cf66', tint: '#d3f9d8' },
  ocean: { id: 'ocean', name: '海洋', color: '#4dabf7', tint: '#d0ebff' },
  galaxy: { id: 'galaxy', name: '星河', color: '#b197fc', tint: '#e5dbff' },
  gold: { id: 'gold', name: '黄金', color: '#ffd43b', tint: '#fff3bf' },
  legend: { id: 'legend', name: '传说', color: '#ff922b', tint: '#ffe8cc' },
  crystal: { id: 'crystal', name: '紫晶', color: '#e599f7', tint: '#f3d9fa' },
}

/** 索引 → 网格坐标 */
export function tilePosition(id: number): { row: number; col: number } {
  const i = ((id % TILE_COUNT) + TILE_COUNT) % TILE_COUNT
  if (i <= 10) return { row: 10, col: 10 - i } // 底边：右 → 左
  if (i <= 20) return { row: 10 - (i - 10), col: 0 } // 左边：下 → 上
  if (i <= 30) return { row: 0, col: i - 20 } // 顶边：左 → 右
  return { row: i - 30, col: 10 } // 右边：上 → 下
}

interface TileSeed {
  kind: TileDef['kind']
  name: string
  group?: GroupId
  price?: number
}

const SEEDS: TileSeed[] = [
  /* 0  */ { kind: 'start', name: '起点' },
  /* 1  */ { kind: 'property', name: '草莓街', group: 'berry', price: 2_000 },
  /* 2  */ { kind: 'property', name: '樱桃巷', group: 'berry', price: 2_400 },
  /* 3  */ { kind: 'property', name: '玫瑰道', group: 'berry', price: 2_800 },
  /* 4  */ { kind: 'news', name: '新闻' },
  /* 5  */ { kind: 'property', name: '蜜桃巷', group: 'mango', price: 3_200 },
  /* 6  */ { kind: 'property', name: '芒果街', group: 'mango', price: 3_600 },
  /* 7  */ { kind: 'property', name: '柠檬巷', group: 'mango', price: 4_000 },
  /* 8  */ { kind: 'bank', name: '星猫银行' },
  /* 9  */ { kind: 'shop', name: '卡片商店' },
  /* 10 */ { kind: 'jail', name: '监狱' },
  /* 11 */ { kind: 'property', name: '薄荷街', group: 'mint', price: 4_400 },
  /* 12 */ { kind: 'property', name: '竹林巷', group: 'mint', price: 4_800 },
  /* 13 */ { kind: 'property', name: '翡翠道', group: 'mint', price: 5_200 },
  /* 14 */ { kind: 'stock', name: '证券交易所' },
  /* 15 */ { kind: 'property', name: '海盐街', group: 'ocean', price: 5_600 },
  /* 16 */ { kind: 'property', name: '蓝莓巷', group: 'ocean', price: 6_000 },
  /* 17 */ { kind: 'property', name: '星河道', group: 'ocean', price: 6_400 },
  /* 18 */ { kind: 'magic', name: '魔法屋' },
  /* 19 */ { kind: 'lottery', name: '彩市' },
  /* 20 */ { kind: 'arcade', name: '游乐场' },
  /* 21 */ { kind: 'property', name: '葡萄街', group: 'galaxy', price: 6_800 },
  /* 22 */ { kind: 'property', name: '紫罗兰巷', group: 'galaxy', price: 7_200 },
  /* 23 */ { kind: 'property', name: '银河道', group: 'galaxy', price: 7_600 },
  /* 24 */ { kind: 'bank', name: '星猫银行' },
  /* 25 */ { kind: 'property', name: '黄金大道', group: 'gold', price: 8_000 },
  /* 26 */ { kind: 'property', name: '云顶道', group: 'gold', price: 8_500 },
  /* 27 */ { kind: 'property', name: '月亮湾', group: 'gold', price: 9_000 },
  /* 28 */ { kind: 'shop', name: '卡片商店' },
  /* 29 */ { kind: 'news', name: '新闻' },
  /* 30 */ { kind: 'park', name: '星猫公园' },
  /* 31 */ { kind: 'property', name: '星猫塔', group: 'legend', price: 10_000 },
  /* 32 */ { kind: 'property', name: '银河大桥', group: 'legend', price: 11_000 },
  /* 33 */ { kind: 'property', name: '宇宙港', group: 'legend', price: 12_000 },
  /* 34 */ { kind: 'property', name: '水晶宫', group: 'crystal', price: 13_000 },
  /* 35 */ { kind: 'property', name: '极光道', group: 'crystal', price: 14_000 },
  /* 36 */ { kind: 'property', name: '太阳宫', group: 'crystal', price: 15_000 },
  /* 37 */ { kind: 'tax', name: '税务局' },
  /* 38 */ { kind: 'card', name: '卡片格' },
  /* 39 */ { kind: 'gotojail', name: '进监狱' },
]

export const TILE_DEFS: readonly TileDef[] = SEEDS.map((seed, id) => {
  const { row, col } = tilePosition(id)
  return {
    id,
    kind: seed.kind,
    name: seed.name,
    group: seed.group ?? null,
    price: seed.price ?? 0,
    row,
    col,
  }
})

/** 每个色组包含的格子索引（按棋盘顺序） */
export const GROUP_TILES: Readonly<Record<GroupId, readonly number[]>> = (() => {
  const map: Record<string, number[]> = {}
  for (const t of TILE_DEFS) {
    if (t.kind === 'property' && t.group) (map[t.group] ??= []).push(t.id)
  }
  return map
})()

/** 角落格索引 */
export const CORNERS = [0, 10, 20, 30] as const
