import { expect, test, type Page } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { revealGameDetails, playUntil } from './modern-play'

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
  await revealGameDetails(page); await page.getByLabel('速度').selectOption('2')
}

async function wallet(page: Page) {
  const text = await page.getByTestId('player-list').locator('li').first().textContent() ?? ''
  const money = text.match(/现金 (-?\d+) · 存款 (-?\d+)/)
  const loan = text.match(/贷款 (-?\d+)/)
  if (!money || !loan) throw new Error(`余额无法解析：${text}`)
  return { cash: Number(money[1]), deposit: Number(money[2]), loan: Number(loan[1]) }
}

test('自然开局 seed17 在第2轮银行完成存取、借还、授信与信用卡实际取现', async ({ page }) => {
  test.setTimeout(150_000)
  await mkdir(evidenceDir, { recursive: true })
  await start(page, 17)
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
  await page.screenshot({ path: `${evidenceDir}/seed17-bank-1440x1000.png` })
  await page.getByTestId('interaction-acknowledge').click()
  await page.getByRole('button', { name: '离开银行' }).click()
  await expect(page.getByTestId('player-list').locator('li').first()).toContainText('贷款 11000')
  await playUntil(page, async () =>
    (await page.getByTestId('round').textContent())?.includes('第 3 轮') === true &&
    await page.getByRole('button', { name: '掷骰' }).isEnabled().catch(() => false))
  const beforeCard = await wallet(page)
  const hand = page.getByTestId('hand-panel')
  await hand.locator('[data-card-id="1"]').click()
  await page.getByTestId('interaction-confirm').click()
  await expect(page.getByTestId('interaction-panel')).toContainText('可用额度 100000')
  await page.getByTestId('credit-amount').fill('5000')
  await page.getByTestId('credit-submit').click()
  await expect(page.getByTestId('interaction-panel')).toContainText('信用卡已生效')
  await expect.poll(() => wallet(page)).toEqual({ ...beforeCard, cash: beforeCard.cash + 5000 })
  await expect(page.getByTestId('player-list').locator('li').first()).toContainText('信用 95000 / 已用 5000')
  await expect(hand.locator('[data-card-id="1"]')).toHaveCount(1)
  await page.getByTestId('interaction-acknowledge').click()
  await page.setViewportSize({ width: 1920, height: 1080 })
  await revealGameDetails(page); await page.getByRole('button', { name: '全屏', exact: true }).click()
  await expect.poll(() => page.evaluate(() => document.fullscreenElement?.classList.contains('game-stage'))).toBe(true)
  const board = (await page.locator('canvas').boundingBox())!
  expect(board.width / board.height).toBeCloseTo(4 / 3, 2)
  expect(board.y + board.height).toBeLessThanOrEqual(1080)
})

test('授信已入账后反馈素材404，重试不重复发卡或增加额度', async ({ page }) => {
  test.setTimeout(120_000)
  let failed = false
  let reactionRequests = 0
  await page.route('**/assets/characters/1/reactions/happy/*/1.png', route => {
    reactionRequests += 1
    if (failed) void route.fulfill({ status: 404, body: '' })
    else void route.continue()
  })
  await start(page, 17)
  await playUntil(page, () => page.getByTestId('bank-form').count().then(Boolean))
  failed = true
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

test('自然开局 seed20 在第2轮股市按现价买卖并继续路径', async ({ page }) => {
  test.setTimeout(150_000)
  await mkdir(evidenceDir, { recursive: true })
  await start(page, 20)
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
  await page.screenshot({ path: `${evidenceDir}/seed20-stock-1440x1000.png` })
  await page.getByTestId('interaction-acknowledge').click()
  await page.getByRole('button', { name: '离开股市' }).click()
  await expect(page.getByTestId('stock-company')).toHaveCount(0)
})

test('自然开局 seed16 遇到公司只认购一次，确认结算后结束回合', async ({ page }) => {
  test.setTimeout(120_000)
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await mkdir(evidenceDir, { recursive: true })
  await start(page, 16)
  await playUntil(page, () => page.getByTestId('company-subscribe').count().then(Boolean))
  const company = page.getByTestId('interaction-panel')
  await expect(company).toContainText('电力公司')
  await expect(company).toContainText('董事：暂无')
  const before = await wallet(page)
  await page.getByTestId('company-subscribe').click()
  await page.getByRole('button', { name: '最大', exact: true }).click()
  await page.getByRole('button', { name: '确定认购', exact: true }).evaluate((button: HTMLButtonElement) => { button.click(); button.click() })
  await expect(company).toContainText('现金 -5000')
  await expect(company).toContainText('持股 +1000')
  await expect.poll(() => wallet(page)).toEqual({ ...before, cash: before.cash - 5000 })
  await page.screenshot({ path: `${evidenceDir}/company-once-seed16-result.png` })
  await page.getByTestId('interaction-acknowledge').click()
  await expect(page.getByTestId('company-shares')).toHaveCount(0)
  await expect(page.getByTestId('company-subscribe')).toHaveCount(0)
  await expect(page.getByTestId('current-player')).not.toContainText('卷毛')
  await expect.poll(() => wallet(page)).toEqual({ ...before, cash: before.cash - 5000 })
  await page.getByRole('button', { name: '暂停对局', exact: true }).click()
  await page.screenshot({ path: `${evidenceDir}/company-once-seed16-next-turn.png` })
  expect(errors).toEqual([])
})

test('公司收费后原版界面素材404，重试不重复收费并可继续认购', async ({ page }) => {
  test.setTimeout(120_000)
  await mkdir(evidenceDir, { recursive: true })
  let failed = true
  let requests = 0
  await page.route('**/assets/companies/dialog.png', route => {
    requests += 1
    if (failed) void route.fulfill({ status: 404, body: '' })
    else void route.continue()
  })
  await start(page, 96)
  await playUntil(page, async () =>
    (await page.getByTestId('company-subscribe').count()) > 0 ||
    (await page.getByRole('alert').allTextContents()).some(value => value.includes('companies/dialog.png')), 700)
  await expect(page.getByRole('alert')).toContainText('companies/dialog.png')
  failed = false
  await page.getByRole('button', { name: '重试载入' }).click()
  await expect(page.getByRole('status')).toContainText('对局已载入')
  await expect(page.getByLabel('速度')).toHaveValue('2')
  await expect.poll(() => requests).toBeGreaterThanOrEqual(2)
  await expect(page.getByTestId('company-original-frame')).toBeVisible()
  await expect(page.getByTestId('interaction-panel')).toContainText('本次经营费 现金 -4500')
  const feeText = await page.getByTestId('interaction-panel').textContent() ?? ''
  const dice = feeText.match(/骰子 (\d) \+ (\d) = (\d+)/)
  expect(dice).not.toBeNull()
  expect(Number(dice![1]) + Number(dice![2])).toBe(9)
  expect(Number(dice![3])).toBe(9)
  // Natural route: 100000 + luck reward 10000 - land 2200 - company fee 4500.
  const charged = { cash: 103300, deposit: 100000, loan: 0 }
  await expect.poll(() => wallet(page)).toEqual(charged)
  await page.screenshot({ path: `${evidenceDir}/company-once-seed96-fee-retry.png` })
  await page.getByTestId('company-subscribe').click()
  await page.getByRole('button', { name: '数字 1', exact: true }).click()
  await page.getByRole('button', { name: '数字 0', exact: true }).click()
  const description = await page.getByTestId('interaction-panel').getByRole('heading').textContent() ?? ''
  const price = Number(description.match(/承销价 ([\d.]+)/)?.[1])
  expect(price).toBeGreaterThan(0)
  await page.getByRole('button', { name: '确定认购', exact: true }).click()
  await expect.poll(() => wallet(page)).toEqual({ ...charged, cash: charged.cash - price * 10 })
  await expect(page.getByTestId('interaction-panel')).toContainText('持股 +10')
  await page.getByTestId('interaction-acknowledge').click()
  await expect(page.getByTestId('company-shares')).toHaveCount(0)
  await expect(page.getByTestId('company-subscribe')).toHaveCount(0)
  await expect(page.getByTestId('current-player')).not.toContainText('卷毛')
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

test('末位AI的月结持续展示，观察者确认后才继续日期且不重复结算', async ({ page }) => {
  test.setTimeout(180_000)
  await start(page, 1, [1], { year: 2026, month: 9, day: 30 })
  await playUntil(page, () => page.getByTestId('monthly-acknowledge').count().then(Boolean), 1500)
  const button = page.getByTestId('monthly-acknowledge')
  await expect(button).toBeEnabled()
  const champion = page.getByTestId('monthly-champion').locator('img')
  await expect(champion).toHaveAttribute('src', /^blob:/)
  await expect(page.getByTestId('monthly-standings').locator('img')).toHaveCount(4)
  await expect.poll(() => champion.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true)
  const before = await page.getByTestId('game-state-fingerprint').getAttribute('data-state-json')
  const state = JSON.parse(before!)
  expect(state.players[state.activePlayerIndex].controller).toBe('ai')
  await page.waitForTimeout(2500)
  expect(await page.getByTestId('game-state-fingerprint').getAttribute('data-state-json')).toBe(before)
  await page.screenshot({ path: '/tmp/starcat-monthly-waits-for-user.png' })
  await button.evaluate((element: HTMLButtonElement) => { element.click(); element.click() })
  await expect(button).toHaveCount(0)
  await expect.poll(async () => JSON.parse((await page.getByTestId('game-state-fingerprint').getAttribute('data-state-json'))!).world.day).toBe(2)
  const after = JSON.parse((await page.getByTestId('game-state-fingerprint').getAttribute('data-state-json'))!)
  expect(after.finance.lastSettledMonth).toBe(state.finance.lastSettledMonth)
  expect(after.finance.entries.filter((entry: { kind: string }) => entry.kind === 'deposit-interest')).toHaveLength(state.finance.entries.filter((entry: { kind: string }) => entry.kind === 'deposit-interest').length)
})
