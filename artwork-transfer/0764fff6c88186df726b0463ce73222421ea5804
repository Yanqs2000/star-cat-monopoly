import { test, expect } from '@playwright/test'

async function choose(page: import('@playwright/test').Page, ids: number[]): Promise<void> {
  for (const id of ids) await page.getByTestId(`character-${id}`).click()
}

test('选择1至4名人类、第五名滚出最早选择，并由AI补满四人', async ({ page }) => {
  const requests: string[] = []
  page.on('request', request => requests.push(new URL(request.url()).pathname))
  await page.goto('/modern.html')
  await expect(page.getByRole('heading', { name: '选择参赛角色' })).toBeVisible()
  await expect(page.getByTestId('character-grid').getByRole('button')).toHaveCount(12)
  expect(await page.locator('.portrait').evaluateAll(portraits => portraits.every(portrait => {
    const image = portrait.querySelector('img')!
    const parentBox = portrait.getBoundingClientRect()
    const imageBox = image.getBoundingClientRect()
    return imageBox.left >= parentBox.left && imageBox.top >= parentBox.top &&
      imageBox.right <= parentBox.right && imageBox.bottom <= parentBox.bottom
  }))).toBe(true)
  expect(await page.locator('.portrait b').count()).toBe(0)
  expect(requests.filter(path => path.endsWith('/manifest.json'))).toEqual([])

  await choose(page, [1, 2, 3, 4, 5])
  await expect(page.getByTestId('selected-order')).toContainText('阿牛 → 吉吉&米米 → 佳佳 → 大牌')
  await expect(page.getByTestId('human-count')).toHaveText('人类 4 · AI 0')
  await page.getByTestId('character-3').click()
  await expect(page.getByTestId('human-count')).toHaveText('人类 3 · AI 1')
})

test('开始后掷骰逐格移动、AI自动接续并可返回选人重开', async ({ page }) => {
  await page.goto('/modern.html')
  await choose(page, [1])
  await page.getByRole('button', { name: '开始对局' }).click()
  await expect(page.getByRole('status')).toContainText('对局已载入')
  await expect(page.locator('canvas')).toHaveCount(1)
  await expect(page.getByTestId('player-list').getByRole('listitem')).toHaveCount(4)
  await expect(page.getByTestId('current-player')).toContainText('卷毛')
  await expect(page.getByTestId('last-roll')).toHaveText('骰子 —')
  await expect(page.locator('.path strong')).toHaveText('本回合路径')
  await expect(page.locator('.path span')).toHaveText('尚未掷骰')

  await page.getByLabel('速度').selectOption('2')
  await page.getByRole('button', { name: '掷骰' }).click()
  await expect(page.getByTestId('last-roll')).not.toHaveText('骰子 —')
  await expect(page.getByTestId('turn-history')).toContainText('卷毛 掷出')
  await expect.poll(async () => {
    if (await page.getByTestId('property-panel').isVisible()) return 'property'
    if (await page.getByTestId('interaction-panel').isVisible()) return 'interaction'
    if ((await page.getByTestId('turn-history').textContent())?.includes('AI')) return 'ai'
    return 'moving'
  }, { timeout: 15_000 }).not.toBe('moving')
  if (await page.getByTestId('property-panel').isVisible()) {
    await page.getByTestId('property-accept').click()
    await expect(page.getByTestId('property-result')).toBeVisible()
    await page.getByTestId('property-acknowledge').click()
  }
  if (await page.getByTestId('interaction-panel').isVisible()) {
    const interaction = page.getByTestId('interaction-panel')
    if (await interaction.getByTestId('interaction-acknowledge').isVisible()) {
      await interaction.getByTestId('interaction-acknowledge').click()
    } else if (await interaction.getByRole('button', { name: '离开卡片屋' }).isVisible()) {
      await interaction.getByRole('button', { name: '离开卡片屋' }).click()
    } else if (await interaction.getByRole('button', { name: '离开银行' }).isVisible()) {
      await interaction.getByRole('button', { name: '离开银行' }).click()
    } else if (await interaction.getByRole('button', { name: '离开股市' }).isVisible()) {
      await interaction.getByRole('button', { name: '离开股市' }).click()
    } else if (await interaction.getByRole('button', { name: '离开公司' }).isVisible()) {
      await interaction.getByRole('button', { name: '离开公司' }).click()
    } else if (await interaction.getByTestId('monthly-acknowledge').isVisible()) {
      await interaction.getByTestId('monthly-acknowledge').click()
    }
  }
  await expect(page.getByTestId('turn-history')).toContainText('AI', { timeout: 12_000 })
  await expect(page.getByTestId('round')).toContainText('第 2 轮', { timeout: 20_000 })
  await expect(page.getByRole('button', { name: '掷骰' })).toBeEnabled()
  await expect(page.getByTestId('last-roll')).toHaveText(/骰子 [1-6]（上一回合）/)
  await expect(page.locator('.path strong')).toHaveText('上一回合路径')
  await expect(page.locator('.path span')).not.toHaveText('尚未掷骰')
  await page.getByRole('button', { name: '掷骰' }).hover()
  expect(await page.getByRole('button', { name: '掷骰' }).evaluate(element => {
    const style = getComputedStyle(element)
    return [style.backgroundColor, style.color]
  })).toEqual(['rgb(255, 225, 138)', 'rgb(35, 55, 60)'])

  await page.getByRole('button', { name: '返回选人' }).click()
  await expect(page.getByRole('heading', { name: '选择参赛角色' })).toBeVisible()
  await expect(page.getByTestId('selected-order')).toContainText('卷毛')
})

test('所选角色纹理失败后重试保持同一阵容和开局状态', async ({ page }) => {
  await page.addInitScript(() => {
    const original = crypto.getRandomValues.bind(crypto)
    crypto.getRandomValues = array => {
      if (array instanceof Uint32Array && array.length === 1) {
        array[0] = 0
        return array
      }
      return original(array)
    }
  })
  let failed = true
  await page.route('**/assets/characters/2/walk/down-right/1.png', route => {
    if (failed) void route.fulfill({ status: 404, body: '' })
    else void route.continue()
  })
  await page.goto('/modern.html')
  await choose(page, [2])
  await page.getByRole('button', { name: '开始对局' }).click()
  await expect(page.getByRole('alert')).toContainText('characters/2/walk/down-right/1.png')
  await expect(page.getByTestId('pending-lineup')).toHaveText('阿牛 · 佳佳 · 大牌 · 怪卡')
  failed = false
  await page.getByRole('button', { name: '重试载入' }).click()
  await expect(page.getByRole('status')).toContainText('对局已载入')
  const players = page.getByTestId('player-list').getByRole('listitem')
  await expect(players.nth(0)).toContainText('阿牛人类 · 6,34')
  await expect(players.nth(1)).toContainText('佳佳AI · 30,32')
  await expect(players.nth(2)).toContainText('大牌AI · 11,9')
  await expect(players.nth(3)).toContainText('怪卡AI · 33,7')
})

test('上方向键触发人类掷骰，暂停时冻结回合进度', async ({ page }) => {
  await page.goto('/modern.html')
  await choose(page, [1, 2, 3, 4])
  await page.getByRole('button', { name: '开始对局' }).click()
  await expect(page.getByRole('status')).toContainText('对局已载入')
  await page.keyboard.press('ArrowUp')
  await expect(page.getByTestId('last-roll')).not.toHaveText('骰子 —')
  await page.getByRole('button', { name: '暂停对局' }).click()
  const remaining = await page.getByTestId('remaining-steps').textContent()
  const pausedCanvas = await page.locator('canvas').screenshot()
  await page.waitForTimeout(700)
  await expect(page.getByTestId('remaining-steps')).toHaveText(remaining ?? '')
  expect((await page.locator('canvas').screenshot()).equals(pausedCanvas)).toBe(true)
  await page.getByRole('button', { name: '继续对局' }).click()
  await page.waitForTimeout(180)
  expect((await page.locator('canvas').screenshot()).equals(pausedCanvas)).toBe(false)
})

test('浏览器拒绝全屏时在已载入对局中显示错误', async ({ page }) => {
  await page.addInitScript(() => {
    HTMLElement.prototype.requestFullscreen = () => Promise.reject(new Error('fullscreen denied'))
  })
  await page.goto('/modern.html')
  await choose(page, [1, 2, 3, 4])
  await page.getByRole('button', { name: '开始对局' }).click()
  await expect(page.getByRole('status')).toContainText('对局已载入')
  await page.getByRole('button', { name: '全屏', exact: true }).click()
  await expect(page.getByRole('alert')).toHaveText('当前浏览器未能进入全屏。')
})
