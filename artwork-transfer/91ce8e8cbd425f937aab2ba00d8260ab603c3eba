import { expect, test, type Page } from '@playwright/test'
import { mkdir } from 'node:fs/promises'

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
  }, seed)
  await page.goto('/modern.html')
  await page.getByTestId('character-1').click()
  await page.getByRole('button', { name: '开始对局' }).click()
  await expect(page.getByRole('status')).toContainText('对局已载入')
  await page.getByLabel('速度').selectOption('2')
}

test('已结算控骰卡的反馈帧404后重试保留完整待决状态且不重复消费', async ({ page }) => {
  test.setTimeout(120_000)
  let failed = true
  let frameRequests = 0
  await page.route('**/assets/characters/1/reactions/happy/*/1.png', route => {
    frameRequests += 1
    if (failed) void route.fulfill({ status: 404, body: '' })
    else void route.continue()
  })
  await seedMondayGame(page, 153)

  const hand = page.getByTestId('hand-panel')
  const beforeReaction = await page.locator('canvas').screenshot()
  const lineup = (await page.getByTestId('player-list').locator('li strong').allTextContents()).join(' · ')
  await expect(hand.getByTestId('hand-card')).toHaveCount(5)
  await hand.locator('[data-card-id="5"]').click()
  await page.getByTestId('interaction-confirm').click()
  await page.getByTestId('dice-2').click()
  await expect(page.getByRole('alert')).toContainText('characters/1/reactions/happy/')
  await expect(page.getByTestId('pending-lineup')).toHaveText(lineup)

  failed = false
  await page.getByRole('button', { name: '重试载入' }).click()
  await expect(page.getByRole('status')).toContainText('对局已载入')
  await expect(page.getByLabel('速度')).toHaveValue('2')
  await expect.poll(() => frameRequests).toBeGreaterThanOrEqual(2)
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
  await expect(page.getByTestId('interaction-panel')).toContainText('12 格真实库存', { timeout: 15_000 })
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

  await page.getByRole('button', { name: '全图' }).click()
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

test('seed153 玩家-only飞弹在所选中心实际派发两种原版特效', async ({ page }) => {
  test.setTimeout(90_000)
  await mkdir(evidenceDir, { recursive: true })
  await seedMondayGame(page, 153)
  await page.getByRole('button', { name: '全图' }).click()
  await page.evaluate(async () => {
    const url = performance.getEntriesByType('resource').map(entry => entry.name).find(name => name.includes('/pixi__js.js'))
    if (!url) throw new Error('Pixi module not found in production page')
    const pixi = await (new Function('url', 'return import(url)')(url) as Promise<typeof import('pixi.js')>)
    const original = pixi.Container.prototype.addChild
    const probe = window as Window & { __missileEffectPositions?: Array<{ x: number; y: number }> }
    probe.__missileEffectPositions = []
    pixi.Container.prototype.addChild = function (...children) {
      for (const child of children) {
        if (child instanceof pixi.Container && child.children.length === 1 && child.children[0] instanceof pixi.Sprite) {
          probe.__missileEffectPositions!.push({ x: child.position.x, y: child.position.y })
        }
      }
      return original.apply(this, children)
    }
  })
  const hand = page.getByTestId('hand-panel')
  await hand.locator('[data-card-id="9"]').click()
  await page.getByTestId('interaction-confirm').click()
  await page.getByTestId('target-player-4').click()
  await expect(page.getByTestId('interaction-panel')).toContainText('飞弹已经发射')
  const effectPositions = await page.evaluate(() => (window as Window & { __missileEffectPositions?: Array<{ x: number; y: number }> }).__missileEffectPositions ?? [])
  expect(effectPositions).toEqual([{ x: 560, y: 400 }, { x: 560, y: 400 }])
  await page.screenshot({ path: `${evidenceDir}/fix-seed153-missile-impact.png` })
  await expect(page.getByTestId('player-list').getByRole('listitem').nth(3)).toContainText('住院 3天')
})

async function buyProperty(page: Page, parcelId: number, amount: number): Promise<void> {
  const panel = page.getByTestId('property-panel')
  await expect(panel).toContainText(`地块 ${parcelId}`, { timeout: 30_000 })
  await expect(panel).toContainText(`买价 ${amount}`)
  await panel.getByTestId('property-accept').click()
  await expect(panel.getByTestId('property-result')).toContainText(`现金支付 ${amount}`)
  await panel.getByTestId('property-acknowledge').click()
}

test('seed153 生产入口合法完成商店买卖、地产、银行信用、运气8与信用卡使用', async ({ page }) => {
  test.setTimeout(240_000)
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
  await expect(interaction).toContainText('12 格真实库存', { timeout: 30_000 })
  await expect(interaction.getByTestId('shop-slot')).toHaveCount(12)
  await expect(interaction).toContainText('奖券 200')
  await interaction.getByTestId('shop-slot').first().click()
  await expect(interaction).toContainText('购买成功')
  await expect(interaction).toContainText('奖券 170')
  await interaction.getByTestId('interaction-acknowledge').click()
  await interaction.locator('.sell-list button').first().click()
  await expect(interaction).toContainText('出售成功')
  await expect(interaction).toContainText('奖券 270')
  await interaction.getByTestId('interaction-acknowledge').click()
  await interaction.getByRole('button', { name: '离开卡片屋' }).click()

  await expect(page.getByTestId('round')).toContainText('第 2 轮', { timeout: 60_000 })
  await page.getByRole('button', { name: '掷骰' }).click()
  await buyProperty(page, 83, 1800)
  await expect(page.getByTestId('round')).toContainText('第 3 轮', { timeout: 60_000 })
  await page.getByRole('button', { name: '掷骰' }).click()
  await buyProperty(page, 77, 2500)

  await expect(page.getByTestId('round')).toContainText('第 4 轮', { timeout: 60_000 })
  await page.getByRole('button', { name: '掷骰' }).click()
  await expect(interaction).toContainText('申请信用卡', { timeout: 30_000 })
  await interaction.getByRole('button', { name: '申请信用' }).click()
  await expect(interaction).toContainText('信用申请通过')
  await expect(page.getByTestId('hand-panel').getByTestId('hand-card')).toHaveCount(6)
  await interaction.getByTestId('interaction-acknowledge').click()
  await interaction.getByRole('button', { name: '离开银行' }).click()
  await expect(interaction.getByTestId('luck-image')).toHaveAttribute('alt', '运气事件 8', { timeout: 30_000 })
  await expect(interaction).toContainText('海外投资失败，损失12000元')
  await expect(interaction).toContainText('现金 -12000')
  await expect(page.getByTestId('player-list').getByRole('listitem').first()).toContainText('现金 83700')
  await page.screenshot({ path: `${evidenceDir}/seed153-bank-luck-1440x1000.png` })

  await page.setViewportSize({ width: 1920, height: 1080 })
  await page.getByRole('button', { name: '全屏', exact: true }).click()
  expect(await page.evaluate(() => document.fullscreenElement?.classList.contains('game-stage'))).toBe(true)
  await expect(page.locator('.game-stage')).toHaveJSProperty('clientWidth', 1920)
  await page.waitForTimeout(1500)
  await page.screenshot({ path: `${evidenceDir}/seed153-bank-luck-fullscreen-1920x1080.png` })

  await interaction.getByTestId('interaction-acknowledge').click()
  await expect(page.getByTestId('round')).toContainText('第 5 轮', { timeout: 60_000 })
  const hand = page.getByTestId('hand-panel')
  await hand.locator('[data-card-id="1"]').click()
  await interaction.getByTestId('interaction-confirm').click()
  await expect(interaction).toContainText('可用额度 100000')
  await interaction.getByTestId('credit-amount').fill('5000')
  await interaction.getByTestId('credit-submit').click()
  await expect(interaction).toContainText('信用卡已生效')
  await expect(page.getByTestId('player-list').getByRole('listitem').first()).toContainText('现金 88700')
  await expect(page.getByTestId('player-list').getByRole('listitem').first()).toContainText('信用 95000 / 已用 5000')
  await expect(hand.locator('[data-card-id="1"]')).toHaveCount(1)
  await interaction.getByTestId('interaction-acknowledge').click()
  await expect(page.getByRole('button', { name: '掷骰' })).toBeEnabled()
  await expect(page.getByTestId('player-list').getByRole('listitem').first()).toContainText('现金 88700')
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

test('卡片格新获卡面404重试关联原获得视觉且不重复卡片或RNG', async ({ page }) => {
  test.setTimeout(180_000)
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
    if (happyRequests === 1) await page.waitForTimeout(700)
    await route.continue().catch(() => {})
  })
  await seedMondayGame(page, 42)

  await page.getByRole('button', { name: '掷骰' }).click()
  const property = page.getByTestId('property-panel')
  await expect(property).toBeVisible({ timeout: 30_000 })
  await property.getByTestId('property-decline').click()
  await property.getByTestId('property-acknowledge').click()
  await expect(page.getByTestId('round')).toContainText('第 2 轮', { timeout: 60_000 })
  await page.getByRole('button', { name: '掷骰' }).click()
  await expect(page.getByTestId('round')).toContainText('第 3 轮', { timeout: 60_000 })
  const beforeDraw = await page.locator('canvas').screenshot()
  await page.getByRole('button', { name: '掷骰' }).click()
  await expect(page.getByRole('alert')).toContainText('cards/18.png')

  failed = false
  await page.getByRole('button', { name: '重试载入' }).click()
  await expect(page.getByRole('status')).toContainText('对局已载入')
  await expect.poll(() => cardRequests).toBeGreaterThanOrEqual(2)
  await expect.poll(() => happyRequests).toBeGreaterThanOrEqual(2)
  const hand = page.getByTestId('hand-panel')
  await expect(hand.getByTestId('hand-card')).toHaveCount(6)
  await expect(hand.locator('[data-card-id="18"]')).toHaveCount(1)
  await expect(page.getByTestId('interaction-panel')).toContainText('获得天使卡')
  await page.waitForTimeout(500)
  expect((await page.locator('canvas').screenshot()).equals(beforeDraw)).toBe(false)
  await page.getByTestId('interaction-acknowledge').click()
  await expect(page.getByTestId('round')).toContainText('第 4 轮', { timeout: 60_000 })
  await page.getByRole('button', { name: '掷骰' }).click()
  await expect(page.getByTestId('last-roll')).toContainText('骰子 4')
})

test('生产入口运气图404保留已扣款notice并恢复原图', async ({ page }) => {
  test.setTimeout(180_000)
  let failed = true
  let requests = 0
  await page.route('**/assets/interactions/luck/8.png', route => {
    requests += 1
    if (failed) void route.fulfill({ status: 404, body: '' })
    else void route.continue()
  })
  await seedMondayGame(page, 153)
  const interaction = page.getByTestId('interaction-panel')
  await page.getByRole('button', { name: '掷骰' }).click()
  await expect(interaction).toContainText('12 格真实库存', { timeout: 30_000 })
  await interaction.getByRole('button', { name: '离开卡片屋' }).click()
  await expect(page.getByTestId('round')).toContainText('第 2 轮', { timeout: 60_000 })
  await page.getByRole('button', { name: '掷骰' }).click(); await buyProperty(page, 83, 1800)
  await expect(page.getByTestId('round')).toContainText('第 3 轮', { timeout: 60_000 })
  await page.getByRole('button', { name: '掷骰' }).click(); await buyProperty(page, 77, 2500)
  await expect(page.getByTestId('round')).toContainText('第 4 轮', { timeout: 60_000 })
  await page.getByRole('button', { name: '掷骰' }).click()
  await expect(interaction).toContainText('申请信用卡', { timeout: 30_000 })
  await interaction.getByRole('button', { name: '申请信用' }).click()
  await interaction.getByTestId('interaction-acknowledge').click()
  await interaction.getByRole('button', { name: '离开银行' }).click()
  await expect(page.getByRole('alert')).toContainText('luck/8.png')
  failed = false
  await page.getByRole('button', { name: '重试载入' }).click()
  await expect(page.getByRole('status')).toContainText('对局已载入')
  await expect.poll(() => requests).toBeGreaterThanOrEqual(2)
  await expect(interaction.getByTestId('luck-image')).toHaveAttribute('alt', '运气事件 8')
  await expect(interaction).toContainText('现金 -12000')
  await expect(page.getByTestId('player-list').getByRole('listitem').first()).toContainText('现金 83700')
})
