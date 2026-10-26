import { test, expect } from '@playwright/test'

test('实际地图收费光柱覆盖计费房屋、会闪动且暂停后冻结', async ({ page }) => {
  await page.goto('/tests/fixtures/modern-property-corners.html')
  await expect(page.locator('#status')).toContainText('全部56块已购')
  await page.evaluate(() => {
    const { scene, state } = (window as any).cornerFixture
    state.properties[43] = { ownerId: 2, level: 2 }; state.properties[47] = { ownerId: 2, level: 0 }; scene.setProperties(state.properties)
    scene.restoreCameraState({ x: 400-25*56, y: 260-31*40, scale: 1, following: false })
    scene.setRentHighlight([{ parcelId: 43, amount: 3000 }, { parcelId: 47, amount: 800 }])
    scene.setPaused(false)
  })
  await page.waitForTimeout(180)
  const first = await page.locator('canvas').screenshot()
  await page.waitForTimeout(230)
  const next = await page.locator('canvas').screenshot()
  expect(first.equals(next)).toBe(false)
  await page.evaluate(() => (window as any).cornerFixture.scene.setPaused(true))
  await page.waitForTimeout(80)
  const paused = await page.locator('canvas').screenshot()
  await page.waitForTimeout(280)
  expect(paused.equals(await page.locator('canvas').screenshot())).toBe(true)
  await page.screenshot({ path: '/tmp/starcat-rent-highlight.png' })
  await page.evaluate(() => (window as any).cornerFixture.scene.setRentHighlight([]))
  expect(paused.equals(await page.locator('canvas').screenshot())).toBe(false)
})
