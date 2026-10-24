import { expect, test } from '@playwright/test'

const cases = [
  { name: '高窗口上下扩展区域', width: 800, height: 1200, rect: [5980, 5460, 40, 40], probe: [400, 80] },
  { name: '宽窗口左右扩展区域', width: 1600, height: 600, rect: [5260, 5980, 40, 40], probe: [80, 300] },
]

for (const fixture of cases) {
  test(`${fixture.name}内的可见地图小切片仍会载入`, async ({ page }) => {
    await page.setViewportSize({ width: fixture.width + 40, height: fixture.height + 40 })
    await page.goto('/modern.html')
    const image = await page.evaluate(() => {
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = 160
      const context = canvas.getContext('2d')!
      context.fillStyle = '#ff0000'; context.fillRect(0, 0, 160, 160)
      return canvas.toDataURL('image/png').split(',')[1]!
    })
    await page.route('**/map-bounds-fixture/tile.png', route => route.fulfill({
      contentType: 'image/png', body: Buffer.from(image, 'base64'),
    }))
    await page.setContent(`<div id="board" style="width:${fixture.width}px;height:${fixture.height}px"></div>`)
    await page.evaluate(async ({ width, height, rect }) => {
      const scenePath = '/src/modern/features/map/MapScene.ts'
      const assetsPath = '/src/modern/features/characters/assets.ts'
      const mapPath = '/src/modern/data/map.json'
      const [{ createMapScene }, { parseAssetManifest }, map] = await Promise.all([
        import(scenePath), import(assetsPath), import(mapPath),
      ])
      const manifest = parseAssetManifest(await fetch('/assets/manifest.json').then(response => response.json()))
      const url = 'map-bounds-fixture/tile.png'
      const scene = await createMapScene(document.querySelector('#board'), map.default, manifest, {
        signal: new AbortController().signal, onFrame: () => {}, assetProfile: 'hd',
        mapRegions: [{ url, logicalRect: rect, scenePosition: [rect[0]! - 184, rect[1]! - 313], pixelDensity: 4 }],
        textureResolutions: { [url]: 4 },
      })
      scene.resize(width, height); scene.showMarkers(false); scene.setPaused(true); scene.setPlaying(false)
      scene.restoreCameraState({ x: 400 - (6000 - 184), y: 300 - (6000 - 313), scale: 1, following: false })
    }, fixture)
    await expect.poll(async () => {
      const shot = await page.locator('#board canvas').screenshot()
      return page.evaluate(async ({ data, probe }) => {
        const bytes = Uint8Array.from(atob(data), value => value.charCodeAt(0))
        const bitmap = await createImageBitmap(new Blob([bytes], { type: 'image/png' }))
        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height); const context = canvas.getContext('2d')!
        context.drawImage(bitmap, 0, 0); bitmap.close()
        return [...context.getImageData(probe[0]!, probe[1]!, 1, 1).data]
      }, { data: shot.toString('base64'), probe: fixture.probe })
    }, { timeout: 3000, intervals: [100, 250, 500], message: 'Actually visible edge tile must replace the sky color' })
      .toEqual([255, 0, 0, 255])
  })
}
