import type { Locator, Page } from '@playwright/test'

/** Drive only visible human decisions; AI continuations are left to the real controller. */
export async function playUntil(page: Page, target: () => Promise<boolean>, limit = 350) {
  for (let turn = 0; turn < limit; turn++) {
    if (await target()) return
    const alerts = await page.getByRole('alert').allTextContents()
    if (alerts.some(message => message.trim())) {
      if (await target()) return
      throw new Error(`未预期的页面错误：${alerts.join(' | ')}`)
    }
    const currentPlayer = await page.getByTestId('current-player').textContent({ timeout: 250 }).catch(() => null)
    if (currentPlayer === null) {
      await page.waitForTimeout(60)
      continue
    }
    if (currentPlayer.includes('AI')) {
      await page.waitForTimeout(80)
      continue
    }
    let action: Locator | undefined
    const choices = [
      page.getByTestId('property-acknowledge'), page.getByTestId('property-accept'),
      page.getByTestId('interaction-acknowledge'),
      page.getByRole('button', { name: '继续动画' }),
      page.locator('.exchange-form').getByRole('button', { name: '放弃' }),
      page.getByTestId('portal-5'),
      page.getByTestId('ludo-confirm'),
      page.locator('[data-testid^="court-target-"]').first(),
      page.getByTestId('court-case-0'),
      ...['离开卡片屋', '离开银行', '离开股市', '离开公司'].map(name => page.getByRole('button', { name })),
      page.getByTestId('monthly-acknowledge'),
    ]
    for (const choice of choices) {
      if (await choice.count()) { action = choice; break }
    }
    const roll = page.getByRole('button', { name: '掷骰' })
    if (!action && await roll.isEnabled({ timeout: 250 }).catch(() => false)) action = roll
    if (!action) {
      await page.waitForTimeout(60)
      continue
    }
    // A resource failure or turn transition may arrive during the DOM reads above.
    if (await target()) return
    try {
      await action.click({ timeout: 2000 })
    } catch (error) {
      if (await target()) return
      throw error
    }
  }
  throw new Error(`未到达目标入口：${await page.getByTestId('current-player').textContent()} / ${await page.getByTestId('round').textContent()}`)
}
