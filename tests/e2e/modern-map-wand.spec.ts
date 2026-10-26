import { test, expect } from '@playwright/test'

for (const profile of ['original', 'hd'] as const) test(`${profile} 医院外卡片格实际渲染双星魔杖`, async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 700 })
  await page.goto('/modern.html')
  await page.setContent('<div id="board" style="width:800px;height:600px"></div>')
  await page.evaluate(async profile => {
    const scenePath = '/src/modern/features/map/MapScene.ts', assetsPath = '/src/modern/features/characters/assets.ts', mapPath = '/src/modern/data/map.json', hdPath = '/src/modern/features/assets/hd-map-art.ts'
    const [{ createMapScene }, { parseAssetManifest }, map, { loadHdMapArtwork }] = await Promise.all([import(scenePath), import(assetsPath), import(mapPath), import(hdPath)])
    const manifest = parseAssetManifest(await (await fetch('/assets/manifest.json')).json())
    const abort = new AbortController()
    const hd = profile === 'hd' ? await loadHdMapArtwork(manifest.map, abort.signal) : undefined
    const scene = await createMapScene(document.querySelector('#board'), map.default, manifest, { signal: abort.signal, onFrame: () => {}, assetProfile: profile, mapBase: hd?.baseMap, mapRegions: hd?.regions, textureResolutions: Object.fromEntries((hd?.regions ?? []).map((region: { url: string; pixelDensity: number }) => [region.url, region.pixelDensity])) })
    scene.restoreCameraState({ x: 400 - 18*56 - 28, y: 320 - 2*40 - 20, scale: 1, following: false }); scene.showMarkers(false); scene.setPaused(true); scene.setPlaying(false)
  }, profile)
  await expect.poll(async () => {
    const bytes = await page.locator('#board canvas').screenshot()
    return page.evaluate(async base64 => {
      const bitmap = await createImageBitmap(new Blob([Uint8Array.from(atob(base64), c => c.charCodeAt(0))], { type: 'image/png' }))
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height), context = canvas.getContext('2d')!
      context.drawImage(bitmap, 0, 0); bitmap.close()
      const pixels = context.getImageData(365, 255, 80, 95).data
      let gold = 0
      for (let i = 0; i < pixels.length; i += 4) if (pixels[i]! > 140 && pixels[i+1]! > 105 && pixels[i+1]! < pixels[i]!*0.95 && pixels[i+2]! < 100) gold++
      return gold
    }, bytes.toString('base64'))
  }, { timeout: 5000 }).toBeGreaterThan(10)
  await page.screenshot({ path: `/tmp/starcat-wand-${profile}.png` })
})
