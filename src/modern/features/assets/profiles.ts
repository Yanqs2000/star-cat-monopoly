import staticArtwork from '../../data/static-hd-assets.json'
import approvedArtwork from '../../data/approved-non-character.json'
import effects from '../../data/non-character-effects.json'
import continuous from '../../data/continuous-non-character.json'
import npc22 from '../../data/npc-22.json'
import npc23 from '../../data/npc-23.json'
import juanmao24 from '../../data/juanmao-24.json'
import characters25 from '../../data/characters-25.json'

export type AssetProfile = 'original' | 'hd'

type Bounds = readonly number[]
type StaticArtworkOverride = { source: string; url: string; pixelSize: readonly number[]; pixelDensity: number; registration?: { sourceBounds: Bounds; renderedBounds: Bounds } }
const character25Overrides=(characters25 as unknown as{assets?:Array<StaticArtworkOverride & {enabled:boolean}>}).assets??[]
const staticOverrides = new Map<string, StaticArtworkOverride>([...staticArtwork.assets,...approvedArtwork.assets,...character25Overrides].filter(asset => asset.enabled)
  .map(asset => [asset.source, asset]))
const staticResolved = new Map<string,StaticArtworkOverride>([...staticOverrides.values(),...[...approvedArtwork.runtimeImages,...effects.runtimeImages,...continuous.runtimeImages,...npc22.runtimeImages,...npc23.runtimeImages,...characters25.runtimeImages].map(asset=>({...asset,source:asset.url}))].map(asset => [asset.url, asset]))
const juanmao24Textures = new Set(Object.values(juanmao24.facings).flatMap(facing=>Object.values(facing.parts).map(part=>part.url)))

export function staticAssetPixels(url: string) {
  return staticResolved.get(url)
}

export function spriteBoundsTransform(source: Bounds, rendered: Bounds) {
  const scaleX = (source[2]! - source[0]!) / (rendered[2]! - rendered[0]!)
  const scaleY = (source[3]! - source[1]!) / (rendered[3]! - rendered[1]!)
  return { x: source[0]! - rendered[0]! * scaleX, y: source[1]! - rendered[1]! * scaleY, scaleX, scaleY }
}

export function profileSpriteTransform(url: string, profile: AssetProfile) {
  const registration = profile === 'hd' ? staticOverrides.get(url)?.registration : undefined
  return registration ? spriteBoundsTransform(registration.sourceBounds, registration.renderedBounds)
    : { x: 0, y: 0, scaleX: 1, scaleY: 1 }
}

export function profileTextureResolution(url: string, profile: AssetProfile): number {
  if (profile === 'original') return 1
  if (juanmao24Textures.has(url.split(/[?#]/, 1)[0]!)) return juanmao24.density
  return staticOverrides.get(url.split(/[?#]/, 1)[0]!)?.pixelDensity ?? staticResolved.get(url.split(/[?#]/, 1)[0]!)?.pixelDensity ?? 2
}

export function isCompleteHdProfileIndex(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false
  const index = value as Partial<{
    version: number
    profile: string
    pixelDensity: number
    sourceAssetCount: number
    assetCount: number
    manifest: string
    manifestSha256: string
    totalBytes: number
  }>
  return index.version === 1
    && index.profile === 'hd'
    && index.pixelDensity === 2
    && Number.isSafeInteger(index.sourceAssetCount)
    && (index.sourceAssetCount ?? 0) > 0
    && Number.isSafeInteger(index.assetCount)
    && index.assetCount === index.sourceAssetCount
    && index.manifest === 'hd-manifest.json'
    && typeof index.manifestSha256 === 'string'
    && /^[a-f0-9]{64}$/i.test(index.manifestSha256)
    && Number.isSafeInteger(index.totalBytes)
    && (index.totalBytes ?? 0) > 0
}

export function profileAssetUrl(url: string, profile: AssetProfile): string {
  if (profile === 'original' || url.startsWith('assets-hd/')) return url
  const suffixStart = url.search(/[?#]/)
  const path = suffixStart < 0 ? url : url.slice(0, suffixStart)
  if (!path.startsWith('assets/') || !/\.png$/i.test(path)) return url
  const suffix = suffixStart < 0 ? '' : url.slice(suffixStart)
  const replacement = staticOverrides.get(path)
  if (replacement) return `${replacement.url}${suffix}`
  // The other legacy champion illustrations retain their existing shared
  // source until that identity has completed its own review.
  if(/^assets\/monthly\/champions\//.test(path))return url
  return `${path.replace(/^assets\//, 'assets-hd/').replace(/\.png$/i, '.webp')}${suffix}`
}

export function mapAssetProfile<T>(value: T, profile: AssetProfile): T {
  const mapValue = (child: unknown, isUrl = false): unknown => {
    if (typeof child === 'string') return isUrl ? profileAssetUrl(child, profile) : child
    if (Array.isArray(child)) return child.map(item => mapValue(item, isUrl))
    if (child && typeof child === 'object') {
      return Object.fromEntries(Object.entries(child).map(([key, item]) => [key, mapValue(item, /url$/i.test(key))]))
    }
    return child
  }
  return mapValue(value) as T
}
