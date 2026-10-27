import { revealGameDetails } from './modern-play'
import { expect, test, type Page } from '@playwright/test'

async function startGame(page: Page, profile: 'original' | 'hd') {
  await page.addInitScript(() => {
    const mapBlobs = new WeakSet<Blob>()
    const liveMapBitmaps = new WeakSet<ImageBitmap>()
    const closeOriginal = ImageBitmap.prototype.close
    ImageBitmap.prototype.close = function () {
      if (liveMapBitmaps.delete(this)) {
        const state = window as typeof window & { liveMapTiles?: number }
        state.liveMapTiles = (state.liveMapTiles ?? 0) - 1
      }
      closeOriginal.call(this)
    }
    const fetchOriginal = window.fetch.bind(window)
    window.fetch = async (...args) => {
      const response = await fetchOriginal(...args)
      if (/hd-map\/full-map-v1\/part-\d+\.webp/.test(String(args[0]))) {
        const blobOriginal = response.blob.bind(response)
        response.blob = async () => { const blob = await blobOriginal(); mapBlobs.add(blob); return blob }
      }
      return response
    }
    window.createImageBitmap = new Proxy(window.createImageBitmap, {
      async apply(target, thisArg, args) {
        const bitmap = await Reflect.apply(target, thisArg, args) as ImageBitmap
        if (mapBlobs.has(args[0] as Blob)) {
          const state = window as typeof window & { decodedMapTiles?: number; liveMapTiles?: number }
          state.decodedMapTiles = (state.decodedMapTiles ?? 0) + 1
          state.liveMapTiles = (state.liveMapTiles ?? 0) + 1
          liveMapBitmaps.add(bitmap)
        }
        return bitmap
      },
    })
    const random = crypto.getRandomValues.bind(crypto)
    crypto.getRandomValues = array => {
      if (array instanceof Uint32Array && array.length === 1) { array[0] = 1327; return array }
      return random(array)
    }
    Date.prototype.getDay = () => 1
    Date.prototype.getFullYear = () => 2026
    Date.prototype.getMonth = () => 9
    Date.prototype.getDate = () => 4
  })
  await page.goto('/modern.html')
  await expect(page).toHaveTitle(/星猫大富翁/)
  await page.getByLabel('素材画质', { exact: true }).selectOption(profile)
  await expect(page.getByTestId('asset-profile-busy')).toHaveCount(0)
  for (const id of [1, 2, 3, 4]) await page.getByTestId(`character-${id}`).click()
  await page.getByRole('button', { name: '开始对局' }).click()
  await expect(page.getByText('对局已载入', { exact: true })).toBeVisible()
  await expect(page.locator('canvas')).toBeVisible()
}

async function waitForMapRender(page: Page, count: number) {
  await expect.poll(() => page.evaluate(() => (window as typeof window & { decodedMapTiles?: number }).decodedMapTiles ?? 0))
    .toBeGreaterThanOrEqual(count)
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
}

test('高清模式显示完整静态地图，保留人物资源和画质切换前后的完整对局状态', async ({ browser }, testInfo) => {
  test.setTimeout(150_000)
  let originalState: string | null = null
  for (const profile of ['original', 'hd'] as const) {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 })
    const tiles: string[] = []
    const characterArt: string[] = []
    const errors: string[] = []
    page.on('request', request => {
      const path = new URL(request.url()).pathname
      if (/^\/hd-map\/full-map-v1\/part-\d+\.webp$/.test(path)) tiles.push(path)
      if (path.includes('/hd-art/characters/') || path.includes('/hd-masters/characters/')) characterArt.push(path)
    })
    page.on('pageerror', error => errors.push(error.message))
    page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`) })
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
    try {
      await startGame(page, profile)
      const fingerprint = page.getByTestId('game-state-fingerprint')
      const state = await fingerprint.getAttribute('data-state-json')
      expect(state).toBeTruthy()
      if (profile === 'original') {
        originalState = state
        expect(tiles).toEqual([])
      } else {
        await expect.poll(() => new Set(tiles).size, { timeout: 10_000 }).toBeGreaterThan(1)
        const initialCount = new Set(tiles).size
        await waitForMapRender(page, initialCount)
        expect(state).toBe(originalState)
        await page.getByRole('button', { name: '暂停对局', exact: true }).click()
        await page.getByLabel('对局素材画质').selectOption('original')
        await expect(page.getByTestId('asset-profile-busy')).toHaveCount(0)
        await expect(fingerprint).toHaveAttribute('data-state-json', state!)
        await page.getByLabel('对局素材画质').selectOption('hd')
        await expect(page.getByTestId('asset-profile-busy')).toHaveCount(0)
        await expect.poll(() => tiles.length).toBeGreaterThanOrEqual(initialCount * 2)
        await waitForMapRender(page, initialCount * 2)
        await expect(fingerprint).toHaveAttribute('data-state-json', state!)
      }
      await page.screenshot({ path: testInfo.outputPath(`${profile}-map.png`), fullPage: true })
      expect(characterArt).toEqual([])
      expect(errors).toEqual([])
    } finally { await page.close() }
  }
})

test('地图切片404后可以重试，且不推进对局', async ({ page }) => {
  test.setTimeout(120_000)
  let fail = true
  let failedPath = ''
  let release!: () => void
  const gate = new Promise<void>(resolve => { release = resolve })
  await page.route('**/hd-map/full-map-v1/part-*.webp', async route => {
    failedPath ||= new URL(route.request().url()).pathname
    if (fail && new URL(route.request().url()).pathname === failedPath) {
      await gate
      await route.fulfill({ status: 404, body: 'map tile failure' })
    } else await route.continue()
  })
  try {
    await startGame(page, 'hd')
    const before = await page.getByTestId('game-state-fingerprint').getAttribute('data-state-json')
    expect(before).toBeTruthy()
    release()
    await expect(page.getByText('加载失败', { exact: true })).toBeVisible()
    await expect(page.getByRole('alert')).toContainText(failedPath.split('/').pop()!)
    fail = false
    await page.getByRole('button', { name: '重试载入' }).click()
    await expect(page.getByText('对局已载入', { exact: true })).toBeVisible()
    await expect(page.getByTestId('game-state-fingerprint')).toHaveAttribute('data-state-json', before!)
  } finally { release(); await page.unrouteAll({ behavior: 'wait' }) }
})

test('1366桌面全图概览释放地图补片，恢复跟随后重新加载', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1366, height: 768 })
  const requests: string[] = []
  page.on('request', request => {
    if (/\/hd-map\/full-map-v1\/part-\d+\.webp/.test(request.url())) requests.push(request.url())
  })
  await startGame(page, 'hd')
  await expect.poll(() => new Set(requests).size).toBeGreaterThan(1)
  const initialCount = new Set(requests).size
  await waitForMapRender(page, initialCount)
  await expect.poll(() => page.evaluate(() => (window as typeof window & { liveMapTiles?: number }).liveMapTiles ?? 0)).toBeGreaterThan(0)
  const before = await page.evaluate(() => (window as typeof window & { decodedMapTiles?: number }).decodedMapTiles ?? 0)
  const beforeRequests = requests.length
  const state = await page.getByTestId('game-state-fingerprint').getAttribute('data-state-json')
  await revealGameDetails(page); await page.getByRole('button', { name: '全图', exact: true }).click()
  await expect.poll(() => page.evaluate(() => (window as typeof window & { liveMapTiles?: number }).liveMapTiles ?? 0)).toBe(0)
  await revealGameDetails(page); await page.getByRole('button', { name: '跟随当前玩家' }).click()
  await expect.poll(() => requests.length).toBeGreaterThan(beforeRequests)
  await waitForMapRender(page, before + 1)
  await expect.poll(() => page.evaluate(() => (window as typeof window & { liveMapTiles?: number }).liveMapTiles ?? 0)).toBeGreaterThan(0)
  await expect(page.getByTestId('game-state-fingerprint')).toHaveAttribute('data-state-json', state!)
  await page.screenshot({ path: testInfo.outputPath('hd-1366x768.png'), fullPage: true })
})
