import * as THREE from 'three'
import { GROUPS } from '@/core/config/board'
import { ECONOMY } from '@/core/config/economy'
import { fmtMoney } from '@/core/engine/GameEngine'
import type { Tile } from '@/core/types'

/** 地块顶面贴图的画布边长 */
export const TILE_TEX_SIZE = 256

const INK = '#2b2140'
const CREAM = '#fffdf9'

const SPECIAL_GLYPH: Record<string, string> = {
  start: '🏁',
  jail: '🚔',
  arcade: '🎡',
  park: '🌳',
  bank: '🏦',
  stock: '📈',
  lottery: '🎟️',
  news: '📰',
  shop: '🛒',
  magic: '🔮',
  gotojail: '👮',
  tax: '🧾',
  card: '🃏',
}

export function makeCanvas(w: number, h = w) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法创建 2D 画布上下文')
  return { canvas, ctx }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/**
 * 画一块地的顶面。
 *
 * 注意：**只画静态内容**（底色、名称、价格、图标）。
 * 拥有者、建筑等级、路障这些会变的东西一律用独立的 3D 物件表示，
 * 这样贴图只在建棋盘时画一次，买地/盖房不会触发重新上传。
 */
export function drawTileFace(tile: Tile): HTMLCanvasElement {
  const S = TILE_TEX_SIZE
  const { canvas, ctx } = makeCanvas(S)
  const group = tile.group ? GROUPS[tile.group] : null

  // 底色
  ctx.fillStyle = CREAM
  ctx.fillRect(0, 0, S, S)

  // 色组描边
  if (group) {
    ctx.strokeStyle = group.color
    ctx.lineWidth = 18
    roundRect(ctx, 12, 12, S - 24, S - 24, 26)
    ctx.stroke()
  } else {
    ctx.strokeStyle = '#d9cfe8'
    ctx.lineWidth = 10
    roundRect(ctx, 10, 10, S - 20, S - 20, 22)
    ctx.stroke()
  }

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  if (tile.kind === 'property') {
    // 名称
    ctx.font = '900 46px "PingFang SC", "Hiragino Sans GB", system-ui, sans-serif'
    ctx.lineWidth = 8
    ctx.strokeStyle = 'rgba(255,255,255,.95)'
    ctx.strokeText(tile.name, S / 2, S * 0.42)
    ctx.fillStyle = INK
    ctx.fillText(tile.name, S / 2, S * 0.42)

    // 价格
    ctx.font = '800 34px "PingFang SC", system-ui, sans-serif'
    ctx.lineWidth = 7
    ctx.strokeStyle = 'rgba(255,255,255,.95)'
    ctx.strokeText(`¥${tile.price.toLocaleString('zh-CN')}`, S / 2, S * 0.66)
    ctx.fillStyle = group ? group.color : '#7c3aed'
    ctx.fillText(`¥${tile.price.toLocaleString('zh-CN')}`, S / 2, S * 0.66)
  } else {
    // 功能格：图标 + 名称
    ctx.font = '88px "Apple Color Emoji", "Segoe UI Emoji", system-ui, sans-serif'
    ctx.fillText(SPECIAL_GLYPH[tile.kind] ?? '✨', S / 2, S * 0.38)

    ctx.font = '900 42px "PingFang SC", "Hiragino Sans GB", system-ui, sans-serif'
    ctx.lineWidth = 8
    ctx.strokeStyle = 'rgba(255,255,255,.95)'
    ctx.strokeText(tile.name, S / 2, S * 0.72)
    ctx.fillStyle = '#5b4b7d'
    ctx.fillText(tile.name, S / 2, S * 0.72)
  }

  return canvas
}

/** 中央广场的品牌地贴 */
export function drawPlazaFace(): HTMLCanvasElement {
  const S = 512
  const { canvas, ctx } = makeCanvas(S)

  ctx.fillStyle = '#f7f1ff'
  ctx.fillRect(0, 0, S, S)

  // 星轨环
  ctx.strokeStyle = 'rgba(124,58,237,.28)'
  ctx.lineWidth = 6
  ctx.setLineDash([18, 14])
  for (const r of [S * 0.36, S * 0.28]) {
    ctx.beginPath()
    ctx.arc(S / 2, S / 2, r, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.setLineDash([])

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  ctx.font = '900 96px "PingFang SC", "Hiragino Sans GB", system-ui, sans-serif'
  ctx.fillStyle = '#7c3aed'
  ctx.fillText('星猫', S / 2, S * 0.4)
  ctx.fillStyle = '#f59f00'
  ctx.fillText('乐园', S / 2, S * 0.56)

  ctx.font = '800 34px "PingFang SC", system-ui, sans-serif'
  ctx.fillStyle = '#9b8bbd'
  ctx.fillText('STAR CAT PARK', S / 2, S * 0.72)

  return canvas
}

/** 把画布包成贴图（带正确的色彩空间与过滤参数） */
export function toTexture(
  canvas: HTMLCanvasElement,
  renderer: THREE.WebGLRenderer | null,
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.generateMipmaps = true
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.magFilter = THREE.LinearFilter
  tex.wrapS = THREE.ClampToEdgeWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  if (renderer) {
    tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy())
  }
  tex.needsUpdate = true
  return tex
}

/** 画一张文字贴图，用来做名字精灵 / 金钱飘字 */
export function drawLabel(text: string, options: { color?: string; bg?: string; size?: number } = {}) {
  const size = options.size ?? 64
  const padX = size * 0.5
  const measure = makeCanvas(8, 8)
  measure.ctx.font = `900 ${size}px "PingFang SC", "Hiragino Sans GB", system-ui, sans-serif`
  const width = Math.ceil(measure.ctx.measureText(text).width + padX * 2)
  const height = Math.ceil(size * 1.5)

  const { canvas, ctx } = makeCanvas(width, height)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `900 ${size}px "PingFang SC", "Hiragino Sans GB", system-ui, sans-serif`

  if (options.bg) {
    ctx.fillStyle = options.bg
    roundRect(ctx, 2, 2, width - 4, height - 4, height / 2)
    ctx.fill()
  }
  ctx.lineWidth = size * 0.18
  ctx.strokeStyle = 'rgba(43,33,64,.85)'
  ctx.strokeText(text, width / 2, height / 2 + 1)
  ctx.fillStyle = options.color ?? '#ffffff'
  ctx.fillText(text, width / 2, height / 2 + 1)

  return { canvas, width, height }
}

/** 精灵形式的文字标签 */
export function makeLabelSprite(
  text: string,
  options: { color?: string; bg?: string; size?: number; scale?: number } = {},
): THREE.Sprite {
  const { canvas, width, height } = drawLabel(text, options)
  const tex = toTexture(canvas, null)
  const material = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  })
  const sprite = new THREE.Sprite(material)
  const scale = options.scale ?? 1
  sprite.scale.set((width / height) * 0.42 * scale, 0.42 * scale, 1)
  sprite.renderOrder = 20
  return sprite
}

export { fmtMoney, ECONOMY }
