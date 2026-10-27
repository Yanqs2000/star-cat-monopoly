import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import map from '../../src/modern/data/map.json'
import anchors from '../../src/modern/data/property-marker-anchors.json'
import { propertyMarkerOffset } from '../../src/modern/features/map/property-marker-placement'

describe('高清已购空地角落落点', () => {
  it.each([
    [43, -8, -1.35], [89, -22, -4.35], [99, -9, -19.35], [11, -9, 13.65],
  ])('%s号地按地图实测角点调整，处理向左、向上和向下偏移', (id, x, y) => {
    const offset = propertyMarkerOffset(id, { ownerId: 4, level: 0 }, 'hd')
    expect(offset.x).toBeCloseTo(x!)
    expect(offset.y).toBeCloseTo(y!)
  })
  it.each([1, 2, 3, 4])('玩家%s的颜色不改变同一地块的落点', ownerId => {
    const offset = propertyMarkerOffset(43, { ownerId, level: 0 }, 'hd')
    expect(offset.x).toBe(-8)
    expect(offset.y).toBeCloseTo(-1.35)
  })
  it('原版、未售地及全部升级等级均保留原位', () => {
    for (const parcel of map.parcels) {
      expect(propertyMarkerOffset(parcel.id, { ownerId: 4, level: 0 }, 'original')).toEqual({ x: 0, y: 0 })
      expect(propertyMarkerOffset(parcel.id, { ownerId: null, level: 0 }, 'hd')).toEqual({ x: 0, y: 0 })
      for (const level of [1, 2, 3, 4, 5] as const) {
        expect(propertyMarkerOffset(parcel.id, { ownerId: 4, level }, 'hd')).toEqual({ x: 0, y: 0 })
      }
    }
  })
  it('56块地产均有实测角点，地图更换时要求重新复核', () => {
    expect(Object.keys(anchors.corners).map(Number)).toEqual(map.parcels.map(p => p.id))
    expect(createHash('sha256').update(readFileSync(new URL('../../public/modern/hd-map/full-map-v1/manifest.json', import.meta.url))).digest('hex'))
      .toBe(anchors.mapManifestSha256)
  })
})
