import { test, expect } from '@playwright/test'

for (const [seed, npcId, title] of [[41, 2, '财神'], [16, 4, '福神']] as const) {
  test(`高清自然seed${seed}首回合遇见${title}，反馈对应真实到账`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.setViewportSize({ width: 1366, height: 768 })
    await page.addInitScript(seed => {
      localStorage.setItem('star-cat-monopoly:asset-profile', 'hd')
      const random = crypto.getRandomValues.bind(crypto)
      crypto.getRandomValues = array => {
        if (array instanceof Uint32Array && array.length === 1) { array[0] = seed; return array }
        return random(array)
      }
      Date.prototype.getDay = () => 1; Date.prototype.getFullYear = () => 2026
      Date.prototype.getMonth = () => 8; Date.prototype.getDate = () => 28
    }, seed)
    await page.goto('/modern.html')
    await expect(page).toHaveTitle(/星猫大富翁/)
    await page.getByTestId('character-1').click()
    await page.getByRole('button', { name: '开始对局', exact: true }).click()
    await expect(page.getByRole('status')).toContainText('对局已载入')
    await page.getByRole('button', { name: '掷骰', exact: true }).click()
    const panel = page.getByTestId('interaction-panel')
    await expect(panel.getByRole('heading')).toContainText(title)
    const state = JSON.parse((await page.getByTestId('game-state-fingerprint').getAttribute('data-state-json'))!)
    expect(state.interaction.notice.npcId).toBe(npcId)
    expect(state.world.statuses[1]).toMatchObject({ godId: npcId, godDays: 7 })
    if (npcId === 2) {
      await expect(panel.locator('.amount')).toHaveText('现金 +16053')
      expect(state.players[0].cash).toBe(116053)
      await expect(page.getByTestId('hud-cash')).toHaveText('116053')
    } else {
      expect(state.interaction.notice.cardIds).toEqual([14, 20])
      expect(state.inventories[1].slice(-2)).toEqual([14, 20])
      await expect(panel.locator('.reward-card')).toHaveCount(2)
      await expect.poll(() => panel.locator('.reward-card').evaluateAll(images => images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true)
    }
    await expect(page.locator('vite-error-overlay')).toHaveCount(0)
    await page.screenshot({ path: `/tmp/starcat-production-${title}.png` })
    await page.getByTestId('interaction-acknowledge').click()
    const after = JSON.parse((await page.getByTestId('game-state-fingerprint').getAttribute('data-state-json'))!)
    expect(after.players[0].cash).toBe(state.players[0].cash)
    expect(after.inventories[1]).toEqual(state.inventories[1])
    expect(errors).toEqual([])
  })
}
