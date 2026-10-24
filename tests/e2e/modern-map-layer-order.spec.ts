import { expect, test } from '@playwright/test'

test('地图前景在底座较晚载入和镜头往返后仍显示在上层', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 700 })
  await page.addInitScript(() => {
    const original = window.createImageBitmap.bind(window)
    window.createImageBitmap = (async (...args: Parameters<typeof createImageBitmap>) => {
      const bitmap = await (original as (...values: unknown[]) => Promise<ImageBitmap>)(...args)
      if (bitmap.width === 167 && bitmap.height === 167) {
        const state = window as typeof window & { orderDecoded?: number }
        state.orderDecoded = (state.orderDecoded ?? 0) + 1
      }
      return bitmap
    }) as typeof createImageBitmap
  })
  await page.goto('/modern.html')
  const images = await page.evaluate(() => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 167
    const context = canvas.getContext('2d')!
    context.fillStyle = '#0000ff'; context.fillRect(0, 0, 167, 167)
    const base = canvas.toDataURL('image/png').split(',')[1]!
    context.clearRect(0, 0, 167, 167)
    context.fillStyle = '#ff0000'; context.fillRect(48, 48, 71, 71)
    return { base, prop: canvas.toDataURL('image/png').split(',')[1]! }
  })
  await page.route('**/map-order-fixture/*.png', async route => {
    const base = route.request().url().endsWith('/base.png')
    if (base) await new Promise(resolve => setTimeout(resolve, 250))
    await route.fulfill({ contentType: 'image/png', body: Buffer.from(base ? images.base : images.prop, 'base64') })
  })
  await page.setContent('<div id="board" style="width:800px;height:600px"></div>')
  await page.evaluate(async () => {
    const scenePath = '/src/modern/features/map/MapScene.ts'
    const assetsPath = '/src/modern/features/characters/assets.ts'
    const mapPath = '/src/modern/data/map.json'
    const [{ createMapScene }, { parseAssetManifest }, map] = await Promise.all([
      import(scenePath), import(assetsPath), import(mapPath),
    ])
    const manifest = parseAssetManifest(await fetch('/assets/manifest.json').then(response => response.json()))
    const regions = ['base', 'prop'].map(name => ({
      url: `map-order-fixture/${name}.png`, logicalRect: [6000, 6000, 41.75, 41.75],
      scenePosition: [5816, 5687], pixelDensity: 4,
    }))
    const scene = await createMapScene(document.querySelector('#board'), map.default, manifest, {
      signal: new AbortController().signal, onFrame: () => {}, assetProfile: 'hd', mapRegions: regions,
      textureResolutions: Object.fromEntries(regions.map(region => [region.url, 4])),
    })
    scene.resize(800, 600); scene.showMarkers(false); scene.setPaused(true); scene.setPlaying(false)
    const state = window as typeof window & { orderScene?: typeof scene; orderDecoded?: number }
    state.orderScene = scene; state.orderDecoded = 0
  })
  for (let visit = 0; visit < 3; visit++) {
    await page.evaluate(async () => {
      const scene = (window as typeof window & { orderScene?: { restoreCameraState: (state: object) => void } }).orderScene!
      scene.restoreCameraState({ x: 0, y: 0, scale: 1, following: false })
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      scene.restoreCameraState({ x: 400 - (6020.875 - 184), y: 300 - (6020.875 - 313), scale: 1, following: false })
    })
    await expect.poll(() => page.evaluate(() => (window as typeof window & { orderDecoded?: number }).orderDecoded ?? 0))
      .toBe((visit + 1) * 2)
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
    const shot = await page.locator('#board canvas').screenshot()
    const pixel = await page.evaluate(async data => {
      const bytes = Uint8Array.from(atob(data), character => character.charCodeAt(0))
      const bitmap = await createImageBitmap(new Blob([bytes], { type: 'image/png' }))
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height); const context = canvas.getContext('2d')!
      context.drawImage(bitmap, 0, 0); bitmap.close()
      return [...context.getImageData(400, 300, 1, 1).data]
    }, shot.toString('base64'))
    expect(pixel, `visit ${visit}: delayed base must not hide the foreground`).toEqual([255, 0, 0, 255])
  }
})
