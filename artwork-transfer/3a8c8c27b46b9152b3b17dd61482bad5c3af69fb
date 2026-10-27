import { expect, test, type Browser, type Page } from '@playwright/test'
import { readFile, stat } from 'node:fs/promises'
import { revealGameDetails, playUntil } from './modern-play'

type Profile = 'original' | 'hd'
type StateSnapshot = Record<string, unknown> & { rngState: number }

async function start(page: Page, profile: Profile, seed: number, options: {
  characters?: number[]
  date?: { year: number; month: number; day: number }
} = {}) {
  const date = options.date ?? { year: 2026, month: 9, day: 28 }
  await page.addInitScript(({ seed, date }) => {
    const original = crypto.getRandomValues.bind(crypto)
    crypto.getRandomValues = array => {
      if (array instanceof Uint32Array && array.length === 1) { array[0] = seed; return array }
      return original(array)
    }
    Date.prototype.getDay = () => 1
    Date.prototype.getFullYear = () => date.year
    Date.prototype.getMonth = () => date.month - 1
    Date.prototype.getDate = () => date.day
  }, { seed, date })
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/modern.html')
  await page.getByLabel('素材画质').selectOption(profile)
  for (const id of options.characters ?? [1]) await page.getByTestId(`character-${id}`).click()
  await page.getByRole('button', { name: '开始对局' }).click()
  await expect(page.getByRole('status')).toContainText('对局已载入',{timeout:90000})
  await revealGameDetails(page); await page.getByLabel('速度').selectOption('2')
}

async function serializedGameState(page: Page): Promise<StateSnapshot> {
  const state = await page.getByTestId('game-state-fingerprint').getAttribute('data-state-json')
  expect(state, 'the complete serialized GameState must be available for a field-by-field replay comparison').not.toBeNull()
  const parsed = JSON.parse(state!) as StateSnapshot
  expect(Number.isInteger(parsed.rngState), 'the replay snapshot must include the authoritative RNG state').toBe(true)
  return parsed
}

async function compareReplay(browser: Browser, replay: (page: Page, profile: Profile) => Promise<StateSnapshot[]>) {
  const originalPage = await browser.newPage()
  const hdPage = await browser.newPage()
  const pageErrors: string[] = []
  const consoleErrors: string[] = []
  for (const page of [originalPage, hdPage]) {
    page.on('pageerror', error => pageErrors.push(error.message))
    page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()) })
  }
  try {
    const [original, hd] = await Promise.all([
      replay(originalPage, 'original'),
      replay(hdPage, 'hd'),
    ])
    expect(hd).toHaveLength(original.length)
    for (let checkpoint = 0; checkpoint < original.length; checkpoint++) {
      expect(hd[checkpoint], `complete GameState checkpoint ${checkpoint}`).toEqual(original[checkpoint])
    }
    expect(pageErrors).toEqual([])
    expect(consoleErrors).toEqual([])
  } finally {
    await originalPage.close()
    await hdPage.close()
  }
}

test('原版与高清同种子开局、选人、掷骰后完整GameState逐字段一致', async ({ browser }) => {
  await compareReplay(browser, async (page, profile) => {
    await start(page, profile, 123456789)
    const initial = await serializedGameState(page)
    await page.getByRole('button', { name: '掷骰' }).click()
    await expect(page.getByTestId('last-roll')).not.toHaveText('骰子 —')
    return [initial, await serializedGameState(page)]
  })
})

test('原版与高清同局公司认购后完整GameState逐字段一致', async ({ browser }) => {
  test.setTimeout(180_000)
  await compareReplay(browser, async (page, profile) => {
    await start(page, profile, 16, { date: { year: 2026, month: 9, day: 27 } })
    const snapshots = [await serializedGameState(page)]
    await playUntil(page, () => page.getByTestId('company-subscribe').count().then(Boolean), 700)
    await expect(page.getByTestId('interaction-panel')).toContainText('电力公司')
    await page.getByTestId('company-subscribe').click()
    await page.getByRole('button', { name: '最大', exact: true }).click()
    await page.getByRole('button', { name: '确定认购', exact: true }).click()
    await expect(page.getByTestId('interaction-panel')).toContainText('持股 +1000')
    snapshots.push(await serializedGameState(page))
    await page.getByTestId('interaction-acknowledge').click()
    await expect(page.getByRole('button', { name: '掷骰' })).toBeEnabled({ timeout: 60_000 })
    snapshots.push(await serializedGameState(page))
    return snapshots
  })
})

test('原版与高清同局NPC遭遇及结算后完整GameState逐字段一致', async ({ browser }) => {
  test.setTimeout(300_000)
  await compareReplay(browser, async (page, profile) => {
    await start(page, profile, 36)
    const snapshots = [await serializedGameState(page)]
    await playUntil(page, async () => {
      const who = await page.getByTestId('current-player').textContent()
      return !!who && who.includes('人类') && await page.locator('[data-clip="trait-12"]').count() > 0
    }, 2200)
    await expect(page.getByTestId('interaction-acknowledge')).toBeVisible()
    await expect(page.getByTestId('activity-receipt')).toBeVisible()
    snapshots.push(await serializedGameState(page))
    return snapshots
  })
})

test('原版与高清同局魔法门转运后完整GameState逐字段一致', async ({ browser }) => {
  test.setTimeout(240_000)
  await compareReplay(browser, async (page, profile) => {
    await start(page, profile, 4)
    const snapshots = [await serializedGameState(page)]
    await playUntil(page, () => page.getByTestId('portal-1').count().then(Boolean), 700)
    await page.getByTestId('portal-1').click()
    await expect(page.getByTestId('interaction-panel')).toContainText('已抵达目的地', { timeout: 20_000 })
    snapshots.push(await serializedGameState(page))
    await page.getByTestId('interaction-acknowledge').click()
    await expect(page.getByRole('button', { name: '掷骰' })).toBeEnabled({ timeout: 60_000 })
    snapshots.push(await serializedGameState(page))
    return snapshots
  })
})

test('原版与高清同局彩票小游戏开奖结算后完整GameState逐字段一致', async ({ browser }) => {
  test.setTimeout(240_000)
  await compareReplay(browser, async (page, profile) => {
    await start(page, profile, 145)
    const snapshots = [await serializedGameState(page)]
    await playUntil(page, async () => {
      const who = await page.getByTestId('current-player').textContent()
      return !!who && !who.includes('AI') && await page.getByTestId('ludo-cell-7').count() > 0
    }, 2500)
    snapshots.push(await serializedGameState(page))
    await page.getByTestId('ludo-cell-7').click()
    await page.getByTestId('ludo-confirm').click()
    await expect(page.getByTestId('interaction-panel')).toContainText('投注结果', { timeout: 20_000 })
    snapshots.push(await serializedGameState(page))
    await page.getByTestId('interaction-acknowledge').click()
    await expect(page.getByRole('button', { name: '掷骰' })).toBeEnabled({ timeout: 60_000 })
    snapshots.push(await serializedGameState(page))
    return snapshots
  })
})

test('原版与高清同局跨月结算后完整GameState逐字段一致', async ({ browser }) => {
  test.setTimeout(360_000)
  await compareReplay(browser, async (page, profile) => {
    await start(page, profile, 1, {
      characters: [1, 2, 3, 4],
      date: { year: 2026, month: 9, day: 30 },
    })
    const snapshots = [await serializedGameState(page)]
    await playUntil(page, () => page.getByTestId('monthly-acknowledge').count().then(Boolean), 600)
    await expect(page.getByTestId('interaction-panel')).toContainText('2026年10月结算')
    snapshots.push(await serializedGameState(page))
    await page.getByTestId('monthly-acknowledge').click()
    await expect(page.locator('.funds')).toContainText('2026年10月2日', { timeout: 30_000 })
    snapshots.push(await serializedGameState(page))
    return snapshots
  })
})

test('生产高清开局记录下载量、解码内存估算及浏览器纹理尺寸上限', async ({ page }) => {
  const hdResponses: Array<{ path: string; status: number }> = []
  const pageErrors: string[] = []
  const consoleErrors: string[] = []
  page.on('pageerror', error => pageErrors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()) })
  page.on('response', response => {
    const path = new URL(response.url()).pathname
    if (!path.startsWith('/assets-hd/') && !path.startsWith('/hd-map/full-map-v1/') && !path.startsWith('/hd-static/')) return
    hdResponses.push({ path, status: response.status() })
  })
  // ResourceTiming measures large textures even when Chromium evicts their
  // response bodies from the inspector cache. Keep all startup entries.
  await page.addInitScript(() => performance.setResourceTimingBufferSize(10_000))
  await start(page, 'hd', 123456789)
  await page.waitForLoadState('networkidle')
  const browserMetrics = await page.evaluate(() => {
    const probe = document.createElement('canvas')
    const gl = probe.getContext('webgl2') ?? probe.getContext('webgl')
    if (!gl) throw new Error('Chromium 未提供可读取纹理上限的 WebGL 上下文')
    const maxTextureSize = Number(gl.getParameter(gl.MAX_TEXTURE_SIZE))
    gl.getExtension('WEBGL_lose_context')?.loseContext()

    const memory = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory
    return {
      maxTextureSize,
      jsHeapUsedBytes: memory?.usedJSHeapSize ?? null,
      resources: (performance.getEntriesByType('resource') as PerformanceResourceTiming[])
        .filter(entry => /^\/(?:assets-hd|hd-map\/full-map-v1|hd-static)\//.test(new URL(entry.name).pathname))
        .map(entry => ({ path: new URL(entry.name).pathname, encodedBodyBytes: entry.encodedBodySize, transferBytes: entry.transferSize })),
    }
  })
  const manifest = JSON.parse(await readFile('public/modern/assets-hd/hd-manifest.json', 'utf8')) as {
    files: Array<{ path: string; group: string; pixelSize: [number, number] }>
  }
  const fullMap = JSON.parse(await readFile('public/modern/hd-map/full-map-v1/manifest.json', 'utf8')) as {
    baseMap: { path: string; pixelSize: [number, number] }; mapRegions: Array<{ path: string; pixelSize: [number, number] }>
  }
  const staticArt = JSON.parse(await readFile('src/modern/data/static-hd-assets.json', 'utf8')) as {
    assets: Array<{ url: string; pixelSize: [number, number] }>
  }
  const files = [...manifest.files,
    ...[fullMap.baseMap, ...fullMap.mapRegions].map(file => ({ ...file, group: 'map-full' })),
    ...staticArt.assets.map(file => ({ path: file.url, pixelSize: file.pixelSize, group: 'static' }))]
  const responses = hdResponses
  const imagePaths = new Set(responses.filter(response => response.path.endsWith('.webp')).map(response => response.path))
  const loadedFiles = files.filter(file => imagePaths.has(`/${file.path}`))
  const loadedByGroup = loadedFiles.reduce<Record<string, { count: number; decodedRgbaBytes: number }>>((groups, file) => {
    const group = groups[file.group] ??= { count: 0, decodedRgbaBytes: 0 }
    group.count += 1
    group.decodedRgbaBytes += file.pixelSize[0] * file.pixelSize[1] * 4
    return groups
  }, {})
  const metrics = {
    ...browserMetrics,
    maxProfileDimension: Math.max(...files.flatMap(file => file.pixelSize)),
    hdResponseCount: responses.length,
    loadedHdImageCount: imagePaths.size,
    downloadedBytes: browserMetrics.resources.reduce((sum, resource) => sum + resource.transferBytes, 0),
    encodedResourceBytes: browserMetrics.resources.reduce((sum, resource) => sum + resource.encodedBodyBytes, 0),
    failedResponses: responses.filter(response => response.status >= 400).map(response => `${response.status} ${response.path}`),
    estimatedDecodedRgbaBytes: loadedFiles.reduce((sum, file) => sum + file.pixelSize[0] * file.pixelSize[1] * 4, 0),
    loadedByGroup,
  }
  console.log(`HD production resource audit ${JSON.stringify({ ...metrics, resources: undefined })}`)
  expect(metrics.maxProfileDimension).toBeLessThanOrEqual(metrics.maxTextureSize)
  expect(metrics.hdResponseCount).toBeGreaterThan(0)
  expect(metrics.loadedHdImageCount).toBeGreaterThan(0)
  expect(metrics.downloadedBytes).toBeGreaterThan(0)
  const baseBytes = (await stat(`public/modern/${fullMap.baseMap.path}`)).size
  expect(Math.max(...browserMetrics.resources.filter(resource => resource.path === `/${fullMap.baseMap.path}`).map(resource => resource.encodedBodyBytes))).toBe(baseBytes)
  expect(metrics.failedResponses).toEqual([])
  expect(metrics.estimatedDecodedRgbaBytes).toBeGreaterThan(0)
  expect(pageErrors).toEqual([])
  expect(consoleErrors).toEqual([])
})
