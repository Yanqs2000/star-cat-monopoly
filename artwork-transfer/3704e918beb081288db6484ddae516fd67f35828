import { expect, test, type Page } from '@playwright/test'

async function layout(page: Page) {
  return page.evaluate(() => Object.fromEntries(['.board-area', '.turn-controls', 'canvas'].map(selector => {
    const element = document.querySelector(selector)!
    const box = element.getBoundingClientRect()
    return [selector, { x: box.x, y: box.y, width: box.width, height: box.height }]
  })))
}

for (const profile of ['original', 'hd'] as const) {
  for (const viewport of [{ width: 1366, height: 768 }, { width: 390, height: 844 }, { width: 700, height: 400 }]) {
    test(`${profile} ${viewport.width}px 打开、取消卡片和暂停不挤压地图，也不重新加载已准备的卡面`, async ({ page }) => {
      await page.setViewportSize(viewport)
      const errors: string[] = [], cardRequests: string[] = []
      let watching = false
      page.on('pageerror', error => errors.push(error.message))
      page.on('request', request => {
        if (watching && /\/(?:assets|hd-static)\/interactions\/cards\//.test(request.url())) cardRequests.push(request.url())
      })
      await page.addInitScript(profile => {
        localStorage.setItem('star-cat-monopoly:asset-profile', profile)
        const random = crypto.getRandomValues.bind(crypto)
        crypto.getRandomValues = array => {
          if (array instanceof Uint32Array && array.length === 1) { array[0] = 153; return array }
          return random(array)
        }
        Date.prototype.getDay = () => 1
      }, profile)
      await page.goto('/modern.html')
      await page.getByTestId('character-1').click()
      await page.getByRole('button', { name: '开始对局', exact: true }).click()
      await expect(page.getByRole('status')).toContainText('对局已载入')
      await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
      const before = await layout(page)
      const state = await page.getByTestId('game-state-fingerprint').getAttribute('data-state-json')
      watching = true
      for (const cardId of [5, 6]) {
        const handImage = page.getByTestId('hand-panel').locator(`[data-card-id="${cardId}"] img`)
        const prepared = await handImage.getAttribute('src')
        expect(prepared).toMatch(/^blob:/)
        await handImage.click()
        const panel = page.getByTestId('interaction-panel')
        await expect(panel).toBeVisible()
        expect.soft(await layout(page), '打开卡片时地图和操作条保持原位').toEqual(before)
        await expect.soft(panel.locator('.card-head img')).toHaveAttribute('src', prepared!)
        await page.getByTestId('interaction-cancel').click()
        expect(await layout(page)).toEqual(before)
        expect(await page.getByTestId('game-state-fingerprint').getAttribute('data-state-json')).toBe(state)
      }
      await page.getByRole('button', { name: '暂停对局', exact: true }).click()
      expect(await layout(page)).toEqual(before)
      await page.getByRole('button', { name: '继续对局', exact: true }).click()
      expect(await layout(page)).toEqual(before)
      expect(cardRequests).toEqual([])
      expect(errors).toEqual([])
      await expect(page.locator('vite-error-overlay')).toHaveCount(0)
      await page.screenshot({ path: `/tmp/starcat-card-stable-${profile}-${viewport.width}.png` })
    })
  }
}
