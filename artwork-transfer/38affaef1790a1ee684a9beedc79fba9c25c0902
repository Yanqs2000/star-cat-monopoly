import { expect, test } from '@playwright/test'
import { playUntil, revealGameDetails } from './modern-play'

for (const profile of ['original', 'hd'] as const) {
  test(`${profile} 自然到公司后拖动计算器滑块、数字键确认，实际扣款只发生一次`, async ({ page }) => {
    test.setTimeout(150_000)
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
    const failed: string[] = []
    page.on('response', response => { if (response.status() >= 400) failed.push(response.url()) })
    await page.addInitScript(() => {
      const original = crypto.getRandomValues.bind(crypto)
      crypto.getRandomValues = array => {
        if (array instanceof Uint32Array && array.length === 1) { array[0] = 16; return array }
        return original(array)
      }
      Date.prototype.getDay = () => 1
      Date.prototype.getFullYear = () => 2026
      Date.prototype.getMonth = () => 8
      Date.prototype.getDate = () => 27
    })
    await page.goto('/modern.html')
    await page.getByLabel('素材画质').selectOption(profile)
    await expect(page).toHaveTitle(/星猫/)
    await page.getByTestId('character-1').click()
    await page.getByRole('button', { name: '开始对局', exact: true }).click()
    await expect(page.getByRole('status')).toContainText('对局已载入')
    await revealGameDetails(page)
    await page.getByLabel('速度').selectOption('2')
    await page.getByTestId('toggle-game-details').click()
    await playUntil(page, () => page.getByTestId('company-subscribe').count().then(Boolean))
    const cash = async () => Number((await page.getByTestId('player-list').locator('li').first().textContent())?.match(/现金 (-?\d+)/)?.[1])
    const before = await cash()
    await page.getByTestId('company-subscribe').click()
    const calculator = page.getByTestId('company-calculator')
    await expect(calculator).toBeVisible()
    // Opaque generic button paint hides the numbers baked into the native artwork.
    await expect(calculator.getByRole('button', { name: '数字 1', exact: true })).toHaveCSS('background-image', 'none')
    await expect(page.locator('input[type="number"]')).toHaveCount(0)
    await expect(page.getByTestId('company-shares')).toHaveText('0')
    const slider = page.getByRole('slider', { name: '认购股数滑块' })
    const box = (await slider.boundingBox())!
    await page.mouse.move(box.x + 6, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width * .6, box.y + box.height / 2, { steps: 12 })
    await page.mouse.up()
    const dragged = Number(await page.getByTestId('company-shares').textContent())
    expect(dragged).toBeGreaterThan(400)
    expect(dragged).toBeLessThan(800)
    await slider.focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('company-shares')).toHaveText(String(dragged + 1))
    await page.getByRole('button', { name: '最大', exact: true }).click()
    await page.getByRole('button', { name: '数字 9', exact: true }).click()
    await expect(page.getByTestId('company-shares')).toHaveText('1000')
    await page.getByRole('button', { name: '取消认购', exact: true }).focus()
    await page.keyboard.press('Enter')
    await expect.poll(cash).toBe(before)
    await page.getByTestId('company-subscribe').click()
    await expect(page.getByTestId('company-shares')).toHaveText('0')
    for (const digit of ['1', '2', '3']) {
      await page.getByRole('button', { name: `数字 ${digit}`, exact: true }).focus()
      await page.keyboard.press('Enter')
    }
    await expect(calculator).toContainText('成交额 615')
    await page.getByRole('button', { name: '暂停对局', exact: true }).click()
    await expect(slider).toBeDisabled()
    await page.getByRole('button', { name: '继续对局', exact: true }).click()
    await expect(page.getByTestId('company-shares')).toHaveText('123')
    await page.screenshot({ path: `/tmp/starcat-calculator-${profile}-desktop.png` })
    await page.setViewportSize({ width: 1024, height: 700 })
    await expect(page.getByRole('button', { name: '确定认购' })).toBeInViewport()
    await page.screenshot({ path: `/tmp/starcat-calculator-${profile}-compact.png` })
    await page.getByRole('button', { name: '确定认购', exact: true }).evaluate((button: HTMLButtonElement) => { button.click(); button.click() })
    await expect(page.getByTestId('interaction-panel')).toContainText('持股 +123')
    await expect.poll(cash).toBe(before - 615)
    const state = JSON.parse((await page.getByTestId('game-state-fingerprint').getAttribute('data-state-json'))!)
    expect(state.finance.stocks[13].holdings[1].shares).toBe(123)
    expect(state.finance.entries.filter((entry: { kind: string }) => entry.kind === 'company-subscribe')).toHaveLength(1)
    await page.getByTestId('interaction-acknowledge').click()
    await expect(calculator).toHaveCount(0)
    await expect.poll(cash).toBe(before - 615)
    await expect(page.locator('vite-error-overlay')).toHaveCount(0)
    expect(errors).toEqual([])
    expect(failed).toEqual([])
  })
}
