import type { HdMapRegion } from '../assets/hd-map-art'

export interface MapViewBounds {
  left: number
  top: number
  right: number
  bottom: number
}

export interface MapRegionVisibilityOptions {
  screenScale: number
  padding?: number
}

export function visibleMapRegions(regions: readonly HdMapRegion[], bounds: MapViewBounds,
                                  options: MapRegionVisibilityOptions): HdMapRegion[] {
  const padding = options.padding ?? 32
  if (!Number.isFinite(options.screenScale) || options.screenScale < 0.75 ||
      !Number.isFinite(padding) || padding < 0) return []
  const left = bounds.left - padding
  const top = bounds.top - padding
  const right = bounds.right + padding
  const bottom = bounds.bottom + padding
  return regions.filter(region => {
    const [x, y] = region.scenePosition
    const [, , width, height] = region.logicalRect
    return x < right && x + width > left && y < bottom && y + height > top
  })
}
