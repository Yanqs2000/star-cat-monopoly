import { expect, test, type Page } from '@playwright/test'

async function seedGame(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const original = crypto.getRandomValues.bind(crypto)
    crypto.getRandomValues = array => {
      if (array instanceof Uint32Array && array.length === 1) {
        array[0] = 235
        return array
      }
      return original(array)
    }
    Date.prototype.getDay = () => 1
  })
  await page.goto('/modern.html')
  await page.getByTestId('character-1').click()
  await page.getByRole('button', { name: '开始对局' }).click()
  await expect(page.getByRole('status')).toContainText('对局已载入')
  await page.getByLabel('速度').selectOption('2')
}

async function humanRoll(page: Page, round: number): Promise<void> {
  await expect(page.getByTestId('round')).toContainText(`第 ${round} 轮`, { timeout: 45_000 })
  await expect(page.getByRole('button', { name: '掷骰' })).toBeEnabled()
  await page.getByRole('button', { name: '掷骰' }).click()
}

async function buyAndAcknowledge(page: Page, parcelId: number, cost: number, screenshot?: string): Promise<void> {
  const panel = page.getByTestId('property-panel')
  await expect(panel).toContainText(`地块 ${parcelId}`, { timeout: 15_000 })
  await expect(panel).toContainText(`买价 ${cost}`)
  await panel.getByTestId('property-accept').click()
  await expect(panel.getByTestId('property-result')).toContainText(`现金支付 ${cost}`)
  await expect(panel).toContainText('产权：卷毛')
  if (screenshot) await page.screenshot({ path: screenshot })
  await panel.getByTestId('property-acknowledge').click()
}

test('seed235 真实浏览器购买、AI交易、租金与升级遵循原版金额', async ({ page }) => {
  test.setTimeout(240_000)
  await page.setViewportSize({ width: 1440, height: 1000 })
  const requests: string[] = []
  const failures: string[] = []
  page.on('request', request => requests.push(new URL(request.url()).pathname))
  page.on('response', response => { if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`) })
  page.on('pageerror', error => failures.push(error.message))
  await seedGame(page)

  await humanRoll(page, 1)
  await expect(page.getByTestId('interaction-panel')).toContainText('12 格真实库存', { timeout: 15_000 })
  await page.getByTestId('interaction-panel').getByRole('button', { name: '离开卡片屋' }).click()
  await humanRoll(page, 2)
  await buyAndAcknowledge(page, 81, 1800, '/tmp/starcat-3a-purchase-1440x1000.png')
  await expect(page.getByTestId('player-list').getByRole('listitem').first()).toContainText('现金 98200 · 存款 100000')
  await page.screenshot({ path: '/tmp/starcat-3a-round2-1440x1000.png' })

  await humanRoll(page, 3)
  await buyAndAcknowledge(page, 79, 1800)
  await humanRoll(page, 4)
  const rent = page.getByTestId('property-panel')
  await expect(rent).toContainText('地块 57', { timeout: 15_000 })
  await expect(rent).toContainText('必须支付租金 1200')
  await expect(rent.getByTestId('property-decline')).toHaveCount(0)
  await rent.getByTestId('property-accept').click()
  await expect(rent.getByTestId('property-result')).toContainText('已支付租金 1200')
  await expect(rent).toContainText('现金 95200 · 存款 100000')
  await page.screenshot({ path: '/tmp/starcat-3a-rent-1440x1000.png' })
  await rent.getByTestId('property-acknowledge').click()

  await humanRoll(page, 5)
  await humanRoll(page, 6)
  await humanRoll(page, 7)
  await humanRoll(page, 8)
  await buyAndAcknowledge(page, 83, 1800)
  await humanRoll(page, 9)
  const upgrade = page.getByTestId('property-panel')
  await expect(upgrade).toContainText('地块 79', { timeout: 15_000 })
  await expect(upgrade).toContainText('升级费用 100')
  await upgrade.getByTestId('property-accept').click()
  await expect(upgrade.getByTestId('property-result')).toContainText('升级至 1 级，现金支付 100')
  await expect(upgrade).toContainText('现金 93300')
  await expect(page.getByTestId('property-list')).toContainText('土星北路 #79 · 1 级')
  await page.screenshot({ path: '.analysis-cache/acceptance-3a/seed235-property-upgrade-1440x1000.png' })
  expect(requests.some(path => path.includes('/assets/properties/houses/owner-1/facing-4/level-1.png'))).toBe(true)
  expect(requests.some(path => /\.swf$|ruffle|\.wasm$/.test(path))).toBe(false)
  expect(failures).toEqual([])
})

test('地产 PNG 404 后重试仍保持相同待定开局', async ({ page }) => {
  await page.addInitScript(() => {
    const original = crypto.getRandomValues.bind(crypto)
    crypto.getRandomValues = array => {
      if (array instanceof Uint32Array && array.length === 1) { array[0] = 235; return array }
      return original(array)
    }
  })
  let failed = true
  await page.route('**/assets/properties/sell-sign/facing-4.png', route => {
    if (failed) void route.fulfill({ status: 404, body: '' })
    else void route.continue()
  })
  await page.goto('/modern.html')
  await page.getByTestId('character-1').click()
  await page.getByRole('button', { name: '开始对局' }).click()
  await expect(page.getByRole('alert')).toContainText('sell-sign/facing-4.png')
  const lineup = await page.getByTestId('pending-lineup').textContent()
  failed = false
  await page.getByRole('button', { name: '重试载入' }).click()
  await expect(page.getByRole('status')).toContainText('对局已载入')
  await expect(page.getByTestId('pending-lineup')).toHaveCount(0)
  expect(lineup).toBe((await page.getByTestId('player-list').locator('li strong').allTextContents()).join(' · '))
  await expect(page.locator('canvas')).toHaveCount(1)
  await page.getByRole('button', { name: '掷骰' }).click()
  await expect(page.getByTestId('interaction-panel')).toContainText('12 格真实库存', { timeout: 15_000 })
})

test('地产决定可暂停、键盘放弃，返回选人重开后可键盘购买', async ({ page }) => {
  test.setTimeout(90_000)
  await seedGame(page)
  await humanRoll(page, 1)
  await page.getByTestId('interaction-panel').getByRole('button', { name: '离开卡片屋' }).click()
  await humanRoll(page, 2)
  const panel = page.getByTestId('property-panel')
  await expect(panel).toContainText('地块 81', { timeout: 15_000 })
  await page.getByRole('button', { name: '暂停对局' }).click()
  await expect(panel.getByTestId('property-accept')).toBeDisabled()
  await expect(panel.getByTestId('property-decline')).toBeDisabled()
  await page.getByRole('button', { name: '继续对局' }).click()
  await page.locator('h1').click()
  await page.keyboard.press('ArrowRight')
  await expect(panel.getByTestId('property-result')).toContainText('已放弃本次交易')
  await expect(panel).toContainText('现金 100000 · 存款 100000')
  await expect(panel).toContainText('产权：无人')
  await panel.getByTestId('property-acknowledge').click()
  await expect(page.getByTestId('round')).toContainText('第 3 轮', { timeout: 45_000 })
  await page.getByRole('button', { name: '返回选人' }).click()
  await expect(page.getByRole('heading', { name: '选择参赛角色' })).toBeVisible()
  await page.getByRole('button', { name: '开始对局' }).click()
  await expect(page.getByRole('status')).toContainText('对局已载入')
  await page.getByLabel('速度').selectOption('2')
  await humanRoll(page, 1)
  await page.getByTestId('interaction-panel').getByRole('button', { name: '离开卡片屋' }).click()
  await humanRoll(page, 2)
  await expect(panel).toContainText('地块 81', { timeout: 15_000 })
  await page.locator('h1').click()
  await page.keyboard.press('ArrowLeft')
  await expect(panel.getByTestId('property-result')).toContainText('购买成功，现金支付 1800')
  await expect(panel).toContainText('现金 98200 · 存款 100000')
})
