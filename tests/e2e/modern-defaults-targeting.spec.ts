import { expect, test } from '@playwright/test'
import { revealGameDetails } from './modern-play'

test('首次启动默认高清，手动选择原版后刷新仍保留偏好', async ({ page }) => {
  await page.goto('/modern.html')
  await expect(page.getByLabel('素材画质')).toHaveValue('hd')
  await expect(page.getByTestId('asset-profile-busy')).toHaveCount(0)
  await expect.poll(() => page.locator('.portrait img').first().evaluate(image => (image as HTMLImageElement).naturalWidth)).toBe(144)
  await page.screenshot({ path: '/tmp/starcat-small-ui-default-hd.png' })
  await page.getByLabel('素材画质').selectOption('original')
  await page.reload()
  await expect(page.getByLabel('素材画质')).toHaveValue('original')
  await expect.poll(() => page.locator('.portrait img').first().evaluate(image => (image as HTMLImageElement).naturalWidth)).toBe(72)
})

test('默认高清不可用时仍可回退原版并开始选择角色', async ({ page }) => {
  await page.route('**/assets-hd/hd-profile.json', route => route.fulfill({ status: 404, body: '' }))
  await page.goto('/modern.html')
  await expect(page.getByRole('alert')).toContainText('高清图集不可用')
  await expect(page.getByLabel('素材画质')).toHaveValue('original')
  await page.getByTestId('character-1').click()
  await expect(page.getByRole('button', { name: '开始对局', exact: true })).toBeEnabled()
})

for (const profile of ['hd', 'original']) test(`${profile}障碍和飞弹选目标显示圆形准星，取消暂停与提交后恢复`, async ({ page }) => {
  test.setTimeout(150_000)
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await page.addInitScript(profile => {
    localStorage.setItem('star-cat-monopoly:asset-profile', profile)
    const original = crypto.getRandomValues.bind(crypto)
    crypto.getRandomValues = array => {
      if (array instanceof Uint32Array && array.length === 1) { array[0] = 153; return array }
      return original(array)
    }
    Date.prototype.getDay = () => 1
    Date.prototype.getFullYear = () => 2026
    Date.prototype.getMonth = () => 8
    Date.prototype.getDate = () => 27
  }, profile)
  await page.goto('/modern.html')
  await expect(page.getByTestId('asset-profile-busy')).toHaveCount(0)
  await page.getByTestId('character-1').click()
  await page.getByRole('button', { name: '开始对局', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('对局已载入', { timeout: 90_000 })
  await revealGameDetails(page)
  const canvas = page.locator('canvas'), hand = page.getByTestId('hand-panel')
  const scopeCursor = /url\(.+\) 16 16, crosshair/
  await hand.locator('[data-card-id="6"]').click()
  await page.getByTestId('interaction-confirm').click()
  await expect(canvas).toHaveCSS('cursor', scopeCursor)
  await page.getByTestId('interaction-cancel').click()
  await expect(canvas).toHaveCSS('cursor', 'grab')
  await expect(hand.getByTestId('hand-card')).toHaveCount(5)
  await hand.locator('[data-card-id="9"]').click()
  await page.getByTestId('interaction-confirm').click()
  await expect(canvas).toHaveCSS('cursor', scopeCursor)
  const target = page.getByTestId('target-player-4')
  await expect(target).toHaveCSS('cursor', scopeCursor)
  await expect(target.locator('img')).toHaveCSS('cursor', scopeCursor)
  const cursorSize = await canvas.evaluate(async element => {
    const url = getComputedStyle(element).cursor.match(/^url\("(.+?)"\)/)![1]!
    const image = new Image(); image.src = url; await image.decode()
    return [image.naturalWidth, image.naturalHeight]
  })
  expect(cursorSize).toEqual([32, 32])
  await page.screenshot({ path: `/tmp/starcat-small-ui-${profile}-target.png` })
  await expect(page.getByTestId('interaction-cancel')).toHaveCSS('cursor', 'pointer')
  await page.getByRole('button', { name: '暂停对局', exact: true }).click()
  await expect(canvas).toHaveCSS('cursor', 'grab')
  await expect(target).toBeDisabled()
  await expect(target).toHaveCSS('cursor', 'default')
  await page.getByRole('button', { name: '继续对局', exact: true }).click()
  await expect(canvas).toHaveCSS('cursor', scopeCursor)
  await target.click()
  await expect(page.getByTestId('interaction-panel')).toContainText('飞弹已经发射')
  await expect(canvas).toHaveCSS('cursor', 'grab')
  await expect(hand.getByTestId('hand-card')).toHaveCount(4)
  expect(errors).toEqual([])
})
