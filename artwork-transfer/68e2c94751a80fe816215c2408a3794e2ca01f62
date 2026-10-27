import { expect, test, type Page } from '@playwright/test'
import { mkdir } from 'node:fs/promises'

const evidenceDir = '.analysis-cache/acceptance-3a'

async function seedMondayGame(page: Page, seed: number): Promise<void> {
  await page.addInitScript(value => {
    const original = crypto.getRandomValues.bind(crypto)
    crypto.getRandomValues = array => {
      if (array instanceof Uint32Array && array.length === 1) {
        array[0] = value
        return array
      }
      return original(array)
    }
    Date.prototype.getDay = () => 1
  }, seed)
  await page.goto('/modern.html')
  await page.getByTestId('character-1').click()
  await page.getByRole('button', { name: '开始对局' }).click()
  await expect(page.getByRole('status')).toContainText('对局已载入')
  await page.getByLabel('速度').selectOption('2')
}

test('已结算控骰卡的反馈帧404后重试保留完整待决状态且不重复消费', async ({ page }) => {
  test.setTimeout(120_000)
  let failed = true
  await page.route('**/assets/characters/1/reactions/happy/*/1.png', route => {
    if (failed) void route.fulfill({ status: 404, body: '' })
    else void route.continue()
  })
  await seedMondayGame(page, 153)

  const hand = page.getByTestId('hand-panel')
  const lineup = (await page.getByTestId('player-list').locator('li strong').allTextContents()).join(' · ')
  await expect(hand.getByTestId('hand-card')).toHaveCount(5)
  await hand.locator('[data-card-id="5"]').click()
  await page.getByTestId('interaction-confirm').click()
  await page.getByTestId('dice-2').click()
  await expect(page.getByRole('alert')).toContainText('characters/1/reactions/happy/')
  await expect(page.getByTestId('pending-lineup')).toHaveText(lineup)

  failed = false
  await page.getByRole('button', { name: '重试载入' }).click()
  await expect(page.getByRole('status')).toContainText('对局已载入')
  await expect(page.getByTestId('interaction-panel')).toContainText('控骰卡')
  await expect(page.getByTestId('hand-panel').getByTestId('hand-card')).toHaveCount(4)
  await page.getByTestId('interaction-acknowledge').click()
  await page.getByRole('button', { name: '掷骰' }).click()
  await expect(page.getByTestId('last-roll')).toContainText('骰子 2')
  await expect(page.getByTestId('interaction-panel')).toContainText('12 格真实库存', { timeout: 15_000 })
  await expect(page.locator('canvas')).toHaveCount(1)
})

test('生产入口用地图点击放置障碍并用真实玩家位置发射飞弹', async ({ page }) => {
  test.setTimeout(90_000)
  await seedMondayGame(page, 153)
  const hand = page.getByTestId('hand-panel')

  await hand.locator('[data-card-id="6"]').click()
  await page.getByTestId('interaction-confirm').click()
  await expect(page.getByTestId('interaction-panel')).toContainText('在地图上点击目标格')
  const target = await page.locator('canvas').evaluate(canvas => {
    const scale = Math.min(canvas.clientWidth / 800, canvas.clientHeight / 600)
    return {
      x: (canvas.clientWidth - 800 * scale) / 2 + 456 * scale,
      y: (canvas.clientHeight - 600 * scale) / 2 + 120 * scale,
    }
  })
  await page.locator('canvas').click({ position: target })
  await expect(page.getByTestId('interaction-panel')).toContainText('障碍已放置')
  await expect(hand.getByTestId('hand-card')).toHaveCount(4)
  await page.getByTestId('interaction-acknowledge').click()

  await hand.locator('[data-card-id="9"]').click()
  await page.getByTestId('interaction-confirm').click()
  await page.getByTestId('target-player-4').click()
  await expect(page.getByTestId('interaction-panel')).toContainText('飞弹已经发射')
  await expect(hand.getByTestId('hand-card')).toHaveCount(3)
  await expect(page.getByTestId('player-list').getByRole('listitem').nth(3)).toContainText('住院 3天')
})

async function buyProperty(page: Page, parcelId: number, amount: number): Promise<void> {
  const panel = page.getByTestId('property-panel')
  await expect(panel).toContainText(`地块 ${parcelId}`, { timeout: 30_000 })
  await expect(panel).toContainText(`买价 ${amount}`)
  await panel.getByTestId('property-accept').click()
  await expect(panel.getByTestId('property-result')).toContainText(`现金支付 ${amount}`)
  await panel.getByTestId('property-acknowledge').click()
}

test('seed153 生产入口合法完成商店买卖、地产、银行信用与运气8', async ({ page }) => {
  test.setTimeout(240_000)
  await mkdir(evidenceDir, { recursive: true })
  await page.setViewportSize({ width: 1440, height: 1000 })
  const requests: string[] = []
  const failures: string[] = []
  page.on('request', request => requests.push(new URL(request.url()).pathname))
  page.on('response', response => { if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`) })
  page.on('pageerror', error => failures.push(error.message))
  await seedMondayGame(page, 153)

  await page.getByRole('button', { name: '掷骰' }).click()
  const interaction = page.getByTestId('interaction-panel')
  await expect(interaction).toContainText('12 格真实库存', { timeout: 30_000 })
  await expect(interaction.getByTestId('shop-slot')).toHaveCount(12)
  await expect(interaction).toContainText('奖券 200')
  await interaction.getByTestId('shop-slot').first().click()
  await expect(interaction).toContainText('购买成功')
  await expect(interaction).toContainText('奖券 170')
  await interaction.getByTestId('interaction-acknowledge').click()
  await interaction.locator('.sell-list button').first().click()
  await expect(interaction).toContainText('出售成功')
  await expect(interaction).toContainText('奖券 270')
  await interaction.getByTestId('interaction-acknowledge').click()
  await interaction.getByRole('button', { name: '离开卡片屋' }).click()

  await expect(page.getByTestId('round')).toContainText('第 2 轮', { timeout: 60_000 })
  await page.getByRole('button', { name: '掷骰' }).click()
  await buyProperty(page, 83, 1800)
  await expect(page.getByTestId('round')).toContainText('第 3 轮', { timeout: 60_000 })
  await page.getByRole('button', { name: '掷骰' }).click()
  await buyProperty(page, 77, 2500)

  await expect(page.getByTestId('round')).toContainText('第 4 轮', { timeout: 60_000 })
  await page.getByRole('button', { name: '掷骰' }).click()
  await expect(interaction).toContainText('申请信用卡', { timeout: 30_000 })
  await interaction.getByRole('button', { name: '申请信用' }).click()
  await expect(interaction).toContainText('信用申请通过')
  await expect(page.getByTestId('hand-panel').getByTestId('hand-card')).toHaveCount(6)
  await interaction.getByTestId('interaction-acknowledge').click()
  await interaction.getByRole('button', { name: '离开银行' }).click()
  await expect(interaction.getByTestId('luck-image')).toHaveAttribute('alt', '运气事件 8', { timeout: 30_000 })
  await expect(interaction).toContainText('海外投资失败，损失12000元')
  await expect(interaction).toContainText('现金 -12000')
  await expect(page.getByTestId('player-list').getByRole('listitem').first()).toContainText('现金 83700')
  await page.screenshot({ path: `${evidenceDir}/seed153-bank-luck-1440x1000.png` })

  await page.setViewportSize({ width: 1920, height: 1080 })
  await page.getByRole('button', { name: '全屏', exact: true }).click()
  expect(await page.evaluate(() => document.fullscreenElement?.classList.contains('game-stage'))).toBe(true)
  await expect(page.locator('.game-stage')).toHaveJSProperty('clientWidth', 1920)
  await page.waitForTimeout(1500)
  await page.screenshot({ path: `${evidenceDir}/seed153-bank-luck-fullscreen-1920x1080.png` })
  expect(requests.some(path => /\.swf$|ruffle|\.wasm$/.test(path))).toBe(false)
  expect(failures).toEqual([])
})
