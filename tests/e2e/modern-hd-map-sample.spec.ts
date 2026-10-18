import { expect, test, type Page } from '@playwright/test'

async function startGame(page: Page, profile: 'original' | 'hd') {
  await page.addInitScript(() => {
    window.createImageBitmap = new Proxy(window.createImageBitmap, {
      async apply(target, thisArg, args) {
        const bitmap = await Reflect.apply(target, thisArg, args) as ImageBitmap
        if (bitmap.width === 1119 && bitmap.height === 1119) {
          const state = window as typeof window & { decodedMapTiles?: number }
          state.decodedMapTiles = (state.decodedMapTiles ?? 0) + 1
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

test('高清模式显示已验收地图样本，保留人物资源和画质切换前后的完整对局状态', async ({ browser }, testInfo) => {
  test.setTimeout(150_000)
  let originalState: string | null = null
  for (const profile of ['original', 'hd'] as const) {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 })
    const tiles: string[] = []
    const characterArt: string[] = []
    const errors: string[] = []
    page.on('request', request => {
      const path = new URL(request.url()).pathname
      if (/^\/hd-map\/region-11-9\/r[01]c[01]\.webp$/.test(path)) tiles.push(path)
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
        await expect.poll(() => new Set(tiles).size, { timeout: 10_000 }).toBe(4)
        expect(state).toBe(originalState)
        await page.getByRole('button', { name: '暂停对局', exact: true }).click()
        await page.getByLabel('对局素材画质').selectOption('original')
        await expect(page.getByTestId('asset-profile-busy')).toHaveCount(0)
        await expect(fingerprint).toHaveAttribute('data-state-json', state!)
        await page.getByLabel('对局素材画质').selectOption('hd')
        await expect(page.getByTestId('asset-profile-busy')).toHaveCount(0)
        await expect.poll(() => tiles.length).toBeGreaterThanOrEqual(8)
        await waitForMapRender(page, 8)
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
  let release!: () => void
  const gate = new Promise<void>(resolve => { release = resolve })
  await page.route('**/hd-map/region-11-9/r0c0.webp', async route => {
    if (fail) {
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
    await expect(page.getByRole('alert')).toContainText('r0c0.webp')
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
    if (request.url().includes('/hd-map/region-11-9/')) requests.push(request.url())
  })
  await page.addInitScript(() => {
    const close = ImageBitmap.prototype.close
    ImageBitmap.prototype.close = function () {
      const state = window as typeof window & { closedBitmaps?: number }
      state.closedBitmaps = (state.closedBitmaps ?? 0) + 1
      close.call(this)
    }
  })
  await startGame(page, 'hd')
  await expect.poll(() => new Set(requests).size).toBe(4)
  await waitForMapRender(page, 4)
  const before = await page.evaluate(() => (window as typeof window & { closedBitmaps?: number }).closedBitmaps ?? 0)
  const state = await page.getByTestId('game-state-fingerprint').getAttribute('data-state-json')
  await page.getByRole('button', { name: '全图', exact: true }).click()
  await expect.poll(() => page.evaluate(() => (window as typeof window & { closedBitmaps?: number }).closedBitmaps ?? 0))
    .toBeGreaterThanOrEqual(before + 4)
  await page.getByRole('button', { name: '跟随当前玩家' }).click()
  await expect.poll(() => requests.length).toBeGreaterThanOrEqual(8)
  await waitForMapRender(page, 8)
  await expect(page.getByTestId('game-state-fingerprint')).toHaveAttribute('data-state-json', state!)
  await page.screenshot({ path: testInfo.outputPath('hd-1366x768.png'), fullPage: true })
})
