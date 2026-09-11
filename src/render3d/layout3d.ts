import { BOARD_SIZE, TILE_COUNT, tilePosition } from '@/core/config/board'

/**
 * 3D 世界的坐标换算。纯函数，不依赖 three —— 可以单测。
 *
 * 约定：棋盘中心在原点，单格边长 1；+x 是「向东」（列增大），+z 是「向南」（行增大）。
 * 于是 11×11 网格的范围是 −5..5，第 0 格（起点，右下角）在 (5, 0, 5)。
 */

export const TILE_SIZE = 1
export const BOARD_HALF = (BOARD_SIZE - 1) / 2 // 5
export const BOARD_EXTENT = BOARD_HALF + 0.5 // 5.5，棋盘外沿
/** 地块厚板的厚度 */
export const SLAB_HEIGHT = 0.16
/** 地块顶面高度 */
export const TILE_TOP = SLAB_HEIGHT
/** 浮岛半径（要罩得住棋盘对角 5.5×√2 ≈ 7.78） */
export const ISLAND_RADIUS = 8.4
/** 马路宽度 */
export const ROAD_WIDTH = 0.62

export interface XZ {
  x: number
  z: number
}

/** 格子索引 → 世界平面坐标 */
export function tileXZ(id: number): XZ {
  const { row, col } = tilePosition(id)
  return {
    x: (col - BOARD_HALF) * TILE_SIZE,
    z: (row - BOARD_HALF) * TILE_SIZE,
  }
}

/** 格子索引 → 该格在棋盘的哪条边 */
export function tileEdge(id: number): 'bottom' | 'right' | 'top' | 'left' {
  const { row, col } = tilePosition(id)
  if (row === BOARD_SIZE - 1) return 'bottom'
  if (col === BOARD_SIZE - 1) return 'right'
  if (row === 0) return 'top'
  return 'left'
}

/**
 * 地块贴图要绕 Y 轴旋转多少弧度，才能让默认视角（相机在 +x/+z 方向）正着读。
 *
 * 推导：贴图经过 rotateX(−90°) 铺平后，其「上」方向指向 −z。
 * 再绕 Y 轴转 θ 后，「上」方向变成 (−sinθ, 0, −cosθ)。
 * 要让文字朝向远离相机的方向，四条边分别需要：
 *   底边（相机在 +z）→ 上指向 −z → θ = 0
 *   右边（相机在 +x）→ 上指向 −x → θ = +90°
 *   顶边（相机在 −z）→ 上指向 +z → θ = 180°
 *   左边（相机在 −x）→ 上指向 +x → θ = −90°
 */
export function tileTextRotation(id: number): number {
  switch (tileEdge(id)) {
    case 'bottom':
      return 0
    case 'right':
      return Math.PI / 2
    case 'top':
      return Math.PI
    default:
      return -Math.PI / 2
  }
}

/** 棋盘上相邻两格（索引差 1，含 39→0 的环绕） */
export function isAdjacent(from: number, to: number): boolean {
  return ((to - from + TILE_COUNT) % TILE_COUNT) === 1
}

/** 棋盘 8 个角的世界坐标，用于相机自动取景 */
export function boardCorners(): XZ[] {
  const e = BOARD_EXTENT
  return [
    { x: -e, z: -e },
    { x: e, z: -e },
    { x: e, z: e },
    { x: -e, z: e },
  ]
}

/** 同格上多名玩家时的错位摆放（沿用 2D 版的四象限布局） */
export function slotOffset(slot: number, distance = 0.17): XZ {
  const table: XZ[] = [
    { x: -distance, z: -distance },
    { x: distance, z: -distance },
    { x: -distance, z: distance },
    { x: distance, z: distance },
  ]
  return table[slot] ?? { x: 0, z: 0 }
}
