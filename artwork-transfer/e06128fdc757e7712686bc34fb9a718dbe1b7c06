import { describe, expect, it } from 'vitest'
import { parseHdMapArtwork, parseHdMapRegions } from '../../src/modern/features/assets/hd-map-art'

const offset = { offsetX: -184, offsetY: -313 }
const fixture = () => ({
  version: 1, kind: 'full-map', reviewStatus: 'installed-pending-user-review', logicalSize: [2700, 2552], regionCount: 1,
  baseMap: { path: 'hd-map/full-map-v1/base.webp', pixelDensity: 2, pixelSize: [5400, 5104] },
  mapRegions: [{ path: 'hd-map/full-map-v1/part-000.webp', reviewStatus: 'installed-pending-user-review',
    logicalRect: [640, 420, 256, 256], scenePosition: [456, 107], pixelDensity: 4, pixelSize: [1024, 1024] }],
})

describe('full native map and matching overview', () => {
  it('loads installed static map regions with their matching two-density base', () => {
    const art = parseHdMapArtwork(fixture(), offset)
    expect(art.baseMap).toEqual({ url: 'hd-map/full-map-v1/base.webp', pixelDensity: 2 })
    expect(art.regions).toHaveLength(1)
    expect(art.regions[0]!.scenePosition).toEqual([456, 107])
  })

  it('rejects unfinished artwork, wrong base dimensions, shifted regions and non-map paths', () => {
    const cases = [
      { ...fixture(), reviewStatus: 'unreviewed' },
      { ...fixture(), logicalSize: [2701, 2552] },
      { ...fixture(), regionCount: 2 },
      { ...fixture(), baseMap: { ...fixture().baseMap, pixelSize: [2700, 2552] } },
      { ...fixture(), baseMap: { ...fixture().baseMap, path: 'assets-hd/map.webp' } },
      { ...fixture(), mapRegions: [{ ...fixture().mapRegions[0], path: 'hd-map/experimental/part.webp' }] },
      { ...fixture(), mapRegions: [{ ...fixture().mapRegions[0], scenePosition: [0, 0] }] },
    ]
    for (const value of cases) expect(() => parseHdMapArtwork(value, offset)).toThrow()
  })

  it('preserves subpixel native boundary rounding without allowing arbitrary negative bounds', () => {
    const value = fixture(); value.mapRegions[0]!.logicalRect[1] = -.08
    value.mapRegions[0]!.scenePosition[1] = -313.08
    expect(parseHdMapArtwork(value, offset).regions[0]!.logicalRect[1]).toBe(-.08)
    value.mapRegions[0]!.logicalRect[1] = -1
    value.mapRegions[0]!.scenePosition[1] = -314
    expect(() => parseHdMapArtwork(value, offset)).toThrow()
  })

  it('keeps the approved-sample parser separate from installed full-map artwork', () => {
    expect(() => parseHdMapRegions(fixture(), offset)).toThrow()
    const value = fixture(); value.mapRegions[0]!.reviewStatus = 'unreviewed'
    expect(() => parseHdMapArtwork(value, offset)).toThrow()
  })

  it('retains the same artwork contract when final visual acceptance is recorded', () => {
    const value = fixture(); value.reviewStatus = 'approved'
    value.mapRegions[0]!.reviewStatus = 'approved'
    value.mapRegions[0]!.logicalRect[1] = -.08
    value.mapRegions[0]!.scenePosition[1] = -313.08
    expect(parseHdMapArtwork(value, offset).regions).toHaveLength(1)
  })
})
