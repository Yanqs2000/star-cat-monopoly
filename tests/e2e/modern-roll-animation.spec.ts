import { test, expect } from '@playwright/test'

test('高清掷骰翻滚后定格真实点数，结果展示结束才开始走步', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 })
  await page.addInitScript(() => {
    localStorage.setItem('star-cat-monopoly:asset-profile', 'hd')
    const random = crypto.getRandomValues.bind(crypto)
    crypto.getRandomValues = a => { if (a instanceof Uint32Array && a.length === 1) { a[0] = 153; return a }; return random(a) }
    Date.prototype.getDay = () => 1
  })
  await page.goto('/modern.html')
  await page.getByTestId('character-1').click()
  await page.getByRole('button', { name: '开始对局', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('对局已载入')
  await page.getByTestId('hand-panel').locator('[data-card-id="5"]').click()
  await page.getByTestId('interaction-confirm').click()
  await page.getByTestId('dice-6').click()
  await page.getByTestId('interaction-acknowledge').click()
  const before = JSON.parse((await page.getByTestId('game-state-fingerprint').getAttribute('data-state-json'))!)
  await page.getByRole('button', { name: '掷骰', exact: true }).click()
  const animation = page.getByTestId('dice-animation')
  await expect(animation).toBeVisible({ timeout: 300 })
  await expect(animation).toHaveAttribute('data-stage', 'rolling')
  const rolling = JSON.parse((await page.getByTestId('game-state-fingerprint').getAttribute('data-state-json'))!)
  expect(rolling.players[0].position).toEqual(before.players[0].position)
  await expect(page.getByRole('button', { name: '掷骰', exact: true })).toBeDisabled()
  await page.screenshot({ path: '/tmp/starcat-dice-rolling.png' })
  await expect(animation).toHaveAttribute('data-stage', 'result', { timeout: 2000 })
  await expect(animation).toContainText('6 点')
  await page.screenshot({ path: '/tmp/starcat-dice-result.png' })
  await expect(animation).toHaveCount(0)
  await expect.poll(async () => JSON.parse((await page.getByTestId('game-state-fingerprint').getAttribute('data-state-json'))!).players[0].position).not.toEqual(before.players[0].position)
})
