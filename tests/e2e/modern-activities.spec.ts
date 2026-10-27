import { expect, test, type Page } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { revealGameDetails, playUntil } from './modern-play'

const evidenceDir = '.analysis-cache/acceptance-3c'
async function start(page: Page, seed: number) {
  await page.addInitScript(seed => {
    const original = crypto.getRandomValues.bind(crypto)
    crypto.getRandomValues = array => {
      if (array instanceof Uint32Array && array.length === 1) { array[0] = seed; return array }
      return original(array)
    }
    Date.prototype.getDay = () => 1
    Date.prototype.getFullYear = () => 2026
    Date.prototype.getMonth = () => 8
    Date.prototype.getDate = () => 28
  }, seed)
  await page.goto('/modern.html')
  await page.setViewportSize({ width: 1440, height: 1000 })
  await expect(page).toHaveTitle(/星猫/)
  await page.getByTestId('character-1').click()
  await page.getByRole('button', { name: '开始对局' }).click()
  await expect(page.getByRole('status')).toContainText('对局已载入')
  await revealGameDetails(page); await page.getByLabel('速度').selectOption('2')
}
async function human(page: Page) {
  const [who] = await page.getByTestId('current-player').allTextContents()
  return !!who && !who.includes('AI')
}
async function wallet(page: Page) {
  const text = await page.getByTestId('player-list').locator('li').first().textContent() ?? ''
  const cash = text.match(/现金 (-?\d+) · 存款 (-?\d+)/), tickets = text.match(/奖券 (-?\d+)/)
  if (!cash || !tickets) throw new Error(`无法读取余额：${text}`)
  return { cash: Number(cash[1]), deposit: Number(cash[2]), tickets: Number(tickets[1]) }
}

for (const [seed, clip, cashSign] of [[103,'witch',1],[24,'lottery',-1]] as const) {
  test(`自然开局seed${seed}原${clip}场景20券交易、暂停和重复确认`, async ({ page }) => {
    test.setTimeout(180_000)
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await mkdir(evidenceDir, { recursive: true })
    await start(page, seed)
    await playUntil(page, async () => await human(page) && await page.getByTestId('exchange-form').count() > 0, 1400)
    await expect(page.locator(`[data-clip="${clip}"] image`)).toHaveAttribute('href', /^blob:/)
    await expect.poll(async () => (await page.locator('.exchange-original').boundingBox())?.width).toBe(824)
    const before = await wallet(page)
    await page.getByTestId('exchange-quantity').fill('20')
    await page.getByRole('button', { name: '暂停对局', exact: true }).click()
    await expect(page.getByTestId('exchange-submit')).toBeDisabled()
    await page.getByRole('button', { name: '继续对局', exact: true }).click()
    await page.screenshot({ path: `${evidenceDir}/seed${seed}-${clip}-1440x1000.png` })
    await page.getByTestId('exchange-form').evaluate((form: HTMLFormElement) => { form.requestSubmit(); form.requestSubmit() })
    await expect(page.getByTestId('activity-receipt')).toContainText(`现金 ${cashSign > 0 ? '+' : '-'}2000`)
    expect(await wallet(page)).toEqual({ ...before, cash: before.cash + cashSign*2000, tickets: before.tickets - cashSign*20 })
    expect(errors).toEqual([])
  })
}

for (const [seed,npc] of [[112,13],[133,9],[36,12],[221,14],[219,15],[0,23]] as const) {
  test(`自然开局seed${seed}原NPC${npc}完整动画及实际结算`, async ({ page }) => {
    test.setTimeout(240_000)
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await mkdir(evidenceDir, { recursive: true })
    await start(page, seed)
    await playUntil(page, async () => await human(page) && await page.locator(`[data-clip="trait-${npc}"]`).count() > 0, 2200)
    const original = page.locator(`[data-clip="trait-${npc}"]`)
    await expect(original.locator('image')).toHaveAttribute('href', /^blob:/)
    await expect.poll(async () => (await original.boundingBox())?.width).toBe(462)
    await page.getByRole('button', { name: '暂停对局', exact: true }).click()
    const frame = await original.getAttribute('data-frame')
    await page.waitForTimeout(150)
    await expect(original).toHaveAttribute('data-frame', frame!)
    await page.screenshot({ path: `${evidenceDir}/seed${seed}-npc${npc}-1440x1000.png` })
    await page.getByRole('button', { name: '继续对局', exact: true }).click()
    await expect(page.getByTestId('interaction-acknowledge')).toBeVisible({ timeout: 15_000 })
    if (npc === 9) {
      const patient=page.getByTestId('player-list').locator('li').first()
      await expect(patient).toContainText('住院 3天');await page.getByTestId('interaction-acknowledge').click()
      await playUntil(page,()=>patient.textContent().then(s=>!!s&&!s.includes('住院')),7000)
      await expect(patient).toContainText('19,1')
    }
    else await expect(page.getByTestId('activity-receipt')).toBeVisible()
    expect(errors).toEqual([])
  })
}

test('自然开局准备好送医动画后，素材断网仍保持医院状态及两倍速', async ({ page }) => {
  test.setTimeout(120_000)
  await start(page, 133)
  let lateRequests=0
  await page.route('**/assets/activities/car2/**',route=>{lateRequests++;return route.fulfill({status:404,body:''})})
  await playUntil(page,()=>page.locator('[data-clip="trait-9"]').count().then(Boolean),2200)
  await expect(page.getByTestId('interaction-acknowledge')).toBeVisible({timeout:15000})
  await expect(page.getByRole('alert')).toHaveCount(0)
  expect(lateRequests).toBe(0)
  await expect(page.getByLabel('速度')).toHaveValue('2')
  await expect(page.getByTestId('player-list').locator('li').first()).toContainText('住院 3天')
})
