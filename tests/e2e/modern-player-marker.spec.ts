import { test, expect } from '@playwright/test'

type SceneNode = { children: SceneNode[]; visible: boolean; context?: unknown; getLocalBounds(): { minX: number; maxX: number; minY: number; maxY: number } }
type SceneApp = { stage: SceneNode }
type SceneRecorder = { __markerApps: SceneApp[]; __PIXI_APP_INIT__: (app: SceneApp) => void }

// Seeds 2/3/0/8 start in directions 1/2/3/4 respectively.
for (const [width, seed, position] of [[565,8,'11,9'],[1440,8,'11,9'],[565,2,'7,35'],[565,3,'10,10'],[565,0,'6,34']] as const) test(`${width}px seed${seed}开局${position}和走动中均隐藏人物脚下黄色圈`, async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message))
  await page.setViewportSize({ width, height: width === 565 ? 827 : 1000 })
  await page.addInitScript(seed => {
    const recorder = window as unknown as SceneRecorder
    recorder.__markerApps = []; recorder.__PIXI_APP_INIT__ = app => recorder.__markerApps.push(app)
    const original = crypto.getRandomValues.bind(crypto)
    crypto.getRandomValues = array => { if (array instanceof Uint32Array && array.length === 1) { array[0] = seed; return array } return original(array) }
    Date.prototype.getFullYear = () => 2026; Date.prototype.getMonth = () => 9; Date.prototype.getDate = () => 4; Date.prototype.getDay = () => 0
  }, seed)
  await page.goto('/modern.html')
  await expect(page.getByRole('heading', { name: '选择参赛角色' })).toBeVisible()
  await page.getByTestId('character-1').click(); await page.getByRole('button', { name: '开始对局' }).click()
  await expect(page.getByRole('status')).toHaveText('对局已载入')
  await expect(page.getByTestId('player-list').locator('li').first()).toContainText(position)
  const actorMarkers = () => page.evaluate(() => {
    const app = (window as unknown as SceneRecorder).__markerApps[0]!
    const entities = app.stage.children[0]!.children[0]!.children[3]!
    const actors = entities.children.filter(node => node.children?.length >= 3 && node.children.some(child => child.children?.length > 0))
    return { count: actors.length, visibleGraphics: actors.flatMap(actor => actor.children.filter(child => child.context && child.visible)).length }
  })
  await page.screenshot({ path: `/tmp/starcat-marker-fix/current-${width}-seed${seed}.png` })
  expect(await actorMarkers()).toEqual({ count: 4, visibleGraphics: 0 })
  await page.getByRole('button', { name: '掷骰', exact: true }).click()
  await expect(page.getByTestId('last-roll')).not.toHaveText('骰子 —')
  await page.getByRole('button', { name: '暂停对局', exact: true }).click()
  expect(await actorMarkers()).toEqual({ count: 4, visibleGraphics: 0 })
  await page.screenshot({ path: `/tmp/starcat-marker-fix/moving-${width}-seed${seed}.png` })
  expect(errors).toEqual([])
})
