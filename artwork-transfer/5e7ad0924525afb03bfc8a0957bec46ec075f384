import { expect, test, type Page } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { revealGameDetails, playUntil } from './modern-play'

interface ReplayResult {
  profile: string
  portraits: number[]
  players: string
  round: string
  currentPlayer: string
  lastRoll: string
  history: string
  stateFingerprint: string | null
  hdRequests: string[]
  staticRequests: string[]
  failures: string[]
  pageErrors: string[]
}

async function replayProfile(page: Page, profile: 'original' | 'hd'): Promise<ReplayResult> {
  const requests: string[] = []
  const failures: string[] = []
  const pageErrors: string[] = []
  page.on('request', request => requests.push(new URL(request.url()).pathname))
  page.on('response', response => {
    if (response.status() >= 400) failures.push(`${response.status()} ${new URL(response.url()).pathname}`)
  })
  page.on('pageerror', error => pageErrors.push(error.message))
  await page.addInitScript(seed => {
    const original = crypto.getRandomValues.bind(crypto)
    crypto.getRandomValues = array => {
      if (array instanceof Uint32Array && array.length === 1) {
        array[0] = seed
        return array
      }
      return original(array)
    }
    Date.prototype.getDay = () => 1
    Date.prototype.getFullYear = () => 2026
    Date.prototype.getMonth = () => 9
    Date.prototype.getDate = () => 4
  }, 123456789)
  await page.goto('/modern.html')
  await expect(page.getByRole('heading', { name: '选择参赛角色' })).toBeVisible()
  await page.getByLabel('素材画质').selectOption(profile)
  await expect(page.getByLabel('素材画质')).toHaveValue(profile)
  await expect(page.getByTestId('asset-profile-busy')).toHaveCount(0)
  expect(await page.evaluate(() => localStorage.getItem('star-cat-monopoly:asset-profile'))).toBe(profile==='hd'?'hd':null)
  await page.reload()
  await expect(page.getByRole('heading', { name: '选择参赛角色' })).toBeVisible()
  await expect(page.getByLabel('素材画质')).toHaveValue(profile)
  await expect(page.getByTestId('asset-profile-busy')).toHaveCount(0)
  const portrait = page.locator('.portrait img').first()
  const expectedSize = profile === 'hd' ? [144, 192] : [72, 96]
  await expect.poll(() => portrait.evaluate(image => {
    const loaded = image as HTMLImageElement
    return [loaded.naturalWidth, loaded.naturalHeight]
  })).toEqual(expectedSize)

  for (const id of [1, 2, 3, 4]) await page.getByTestId(`character-${id}`).click()
  await page.getByRole('button', { name: '开始对局' }).click()
  await expect(page.getByRole('status')).toContainText('对局已载入')
  await expect(page.locator('canvas')).toHaveCount(1)
  const evidenceDir = 'docs/modernization/evidence/phase-5b'
  await mkdir(evidenceDir, { recursive: true })
  await page.screenshot({ path: `${evidenceDir}/${profile}-game-start.png`, fullPage: true })
  const players = await page.getByTestId('player-list').innerText()
  const round = await page.getByTestId('round').innerText()
  const currentPlayer = await page.getByTestId('current-player').innerText()
  await page.getByRole('button', { name: '掷骰' }).click()
  await expect(page.getByTestId('last-roll')).not.toHaveText('骰子 —')

  return {
    profile,
    portraits: expectedSize,
    players,
    round,
    currentPlayer,
    lastRoll: await page.getByTestId('last-roll').innerText(),
    history: await page.getByTestId('turn-history').innerText(),
    stateFingerprint: await page.getByTestId('game-state-fingerprint').getAttribute('data-fingerprint'),
    hdRequests: requests.filter(url => url.startsWith('/assets-hd/')),
    staticRequests: requests.filter(url => url.startsWith('/hd-static/')),
    failures,
    pageErrors,
  }
}

test('原版/高清入口使用对应像素倍率且同种子掷骰不改变对局输出', async ({ browser }) => {
  test.setTimeout(120_000)
  const originalPage = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const hdPage = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  try {
    const original = await replayProfile(originalPage, 'original')
    const hd = await replayProfile(hdPage, 'hd')
    expect(original.hdRequests).toEqual([])
    expect(original.staticRequests).toEqual([])
    expect(hd.staticRequests).toContain('/hd-static/companies/1.webp')
    expect(hd.staticRequests.some(url => url.includes('/properties/houses/'))).toBe(true)
    expect(hd.hdRequests.some(url => url.endsWith('/walk/down-right/1.webp'))).toBe(true)
    expect(hd.hdRequests.some(url => url.endsWith('/characters/2/walk/down-right/1.webp'))).toBe(true)
    expect(hd.players).toBe(original.players)
    expect(hd.round).toBe(original.round)
    expect(hd.currentPlayer).toBe(original.currentPlayer)
    expect(hd.lastRoll).toBe(original.lastRoll)
    expect(hd.history).toBe(original.history)
    expect(hd.stateFingerprint).toBe(original.stateFingerprint)
    expect(hd.stateFingerprint).not.toBeNull()
    expect(original.failures).toEqual([])
    expect(hd.failures).toEqual([])
    expect(original.pageErrors).toEqual([])
    expect(hd.pageErrors).toEqual([])
  } finally {
    await originalPage.close()
    await hdPage.close()
  }
})

test('高清角色帧加载失败后重试恢复同一阵容，并可正常暂停继续', async ({ page }) => {
  test.setTimeout(90_000)
  await page.addInitScript(seed => {
    const original = crypto.getRandomValues.bind(crypto)
    crypto.getRandomValues = array => {
      if (array instanceof Uint32Array && array.length === 1) {
        array[0] = seed
        return array
      }
      return original(array)
    }
    Date.prototype.getDay = () => 1
    Date.prototype.getFullYear = () => 2026
    Date.prototype.getMonth = () => 9
    Date.prototype.getDate = () => 4
  }, 123456789)
  await page.goto('/modern.html')
  await page.getByLabel('素材画质').selectOption('hd')
  await expect(page.getByTestId('asset-profile-busy')).toHaveCount(0)
  await page.getByTestId('character-2').click()
  let failFirstRequest = true
  await page.route('**/assets-hd/characters/2/walk/down-right/1.webp', route => {
    if (failFirstRequest) {
      failFirstRequest = false
      void route.fulfill({ status: 404, body: '' })
    } else void route.continue()
  })
  await page.getByRole('button', { name: '开始对局' }).click()
  await expect(page.getByRole('alert')).toContainText('characters/2/walk/down-right/1.webp')
  await expect(page.getByTestId('pending-lineup')).toContainText('阿牛')
  await page.getByRole('button', { name: '重试载入' }).click()
  await expect(page.getByRole('status')).toContainText('对局已载入')
  await expect(page.getByTestId('current-player')).toContainText('阿牛')
  await page.getByRole('button', { name: '暂停对局', exact: true }).click()
  await expect(page.getByRole('button', { name: '继续对局', exact: true })).toBeVisible()
  await page.getByRole('button', { name: '继续对局', exact: true }).click()
  await expect(page.getByRole('button', { name: '掷骰' })).toBeEnabled()
})

test('暂停安全点切换画质；预载失败保留当前场景，成功后状态与相机保持稳定', async ({ page }) => {
  test.setTimeout(240_000)
  await page.addInitScript(seed => {
    const original = crypto.getRandomValues.bind(crypto)
    crypto.getRandomValues = array => {
      if (array instanceof Uint32Array && array.length === 1) { array[0] = seed; return array }
      return original(array)
    }
    Date.prototype.getDay = () => 1
    Date.prototype.getFullYear = () => 2026
    Date.prototype.getMonth = () => 9
    Date.prototype.getDate = () => 4
  }, 123456789)
  await page.goto('/modern.html')
  await page.getByTestId('character-1').click()
  await page.getByRole('button', { name: '开始对局' }).click()
  await expect(page.getByRole('status')).toContainText('对局已载入')
  await revealGameDetails(page); await page.getByRole('button', { name: '全图' }).click()
  await page.getByRole('button', { name: '暂停对局', exact: true }).click()
  const before = {
    players: await page.getByTestId('player-list').innerText(),
    round: await page.getByTestId('round').innerText(),
    stateFingerprint:await page.getByTestId('game-state-fingerprint').getAttribute('data-fingerprint'),
  }
  const evidenceDir='docs/modernization/evidence/phase-5b'
  await mkdir(evidenceDir,{recursive:true})
  const initialCanvas = await page.locator('canvas').elementHandle()
  expect(initialCanvas).not.toBeNull()
  await initialCanvas!.screenshot({path:`${evidenceDir}/camera-before-profile-switch.png`})
  let failCandidate = true
  let holdCandidate=false
  let candidateRequestHeld=false
  let releaseCandidate:()=>void=()=>{}
  await page.route('**/hd-static/companies/1.webp', route => {
    if (failCandidate) void route.fulfill({ status: 404, body: '' })
    else if(holdCandidate){candidateRequestHeld=true;void new Promise<void>(resolve=>{releaseCandidate=resolve}).then(()=>route.continue())}
    else void route.continue()
  })
  const selector = page.getByLabel('对局素材画质')
  await expect(selector).toBeEnabled()
  await selector.selectOption('hd')
  await expect(page.getByRole('alert')).toContainText('companies/1.webp')
  await expect(selector).toHaveValue('original')
  await expect(page.locator('canvas')).toHaveCount(1)
  expect(await initialCanvas!.evaluate(canvas => canvas.isConnected)).toBe(true)
  expect(await page.getByTestId('player-list').innerText()).toBe(before.players)
  expect(await page.getByTestId('round').innerText()).toBe(before.round)
  expect(await page.getByTestId('game-state-fingerprint').getAttribute('data-fingerprint')).toBe(before.stateFingerprint)
  expect(await page.evaluate(() => localStorage.getItem('star-cat-monopoly:asset-profile'))).toBeNull()

  failCandidate = false
  holdCandidate=true
  await selector.selectOption('hd')
  await expect(page.locator('.profile-switch-overlay')).toBeVisible()
  await expect.poll(()=>candidateRequestHeld).toBe(true)
  await revealGameDetails(page); await page.getByLabel('速度').selectOption('2',{force:true})
  await page.getByRole('button',{name:'继续对局',exact:true}).dispatchEvent('click')
  expect(await page.getByTestId('game-state-fingerprint').getAttribute('data-fingerprint')).toBe(before.stateFingerprint)
  releaseCandidate();holdCandidate=false
  await expect(selector).toHaveValue('hd', { timeout: 120_000 })
  await expect.poll(() => page.evaluate(() => localStorage.getItem('star-cat-monopoly:asset-profile'))).toBe('hd')
  await expect(page.getByTestId('asset-profile-busy')).toHaveCount(0)
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(page.locator('canvas')).toHaveCount(1)
  expect(await initialCanvas!.evaluate(canvas => canvas.isConnected)).toBe(false)
  expect(await page.getByTestId('player-list').innerText()).toBe(before.players)
  expect(await page.getByTestId('round').innerText()).toBe(before.round)
  expect(await page.getByTestId('game-state-fingerprint').getAttribute('data-fingerprint')).toBe(before.stateFingerprint)
  await expect(page.getByLabel('速度')).toHaveValue('1')
  await expect(page.locator('.panel')).toHaveAttribute('data-speed','1')
  await expect(page.getByRole('button',{name:'继续对局',exact:true})).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('star-cat-monopoly:asset-profile'))).toBe('hd')
  const hdCanvas=await page.locator('canvas').elementHandle()
  expect(hdCanvas).not.toBeNull()
  await hdCanvas!.screenshot({path:`${evidenceDir}/camera-after-profile-switch-hd.png`})
  await selector.selectOption('original')
  await expect(selector).toHaveValue('original',{timeout:120_000})
  await expect.poll(() => page.evaluate(() => localStorage.getItem('star-cat-monopoly:asset-profile'))).toBe('original')
  await expect(page.getByTestId('asset-profile-busy')).toHaveCount(0)
  expect(await hdCanvas!.evaluate(canvas=>canvas.isConnected)).toBe(false)
  expect(await page.getByTestId('player-list').innerText()).toBe(before.players)
  expect(await page.getByTestId('game-state-fingerprint').getAttribute('data-fingerprint')).toBe(before.stateFingerprint)
  expect(await page.evaluate(() => localStorage.getItem('star-cat-monopoly:asset-profile'))).toBe('original')
  await page.locator('canvas').screenshot({path:`${evidenceDir}/camera-after-profile-switch-original.png`})
  await page.getByRole('button', { name: '继续对局', exact: true }).click()
  await expect(page.getByRole('button', { name: '掷骰' })).toBeEnabled()
})

test('选人页高清清单验证期间改回原版会取消旧请求，不被迟到结果覆盖', async ({ page }) => {
  await page.goto('/modern.html')
  let release!: () => void
  const delayed = new Promise<void>(resolve => { release = resolve })
  await page.route('**/assets-hd/hd-profile.json', async route => {
    await delayed
    await route.continue()
  })
  await page.getByTestId('character-1').click()
  const selector = page.getByLabel('素材画质')
  await selector.selectOption('hd')
  await selector.selectOption('original')
  release()
  await expect(selector).toHaveValue('original')
  await expect.poll(() => page.evaluate(() => localStorage.getItem('star-cat-monopoly:asset-profile'))).toBeNull()
  await expect(page.getByRole('button', { name: '开始对局' })).toBeEnabled()
})

test('游乐场Pixi图集在原版/高清模式下保持同一逻辑画布与玩家状态', async ({ browser }) => {
  test.setTimeout(180_000)
  const run = async (page: Page, profile: 'original' | 'hd') => {
    const requests: string[] = []
    const pageErrors: string[] = []
    page.on('request', request => requests.push(new URL(request.url()).pathname))
    page.on('pageerror', error => pageErrors.push(error.message))
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.addInitScript(seed => {
      const original = crypto.getRandomValues.bind(crypto)
      crypto.getRandomValues = array => {
        if (array instanceof Uint32Array && array.length === 1) {
          array[0] = seed
          return array
        }
        return original(array)
      }
      Date.prototype.getDay = () => 1
      Date.prototype.getFullYear = () => 2026
      Date.prototype.getMonth = () => 8
      Date.prototype.getDate = () => 28
    }, 104)
    await page.goto('/modern.html')
    await page.getByLabel('素材画质').selectOption(profile)
    await page.getByTestId('character-1').click()
    await page.getByRole('button', { name: '开始对局' }).click()
    await expect(page.getByRole('status')).toContainText('对局已载入')
    await revealGameDetails(page); await page.getByLabel('速度').selectOption('2')
    await playUntil(page, () => page.getByTestId('carnival-original').count().then(Boolean), 3500)
    const stage = page.getByTestId('carnival-original')
    const canvas = stage.locator('canvas')
    await expect(canvas).toBeVisible({ timeout: 15_000 })
    await page.getByRole('button', { name: '暂停对局', exact: true }).click()
    const box = await canvas.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.width / box!.height).toBeCloseTo(4 / 3, 3)
    await page.screenshot({ path: `docs/modernization/evidence/phase-5b/carnival-${profile}.png`, fullPage: true })
    const result = {
      round: await page.getByTestId('round').innerText(),
      currentPlayer: await page.getByTestId('current-player').innerText(),
      players: await page.getByTestId('player-list').innerText(),
      canvasRatio: box!.width / box!.height,
      hdRequests: requests.filter(url => url.startsWith('/assets-hd/')),
      staticRequests: requests.filter(url => url.startsWith('/hd-static/')),
      pageErrors,
    }
    await page.getByRole('button', { name: '继续对局', exact: true }).click()
    return result
  }

  const originalPage = await browser.newPage()
  const hdPage = await browser.newPage()
  try {
    const original = await run(originalPage, 'original')
    const hd = await run(hdPage, 'hd')
    expect(hd.round).toBe(original.round)
    expect(hd.currentPlayer).toBe(original.currentPlayer)
    expect(hd.players).toBe(original.players)
    expect(hd.canvasRatio).toBeCloseTo(original.canvasRatio, 4)
    expect(hd.staticRequests).toContain('/hd-static/activities/carnival-play/1.webp')
    expect(original.hdRequests).toEqual([])
    expect(original.staticRequests).toEqual([])
    expect(original.pageErrors).toEqual([])
    expect(hd.pageErrors).toEqual([])
  } finally {
    await originalPage.close()
    await hdPage.close()
  }
})

test('5B六组可视化对照页中所有原图和高清图都成功加载并保持2倍像素倍率', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/hd-review/5b/index.html')
  await expect(page.getByRole('heading', { name: '高清资源逐组对照' })).toBeVisible()
  await expect(page.locator('#samples article')).toHaveCount(27)
  const images = page.locator('#samples img')
  await expect(images).toHaveCount(54)
  await images.evaluateAll(async elements => {
    const images = elements as HTMLImageElement[]
    await Promise.all(images.map(async image => {
      image.loading = 'eager'
      if (!image.complete) await new Promise<void>((resolve, reject) => {
        image.addEventListener('load', () => resolve(), { once: true })
        image.addEventListener('error', () => reject(new Error(`failed ${image.src}`)), { once: true })
      })
      await image.decode()
    }))
  })
  const dimensions = await page.locator('#samples article').evaluateAll(articles => articles.map(article => {
    const images = [...article.querySelectorAll('img')]
    const rects = images.map(image => image.getBoundingClientRect())
    return {
      name: article.querySelector('h2')?.textContent,
      original: [images[0]!.naturalWidth, images[0]!.naturalHeight],
      hd: [images[1]!.naturalWidth, images[1]!.naturalHeight],
      visibleBounds: rects.map(rect => [rect.width, rect.height]),
    }
  }))
  for (const item of dimensions) {
    expect(item.hd).toEqual([item.original[0] * 2, item.original[1] * 2])
    expect(item.visibleBounds.every(([width, height]) => width > 0 && height > 0)).toBe(true)
    expect(item.visibleBounds[1]).toEqual(item.visibleBounds[0])
  }
  await page.locator('#samples article').last().scrollIntoViewIfNeeded()
  await page.locator('#samples article').first().scrollIntoViewIfNeeded()
  const lightColors = await page.locator('.preview').evaluateAll(elements => elements.map(element => getComputedStyle(element).backgroundColor))
  expect(new Set(lightColors).size).toBe(1)
  await page.getByLabel('深色棋盘底').check()
  const darkColors = await page.locator('.preview').evaluateAll(elements => elements.map(element => getComputedStyle(element).backgroundColor))
  expect(new Set(darkColors).size).toBe(1)
  expect(darkColors[0]).not.toBe(lightColors[0])
  await page.locator('#samples article').last().scrollIntoViewIfNeeded()
  await page.locator('#samples article').first().scrollIntoViewIfNeeded()
  await page.screenshot({ path: 'docs/modernization/evidence/phase-5b/resource-contact-sheet-dark.png', fullPage: true })
  await page.getByLabel('深色棋盘底').uncheck()
  const resetColors = await page.locator('.preview').evaluateAll(elements => elements.map(element => getComputedStyle(element).backgroundColor))
  expect(new Set(resetColors).size).toBe(1)
  expect(resetColors[0]).toBe(lightColors[0])
  await page.locator('#samples article').last().scrollIntoViewIfNeeded()
  await page.locator('#samples article').first().scrollIntoViewIfNeeded()
  await page.screenshot({ path: 'docs/modernization/evidence/phase-5b/resource-contact-sheet.png', fullPage: true })
})
