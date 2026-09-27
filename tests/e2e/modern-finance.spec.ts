import { expect, test, type Page } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { playUntil } from './modern-play'

const evidenceDir = '.analysis-cache/acceptance-3b'

async function start(page: Page, seed: number, characters = [1], date = { year: 2026, month: 9, day: 27 }) {
  await page.addInitScript(({ seed, date }) => {
    const original = crypto.getRandomValues.bind(crypto)
    crypto.getRandomValues = array => {
      if (array instanceof Uint32Array && array.length === 1) { array[0] = seed; return array }
      return original(array)
    }
    Date.prototype.getDay = () => 1
    Date.prototype.getFullYear = () => date.year
    Date.prototype.getMonth = () => date.month - 1
    Date.prototype.getDate = () => date.day
  }, { seed, date })
  await page.goto('/modern.html')
  for (const id of characters) await page.getByTestId(`character-${id}`).click()
  await page.getByRole('button', { name: '开始对局' }).click()
  await expect(page.getByRole('status')).toContainText('对局已载入')
  await page.getByLabel('速度').selectOption('2')
}

async function wallet(page: Page) {
  const text = await page.getByTestId('player-list').locator('li').first().textContent() ?? ''
  const money = text.match(/现金 (-?\d+) · 存款 (-?\d+)/)
  const loan = text.match(/贷款 (-?\d+)/)
  if (!money || !loan) throw new Error(`余额无法解析：${text}`)
  return { cash: Number(money[1]), deposit: Number(money[2]), loan: Number(loan[1]) }
}

test('自然开局 seed8 在第2轮银行完成存取、借还与授信', async ({ page }) => {
  test.setTimeout(150_000)
  await mkdir(evidenceDir, { recursive: true })
  await start(page, 8)
  await playUntil(page, () => page.getByTestId('bank-form').count().then(Boolean))
  await expect(page.getByTestId('round')).toContainText('第 2 轮')
  const before = await wallet(page)
  const operation = async (action: string, amount: number) => {
    await page.getByTestId('bank-operation').selectOption(action)
    await page.getByTestId('bank-amount').fill(String(amount))
    await page.getByTestId('bank-form').evaluate((form: HTMLFormElement) => form.requestSubmit())
    await expect(page.getByTestId('interaction-panel')).toContainText('结算结果')
    await page.getByTestId('interaction-acknowledge').click()
    await expect(page.getByTestId('bank-form')).toBeVisible()
  }
  await operation('deposit', 200)
  await expect.poll(() => wallet(page)).toEqual({ cash: before.cash - 200, deposit: before.deposit + 200, loan: 0 })
  await operation('withdraw', 50)
  await expect.poll(() => wallet(page)).toEqual({ cash: before.cash - 150, deposit: before.deposit + 150, loan: 0 })
  await operation('borrow', 12000)
  await expect.poll(() => wallet(page)).toEqual({ cash: before.cash + 11850, deposit: before.deposit + 150, loan: 12000 })
  await operation('repay-loan', 1000)
  await expect.poll(() => wallet(page)).toEqual({ cash: before.cash + 10850, deposit: before.deposit + 150, loan: 11000 })
  await page.getByRole('button', { name: '申请信用卡' }).click()
  await expect(page.getByTestId('interaction-panel')).toContainText('信用申请通过')
  await page.screenshot({ path: `${evidenceDir}/seed8-bank-1440x1000.png` })
  await page.getByTestId('interaction-acknowledge').click()
  await page.getByRole('button', { name: '离开银行' }).click()
  await expect(page.getByTestId('player-list').locator('li').first()).toContainText('贷款 11000')
})

test('授信已入账后反馈素材404，重试不重复发卡或增加额度', async ({ page }) => {
  test.setTimeout(120_000)
  let failed = true
  let reactionRequests = 0
  await page.route('**/assets/characters/1/reactions/happy/*/1.png', route => {
    reactionRequests += 1
    if (failed) void route.fulfill({ status: 404, body: '' })
    else void route.continue()
  })
  await start(page, 8)
  await playUntil(page, () => page.getByTestId('bank-form').count().then(Boolean))
  await page.getByRole('button', { name: '申请信用卡' }).click()
  await expect(page.getByRole('alert')).toContainText('characters/1/reactions/happy/', { timeout: 15_000 })
  failed = false
  await page.getByRole('button', { name: '重试载入' }).click()
  await expect(page.getByRole('status')).toContainText('对局已载入')
  await expect(page.getByLabel('速度')).toHaveValue('2')
  await expect.poll(() => reactionRequests).toBeGreaterThanOrEqual(2)
  await expect(page.getByTestId('interaction-panel')).toContainText('信用申请通过')
  await expect(page.getByTestId('hand-panel').locator('[data-card-id="1"]')).toHaveCount(1)
  await expect(page.getByTestId('player-list').locator('li').first()).toContainText('信用 100000 / 已用 0')
  await page.getByTestId('interaction-acknowledge').click()
  await expect(page.getByTestId('bank-form')).toBeVisible()
  await page.getByRole('button', { name: '申请信用卡' }).click()
  await expect(page.getByRole('alert')).toContainText('不符合信用卡申请条件')
  await expect(page.getByTestId('hand-panel').locator('[data-card-id="1"]')).toHaveCount(1)
})

test('自然开局 seed5 在第2轮股市按现价买卖并继续路径', async ({ page }) => {
  test.setTimeout(150_000)
  await mkdir(evidenceDir, { recursive: true })
  await start(page, 5)
  await playUntil(page, () => page.getByTestId('stock-company').count().then(Boolean))
  await expect(page.getByTestId('round')).toContainText('第 2 轮')
  const before = await wallet(page)
  await page.getByTestId('stock-company').selectOption('2')
  await page.getByTestId('stock-shares').fill('3')
  const description = await page.getByTestId('interaction-panel').textContent() ?? ''
  const price = Number(description.match(/现价 ([\d.]+)/)?.[1])
  expect(price).toBeGreaterThan(0)
  const cashChange = Math.trunc(price * 3)
  await page.getByTestId('stock-buy').click()
  await expect(page.getByTestId('interaction-panel')).toContainText(`现金 -${cashChange}`)
  await expect.poll(() => wallet(page)).toEqual({ ...before, cash: before.cash - cashChange })
  await page.getByTestId('interaction-acknowledge').click()
  await page.getByTestId('stock-company').selectOption('2')
  await expect(page.getByTestId('interaction-panel')).toContainText('已持 3')
  await page.getByTestId('stock-shares').fill('3')
  await page.getByTestId('stock-sell').click()
  await expect(page.getByTestId('interaction-panel')).toContainText(`现金 +${cashChange}`)
  await expect.poll(() => wallet(page)).toEqual(before)
  await page.screenshot({ path: `${evidenceDir}/seed5-stock-1440x1000.png` })
  await page.getByTestId('interaction-acknowledge').click()
  await page.getByRole('button', { name: '离开股市' }).click()
  await expect(page.getByTestId('stock-company')).toHaveCount(0)
})

test('自然开局 seed16 落在公司格认购并取得董事权', async ({ page }) => {
  test.setTimeout(120_000)
  await mkdir(evidenceDir, { recursive: true })
  await start(page, 16)
  await playUntil(page, () => page.getByTestId('company-shares').count().then(Boolean))
  const company = page.getByTestId('interaction-panel')
  await expect(company).toContainText('电力公司')
  await expect(company).toContainText('董事：暂无')
  const before = await wallet(page)
  await page.getByTestId('company-shares').fill('10')
  await page.getByTestId('company-subscribe').click()
  await expect(company).toContainText('现金 -50')
  await expect.poll(() => wallet(page)).toEqual({ ...before, cash: before.cash - 50 })
  await page.getByTestId('interaction-acknowledge').click()
  await expect(company).toContainText('董事：卷毛')
  await expect(company).toContainText('已持 10 股')
  await page.screenshot({ path: `${evidenceDir}/seed16-company-1440x1000.png` })
  await page.getByRole('button', { name: '离开公司' }).click()
})

test('四名真人跨月时月结确认前不推进日期，确认后仅执行一次', async ({ page }) => {
  test.setTimeout(180_000)
  await mkdir(evidenceDir, { recursive: true })
  await start(page, 1, [1, 2, 3, 4], { year: 2026, month: 9, day: 30 })
  await playUntil(page, () => page.getByTestId('monthly-acknowledge').count().then(Boolean), 600)
  await expect(page.getByTestId('interaction-panel')).toContainText('2026年10月结算')
  await expect(page.getByTestId('interaction-panel')).toContainText('排名台词：')
  await expect(page.locator('.funds')).toContainText('2026年10月1日')
  await page.screenshot({ path: `${evidenceDir}/month-boundary-1440x1000.png` })
  await page.getByTestId('monthly-acknowledge').click()
  await expect(page.getByTestId('monthly-acknowledge')).toHaveCount(0)
  await expect(page.locator('.funds')).toContainText('2026年10月2日', { timeout: 15_000 })
})
