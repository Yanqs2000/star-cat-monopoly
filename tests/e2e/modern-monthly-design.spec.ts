import { test, expect } from '@playwright/test'

for (const viewport of [{ width: 1366, height: 768 }, { width: 390, height: 844 }]) test(`${viewport.width}px月结冠军立绘、四人排名和固定继续按钮完整呈现`, async ({ page }) => {
  await page.setViewportSize(viewport)
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message))
  await page.goto('/tests/fixtures/modern-observed-ui.html?scenario=monthly')
  const panel = page.getByTestId('interaction-panel')
  await expect(panel.getByRole('heading', { name: '本月结算', exact: true })).toBeVisible()
  await expect.poll(() => panel.locator('img').evaluateAll(images => images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true)
  await expect(panel.getByTestId('monthly-standings').locator('li')).toHaveCount(4)
  for (const area of [panel.getByTestId('monthly-champion'), panel.getByTestId('monthly-standings'), panel.getByTestId('monthly-acknowledge')]) {
    const box = (await area.boundingBox())!, boundary = (await panel.boundingBox())!
    expect(box.x).toBeGreaterThanOrEqual(boundary.x)
    expect(box.x+box.width).toBeLessThanOrEqual(boundary.x+boundary.width)
    expect(box.y).toBeGreaterThanOrEqual(boundary.y)
    expect(box.y+box.height).toBeLessThanOrEqual(boundary.y+boundary.height)
  }
  const list = panel.locator('.finance-lines')
  await list.evaluate(element => { element.scrollTop = element.scrollHeight })
  expect(await list.evaluate(element => element.scrollTop)).toBeGreaterThan(0)
  await page.screenshot({ path: `/tmp/starcat-monthly-new-${viewport.width}.png` })
  await expect(page.getByTestId('acknowledged')).toHaveText('false')
  await panel.getByTestId('monthly-acknowledge').click()
  await expect(page.getByTestId('acknowledged')).toHaveText('true')
  expect(errors).toEqual([])
})
