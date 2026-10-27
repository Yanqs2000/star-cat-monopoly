import { expect, test, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
const cardRecords = JSON.parse(readFileSync(new URL('../../src/modern/data/card-board.json', import.meta.url), 'utf8')).records as Record<number, { position: { column: number; row: number } }>
import type { GameState } from '../../src/modern/features/game/types'
import { revealGameDetails, playUntil } from './modern-play'

async function state(page: Page): Promise<GameState> {
  return JSON.parse((await page.getByTestId('game-state-fingerprint').getAttribute('data-state-json'))!)
}
async function start(page: Page, profile = 'original', humans = [1, 2, 3, 4], date = 28) {
  await page.addInitScript(day => {
    const original = crypto.getRandomValues.bind(crypto)
    crypto.getRandomValues = array => {
      if (array instanceof Uint32Array && array.length === 1) { array[0] = 42; return array }
      return original(array)
    }
    Date.prototype.getDay = () => 1
    Date.prototype.getFullYear = () => 2026
    Date.prototype.getMonth = () => 8
    Date.prototype.getDate = () => day
  }, date)
  await page.goto('/modern.html')
  await page.getByLabel('素材画质', { exact: true }).selectOption(profile)
  for (const id of humans) await page.getByTestId(`character-${id}`).click()
  await page.getByRole('button', { name: '开始对局', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('对局已载入')
}

for (const profile of ['original', 'hd']) test(`${profile}实际对局可查询资产、行情、持股和帮助，关闭后完整状态不变`, async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await start(page, profile)
  const before = await state(page)
  await revealGameDetails(page); await page.getByTestId('open-assets').click()
  await expect(page.getByTestId('asset-standings').locator('tbody tr')).toHaveCount(4)
  await expect(page.getByTestId('assets-player-1')).toContainText('260000')
  await page.keyboard.press('ArrowUp')
  expect(await state(page)).toEqual(before)
  await page.getByTestId('reference-stocks').click()
  await expect(page.getByTestId('stock-overview').locator('tbody tr')).toHaveCount(12)
  await page.getByLabel('查询角色').selectOption('2')
  await expect(page.getByTestId('stock-row-2')).toContainText('3000')
  await page.getByTestId('reference-holdings').click()
  await expect(page.getByTestId('holdings-overview').locator('tbody tr')).toHaveCount(15)
  await expect(page.getByTestId('holdings-row-13')).toContainText('非上市')
  await page.getByTestId('reference-help').click()
  await expect(page.getByTestId('help-card')).toHaveCount(17)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: '对局查询与帮助' })).toHaveCount(0)
  await expect(page.getByTestId('open-assets')).toBeFocused()
  await expect(page.getByRole('button', { name: '掷骰', exact: true })).toBeEnabled()
  expect(await state(page)).toEqual(before)
  expect(errors).toEqual([])
  expect(await page.locator('vite-error-overlay').count()).toBe(0)
})

test('选人前帮助、全屏内查询、原暂停状态和Escape关闭后保留全屏', async ({ page }) => {
  await page.goto('/modern.html')
  await page.getByTestId('character-3').click()
  await page.getByTestId('open-help').click()
  await expect(page.getByTestId('help-card')).toHaveCount(17)
  await page.keyboard.press('Escape')
  await expect(page.getByTestId('selected-order')).toContainText('吉吉&米米')
  await start(page)
  await page.getByRole('button', { name: '暂停对局', exact: true }).click()
  await revealGameDetails(page); await page.getByRole('button', { name: '全屏', exact: true }).click()
  await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(true)
  const before = await state(page)
  await revealGameDetails(page); await page.getByTestId('open-assets').click()
  await page.screenshot({ path: '/tmp/starcat-functions-assets-fullscreen.png' })
  await expect(page.getByRole('dialog', { name: '对局查询与帮助' })).toBeVisible()
  expect(await page.getByTestId('reference-close').evaluate(element => !!element.closest(':fullscreen'))).toBe(true)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: '对局查询与帮助' })).toHaveCount(0)
  await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(true)
  await expect(page.getByRole('button', { name: '继续对局', exact: true })).toBeVisible()
  expect(await state(page)).toEqual(before)
})

test('实际地图住宅道路与建筑、当前公司和失物招领查询，拖动不触发', async ({ page }) => {
  await start(page)
  const before = await state(page)
  await revealGameDetails(page); await page.getByRole('button', { name: '全图', exact: true }).click()
  const canvas = page.locator('canvas'), box = (await canvas.boundingBox())!
  const scale = Math.min(760 / 2700, 560 / 2552)
  // MapScene.resize uniformly fits the 800×600 viewport, then centers the letterbox.
  const viewportScale = Math.min(box.width / 800, box.height / 600)
  const point = (column: number, row: number) => ({
    x: (box.width - 800 * viewportScale) / 2 + ((400 - (-184 + 1350) * scale) + (column * 56 + 28) * scale) * viewportScale,
    y: (box.height - 600 * viewportScale) / 2 + ((300 - (-313 + 1276) * scale) + (row * 40 + 20) * scale) * viewportScale,
  })
  for (const position of [{ column: 6, row: 32 }, { column: 7, row: 31 }]) {
    await canvas.click({ position: point(position.column, position.row) })
    await expect(page.getByTestId('map-info')).toContainText('金星大道')
    await expect(page.getByTestId('map-info')).toContainText('1500')
    await page.getByRole('button', { name: '关闭地图信息' }).click()
  }
  const record = cardRecords[before.finance.stocks[1]!.mainRecordId - 2]!
  await canvas.click({ position: point(record.position.column, record.position.row) })
  await expect(page.getByTestId('map-info')).toContainText(before.finance.stocks[1]!.name)
  await expect(page.getByTestId('map-info')).toContainText('待购股份 2000')
  await page.screenshot({ path: '/tmp/starcat-functions-map-company.png' })
  await page.getByRole('button', { name: '关闭地图信息' }).click()
  await canvas.click({ position: point(4, 32) })
  await expect(page.getByTestId('map-info')).toContainText('失物招领')
  await expect(page.getByTestId('map-info')).toContainText('累计金额 0')
  await page.getByRole('button', { name: '关闭地图信息' }).click()
  const p = point(6, 32), x = box.x + p.x, y = box.y + p.y
  await page.mouse.move(x, y); await page.mouse.down()
  await page.mouse.move(x + 80, y); await page.mouse.move(x, y); await page.mouse.up()
  await expect(page.getByTestId('map-info')).toHaveCount(0)
  expect(await state(page)).toEqual(before)
})

test('查询在逐格移动中冻结完整状态，关闭后继续原移动', async ({ page }) => {
  await start(page)
  await page.getByRole('button', { name: '掷骰', exact: true }).click()
  await revealGameDetails(page); await page.getByTestId('open-assets').click()
  const before = await state(page)
  await page.waitForTimeout(300)
  expect(await state(page)).toEqual(before)
  await page.getByTestId('reference-close').click()
  await expect.poll(async () => JSON.stringify(await state(page))).not.toBe(JSON.stringify(before))
})

test('月结在账户结算后提供完整资产排名，查询关闭不会二次月结', async ({ page }) => {
  test.setTimeout(180000)
  await start(page, 'original', [1, 2, 3, 4], 30)
  await revealGameDetails(page); await page.getByLabel('速度', { exact: true }).selectOption('2')
  await playUntil(page, () => page.getByTestId('monthly-standings').count().then(Boolean), 1200)
  await expect(page.getByTestId('monthly-standings').locator('li')).toHaveCount(4)
  const before = await state(page)
  await revealGameDetails(page); await page.getByTestId('open-assets').click()
  await expect(page.getByTestId('asset-standings')).toBeVisible()
  await page.getByTestId('reference-close').click()
  expect(await state(page)).toEqual(before)
})

test('真实后端保存查询后的对局，刷新页面读回完整状态与随机数', async ({ page }) => {
  await start(page)
  await revealGameDetails(page); await page.getByTestId('open-holdings').click()
  await page.getByTestId('reference-close').click()
  const before = await state(page)
  await page.getByTestId('open-saves').click()
  await expect(page.getByTestId('save-row-1')).toBeVisible()
  await page.getByTestId('save-slot-1').click()
  if (await page.getByTestId('save-confirm').count()) await page.getByTestId('save-confirm').click()
  await expect(page.getByRole('dialog', { name: '手动存读档', exact: true }).getByRole('status')).toContainText('槽位1保存成功')
  await page.reload()
  await page.getByRole('button', { name: '读取存档', exact: true }).click()
  await page.getByTestId('load-slot-1').click()
  await expect(page.getByTestId('current-player')).toContainText('卷毛')
  expect(await state(page)).toEqual(before)
  await revealGameDetails(page); await page.getByTestId('open-assets').click()
  await expect(page.getByTestId('assets-player-1')).toContainText('260000')
  await page.screenshot({ path: '/tmp/starcat-functions-saved-assets.png' })
})
