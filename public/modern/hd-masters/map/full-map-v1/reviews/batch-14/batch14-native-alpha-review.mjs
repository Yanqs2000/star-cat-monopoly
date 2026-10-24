import { chromium } from 'playwright'
import fs from 'node:fs/promises'

const dir = process.cwd() + '/public/modern/hd-masters/map/full-map-v1/reviews/batch-14'
const regions = JSON.parse(await fs.readFile(dir + '/regions.json', 'utf8'))
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const page = await browser.newPage({ viewport: { width: 1600, height: 1460 }, deviceScaleFactor: 1 })
const errors = [], requests = [], views = []
page.on('pageerror', error => errors.push(error.message))
page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`) })
page.on('request', request => requests.push(new URL(request.url()).pathname))
await page.addInitScript(rects => {
  const state = window.reviewAssets = { pending:0,decoded:[],legacyBaseCulls:0 }
  const fetchOriginal = window.fetch.bind(window), blobs = new WeakMap()
  window.fetch = async (...args) => {
    const url = String(args[0])
    // Review-only legacy-base culling: simulate replacement, not overlay on old art.
    // Generated RGBA files and production source map are never modified.
    if (/\/(?:assets\/map\.png|assets-hd\/map\.webp)$/.test(url)) {
      const response = await fetchOriginal(...args)
      const bitmap = await bitmapOriginal(await response.blob())
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
      const context = canvas.getContext('2d'); context.drawImage(bitmap, 0, 0)
      const sx=bitmap.width/2700,sy=bitmap.height/2552
      for (const [x,y,w,h] of rects) context.clearRect(x*sx,y*sy,w*sx,h*sy)
      const samples=rects.map(([x,y,w,h])=>context.getImageData(Math.floor((x+w/2)*sx),Math.floor((y+h/2)*sy),1,1).data[3])
      if(samples.some(alpha=>alpha!==0)) throw new Error('Legacy base culling did not clear native cores')
      const underlayZeroAlphaSamples=[[656,548],[656,804]].map(([x,y])=>context.getImageData(Math.floor(x*sx),Math.floor(y*sy),1,1).data[3]);if(underlayZeroAlphaSamples.some(alpha=>alpha!==0)) throw new Error('Native pilot underlay strip was not cleared from legacy base')
      state.legacyBase={url,pixelSize:[bitmap.width,bitmap.height],logicalScale:[sx,sy],rectCount:rects.length,zeroAlphaSamples:samples,underlayZeroAlphaSamples}
      bitmap.close(); state.legacyBaseCulls++
      return new Response(await canvas.convertToBlob({ type: 'image/png' }), { status:200, headers:{'Content-Type':'image/png'} })
    }
    if (!/reviews\/batch-14\/|hd-map\/region-11-9\//.test(url)) return fetchOriginal(...args)
    state.pending++
    try {
      const response = await fetchOriginal(...args)
      if (!response.ok) { state.pending--; return response }
      const blobOriginal = response.blob.bind(response)
      response.blob = async () => {
        try { const blob = await blobOriginal(); blobs.set(blob, url); return blob }
        catch (error) { state.pending--; throw error }
      }
      return response
    } catch (error) { state.pending--; throw error }
  }
  const bitmapOriginal = window.createImageBitmap.bind(window)
  window.createImageBitmap = async (...args) => {
    const url = blobs.get(args[0])
    try {
      const bitmap = await bitmapOriginal(...args)
      if (url) state.decoded.push({ url, width: bitmap.width, height: bitmap.height })
      return bitmap
    } finally { if (url) state.pending-- }
  }
}, regions.map(region => region.replacementRect ?? region.coreRect))
await page.goto('http://127.0.0.1:5198/modern.html')
await page.setContent('<html><body style="margin:0;background:#66ccff"><div id="board" style="width:1600px;height:1400px"></div></body></html>')
await page.evaluate(async regions => {
  const [{ createMapScene }, { parseAssetManifest }, { loadHdMapRegions }, map] = await Promise.all([
    import('/src/modern/features/map/MapScene.ts'), import('/src/modern/features/characters/assets.ts'),
    import('/src/modern/features/assets/hd-map-art.ts'), import('/src/modern/data/map.json')])
  const manifest = parseAssetManifest(await fetch('/assets/manifest.json').then(response => response.json()))
  const signal = new AbortController().signal, approved = await loadHdMapRegions(manifest.map, signal), all = [...regions, ...approved]
  const scene = await createMapScene(document.querySelector('#board'), map.default, manifest, {
    signal, onFrame: () => {}, assetProfile: 'hd', requiredTextureUrls: all.map(region => region.url),
    textureResolutions: Object.fromEntries(all.map(region => [region.url, region.pixelDensity])), mapRegions: all,
    onAssetError: error => { throw error },
  })
  scene.showMarkers(false); scene.setPaused(true); scene.setPlaying(false); window.reviewScene = scene
}, regions)
if (!await page.evaluate(() => window.reviewAssets.legacyBaseCulls>0)) throw new Error('Legacy map base was not culled: replacement simulation is invalid')
async function capture(name, width, height, zoom, cx, cy, clip) {
  await page.setViewportSize({ width, height: height + 60 })
  const result = await page.evaluate(async ({ width, height, zoom, cx, cy }) => {
    const board = document.querySelector('#board'); board.style.width = width + 'px'; board.style.height = height + 'px'
    const scene = window.reviewScene; scene.resize(width, height)
    const viewportScale = Math.min(width / 800, height / 600), scale = zoom / viewportScale
    scene.restoreCameraState({ x: 400 - (cx - 184) * scale, y: 300 - (cy - 313) * scale, scale, following: false })
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    return { camera: scene.getCameraState(), viewportScale, actualScreenScale: zoom, sourceFocus: [cx, cy] }
  }, { width, height, zoom, cx, cy })
  await page.waitForFunction(() => window.reviewAssets.pending === 0, null, { timeout: 45000 })
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  const decoding = await page.evaluate(() => ({ pending: window.reviewAssets.pending, decodedCount: window.reviewAssets.decoded.length }))
  if (clip) await page.screenshot({ path: dir + '/' + name + '.png', clip })
  else await page.locator('#board').screenshot({ path: dir + '/' + name + '.png' })
  views.push({ name, width, height, ...result, ...decoding, clip })
}
await capture('overview',1800,1600,0.85,1450,1280)
await capture('central-west-whole-2x',1500,1300,2,1100,1260)
await capture('TOMORROW-CITY-whole-2x',1500,1300,2,1260,1220)
await capture('TOMORROW-left-4x',1200,1200,4,1160,1160,{x:200,y:200,width:800,height:800})
await capture('TOMORROW-right-4x',1200,1200,4,1340,1280,{x:200,y:200,width:800,height:800})
await capture('sign-old-west-context-4x',1200,1200,4,1120,1320,{x:200,y:200,width:800,height:800})
await capture('sign-old-east-context-4x',1200,1200,4,1415,1135,{x:200,y:200,width:800,height:800})
await capture('r5c4-left-4x',1200,1200,4,896,1290,{x:200,y:200,width:800,height:800})
await capture('r5c4-right-4x',1200,1200,4,1152,1290,{x:200,y:200,width:800,height:800})
await capture('r5c4-top-4x',1200,1200,4,1024,1172,{x:200,y:200,width:800,height:800})
await capture('r5c4-bottom-4x',1200,1200,4,1024,1412,{x:200,y:200,width:800,height:800})
await capture('white-parcels-west-whole-4x',1200,1200,4,1168,1350,{x:200,y:200,width:800,height:800})
await capture('white-parcels-patch-left-4x',1200,1200,4,1080,1352,{x:200,y:200,width:800,height:800})
await capture('white-parcels-patch-right-4x',1200,1200,4,1256,1352,{x:200,y:200,width:800,height:800})
await capture('white-parcels-patch-top-4x',1200,1200,4,1168,1264,{x:200,y:200,width:800,height:800})
await capture('white-parcels-patch-bottom-4x',1200,1200,4,1168,1440,{x:200,y:200,width:800,height:800})
await capture('r4c6-whole-2x',1500,1300,2,1512,1050)
await capture('r4c6-left-4x',1200,1200,4,1392,1050,{x:200,y:200,width:800,height:800})
await capture('r4c6-right-4x',1200,1200,4,1632,1050,{x:200,y:200,width:800,height:800})
await capture('r4c6-bottom-4x',1200,1200,4,1512,1172,{x:200,y:200,width:800,height:800})
await capture('r4c6-top-4x',1200,1200,4,1512,932,{x:200,y:200,width:800,height:800})
await capture('r3c6-whole-2x',1500,1300,2,1512,810)
await capture('r3c6-left-4x',1200,1200,4,1392,810,{x:200,y:200,width:800,height:800})
await capture('r3c6-right-4x',1200,1200,4,1632,810,{x:200,y:200,width:800,height:800})
await capture('r3c6-bottom-4x',1200,1200,4,1512,932,{x:200,y:200,width:800,height:800})
await capture('r3c6-sky-inlet-4x',1200,1200,4,1440,680,{x:200,y:200,width:800,height:800})
await capture('r3c5-unfinished-top16-4x',1200,1200,4,1380,680,{x:200,y:200,width:800,height:800})
await capture('r2c7-whole-2x',1500,1300,2,1752,548)
await capture('r2c7-right-4x',1200,1200,4,1872,548,{x:200,y:200,width:800,height:800})
await capture('r2c7-bottom-4x',1200,1200,4,1752,676,{x:200,y:200,width:800,height:800})
await capture('r2c7-top-4x',1200,1200,4,1752,420,{x:200,y:200,width:800,height:800})
await capture('r2c7-left-4x',1200,1200,4,1632,548,{x:200,y:200,width:800,height:800})
await capture('gateway-whole-4x',1200,1200,4,1890,560,{x:200,y:200,width:800,height:800})
await capture('long-lane-complete-whole-4x',1200,1200,4,1200,1300,{x:200,y:200,width:800,height:800})
await fs.writeFile(dir + '/native-alpha-browser-verification.json', JSON.stringify({ renderer: 'actual createMapScene / Pixi',
  browser: 'local Chrome / SwiftShader', fixtureOnly: true, productionManifestModified: false, legacyBaseCulledForReviewCoreReplacement:true, nativeRgbaFilesUnmodified:true,
  regionCount: regions.length, legacyApprovedTilesAlsoLoaded: 4, allTextureResolutionsRegistered: true, legacyBaseCulling: await page.evaluate(() => ({calls:window.reviewAssets.legacyBaseCulls,...window.reviewAssets.legacyBase})),
  protectedPilotDrawnAboveNativeContextUnderlay: true, protectedPilotUnderlayLabels:['r2c2','r3c2'], commonNativeGrid: true, bleedPixels: 0, nonOverlappingGridDrawRects: true, waitsForNativeBitmapDecoding: true, views,
  requestedReviewAtlases: requests.filter(path => path.includes('/reviews/batch-14/')), errors }, null, 2) + '\n')
await browser.close()
if (errors.length) throw new Error(errors.join('\n'))
console.log(JSON.stringify({ actualMapSceneViews: views.length, decodedPendingAtCaptures: views.map(view => view.pending), errors }))
