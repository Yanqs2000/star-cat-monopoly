import { expect, test, type Locator, type Page } from '@playwright/test'

async function start(page: Page, seed = 153) {
  await page.addInitScript(seed => {
    const random = crypto.getRandomValues.bind(crypto)
    crypto.getRandomValues = array => {
      if (array instanceof Uint32Array && array.length === 1) { array[0] = seed; return array }
      return random(array)
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
}

async function centered(page: Page, panel: Locator) {
  await expect(panel).toBeVisible()
  const area = await page.locator('.board-area').boundingBox()
  const box = await panel.boundingBox()
  expect(area).not.toBeNull(); expect(box).not.toBeNull()
  expect(Math.abs(box!.x + box!.width / 2 - area!.x - area!.width / 2)).toBeLessThan(3)
  expect(Math.abs(box!.y + box!.height / 2 - area!.y - area!.height / 2)).toBeLessThan(3)
  expect(box!.x).toBeGreaterThanOrEqual(area!.x)
  expect(box!.y).toBeGreaterThanOrEqual(area!.y)
  expect(box!.x + box!.width).toBeLessThanOrEqual(area!.x + area!.width + 1)
  expect(box!.y + box!.height).toBeLessThanOrEqual(area!.y + area!.height + 1)
}

for (const viewport of [{ width: 1366, height: 768 }, { width: 390, height: 844 }]) {
  test(`${viewport.width}px 主画面独立掷骰和用卡，辅助栏默认收起且切换不改变对局`, async ({ page }) => {
    await page.setViewportSize(viewport)
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await start(page)
    const details = page.getByRole('complementary', { name: '对局控制' })
    await expect(details).toBeHidden()
    await expect(page.getByRole('button', { name: '掷骰', exact: true })).toBeEnabled()
    await expect(page.getByTestId('hand-panel')).toBeVisible()
    const before = await page.getByTestId('game-state-fingerprint').getAttribute('data-state-json')
    await page.getByTestId('toggle-game-details').click()
    await expect(details).toBeVisible()
    await page.getByTestId('toggle-game-details').click()
    await expect(details).toBeHidden()
    expect(await page.getByTestId('game-state-fingerprint').getAttribute('data-state-json')).toBe(before)
    await page.getByTestId('hand-panel').locator('[data-card-id="5"]').click()
    await centered(page, page.getByTestId('interaction-panel'))
    await page.getByTestId('interaction-cancel').click()
    await page.getByRole('button', { name: '暂停对局', exact: true }).click()
    await expect(page.getByRole('button', { name: '掷骰', exact: true })).toBeDisabled()
    await expect(page.getByTestId('hand-card').first()).toBeDisabled()
    await page.screenshot({ path: `/tmp/starcat-main-ui-${viewport.width}.png` })
    await page.getByRole('button', { name: '继续对局', exact: true }).click()
    await page.getByTestId('hand-panel').locator('[data-card-id="5"]').click()
    await page.getByTestId('interaction-confirm').click()
    await page.getByTestId('dice-2').click()
    await page.getByTestId('interaction-acknowledge').click()
    await expect(page.getByTestId('hand-card')).toHaveCount(4)
    await page.getByRole('button', { name: '掷骰', exact: true }).click()
    await expect.poll(async () => (await page.getByTestId('game-state-fingerprint').getAttribute('data-state-json')) !== before).toBe(true)
    await expect(page.getByTestId('last-roll')).toContainText('骰子 2')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    expect(errors).toEqual([])
  })

  test(`${viewport.width}px 地产窗口在主页面居中，辅助栏展开后仍居中`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await start(page, 2)
    await page.getByRole('button', { name: '掷骰', exact: true }).click()
    const panel = page.getByTestId('property-panel')
    await centered(page, panel)
    await page.getByTestId('toggle-game-details').click()
    await centered(page, panel)
    await page.getByTestId('toggle-game-details').click()
    await panel.getByTestId('property-accept').click()
    await expect(panel.getByTestId('property-result')).toContainText('购买成功')
    await centered(page, panel)
    await page.screenshot({ path: `/tmp/starcat-main-ui-property-${viewport.width}.png` })
  })
}

test('查询、存档在主页面居中，全屏保留操作条并能用卡', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 })
  await page.route('**/api/**', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: { code: 'unavailable', message: '测试服务不可用' } }) }))
  await start(page)
  await page.getByTestId('toggle-game-details').click()
  await page.getByTestId('open-assets').click()
  await centered(page, page.getByRole('dialog', { name: '对局查询与帮助' }))
  await page.getByRole('button', { name: '关闭查询' }).click()
  await page.getByTestId('open-saves').click()
  await centered(page, page.getByRole('dialog', { name: '手动存读档' }))
  await page.getByRole('button', { name: '关闭，返回对局', exact: true }).click()
  await page.getByRole('button', { name: '全屏', exact: true }).click()
  await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(true)
  await page.getByTestId('toggle-game-details').click()
  await expect(page.getByTestId('hand-panel')).toBeVisible()
  await page.getByTestId('hand-panel').locator('[data-card-id="5"]').click()
  await centered(page, page.getByTestId('interaction-panel'))
  await page.getByTestId('interaction-cancel').click()
  await page.getByTestId('open-saves').click()
  await centered(page, page.getByRole('dialog', { name: '手动存读档' }))
  await page.getByRole('button', { name: '关闭，返回对局', exact: true }).click()
  await page.getByRole('button', { name: '退出全屏', exact: true }).click()
})

test('700×400横屏仍显示地图，掷骰与手牌完整留在窗口内', async ({ page }) => {
  await page.setViewportSize({ width: 700, height: 400 })
  await start(page)
  const canvas = await page.locator('canvas').boundingBox()
  expect(canvas!.height).toBeGreaterThan(60)
  for (const control of [page.getByRole('button', { name: '掷骰', exact: true }), page.getByTestId('hand-card').last()]) {
    const box = await control.boundingBox()
    expect(box!.y + box!.height).toBeLessThanOrEqual(400)
  }
})

test('原版风格HUD显示真实资金，设置默认收起且声音设置不改变对局', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 })
  await start(page, 2)
  await expect(page.getByTestId('hud-cash')).toHaveText('100000', { timeout: 2000 })
  await expect(page.getByTestId('hud-deposit')).toHaveText('100000')
  await expect(page.getByTestId('hud-tickets')).toHaveText('200')
  await expect(page.getByLabel('音乐音量')).toBeHidden()
  const before = await page.getByTestId('game-state-fingerprint').getAttribute('data-state-json')
  await page.getByTestId('game-settings').click()
  await expect(page.getByLabel('音乐音量')).toBeVisible()
  await page.getByLabel('静音', { exact: true }).check()
  await page.getByTestId('game-settings').click()
  await expect(page.getByLabel('音乐音量')).toBeHidden()
  expect(await page.getByTestId('game-state-fingerprint').getAttribute('data-state-json')).toBe(before)
  await page.getByRole('button', { name: '掷骰', exact: true }).click()
  await page.getByTestId('property-accept').click()
  await expect(page.getByTestId('hud-cash')).toHaveText('98800')
  await expect(page.getByTestId('hud-deposit')).toHaveText('100000')
})
