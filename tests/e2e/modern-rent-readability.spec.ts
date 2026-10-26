import { test, expect } from '@playwright/test'

test('收费明细在原版蓝色面板和深色面板上均可读且不会溢出窄屏', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/tests/fixtures/modern-rent-panel.html')
  const panel = page.getByTestId('property-panel')
  await expect(panel).toBeVisible()
  for (const original of [true, false]) {
    await page.locator('.board-surface').evaluate((element, original) => element.parentElement!.classList.toggle('original-ui', original), original)
    const contrast = await panel.evaluate(element => {
      const rgb = (value: string) => value.match(/[\d.]+/g)!.slice(0,3).map(Number)
      const luminance = (values: number[]) => values.map(n => { const s=n/255; return s<=0.04045 ? s/12.92 : ((s+0.055)/1.055)**2.4 }).reduce((sum,n,i)=>sum+n*[0.2126,0.7152,0.0722][i]!,0)
      const fg=luminance(rgb(getComputedStyle(element.querySelector('.rent-items li')!).color)), bg=luminance(rgb(getComputedStyle(element).backgroundColor))
      return { ratio: (Math.max(fg,bg)+0.05)/(Math.min(fg,bg)+0.05), fg: getComputedStyle(element.querySelector('.rent-items li')!).color, bg: getComputedStyle(element).backgroundColor }
    })
    expect(contrast.ratio).toBeGreaterThanOrEqual(4.5)
    const bounds = (await panel.boundingBox())!; expect(bounds.x).toBeGreaterThanOrEqual(0); expect(bounds.x+bounds.width).toBeLessThanOrEqual(390)
    await expect(panel.getByRole('button')).toHaveCount(0)
    await expect(panel).toContainText('1 秒后自动扣款')
    await page.screenshot({ path: `/tmp/starcat-rent-panel-${original ? 'blue' : 'dark'}-390.png` })
  }
})


test('人类玩家不点击任何按钮也会在提示后自动付款并继续回合', async ({ page }) => {
  await page.goto('/tests/fixtures/modern-rent-panel.html?auto=1')
  const panel = page.getByTestId('property-panel')
  await expect(panel).toContainText('正在标出收费房屋')
  await expect(panel.getByRole('button')).toHaveCount(0)
  await expect(page.getByTestId('rent-wallet')).toHaveText('100000/100000')
  await expect(panel).toContainText('1 秒后自动扣款')
  await page.waitForTimeout(500)
  await expect(page.getByTestId('rent-wallet')).toHaveText('100000/100000')
  await page.screenshot({ path: '/tmp/starcat-human-auto-rent.png' })
  await expect(page.getByTestId('rent-wallet')).toHaveText('96200/103800')
  await expect(page.getByTestId('rent-turn')).toHaveText('awaiting-roll/1')
  await page.waitForTimeout(1200)
  await expect(page.getByTestId('rent-wallet')).toHaveText('96200/103800')
  await expect(page.getByTestId('rent-turn')).toHaveText('awaiting-roll/1')
})
