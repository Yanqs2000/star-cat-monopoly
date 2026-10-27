import { test, expect } from '@playwright/test'

for (const viewport of [{ width: 1366, height: 768 }, { width: 390, height: 844 }]) {
  for (const scenario of ['monthly', 'luck', 'bankruptcy']) test(`${viewport.width}px ${scenario}首屏内容和继续操作完整可见`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.goto(`/tests/fixtures/modern-observed-ui.html?scenario=${scenario}`)
    const button = page.getByTestId(scenario === 'monthly' ? 'monthly-acknowledge' : scenario === 'bankruptcy' ? 'bankruptcy-acknowledge' : 'interaction-acknowledge')
    const fits = async () => button.evaluate(element => {
      const box = element.getBoundingClientRect(), stage = document.querySelector('.board-surface')!.getBoundingClientRect()
      const atCenter = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)
      return box.top >= stage.top && box.bottom <= stage.bottom && !!atCenter && element.contains(atCenter)
    })
    expect(await fits()).toBe(true)
    if (scenario === 'monthly') {
      const ranking = await page.getByTestId('monthly-standings').boundingBox()
      const buttonBox = await button.boundingBox()
      expect(ranking!.y + ranking!.height).toBeLessThan(buttonBox!.y)
      const details = page.locator('.finance-lines')
      await details.evaluate(element => { element.scrollTop = element.scrollHeight })
      expect(await details.evaluate(element => element.scrollTop)).toBeGreaterThan(0)
      expect(await fits()).toBe(true)
    }
    await page.screenshot({ path: `/tmp/starcat-observed-${scenario}-${viewport.width}.png` })
    await button.click()
    await expect(page.getByTestId('acknowledged')).toHaveText('true')
  })
}

test('游乐场800×600画布完整缩放，鼠标位置仍映射到原逻辑坐标', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 })
  await page.goto('/tests/fixtures/modern-observed-ui.html?scenario=carnival')
  await expect(page.getByTestId('ready')).toHaveText('ready')
  const canvas = await page.locator('canvas').boundingBox(), stage = await page.locator('.board-surface').boundingBox()
  expect(canvas!.x + canvas!.width).toBeLessThanOrEqual(stage!.x + stage!.width)
  expect(canvas!.y + canvas!.height).toBeLessThanOrEqual(stage!.y + stage!.height)
  expect(canvas!.width / canvas!.height).toBeCloseTo(4 / 3)
  await page.mouse.move(canvas!.x + canvas!.width * .875, canvas!.y + canvas!.height / 2)
  await expect(page.getByTestId('pointer')).toHaveText('700')
  await page.screenshot({ path: '/tmp/starcat-observed-carnival.png' })
})

test('彩票动画资源延迟时有不透明加载画面，就绪后再显示投注盘', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 })
  let release!: () => void
  const held = new Promise<void>(resolve => { release = resolve })
  await page.route('**/assets-hd/activities/ludo-dice/17.webp', async route => { await held; await route.continue() })
  await page.goto('/tests/fixtures/modern-observed-ui.html?scenario=ludo')
  const loading = page.getByRole('status', { name: '活动素材加载' })
  await expect(loading).toBeVisible({ timeout: 3000 })
  await expect(loading).toContainText('正在准备')
  await page.screenshot({ path: '/tmp/starcat-observed-ludo-loading.png' })
  release()
  await expect(page.getByTestId('ready')).toHaveText('ready')
  await expect(loading).toHaveCount(0)
  await expect(page.getByTestId('ludo-original').locator('svg image').first()).toBeVisible()
  await page.screenshot({ path: '/tmp/starcat-observed-ludo-ready.png' })
})

for (const scenario of ['wealth', 'fortune', 'card']) test(`${scenario}奖励反馈与实际入账一致`, async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 })
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(`/tests/fixtures/modern-observed-ui.html?scenario=${scenario}`)
  const panel = page.getByTestId('interaction-panel')
  if (scenario === 'wealth') {
    await expect(panel.getByRole('heading')).toContainText('财神')
    await expect(panel.locator('.amount')).toContainText('现金 +')
  } else {
    await expect(panel.locator('.reward-card')).toHaveCount(scenario === 'fortune' ? 2 : 1)
    await expect(panel.getByRole('heading')).toContainText(scenario === 'fortune' ? '福神' : '送神卡')
    await expect.poll(() => panel.locator('.reward-card').evaluateAll(images => images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true)
  }
  await page.screenshot({ path: `/tmp/starcat-observed-${scenario}.png` })
  await panel.getByTestId('interaction-acknowledge').click()
  await expect(page.getByTestId('acknowledged')).toHaveText('true')
  expect(errors).toEqual([])
})

test('游乐场资源尚未解码时显示加载提示，不提前倒数或出现透明空壳', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 })
  let release!: () => void
  const held = new Promise<void>(resolve => { release = resolve })
  await page.route('**/assets-hd/activities/carnival-boy-1/3.webp', async route => { await held; await route.continue() })
  await page.goto('/tests/fixtures/modern-observed-ui.html?scenario=carnival')
  const loading = page.getByRole('status', { name: '活动素材加载' })
  await expect(loading).toContainText('正在准备', { timeout: 3000 })
  await expect(page.getByText('准备接物，3秒倒数', { exact: true })).toHaveCount(0)
  release()
  await expect(page.getByTestId('ready')).toHaveText('ready')
  await expect(loading).toHaveCount(0)
  await expect(page.getByText('准备接物，3秒倒数', { exact: true })).toBeVisible()
})
