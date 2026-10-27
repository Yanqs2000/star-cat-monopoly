import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { companyPlacement, parseCompanyAssets } from '../../src/modern/features/map/company-assets'

const root = resolve(import.meta.dirname, '../..')

describe('原版公司建筑素材', () => {
  it('角色3的源边界决定图片尺寸与原点偏移，出生区4保持源绝对坐标', () => {
    const manifest = parseCompanyAssets(JSON.parse(readFileSync(resolve(root, 'public/modern/assets/companies/manifest.json'), 'utf8')))
    const building = manifest.companies[2]!
    expect(building).toMatchObject({ characterId: 3, sourceSpriteId: 213,
      width: 213, height: 186, offsetX: -104.5, offsetY: -110 })
    expect(companyPlacement(manifest, 3, 4)).toMatchObject({
      x: 530, y: 330, mainRecordId: 133, url: 'assets/companies/3.png',
      offsetX: -104.5, offsetY: -110,
    })
  })

  it('12 张 PNG 与清单几何一致，均为带透明度的原图', () => {
    const manifest = parseCompanyAssets(JSON.parse(readFileSync(resolve(root, 'public/modern/assets/companies/manifest.json'), 'utf8')))
    expect(manifest.companies).toHaveLength(12)
    for (const asset of manifest.companies) {
      const png = readFileSync(resolve(root, 'public/modern', asset.url))
      expect(png.subarray(0, 8)).toEqual(Buffer.from('89504e470d0a1a0a', 'hex'))
      expect(png.readUInt32BE(16)).toBe(asset.width)
      expect(png.readUInt32BE(20)).toBe(asset.height)
      expect(png[25]).toBe(6)
    }
  })
})
