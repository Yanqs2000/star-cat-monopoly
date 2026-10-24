import { expect, test, type Page } from '@playwright/test'

async function pixel(page: Page, x: number, y: number) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  const shot = await page.locator('#board canvas').screenshot()
  return page.evaluate(async ({ data, x, y }) => {
    const bitmap = await createImageBitmap(new Blob([Uint8Array.from(atob(data), c => c.charCodeAt(0))], { type: 'image/png' }))
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height), context = canvas.getContext('2d')!
    context.drawImage(bitmap, 0, 0); bitmap.close()
    return [...context.getImageData(x, y, 1, 1).data]
  }, { data: shot.toString('base64'), x, y })
}

test('完整地图在分片等待时显示同源底图，准备后只绘制一次RGBA，缩小再放大不露旧图', async ({ page }) => {
  test.setTimeout(90_000)
  await page.setViewportSize({ width: 900, height: 700 })
  await page.addInitScript(() => {
    const decode = window.createImageBitmap.bind(window)
    window.createImageBitmap = (async (...args: Parameters<typeof createImageBitmap>) => {
      const bitmap = await (decode as (...a: unknown[]) => Promise<ImageBitmap>)(...args)
      if (bitmap.width === 1600 && bitmap.height === 2400) {
        const state = window as typeof window & { fullMapDecoded?: number }
        state.fullMapDecoded = (state.fullMapDecoded ?? 0) + 1
      }
      return bitmap
    }) as typeof createImageBitmap
  })
  await page.goto('/modern.html')
  const images = await page.evaluate(() => {
    const canvas = document.createElement('canvas'); canvas.width = 1600; canvas.height = 1200
    const context = canvas.getContext('2d')!; context.fillStyle = '#ff0000'; context.fillRect(0, 0, 1600, 1200)
    const base = canvas.toDataURL().split(',')[1]!
    canvas.height = 2400; context.fillStyle = '#00ff00'; context.fillRect(0, 0, 1600, 2400)
    const right = canvas.toDataURL().split(',')[1]!
    context.clearRect(380, 1180, 40, 40)
    return { base, left: canvas.toDataURL().split(',')[1]!, right }
  })
  let release!: () => void
  const held = new Promise<void>(resolve => { release = resolve })
  const oldBaseRequests: string[] = []
  page.on('request', request => { if (request.url().endsWith('/assets-hd/map.webp')) oldBaseRequests.push(request.url()) })
  await page.route('**/map-composition-fixture/*.png', async route => {
    const name = route.request().url().split('/').pop()!.replace('.png', '') as keyof typeof images
    if (name === 'right') await held
    await route.fulfill({ contentType: 'image/png', body: Buffer.from(images[name], 'base64') })
  })
  try {
    await page.setContent('<div id="board" style="width:800px;height:600px"></div>')
    await page.evaluate(async () => {
      const scenePath = '/src/modern/features/map/MapScene.ts', assetsPath = '/src/modern/features/characters/assets.ts', mapPath = '/src/modern/data/map.json'
      const [{ createMapScene }, { parseAssetManifest }, map] = await Promise.all([
        import(scenePath), import(assetsPath), import(mapPath),
      ])
      const manifest = parseAssetManifest(await fetch('/assets/manifest.json').then(r => r.json()))
      const regions = ['left', 'right'].map((name, index) => ({ url: `map-composition-fixture/${name}.png`,
        logicalRect: [index * 400, 0, 400, 600], scenePosition: [index * 400 - 184, -313], pixelDensity: 4 }))
      const scene = await createMapScene(document.querySelector('#board'), map.default, manifest, {
        signal: new AbortController().signal, onFrame: () => {}, assetProfile: 'hd', mapRegions: regions,
        mapBase: { url: 'map-composition-fixture/base.png', pixelDensity: 2 },
        textureResolutions: Object.fromEntries(regions.map(r => [r.url, 4])),
      })
      scene.resize(800, 600); scene.showMarkers(false); scene.setPaused(true); scene.setPlaying(false)
      scene.restoreCameraState({ x: 184, y: 313, scale: 1, following: false })
      ;(window as typeof window & { fullMapScene?: typeof scene }).fullMapScene = scene
    })
    await expect.poll(() => page.evaluate(() => (window as typeof window & { fullMapDecoded?: number }).fullMapDecoded ?? 0)).toBe(1)
    expect(await pixel(page, 100, 300), 'partial native load must keep the complete base visible').toEqual([255, 0, 0, 255])
    release()
    await expect.poll(() => page.evaluate(() => (window as typeof window & { fullMapDecoded?: number }).fullMapDecoded ?? 0)).toBe(2)
    expect(await pixel(page, 100, 300), 'transparent native outline must show sky, not a second base composition').toEqual([102, 204, 255, 255])
    expect(await pixel(page, 200, 300)).toEqual([0, 255, 0, 255])
    await page.evaluate(() => (window as typeof window & { fullMapScene?: { restoreCameraState: (s: object) => void } }).fullMapScene!
      .restoreCameraState({ x: 292, y: 306.5, scale: .5, following: false }))
    expect(await pixel(page, 400, 300), 'overview uses the configured matching base').toEqual([255, 0, 0, 255])
    await page.evaluate(() => (window as typeof window & { fullMapScene?: { restoreCameraState: (s: object) => void } }).fullMapScene!
      .restoreCameraState({ x: 184, y: 313, scale: 1, following: false }))
    await expect.poll(() => page.evaluate(() => (window as typeof window & { fullMapDecoded?: number }).fullMapDecoded ?? 0)).toBe(4)
    expect(await pixel(page, 100, 300)).toEqual([102, 204, 255, 255])
    expect(oldBaseRequests).toEqual([])
  } finally { release(); await page.unrouteAll({ behavior: 'wait' }) }
})
