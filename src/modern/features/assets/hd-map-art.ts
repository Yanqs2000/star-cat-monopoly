export interface HdMapRegion {
  url: string
  logicalRect: [number, number, number, number]
  pixelDensity: number
  scenePosition: [number, number]
  pixelSize?: [number, number]
  tileId?: string
  contentRect?: [number, number, number, number]
  overlapPixels?: [number, number, number, number]
}

export interface HdMapBase { url: string; pixelDensity: number }
export interface HdMapArtwork { baseMap: HdMapBase; regions: HdMapRegion[] }

function record(value: unknown, message: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(message)
  return value as Record<string, unknown>
}

function tuple(value: unknown, length: number, message: string): number[] {
  if (!Array.isArray(value) || value.length !== length ||
      value.some(item => typeof item !== 'number' || !Number.isFinite(item))) throw new Error(message)
  return value as number[]
}

export function parseHdMapRegions(value: unknown,
                                  mapOffset: { offsetX: number; offsetY: number }): HdMapRegion[] {
  return parseMapRegions(value, mapOffset, 'approved')
}

function parseMapRegions(value: unknown, mapOffset: { offsetX: number; offsetY: number },
                         reviewStatus: 'approved' | 'installed-pending-user-review', nativeRounding = false): HdMapRegion[] {
  const profile = record(value, '高清美术清单结构错误')
  if (profile.reviewStatus !== reviewStatus) throw new Error('高清地图清单状态错误')
  const rows = profile.mapRegions
  if (!Array.isArray(rows)) throw new Error('高清地图补片清单结构错误')
  const regions = rows.map(value => {
    const row = record(value, '高清地图补片定义错误')
    if (row.reviewStatus !== reviewStatus) throw new Error('高清地图切片状态错误')
    if (typeof row.path !== 'string' || !/^hd-map\/[\w/-]+\.webp$/.test(row.path)) {
      throw new Error('高清地图补片路径错误')
    }
    const rect = tuple(row.logicalRect, 4, '高清地图补片逻辑矩形错误') as [number, number, number, number]
    const pixelSize = tuple(row.pixelSize, 2, '高清地图补片像素尺寸错误')
    const position = tuple(row.scenePosition, 2, '高清地图补片场景坐标错误') as [number, number]
    const density = row.pixelDensity
    // The native whole-map grid rounds y=0 to -0.079 logical pixels.
    // Retain that source row; the approved-sample contract remains nonnegative.
    const rounding = nativeRounding && typeof density === 'number' && density > 0 ? 1 / density : 0
    if (rect[0] < -rounding || rect[1] < -rounding || rect[2] <= 0 || rect[3] <= 0 ||
        typeof density !== 'number' || !Number.isFinite(density) || density < 4 ||
        pixelSize.some((size, index) => Math.abs(size - rect[index + 2]! * density) > 1)) {
      throw new Error('高清地图补片像素密度或边界不符')
    }
    const expectedPosition: [number, number] = [rect[0] + mapOffset.offsetX, rect[1] + mapOffset.offsetY]
    if (position.some((coordinate, index) => Math.abs(coordinate - expectedPosition[index]!) > 0.001)) {
      throw new Error('地图补片坐标与原图偏移不符')
    }
    const tileId = row.tileId
    if (tileId === undefined) {
      return { url: row.path as string, logicalRect: rect, pixelDensity: density, scenePosition: position }
    }
    const contentRect = tuple(row.contentRect, 4, '高清地图切片内容格错误') as [number, number, number, number]
    const overlapPixels = tuple(row.overlapPixels, 4, '高清地图切片重叠像素错误') as [number, number, number, number]
    const validIntegerRect = contentRect.every(Number.isInteger)
    const insideRenderRect = contentRect[0] >= rect[0] - 1 / density
      && contentRect[1] >= rect[1] - 1 / density
      && contentRect[0] + contentRect[2] <= rect[0] + rect[2] + 1 / density
      && contentRect[1] + contentRect[3] <= rect[1] + rect[3] + 1 / density
    if (typeof tileId !== 'string' || !/^r\d+c\d+$/.test(tileId) ||
        !row.path.endsWith(`/${tileId}.webp`) || !validIntegerRect ||
        contentRect[0] < 0 || contentRect[1] < 0 || contentRect[2] <= 0 || contentRect[2] > 256 ||
        contentRect[3] <= 0 || contentRect[3] > 256 || !insideRenderRect ||
        overlapPixels.some(value => !Number.isInteger(value) || value < 0) ||
        overlapPixels[0] + overlapPixels[2] >= pixelSize[0] ||
        overlapPixels[1] + overlapPixels[3] >= pixelSize[1]) {
      throw new Error('高清地图切片边界或重叠无效')
    }
    return {
      url: row.path as string, logicalRect: rect, pixelDensity: density, scenePosition: position,
      tileId, contentRect, overlapPixels, pixelSize: pixelSize as [number, number],
    }
  })
  const urls = regions.map(region => region.url)
  const tileIds = regions.flatMap(region => region.tileId === undefined ? [] : [region.tileId])
  if (new Set(urls).size !== urls.length || new Set(tileIds).size !== tileIds.length) {
    throw new Error('高清地图切片重复')
  }
  return regions
}

export function parseHdMapArtwork(value: unknown,
                                  mapOffset: { offsetX: number; offsetY: number }): HdMapArtwork {
  const profile = record(value, '完整高清地图清单结构错误')
  const size = tuple(profile.logicalSize, 2, '完整高清地图逻辑尺寸错误')
  if (profile.version !== 1 || profile.kind !== 'full-map' || size[0] !== 2700 || size[1] !== 2552) {
    throw new Error('完整高清地图范围错误')
  }
  const base = record(profile.baseMap, '完整高清地图底图错误')
  const pixels = tuple(base.pixelSize, 2, '完整高清地图底图尺寸错误')
  if (base.path !== 'hd-map/full-map-v1/base.webp' || base.pixelDensity !== 2 || pixels[0] !== 5400 || pixels[1] !== 5104) {
    throw new Error('完整高清地图底图定义错误')
  }
  if (profile.reviewStatus !== 'approved' && profile.reviewStatus !== 'installed-pending-user-review') {
    throw new Error('完整高清地图尚未安装或验收')
  }
  const regions = parseMapRegions(value, mapOffset, profile.reviewStatus, true)
  if (!regions.length || profile.regionCount !== regions.length ||
      regions.some(region => !region.url.startsWith('hd-map/full-map-v1/'))) {
    throw new Error('完整高清地图分片范围错误')
  }
  return { baseMap: { url: base.path, pixelDensity: 2 }, regions }
}

export async function loadHdMapArtwork(mapOffset: { offsetX: number; offsetY: number },
                                       signal: AbortSignal): Promise<HdMapArtwork> {
  const response = await fetch(`${import.meta.env.BASE_URL}hd-map/full-map-v1/manifest.json`, { signal })
  if (!response.ok) throw new Error(`完整高清地图清单不可用（HTTP ${response.status}）`)
  return parseHdMapArtwork(await response.json(), mapOffset)
}

export async function loadHdMapRegions(mapOffset: { offsetX: number; offsetY: number },
                                       signal: AbortSignal): Promise<HdMapRegion[]> {
  const response = await fetch(`${import.meta.env.BASE_URL}hd-map/manifest.json`, { signal })
  if (!response.ok) throw new Error(`高清地图清单不可用（HTTP ${response.status}）`)
  return parseHdMapRegions(await response.json(), mapOffset)
}
