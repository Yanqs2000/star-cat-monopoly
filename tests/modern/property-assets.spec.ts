import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  parsePropertyAssets,
  type PropertyAssetManifest,
} from '../../src/modern/features/map/property-assets'

const ROOT = resolve(import.meta.dirname, '../..')

function completeManifest(): PropertyAssetManifest {
  return {
    version: 1,
    sourceSha256: 'a'.repeat(64),
    sellSigns: [1, 2, 3, 4].map((facing) => ({
      facing: facing as 1 | 2 | 3 | 4,
      url: `assets/properties/sell-sign/facing-${facing}.png`,
      offsetX: -0.4,
      offsetY: -25.75,
    })),
    houses: [1, 2, 3, 4].flatMap((ownerId) =>
      [1, 2, 3, 4].flatMap((facing) =>
        [0, 1, 2, 3, 4, 5].map((level) => ({
          ownerId: ownerId as 1 | 2 | 3 | 4,
          facing: facing as 1 | 2 | 3 | 4,
          level: level as 0 | 1 | 2 | 3 | 4 | 5,
          url: `assets/properties/houses/owner-${ownerId}/facing-${facing}/level-${level}.png`,
          offsetX: -18,
          offsetY: -68.65,
        })),
      ),
    ),
  }
}

describe('原版地块牌与房屋等级素材', () => {
  it('读取真实清单并覆盖四方向地块牌与全部 96 个房屋变体', () => {
    const raw = JSON.parse(
      readFileSync(resolve(ROOT, 'public/modern/assets/properties/manifest.json'), 'utf8'),
    )
    const manifest = parsePropertyAssets(raw)
    const sourceHash = createHash('sha256')
      .update(readFileSync(resolve(ROOT, 'public/original/play.swf')))
      .digest('hex')

    expect(manifest.sourceSha256).toBe(sourceHash)
    expect(manifest.sellSigns.map(({ facing }) => facing)).toEqual([1, 2, 3, 4])
    expect(manifest.houses).toHaveLength(96)
    expect(new Set(manifest.houses.map(({ ownerId }) => ownerId))).toEqual(new Set([1, 2, 3, 4]))
    expect(new Set(manifest.houses.map(({ facing }) => facing))).toEqual(new Set([1, 2, 3, 4]))
    expect(new Set(manifest.houses.map(({ level }) => level))).toEqual(new Set([0, 1, 2, 3, 4, 5]))

    const urls = [...manifest.sellSigns, ...manifest.houses].map(({ url }) => url)
    expect(new Set(urls).size).toBe(100)
    for (const url of urls) {
      const png = readFileSync(resolve(ROOT, 'public/modern', url))
      expect(png.subarray(1, 4).toString(), url).toBe('PNG')
      expect(png.readUInt32BE(16), `${url} width`).toBeGreaterThan(0)
      expect(png.readUInt32BE(20), `${url} height`).toBeGreaterThan(0)
      expect(png[25], `${url} must retain RGBA transparency`).toBe(6)
    }
  })

  it('拒绝重复房屋变体', () => {
    const manifest = completeManifest()
    manifest.houses[95] = { ...manifest.houses[0]! }
    expect(() => parsePropertyAssets(manifest)).toThrow('房屋变体重复')
  })

  it('拒绝缺少房屋变体', () => {
    const manifest = completeManifest()
    manifest.houses.pop()
    expect(() => parsePropertyAssets(manifest)).toThrow('必须包含 96 个房屋变体')
  })

  it('拒绝重复地块牌方向', () => {
    const manifest = completeManifest()
    manifest.sellSigns[3] = { ...manifest.sellSigns[0]! }
    expect(() => parsePropertyAssets(manifest)).toThrow('地块牌方向重复')
  })

  it('拒绝无效哈希、路径和偏移', () => {
    const manifest = completeManifest()
    expect(() => parsePropertyAssets({ ...manifest, sourceSha256: 'short' })).toThrow('来源哈希')
    expect(() => parsePropertyAssets({
      ...manifest,
      sellSigns: [{ ...manifest.sellSigns[0]!, url: '../escape.png' }, ...manifest.sellSigns.slice(1)],
    })).toThrow('地块牌定义')
    expect(() => parsePropertyAssets({
      ...manifest,
      houses: [{ ...manifest.houses[0]!, offsetX: Number.NaN }, ...manifest.houses.slice(1)],
    })).toThrow('房屋定义')
  })
})
