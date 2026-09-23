import { expect, test } from '@playwright/test'

const cardIds = [1, 5, 6, 7, 9, 11, 14, 15, 18, 19, 20, 21, 22, 25, 26, 27, 33]
const cardsWithFailure = [1, 5, 6, 7, 9, 11, 14, 15, 18, 19, 20, 21, 25, 26, 33]

test('测试专用真实组件夹具逐张显示17卡成功结算且重复提交失效', async ({ page }) => {
  test.setTimeout(120_000)
  for (const cardId of cardIds) {
    await page.goto(`/tests/fixtures/modern-interactions.html?card=${cardId}`)
    const summary = page.getByTestId('fixture-summary')
    await expect(summary, `card ${cardId}`).toContainText(`"cardId":${cardId}`)
    await expect(summary, `card ${cardId}`).toContainText('"begin":true')
    await expect(summary, `card ${cardId}`).toContainText('"settle":true')
    await expect(summary, `card ${cardId}`).toContainText('"duplicate":false')
    await expect(page.getByTestId('interaction-panel'), `card ${cardId}`).toBeVisible()
    if (cardId === 1) await expect(summary).toContainText('"inventory":[1]')
    else await expect(summary).toContainText('"inventory":[]')
  }
})

test('测试专用真实组件夹具显示可失败卡的原因、保留库存并允许取消', async ({ page }) => {
  test.setTimeout(120_000)
  for (const cardId of cardsWithFailure) {
    await page.goto(`/tests/fixtures/modern-interactions.html?card=${cardId}&invalid=1`)
    const summary = page.getByTestId('fixture-summary')
    await expect(summary, `card ${cardId}`).toContainText(`"inventory":[${cardId}]`)
    if (cardId === 21) {
      await expect(page.getByTestId('interaction-panel')).toContainText('附近看不到神灵')
      await page.getByTestId('interaction-acknowledge').click()
    } else {
      await expect(summary, `card ${cardId}`).toContainText('"choiceError":')
      await expect(page.getByTestId('interaction-panel').getByRole('alert'), `card ${cardId}`).toBeVisible()
      await page.getByTestId('interaction-cancel').click()
    }
    await expect(summary, `card ${cardId}`).toContainText('"phase":"awaiting-roll"')
    await expect(summary, `card ${cardId}`).toContainText(`"inventory":[${cardId}]`)
  }
})

test('测试专用真实组件夹具显示B01扣款一次、原图和重复确认守卫', async ({ page }) => {
  await page.goto('/tests/fixtures/modern-interactions.html?scenario=b01')
  await expect(page.getByTestId('interaction-panel')).toContainText('捐款1000元')
  await expect(page.getByTestId('luck-image')).toHaveAttribute('src', /luck\/28\.png/)
  await expect(page.getByTestId('fixture-summary')).toContainText('"cash":99000')
  await expect(page.getByTestId('fixture-summary')).toContainText('"lostAndFoundFunds":[1000,1000]')
  await page.getByTestId('double-ack').click()
  await expect(page.getByTestId('fixture-summary')).toContainText('"firstAck":true')
  await expect(page.getByTestId('fixture-summary')).toContainText('"secondAck":false')
  await expect(page.getByTestId('fixture-summary')).toContainText('"cash":99000')
})

test('测试专用真实组件夹具区分地雷经过、落地及银行后路障落地顺序', async ({ page }) => {
  await page.goto('/tests/fixtures/modern-interactions.html?scenario=mine-pass')
  await expect(page.getByTestId('fixture-summary')).toContainText('"phase":"moving"')
  await expect(page.getByTestId('fixture-summary')).toContainText('"remainingSteps":1')
  await expect(page.getByTestId('fixture-summary')).toContainText('"marker221":7')
  await expect(page.getByTestId('interaction-panel')).toHaveCount(0)
  await page.getByTestId('advance').click()
  await expect(page.getByTestId('fixture-summary')).not.toContainText('mine-triggered')

  await page.goto('/tests/fixtures/modern-interactions.html?scenario=mine-land')
  await expect(page.getByTestId('interaction-panel')).toContainText('踩中地雷，已送往医院')
  await expect(page.getByTestId('fixture-summary')).toContainText('"position":{"column":19,"row":1}')

  await page.goto('/tests/fixtures/modern-interactions.html?scenario=barrier')
  await expect(page.getByTestId('interaction-panel')).toContainText('申请信用卡')
  await page.getByRole('button', { name: '离开银行' }).click()
  await expect(page.getByTestId('interaction-panel')).toContainText('路障使移动停止')
  await expect(page.getByTestId('fixture-summary')).toContainText('"remainingSteps":0')
})

test('测试专用真实组件夹具显示神灵先改地产、到期与住院释放重返', async ({ page }) => {
  await page.goto('/tests/fixtures/modern-interactions.html?scenario=god-property')
  await expect(page.getByTestId('interaction-panel')).toContainText('遇到原版 NPC')
  await page.getByTestId('interaction-acknowledge').click()
  await expect(page.getByTestId('interaction-panel')).toContainText('神灵改变了房屋等级')
  await expect(page.getByTestId('fixture-summary')).toContainText('"property1":{"ownerId":null,"level":1}')
  await page.getByTestId('interaction-acknowledge').click()
  await expect(page.getByTestId('property-panel')).toContainText('买价 1500')

  await page.goto('/tests/fixtures/modern-interactions.html?scenario=god-expiry')
  await expect(page.getByTestId('interaction-panel')).toContainText('神灵附身已经到期')
  await expect(page.getByTestId('fixture-summary')).toContainText('"godId":null')

  await page.goto('/tests/fixtures/modern-interactions.html?scenario=reentry')
  await expect(page.getByTestId('interaction-panel')).toContainText('限制状态已经解除')
  await expect(page.getByTestId('fixture-summary')).toContainText('"state":0')
})

test('测试专用真实组件夹具恢复已离开银行和商店的快照不重复处理', async ({ page }) => {
  await page.goto('/tests/fixtures/modern-interactions.html?scenario=resume-bank')
  const bank = page.getByTestId('fixture-summary')
  await expect(bank).toContainText('"phase":"moving"')
  await expect(bank).toContainText('"remainingSteps":1')
  await expect(bank).toContainText('"interaction":null')
  await expect(bank).toContainText('"continuation":"start-step"')
  await page.getByTestId('advance').click()
  await expect(bank).toContainText('"position":{"column":20,"row":16}')
  await expect(page.getByTestId('interaction-panel')).toHaveCount(0)

  await page.goto('/tests/fixtures/modern-interactions.html?scenario=resume-shop')
  const shop = page.getByTestId('fixture-summary')
  const before = JSON.parse(await shop.textContent() ?? '{}') as { rngState: number }
  await expect(shop).toContainText('"interaction":null')
  await expect(shop).toContainText('"continuation":"finish-turn"')
  await page.getByTestId('advance').click()
  await expect(shop).toContainText('"activePlayerIndex":1')
  const after = JSON.parse(await shop.textContent() ?? '{}') as { rngState: number }
  expect(after.rngState).toBe(before.rngState)
  await expect(page.getByTestId('interaction-panel')).toHaveCount(0)
})
