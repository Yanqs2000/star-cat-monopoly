import { expect, test } from '@playwright/test'

for (const viewport of [{ width: 1366, height: 768 }, { width: 390, height: 844 }]) {
  for (const scenario of ['purchase', 'upgrade', 'rent', 'victory', 'bankruptcy', 'neutral', 'defeat']) {
    test(`${scenario} 图文内容在 ${viewport.width}×${viewport.height} 内完整可读`, async ({ page }) => {
      await page.setViewportSize(viewport)
      const errors: string[] = []
      page.on('pageerror', err => errors.push(err.message))
      page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`) })
      await page.goto(`/tests/fixtures/modern-property-polish.html?scenario=${scenario}`)
      await expect(page.getByTestId('fixture-ready')).toContainText('已准备')
      const panel = page.getByTestId(['victory', 'bankruptcy','defeat'].includes(scenario) ? 'endgame-panel' : 'property-panel')
      await expect(panel).toBeVisible()
      await expect.poll(() => panel.locator('img').evaluateAll(images => images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true)
      const box = (await panel.boundingBox())!
      expect(box.x).toBeGreaterThanOrEqual(0); expect(box.y).toBeGreaterThanOrEqual(0)
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width)
      expect(box.y + box.height).toBeLessThanOrEqual(viewport.height)
      if (scenario === 'rent') await expect(panel.locator('button')).toHaveCount(0)
      if (scenario === 'upgrade') await expect(panel.getByTestId('property-next-art')).toBeVisible()
      if (scenario === 'victory') {
        await expect(panel.getByTestId('endgame-player-1')).toContainText('胜出')
        const date = (await panel.getByText('第 1 轮 · 2026年1月5日', { exact: true }).boundingBox())!
        const players = (await panel.locator('.final-players').boundingBox())!
        expect(date.y + date.height).toBeLessThanOrEqual(players.y)
      }
      expect(await panel.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true)
      await page.screenshot({ path: `/tmp/property-polish/${scenario}-${viewport.width}x${viewport.height}.png` })
      expect(errors).toEqual([])
    })
  }
}


test('矮屏多栋房屋收费时总金额保持可见，房屋列表独立滚动', async({page})=>{
 await page.setViewportSize({width:390,height:500})
 await page.goto('/tests/fixtures/modern-property-polish.html?scenario=rent-many')
 await expect(page.getByTestId('fixture-ready')).toContainText('已准备')
 const panel=page.getByTestId('property-panel'), amount=panel.locator('.amount')
 await expect(amount.locator('strong')).toHaveText('2400')
 const bounds=(await panel.boundingBox())!, money=(await amount.boundingBox())!
 expect(money.y+money.height).toBeLessThanOrEqual(bounds.y+bounds.height-3)
 expect(await panel.locator('.rent-items').evaluate(el=>el.clientHeight)).toBeGreaterThanOrEqual(60)
 await page.screenshot({path:'/tmp/property-polish/rent-many-short.png'})
})
