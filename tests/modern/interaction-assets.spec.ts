import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  parseInteractionAssets,
  type InteractionAsset,
  type InteractionAssetsManifest,
} from '../../src/modern/features/game/interaction-assets'

const ROOT = resolve(import.meta.dirname, '../..')
const CARD_IDS = [1, 5, 6, 7, 9, 11, 14, 15, 18, 19, 20, 21, 22, 25, 26, 27, 33]

function asset(id: number, kind: 'cards' | 'luck'): InteractionAsset {
  const card = kind === 'cards'
  return {
    id,
    sourceFrame: card ? id + 1 : id,
    url: `assets/interactions/${kind}/${id}.png`,
    width: card ? 65 : 400,
    height: card ? 67 : 300,
    offsetX: card ? -25 : 0,
    offsetY: card ? -32 : 0,
  }
}

function completeManifest(): InteractionAssetsManifest {
  return {
    version: 1,
    sourceSha256: 'a'.repeat(64),
    cards: CARD_IDS.map(id => asset(id, 'cards')),
    luck: Array.from({ length: 41 }, (_, index) => asset(index + 1, 'luck')),
  }
}

describe('原版卡面与运气插图素材', () => {
  it('读取真实清单并覆盖 17 张可达卡面和 41 张运气图', () => {
    const raw = JSON.parse(
      readFileSync(resolve(ROOT, 'public/modern/assets/interactions/manifest.json'), 'utf8'),
    )
    const manifest = parseInteractionAssets(raw)
    const sourceHash = createHash('sha256')
      .update(readFileSync(resolve(ROOT, 'public/original/play.swf')))
      .digest('hex')

    expect(manifest.sourceSha256).toBe(sourceHash)
    expect(manifest.cards.map(({ id }) => id)).toEqual(CARD_IDS)
    expect(manifest.cards.map(({ sourceFrame }) => sourceFrame)).toEqual(CARD_IDS.map(id => id + 1))
    expect(manifest.luck.map(({ id }) => id)).toEqual(Array.from({ length: 41 }, (_, index) => index + 1))
    expect(manifest.luck.map(({ sourceFrame }) => sourceFrame)).toEqual(
      Array.from({ length: 41 }, (_, index) => index + 1),
    )

    const assets = [...manifest.cards, ...manifest.luck]
    expect(new Set(assets.map(({ url }) => url)).size).toBe(58)
    for (const item of assets) {
      const png = readFileSync(resolve(ROOT, 'public/modern', item.url))
      expect(png.subarray(1, 4).toString(), item.url).toBe('PNG')
      expect(png.readUInt32BE(16), `${item.url} width`).toBe(item.width)
      expect(png.readUInt32BE(20), `${item.url} height`).toBe(item.height)
      expect(png[25], `${item.url} must retain RGBA transparency`).toBe(6)
    }
  })

  it('拒绝缺少或重复的卡面 ID', () => {
    const missing = completeManifest()
    missing.cards.pop()
    expect(() => parseInteractionAssets(missing)).toThrow('必须包含 17 张卡面')

    const duplicate = completeManifest()
    duplicate.cards[16] = { ...duplicate.cards[0]! }
    expect(() => parseInteractionAssets(duplicate)).toThrow('卡面 ID 重复')
  })

  it('拒绝缺少或重复的运气图 ID', () => {
    const missing = completeManifest()
    missing.luck.pop()
    expect(() => parseInteractionAssets(missing)).toThrow('必须包含 41 张运气图')

    const duplicate = completeManifest()
    duplicate.luck[40] = { ...duplicate.luck[0]! }
    expect(() => parseInteractionAssets(duplicate)).toThrow('运气图 ID 重复')
  })

  it('拒绝清单中不可达卡面或 42 号运气图', () => {
    const inaccessibleCard = completeManifest()
    inaccessibleCard.cards[16] = asset(2, 'cards')
    expect(() => parseInteractionAssets(inaccessibleCard)).toThrow('卡面 ID 不在可达清单')

    const extraLuck = completeManifest()
    extraLuck.luck[40] = asset(42, 'luck')
    expect(() => parseInteractionAssets(extraLuck)).toThrow('运气图 ID 必须为 1 至 41')
  })

  it('拒绝源帧、原生尺寸或偏移与素材语义不一致', () => {
    const frame = completeManifest()
    frame.cards[0]!.sourceFrame = 1
    expect(() => parseInteractionAssets(frame)).toThrow('卡面源帧错误')

    const dimensions = completeManifest()
    dimensions.luck[0]!.width = 900
    expect(() => parseInteractionAssets(dimensions)).toThrow('运气图原生几何错误')

    const offset = completeManifest()
    offset.cards[0]!.offsetX = Number.NaN
    expect(() => parseInteractionAssets(offset)).toThrow('卡面定义错误')
  })

  it('拒绝路径穿越、复用路径和 ID 与规范路径不一致', () => {
    const traversal = completeManifest()
    traversal.cards[0]!.url = '../escape.png'
    expect(() => parseInteractionAssets(traversal)).toThrow('卡面定义错误')

    const reused = completeManifest()
    reused.luck[1]!.url = reused.luck[0]!.url
    expect(() => parseInteractionAssets(reused)).toThrow('运气图路径与 ID 不一致')

    const swapped = completeManifest()
    const first = swapped.cards[0]!.url
    swapped.cards[0]!.url = swapped.cards[1]!.url
    swapped.cards[1]!.url = first
    expect(() => parseInteractionAssets(swapped)).toThrow('卡面路径与 ID 不一致')
  })

  it('拒绝错误版本、来源哈希和清单结构', () => {
    const manifest = completeManifest()
    expect(() => parseInteractionAssets({ ...manifest, version: 2 })).toThrow('清单版本错误')
    expect(() => parseInteractionAssets({ ...manifest, sourceSha256: 'short' })).toThrow('来源哈希错误')
    expect(() => parseInteractionAssets(null)).toThrow('清单结构错误')
  })
})
