import { expect, test } from '@playwright/test'
import staticArtwork from '../../src/modern/data/static-hd-assets.json' with { type: 'json' }

test('new static cards and company building render through real game components at their original logical size', async ({ page }, testInfo) => {
  test.setTimeout(120_000)
  const errors: string[] = []
  const requested: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`) })
  page.on('request', request => requested.push(new URL(request.url()).pathname))
  await page.setViewportSize({ width: 1440, height: 960 })
  await page.goto('/tests/fixtures/modern-static-art.html')
  await expect(page).toHaveTitle(/星猫大富翁/)
  await expect(page.locator('#result')).toHaveText('实际组件已载入')
  await expect(page.locator('#board canvas')).toBeVisible()
  await expect(page.locator('vite-error-overlay')).toHaveCount(0)
  for (let section = 0; section < 3; section++) {
    for (const image of await page.getByTestId('hand-panel').locator('img').all()) {
      await expect(image).toHaveAttribute('src', /\/hd-static\/interactions\/cards\//)
      await expect.poll(() => image.evaluate(image => (image as HTMLImageElement).naturalWidth)).toBe(260)
    }
    if (section < 2) await page.getByTestId('hand-next').click()
  }
  expect(requested).toContain('/hd-static/companies/1.webp')
  expect(requested).toContain('/assets-hd/companies/2.webp')
  expect(requested.some(path => path.includes('/hd-art/characters/'))).toBe(false)
  await page.getByTestId('hand-prev').click()
  await page.getByTestId('hand-prev').click()
  await page.getByTestId('hand-card').first().click()
  await expect(page.locator('#result')).toHaveText('选择卡片 1')
  await page.screenshot({ path: testInfo.outputPath('static-art-actual-components.png'), fullPage: true })
  expect(errors).toEqual([])

  await page.goto('/tests/fixtures/modern-static-art.html?profile=original')
  await expect(page.locator('#result')).toHaveText('实际组件已载入')
  await expect(page.getByTestId('hand-panel').locator('img').first()).toHaveAttribute('src', /\/assets\/interactions\/cards\/1.png$/)
})

test('new event illustrations are loaded by the real interaction panel and its acknowledge button responds', async ({ page }, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`) })
  for (const asset of staticArtwork.assets.filter(asset => asset.enabled && /^assets\/interactions\/luck\/\d+\.png$/.test(asset.source))) {
    const id = Number(asset.source.match(/\/(\d+)\.png$/)![1])
    await page.goto(`/tests/fixtures/modern-static-art.html?event=${id}`)
    await expect(page.locator('#result')).toHaveText('实际事件组件已载入')
    const image = page.getByTestId('luck-image')
    await expect(image).toHaveAttribute('src', `/${asset.url}`)
    await expect.poll(() => image.evaluate(image => (image as HTMLImageElement).naturalWidth)).toBe(1200)
    await page.getByTestId('interaction-acknowledge').click()
    await expect(page.locator('#result')).toHaveText(`确认事件 ${id}`)
    if (id === 13) await page.screenshot({ path: testInfo.outputPath('event-actual-interaction.png'), fullPage: true })
  }
  expect(errors).toEqual([])
})
