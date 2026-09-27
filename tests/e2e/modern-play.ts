import type { Page } from '@playwright/test'

/** Drive only visible human decisions; AI continuations are left to the real controller. */
export async function playUntil(page: Page, target: () => Promise<boolean>, limit = 350) {
  for (let turn = 0; turn < limit; turn++) {
    if (await target()) return
    const alerts = await page.getByRole('alert').allTextContents()
    if (alerts.some(message => message.trim())) throw new Error(`未预期的页面错误：${alerts.join(' | ')}`)
    const currentPlayer = await page.getByTestId('current-player').textContent({ timeout: 250 }).catch(() => null)
    if (currentPlayer === null) {
      await page.waitForTimeout(60)
      continue
    }
    if (currentPlayer.includes('AI')) {
      await page.waitForTimeout(80)
      continue
    }
    if (await page.getByTestId('property-acknowledge').count()) {
      await page.getByTestId('property-acknowledge').click()
    } else if (await page.getByTestId('property-accept').count()) {
      await page.getByTestId('property-accept').click()
    } else if (await page.getByTestId('interaction-acknowledge').count()) {
      await page.getByTestId('interaction-acknowledge').click()
    } else if (await page.getByRole('button', { name: '离开卡片屋' }).count()) {
      await page.getByRole('button', { name: '离开卡片屋' }).click()
    } else if (await page.getByRole('button', { name: '离开银行' }).count()) {
      await page.getByRole('button', { name: '离开银行' }).click()
    } else if (await page.getByRole('button', { name: '离开股市' }).count()) {
      await page.getByRole('button', { name: '离开股市' }).click()
    } else if (await page.getByRole('button', { name: '离开公司' }).count()) {
      await page.getByRole('button', { name: '离开公司' }).click()
    } else if (await page.getByTestId('monthly-acknowledge').count()) {
      await page.getByTestId('monthly-acknowledge').click()
    } else if ((await page.getByRole('button', { name: '掷骰' }).count()) > 0 &&
        await page.getByRole('button', { name: '掷骰' }).isEnabled({ timeout: 250 }).catch(() => false)) {
      await page.getByRole('button', { name: '掷骰' }).click()
    } else {
      await page.waitForTimeout(60)
    }
  }
  throw new Error(`未到达目标入口：${await page.getByTestId('current-player').textContent()} / ${await page.getByTestId('round').textContent()}`)
}
