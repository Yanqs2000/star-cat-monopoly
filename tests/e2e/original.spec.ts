import { test, expect } from '@playwright/test'

test('默认入口加载原版程序，保留原始 800×600 画布而不是自绘棋盘', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')
  await expect(page.getByRole('application', { name: '星猫大富翁原版游戏' })).toBeVisible()
  await expect(page.getByText('原版已载入', { exact: true })).toBeVisible()
  const metadata = await page.locator('ruffle-player').evaluate((element: any) => element.ruffle().metadata)
  expect(metadata).toMatchObject({ width: 800, height: 600, swfVersion: 8, isActionScript3: false })
  await expect(page.locator('vite-error-overlay')).toHaveCount(0)
  expect(errors).toEqual([])
})

test('角色文件缺失时给出明确错误，恢复资源后可以重试', async ({ page }) => {
  await page.route('**/original/star1.swf', route => route.fulfill({ status: 404, body: '' }))
  await page.goto('/')
  await expect(page.getByRole('alert')).toContainText('star1.swf')
  await expect(page.locator('ruffle-player')).toHaveCount(0)
  await page.unroute('**/original/star1.swf')
  await page.getByRole('button', { name: '重试', exact: true }).click()
  await expect(page.getByText('原版已载入', { exact: true })).toBeVisible()
  await expect(page.locator('ruffle-player')).toHaveCount(1)
})

test('静音、重新载入取消及确认不会产生重复播放器', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('原版已载入', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: '静音', exact: true }).click()
  expect(await page.locator('ruffle-player').evaluate((el: any) => el.ruffle().volume)).toBe(0)
  await page.getByRole('button', { name: '重新载入', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: '取消', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.getByRole('button', { name: '重新载入', exact: true }).click()
  await page.getByRole('button', { name: '确认重新载入', exact: true }).click()
  await expect(page.getByText('原版已载入', { exact: true })).toBeVisible()
  await expect(page.locator('ruffle-player')).toHaveCount(1)
  expect(await page.locator('ruffle-player').evaluate((el: any) => el.ruffle().volume)).toBe(0)
})

test('窄屏保持完整四比三画面，工具栏不横向溢出', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(page.getByText('原版已载入', { exact: true })).toBeVisible()
  const box = (await page.locator('ruffle-player').boundingBox())!
  expect(box.width / box.height).toBeCloseTo(4 / 3, 2)
  expect(box.x).toBeGreaterThanOrEqual(0)
  expect(box.x + box.width).toBeLessThanOrEqual(390)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('选人页的动态中文交给浏览器实际绘制，避免内置西文字体吞字', async ({ page }) => {
  await page.addInitScript(() => {
    const drawn: string[] = []
    ;(window as any).__drawnChinese = drawn
    // Ruffle 在离屏画布上绘制设备字体，再合成进游戏画面；不替换绘制行为。
    for (const prototype of [CanvasRenderingContext2D.prototype, OffscreenCanvasRenderingContext2D.prototype]) {
      const original = prototype.fillText
      prototype.fillText = function (text: string, ...args: any[]) {
        if (/[\u4e00-\u9fff]/.test(text)) drawn.push(text)
        return (original as any).call(this, text, ...args)
      }
    }
  })
  await page.goto('/')
  await expect(page.getByText('原版已载入', { exact: true })).toBeVisible()
  // 原版片头有时间轴动画，等待菜单出现后真实点击“开始”。
  await page.waitForTimeout(5000)
  const box = (await page.locator('ruffle-player').boundingBox())!
  const x = box.x + box.width * 665 / 800
  const y = box.y + box.height * 255 / 600
  await page.mouse.move(x, y)
  await page.waitForTimeout(500)
  await page.mouse.click(x, y, { delay: 150 })
  await page.waitForTimeout(800)
  await page.mouse.click(x, y, { delay: 150 })
  await expect.poll(async () => page.evaluate(() => (window as any).__drawnChinese.length)).toBeGreaterThan(0)
})
