import staticArtwork from '../../data/static-hd-assets.json'

export type AssetProfile = 'original' | 'hd'

const staticOverrides = new Map(staticArtwork.assets.filter(asset => asset.enabled)
  .map(asset => [asset.source, asset]))

export function profileTextureResolution(url: string, profile: AssetProfile): number {
  if (profile === 'original') return 1
  return staticOverrides.get(url.split(/[?#]/, 1)[0]!)?.pixelDensity ?? 2
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
