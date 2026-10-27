import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parseHdMapRegions } from '../../src/modern/features/assets/hd-map-art'

const manifest = JSON.parse(readFileSync(new URL('../../public/modern/hd-map/manifest.json', import.meta.url), 'utf8'))
const offset = { offsetX: -184, offsetY: -313 }

describe('map-only HD artwork', () => {
  it('loads all four approved tiles with the original world position and native density', () => {
    const regions = parseHdMapRegions(manifest, offset)
    expect(regions).toHaveLength(4)
    expect(regions[0]!.scenePosition).toEqual([456, 107])
    expect(regions[0]!.pixelDensity).toBe(4.3515625)
    expect(regions[0]!.pixelSize).toEqual([1119, 1119])
    for (const tile of manifest.mapRegions) {
      const bytes = readFileSync(new URL(`../../public/modern/${tile.path}`, import.meta.url))
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(tile.outputSha256)
    }
  })

  it('rejects unapproved experiments instead of rendering them in a game', () => {
    expect(() => parseHdMapRegions({ ...manifest, reviewStatus: 'unreviewed' }, offset)).toThrow()
    const changed = structuredClone(manifest)
    changed.mapRegions[0].reviewStatus = 'unreviewed'
    expect(() => parseHdMapRegions(changed, offset)).toThrow()
  })

  it('rejects shifted coordinates, invalid density, duplicates and non-map URLs', () => {
    for (const mutation of [
      { scenePosition: [0, 0] }, { pixelDensity: 2 },
      { path: 'assets-hd/hd-art/characters/1/walk/down-left/1.webp' },
    ]) {
      const changed = structuredClone(manifest)
      Object.assign(changed.mapRegions[0], mutation)
      expect(() => parseHdMapRegions(changed, offset)).toThrow()
    }
    expect(() => parseHdMapRegions({ ...manifest, mapRegions: [manifest.mapRegions[0], manifest.mapRegions[0]] }, offset)).toThrow()
  })
})
