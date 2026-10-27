import { describe, expect, it } from 'vitest'
import { visibleMapRegions, type MapViewBounds } from '../../src/modern/features/map/map-region-visibility'

const regions = [
  { url: 'a.webp', logicalRect: [0, 0, 257, 257] as [number, number, number, number],
    pixelDensity: 4, scenePosition: [0, 0] as [number, number] },
  { url: 'b.webp', logicalRect: [255, 0, 257, 257] as [number, number, number, number],
    pixelDensity: 4, scenePosition: [255, 0] as [number, number] },
  { url: 'c.webp', logicalRect: [512, 0, 257, 257] as [number, number, number, number],
    pixelDensity: 4, scenePosition: [512, 0] as [number, number] },
]

const view: MapViewBounds = { left: 0, top: 0, right: 256, bottom: 256 }

describe('visible high-resolution map tiles', () => {
  it('includes tiles intersecting the viewport, including their sampling overlap', () => {
    expect(visibleMapRegions(regions, view, { screenScale: 1, padding: 0 }).map(item => item.url))
      .toEqual(['a.webp', 'b.webp'])
  })

  it('loads nearby tiles ahead of camera movement within the prefetch padding', () => {
    const narrowView = { left: 0, top: 0, right: 220, bottom: 220 }
    expect(visibleMapRegions(regions, narrowView, { screenScale: 1, padding: 40 }).map(item => item.url))
      .toEqual(['a.webp', 'b.webp'])
  })

  it('skips 4x overlays at overview scale where the legacy 2x base already exceeds display pixels', () => {
    expect(visibleMapRegions(regions, { left: -1000, top: -1000, right: 2000, bottom: 2000 },
      { screenScale: 0.7, padding: 0 })).toEqual([])
  })

  it('selects only nearby tiles from a 2700x2552 map during normal play', () => {
    const fullMap = Array.from({ length: 10 }, (_, row) =>
      Array.from({ length: 11 }, (_, col) => {
        const contentX = col * 256
        const contentY = row * 256
        const width = Math.min(256, 2700 - contentX)
        const height = Math.min(256, 2552 - contentY)
        return {
          url: `map/${row}-${col}.webp`,
          logicalRect: [contentX - 1, contentY - 1, width + 2, height + 2] as [number, number, number, number],
          pixelDensity: 4,
          scenePosition: [contentX - 1, contentY - 1] as [number, number],
        }
      })).flat()

    const visible = visibleMapRegions(fullMap, { left: 300, top: 300, right: 1100, bottom: 900 },
                                      { screenScale: 2, padding: 64 })

    expect(fullMap).toHaveLength(110)
    expect(visible.length).toBeGreaterThan(0)
    expect(visible.length).toBeLessThanOrEqual(20)
  })
})
