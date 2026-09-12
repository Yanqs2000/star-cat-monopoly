import { test, expect } from '@playwright/test'

test('现代场景独立加载原素材，方向和地点控制可用', async ({ page }) => {
  const requests: string[] = []
  const errors: string[] = []
  page.on('request', request => requests.push(request.url()))
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/modern.html')
  await expect(page.getByRole('heading', { name: '星猫大富翁 · 现代场景' })).toBeVisible({ timeout: 2000 })
  await expect(page.getByRole('status')).toContainText('场景已载入')
  await expect(page.locator('canvas')).toHaveCount(1)
  await page.getByRole('button', { name: '左上', exact: true }).click()
  await expect(page.getByRole('button', { name: '左上', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await page.getByLabel('地图定位').selectOption('portal')
  await expect(page.getByTestId('scene-position')).toContainText('30, 5')
  await page.getByRole('button', { name: '暂停动画' }).click()
  await expect(page.getByRole('button', { name: '继续动画' })).toBeVisible()
  const paused = await page.locator('canvas').screenshot()
  await page.waitForTimeout(120)
  expect((await page.locator('canvas').screenshot()).equals(paused)).toBe(true)
  await page.getByRole('button', { name: '继续动画' }).click()
  await page.waitForTimeout(120)
  expect((await page.locator('canvas').screenshot()).equals(paused)).toBe(false)
  await page.getByRole('checkbox', { name: '显示地块标记' }).uncheck()
  await expect(page.getByRole('checkbox', { name: '显示地块标记' })).not.toBeChecked()
  expect(requests.filter(url => /ruffle|\.swf(?:\?|$)/i.test(url))).toEqual([])
  expect(errors).toEqual([])
})

test('纹理缺失会说明文件，恢复后重试只保留一个画布', async ({ page }) => {
  await page.route('**/assets/map.png', route => route.fulfill({ status: 404, body: '' }))
  await page.goto('/modern.html')
  await expect(page.getByRole('alert')).toContainText('assets/map.png')
  await page.unroute('**/assets/map.png')
  await page.getByRole('button', { name: '重试' }).click()
  await expect(page.getByRole('status')).toContainText('场景已载入')
  await expect(page.locator('canvas')).toHaveCount(1)
  await page.getByRole('button', { name: '重新载入场景' }).click()
  await expect(page.getByRole('status')).toContainText('场景已载入')
  await expect(page.locator('canvas')).toHaveCount(1)
})

test('1920×1080窗口保持4比3画面和完整控制栏', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 })
  await page.goto('/modern.html')
  await expect(page.getByRole('status')).toContainText('场景已载入')
  const box = (await page.locator('canvas').boundingBox())!
  expect(box.width / box.height).toBeCloseTo(4 / 3, 2)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await expect(page.getByRole('button', { name: '全屏', exact: true })).toBeVisible()
  await page.getByRole('button', { name: '全屏', exact: true }).click()
  await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(true)
  // Fullscreen state changes before layout and ResizeObserver finish resizing.
  await expect.poll(async () => (await page.locator('canvas').boundingBox())?.height).toBe(1080)
  const fullscreenBox = (await page.locator('canvas').boundingBox())!
  expect(fullscreenBox.width / fullscreenBox.height).toBeCloseTo(4 / 3, 2)
  expect(fullscreenBox.height).toBe(1080)
  await page.keyboard.press('Escape')
  await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(false)
  await expect(page.getByRole('button', { name: '重新载入场景' })).toBeVisible()
  await page.getByRole('button', { name: '全屏', exact: true }).click()
  await page.getByRole('button', { name: '退出全屏', exact: true }).click()
  await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(false)
})
