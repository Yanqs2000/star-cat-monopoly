import { expect, test, type Page } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { revealGameDetails, playUntil } from './modern-play'

const evidenceDir = '.analysis-cache/acceptance-3a'

async function seedMondayGame(page: Page, seed: number): Promise<void> {
  await page.addInitScript(value => {
    const original = crypto.getRandomValues.bind(crypto)
    crypto.getRandomValues = array => {
      if (array instanceof Uint32Array && array.length === 1) {
        array[0] = value
        return array
      }
      return original(array)
    }
    Date.prototype.getDay = () => 1
    Date.prototype.getFullYear = () => 2026
    Date.prototype.getMonth = () => 8
    Date.prototype.getDate = () => 27
  }, seed)
  await page.goto('/modern.html')
  await page.getByTestId('character-1').click()
  await page.getByRole('button', { name: '开始对局' }).click()
  await expect(page.getByRole('status')).toContainText('对局已载入')
  await revealGameDetails(page); await page.getByLabel('速度').selectOption('2')
}

test('开局准备的控骰反馈在后续素材断网时仍播放且不重复消费', async ({ page }) => {
  test.setTimeout(120_000)
  let failed = false
  let frameRequests = 0
  await page.route('**/assets/characters/1/reactions/happy/*/1.png', route => {
    frameRequests += 1
    if (failed) void route.fulfill({ status: 404, body: '' })
    else void route.continue()
  })
  await seedMondayGame(page, 153)

  failed = true
  const preparedRequests=frameRequests
  const hand = page.getByTestId('hand-panel')
  const beforeReaction = await page.locator('canvas').screenshot()
  const lineup = (await page.getByTestId('player-list').locator('li strong').allTextContents()).join(' · ')
  await expect(hand.getByTestId('hand-card')).toHaveCount(5)
  await hand.locator('[data-card-id="5"]').click()
  await page.getByTestId('interaction-confirm').click()
  await page.getByTestId('dice-2').click()
  await expect(page.getByRole('alert')).toHaveCount(0)
  expect(frameRequests).toBe(preparedRequests)
  expect((await page.getByTestId('player-list').locator('li strong').allTextContents()).join(' · ')).toBe(lineup)
  await expect(page.getByLabel('速度')).toHaveValue('2')
  await expect(page.getByTestId('interaction-panel')).toContainText('控骰卡')
  await expect(page.getByTestId('hand-panel').getByTestId('hand-card')).toHaveCount(4)
  await page.waitForTimeout(500)
  expect((await page.locator('canvas').screenshot()).equals(beforeReaction)).toBe(false)
  await page.getByTestId('interaction-acknowledge').click()
  const pixiTimingAvailable = await page.evaluate(async () => {
    const url = performance.getEntriesByType('resource').map(entry => entry.name).find(name => name.includes('/pixi__js.js'))
    if (!url) return false
    const pixi = await (new Function('url', 'return import(url)')(url) as Promise<typeof import('pixi.js')>)
    const originalAdd = pixi.Container.prototype.addChild
    const originalRemove = pixi.Container.prototype.removeChild
    const probe = window as Window & { __effectTimes?: Array<{ start: number; end?: number }> }
    const tracked = new Map<object, { start: number; end?: number }>()
    probe.__effectTimes = []
    pixi.Container.prototype.addChild = function (...children) {
      for (const child of children) {
        if (child instanceof pixi.Container && child.children.length === 1 && child.children[0] instanceof pixi.Sprite && child.position.x === 560 && child.position.y === 400) {
          const record = { start: performance.now() }
          tracked.set(child, record)
          probe.__effectTimes!.push(record)
        }
      }
      return originalAdd.apply(this, children)
    }
    pixi.Container.prototype.removeChild = function (...children) {
      for (const child of children) {
        const record = tracked.get(child)
        if (record) record.end = performance.now()
      }
      return originalRemove.apply(this, children)
    }
    return true
  })
  await page.getByTestId('hand-panel').locator('[data-card-id="9"]').click()
  await page.getByTestId('interaction-confirm').click()
  await page.getByTestId('target-player-4').click()
  await expect(page.getByTestId('interaction-panel')).toContainText('飞弹已经发射')
  if (pixiTimingAvailable) {
    await expect.poll(() => page.evaluate(() => (window as Window & { __effectTimes?: Array<{ end?: number }> }).__effectTimes?.filter(item => item.end !== undefined).length ?? 0)).toBe(2)
    const durations = await page.evaluate(() => (window as Window & { __effectTimes?: Array<{ start: number; end?: number }> }).__effectTimes!.map(item => item.end! - item.start))
    expect(durations).toHaveLength(2)
    for (const duration of durations) expect(duration).toBeLessThan(2100)
  }
  await page.getByTestId('interaction-acknowledge').click()
  await page.getByRole('button', { name: '掷骰' }).click()
  await expect(page.getByTestId('last-roll')).toContainText('骰子 2')
  await expect(page.getByTestId('interaction-panel')).toContainText('12 格库存', { timeout: 15_000 })
  await expect(page.locator('canvas')).toHaveCount(1)
})

test('生产入口用地图点击放置障碍并用真实玩家位置发射飞弹', async ({ page }) => {
  test.setTimeout(90_000)
  await mkdir(evidenceDir, { recursive: true })
  await seedMondayGame(page, 153)
  const hand = page.getByTestId('hand-panel')

  await hand.locator('[data-card-id="6"]').click()
  await page.getByTestId('interaction-confirm').click()
  await expect(page.getByTestId('interaction-panel')).toContainText('在地图上点击目标格')
  const target = await page.locator('canvas').evaluate(canvas => {
    const scale = Math.min(canvas.clientWidth / 800, canvas.clientHeight / 600)
    return {
      x: (canvas.clientWidth - 800 * scale) / 2 + 456 * scale,
      y: (canvas.clientHeight - 600 * scale) / 2 + 120 * scale,
    }
  })
  await page.locator('canvas').click({ position: target })
  await expect(page.getByTestId('interaction-panel')).toContainText('障碍已放置')
  await expect(hand.getByTestId('hand-card')).toHaveCount(4)
  await page.getByTestId('interaction-acknowledge').click()

  await revealGameDetails(page); await page.getByRole('button', { name: '全图' }).click()
  await hand.locator('[data-card-id="9"]').click()
  await page.getByTestId('interaction-confirm').click()
  await page.getByTestId('target-player-4').click()
  await expect(page.getByTestId('interaction-panel')).toContainText('飞弹已经发射')
  await page.screenshot({ path: `${evidenceDir}/fix-seed153-missile-impact-production.png` })
  await expect(hand.getByTestId('hand-card')).toHaveCount(3)
  await expect(page.getByTestId('player-list').getByRole('listitem').nth(3)).toContainText('住院 3天')
})

test('地图选目标时拖出又返回原点不消耗卡，普通点击仍可提交', async ({ page }) => {
  test.setTimeout(90_000)
  await seedMondayGame(page, 153)
  const hand = page.getByTestId('hand-panel')
  await hand.locator('[data-card-id="6"]').click()
  await page.getByTestId('interaction-confirm').click()
  const canvas = page.locator('canvas')
  const target = await canvas.evaluate(element => {
    const scale = Math.min(element.clientWidth / 800, element.clientHeight / 600)
    return {
      x: (element.clientWidth - 800 * scale) / 2 + 456 * scale,
      y: (element.clientHeight - 600 * scale) / 2 + 120 * scale,
    }
  })
  const bounds = (await canvas.boundingBox())!
  const x = bounds.x + target.x
  const y = bounds.y + target.y
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x + 100, y, { steps: 4 })
  await page.mouse.move(x, y, { steps: 4 })
  await page.mouse.up()
  await expect(page.getByTestId('interaction-panel')).toContainText('在地图上点击目标格')
  await expect(hand.getByTestId('hand-card')).toHaveCount(5)
  await canvas.click({ position: target })
  await expect(page.getByTestId('interaction-panel')).toContainText('障碍已放置')
  await expect(hand.getByTestId('hand-card')).toHaveCount(4)
})

test('seed153 玩家飞弹在目标处产生实际画面反馈并送医', async ({ page }) => {
  test.setTimeout(90_000)
  await mkdir(evidenceDir, { recursive: true })
  await seedMondayGame(page, 153)
  await revealGameDetails(page); await page.getByRole('button', { name: '全图' }).click()
  const before = await page.locator('canvas').screenshot()
  const hand = page.getByTestId('hand-panel')
  await hand.locator('[data-card-id="9"]').click()
  await page.getByTestId('interaction-confirm').click()
  await page.getByTestId('target-player-4').click()
  await expect(page.getByTestId('interaction-panel')).toContainText('飞弹已经发射')
  expect((await page.locator('canvas').screenshot()).equals(before)).toBe(false)
  await page.screenshot({ path: `${evidenceDir}/fix-seed153-missile-impact.png` })
  await expect(page.getByTestId('player-list').getByRole('listitem').nth(3)).toContainText('住院 3天')
})

test('seed153 生产入口卡片屋买卖后在新金融随机流继续', async ({ page }) => {
  test.setTimeout(90_000)
  await mkdir(evidenceDir, { recursive: true })
  await page.setViewportSize({ width: 1440, height: 1000 })
  const requests: string[] = []
  const failures: string[] = []
  page.on('request', request => requests.push(new URL(request.url()).pathname))
  page.on('response', response => { if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`) })
  page.on('pageerror', error => failures.push(error.message))
  await seedMondayGame(page, 153)

  await page.getByRole('button', { name: '掷骰' }).click()
  const interaction = page.getByTestId('interaction-panel')
  await expect(interaction).toContainText('12 格库存', { timeout: 30_000 })
  await expect(interaction.getByTestId('shop-slot')).toHaveCount(12)
  await interaction.getByTestId('shop-slot').first().click()
  await expect(interaction).toContainText('奖券 170')
  await interaction.getByTestId('interaction-acknowledge').click()
  await interaction.locator('.sell-list button').first().click()
  await expect(interaction).toContainText('奖券 270')
  await interaction.getByTestId('interaction-acknowledge').click()
  await interaction.getByRole('button', { name: '离开卡片屋' }).click()
  await expect(page.getByTestId('round')).toContainText('第 2 轮', { timeout: 60_000 })
  await expect(page.getByTestId('player-list').getByRole('listitem').first()).toContainText('奖券 270')
  await page.screenshot({ path: `${evidenceDir}/seed153-shop-finance-flow-1440x1000.png` })
  expect(requests.some(path => /\.swf$|ruffle|\.wasm$/.test(path))).toBe(false)
  expect(failures).toEqual([])
})

test('生产入口卡面404经同一完整状态边界恢复', async ({ page }) => {
  test.setTimeout(90_000)
  let failed = true
  let requests = 0
  await page.route('**/assets/interactions/cards/9.png', route => {
    requests += 1
    if (failed) void route.fulfill({ status: 404, body: '' })
    else void route.continue()
  })
  await page.addInitScript(() => {
    const original = crypto.getRandomValues.bind(crypto)
    crypto.getRandomValues = array => {
      if (array instanceof Uint32Array && array.length === 1) { array[0] = 153; return array }
      return original(array)
    }
    Date.prototype.getDay = () => 1
    Date.prototype.getFullYear = () => 2026
    Date.prototype.getMonth = () => 8
    Date.prototype.getDate = () => 27
  })
  await page.goto('/modern.html')
  await page.getByTestId('character-1').click()
  await page.getByRole('button', { name: '开始对局' }).click()
  await expect(page.getByRole('alert')).toContainText('cards/9.png')
  failed = false
  await page.getByRole('button', { name: '重试载入' }).click()
  await expect(page.getByRole('status')).toContainText('对局已载入')
  await expect.poll(() => requests).toBeGreaterThanOrEqual(2)
  await expect(page.getByTestId('hand-panel').getByTestId('hand-card')).toHaveCount(5)
  await expect(page.locator('canvas')).toHaveCount(1)
})

test('自然卡片格新获卡面404重试保留原奖励且不重复发卡', async ({ page }) => {
  test.setTimeout(60_000)
  let failed = true
  let cardRequests = 0
  let happyRequests = 0
  await page.route('**/assets/interactions/cards/18.png', route => {
    cardRequests += 1
    if (failed) void route.fulfill({ status: 404, body: '' })
    else void route.continue()
  })
  await page.route('**/assets/characters/1/reactions/happy/*/1.png', async route => {
    happyRequests += 1
    await route.continue().catch(() => {})
  })
  await seedMondayGame(page, 40)
  await playUntil(page, async () => {
    const alert = page.getByRole('alert')
    return (await page.getByTestId('hand-panel').locator('[data-card-id="18"]').count()) > 0 ||
      (await alert.count()) > 0 && (await alert.first().textContent())?.includes('cards/18.png') === true
  }, 450)
  await expect(page.getByRole('alert')).toContainText('cards/18.png')
  expect(cardRequests).toBeGreaterThanOrEqual(1)

  failed = false
  await page.getByRole('button', { name: '重试载入' }).click()
  await expect(page.getByRole('status')).toContainText('对局已载入')
  await expect.poll(() => cardRequests).toBeGreaterThanOrEqual(2)
  const hand = page.getByTestId('hand-panel')
  await expect(hand.locator('[data-card-id="18"]')).toHaveCount(1)
  await expect(page.getByTestId('interaction-panel')).toContainText('获得天使卡')
  await expect.poll(() => happyRequests).toBeGreaterThanOrEqual(1)
  await page.getByTestId('interaction-acknowledge').click()
  await expect(page.getByRole('button', { name: '掷骰' })).toBeEnabled({ timeout: 60_000 })
})

test('自然运气事件8图片404后保留已扣款结果并恢复原图', async ({ page }) => {
  test.setTimeout(150_000)
  let failed = true
  let requests = 0
  await page.route('**/assets/interactions/luck/8.png', route => {
    requests += 1
    if (failed) void route.fulfill({ status: 404, body: '' })
    else void route.continue()
  })
  await seedMondayGame(page, 1459)
  await playUntil(page, async () =>
    (await page.locator('[data-testid="luck-image"][alt="运气事件 8"]').count()) > 0 ||
    (await page.getByRole('alert').count()) > 0, 450)
  await expect(page.getByRole('alert')).toContainText('luck/8.png')
  failed = false
  await page.getByRole('button', { name: '重试载入' }).click()
  await expect(page.getByRole('status')).toContainText('对局已载入')
  await expect.poll(() => requests).toBeGreaterThanOrEqual(2)
  const interaction = page.getByTestId('interaction-panel')
  await expect(interaction.getByTestId('luck-image')).toHaveAttribute('alt', '运气事件 8')
  await expect(interaction).toContainText('现金 -12000')
  await expect(interaction).toContainText('海外投资失败')
})
