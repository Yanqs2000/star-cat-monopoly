export interface HdMapRegionLoaderHooks<Region extends { url: string }> {
  load: (region: Region) => Promise<void>
  attach: (region: Region) => void
  detach: (region: Region) => void
  release: (region: Region) => void
  onError?: (error: Error) => void
}

export class HdMapRegionLoader<Region extends { url: string }> {
  private readonly loaded = new Map<string, Region>()
  private readonly loading = new Set<string>()
  private wanted = new Set<string>()
  private disposed = false

  constructor(private readonly hooks: HdMapRegionLoaderHooks<Region>) {}

  update(regions: readonly Region[]): void {
    if (this.disposed) return
    const uniqueRegions = new Map(regions.map(region => [region.url, region]))
    this.wanted = new Set(uniqueRegions.keys())

    for (const [url, region] of this.loaded) {
      if (this.wanted.has(url)) continue
      this.loaded.delete(url)
      this.hooks.detach(region)
      this.hooks.release(region)
    }

    for (const region of uniqueRegions.values()) {
      if (this.loaded.has(region.url) || this.loading.has(region.url)) continue
      this.loading.add(region.url)
      void Promise.resolve().then(() => this.hooks.load(region)).then(() => {
        if (this.disposed || !this.wanted.has(region.url)) {
          this.hooks.release(region)
          return
        }
        try {
          this.hooks.attach(region)
          this.loaded.set(region.url, region)
        } catch (error) {
          this.hooks.release(region)
          throw error
        }
      }).catch(error => {
        if (!this.disposed) {
          this.hooks.onError?.(error instanceof Error ? error : new Error(String(error)))
        }
      }).finally(() => this.loading.delete(region.url))
    }
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.wanted.clear()
    for (const region of this.loaded.values()) {
      this.hooks.detach(region)
      this.hooks.release(region)
    }
    this.loaded.clear()
  }
}
