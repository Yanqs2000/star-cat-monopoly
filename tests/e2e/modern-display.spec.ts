import { test, expect, type Page } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { revealGameSettings, revealGameDetails, playUntil } from './modern-play'

const evidence='/tmp/starcat-5c-evidence'
async function start(page: Page, profile: 'original' | 'hd', seed=123456789, characters=[1,2,3,4], pause=true) {
  await page.addInitScript(seed=>{
    const original=crypto.getRandomValues.bind(crypto)
    crypto.getRandomValues=array=>{if(array instanceof Uint32Array&&array.length===1){array[0]=seed;return array}return original(array)}
    Date.prototype.getDay=()=>1;Date.prototype.getFullYear=()=>2026;Date.prototype.getMonth=()=>8;Date.prototype.getDate=()=>28
  },seed)
  await page.goto('/modern.html')
  await page.getByLabel('素材画质').selectOption(profile)
  for (const id of characters) await page.getByTestId(`character-${id}`).click()
  await page.getByRole('button',{name:'开始对局'}).click()
  await expect(page.getByRole('status')).toContainText('对局已载入')
  if(pause)await page.getByRole('button',{name:'暂停对局',exact:true}).click()
}

for (const profile of ['original','hd'] as const) for (const viewport of [{width:1920,height:1080},{width:1366,height:768}]) {
  test(`${profile} ${viewport.width}×${viewport.height}地图铺满可用矩形区域且页面完整显示`,async({browser})=>{
    const context=await browser.newContext({viewport,deviceScaleFactor:viewport.width===1920?2:1})
    const page=await context.newPage()
    try {
      await start(page,profile)
      expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight)).toBe(true)
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
      const canvas=await page.locator('canvas').boundingBox()
      const surface=await page.locator('.board-surface').boundingBox()
      expect(Math.abs(canvas!.x-surface!.x)).toBeLessThan(1)
      expect(Math.abs(canvas!.y-surface!.y)).toBeLessThan(1)
      expect(Math.abs(canvas!.width-surface!.width)).toBeLessThan(1)
      expect(Math.abs(canvas!.height-surface!.height)).toBeLessThan(1)
      // Renderer dimensions follow the rectangle: CSS must not stretch an 800×600 bitmap.
      await expect.poll(()=>page.locator('canvas').evaluate((el:HTMLCanvasElement)=>Math.abs(el.width/el.clientWidth-el.height/el.clientHeight))).toBeLessThan(.01)
      expect(canvas!.y+canvas!.height).toBeLessThanOrEqual(viewport.height)
      await expect.poll(()=>page.locator('canvas').evaluate((el:HTMLCanvasElement)=>el.width/el.clientWidth)).toBeGreaterThanOrEqual(viewport.width===1920?1.99:.99)
      expect(await page.locator('.panel').evaluate(el=>parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(14)
      await expect(page.getByRole('button',{name:'继续对局',exact:true})).toBeVisible()
      await mkdir(evidence,{recursive:true})
      await page.screenshot({path:`${evidence}/${profile}-${viewport.width}.png`})
    } finally {await context.close()}
  })
}

test('1080p全屏保留画质/声音/存档工具栏，关闭存档和退出全屏后同局仍暂停',async({page})=>{
  await page.setViewportSize({width:1920,height:1080})
  await page.route('**/api/**',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:{code:'unavailable',message:'测试服务不可用'}})}))
  await start(page,'hd')
  const before=await page.getByTestId('game-state-fingerprint').getAttribute('data-state-json')
  await revealGameDetails(page); await page.getByRole('button',{name:'全屏',exact:true}).click()
  await expect.poll(()=>page.evaluate(()=>document.fullscreenElement?.classList.contains('game-stage'))).toBe(true)
  await revealGameSettings(page)
  await expect(page.locator('.game-stage').getByLabel('对局素材画质')).toBeVisible()
  await expect(page.locator('.game-stage').getByLabel('音乐音量')).toBeVisible()
  await page.locator('.game-stage').getByLabel('对局素材画质').selectOption('original')
  await expect.poll(()=>page.evaluate(()=>localStorage.getItem('star-cat-monopoly:asset-profile'))).toBe('original')
  expect(await page.getByTestId('game-state-fingerprint').getAttribute('data-state-json')).toBe(before)
  let release!:()=>void
  const held=new Promise<void>(resolve=>{release=resolve})
  await page.route('**/assets-hd/hd-profile.json',async route=>{await held;await route.continue()})
  await page.locator('.game-stage').getByLabel('对局素材画质').selectOption('hd')
  await expect(page.getByTestId('asset-profile-busy')).toBeVisible()
  await page.locator('.game-stage').getByLabel('对局素材画质').selectOption('original')
  release()
  await expect(page.getByTestId('asset-profile-busy')).toHaveCount(0)
  await page.unroute('**/assets-hd/hd-profile.json')
  await page.locator('.game-stage').getByTestId('open-saves').click()
  await expect(page.getByRole('dialog',{name:'手动存读档'})).toBeVisible()
  expect(await page.locator('.fullscreen-toolbar').evaluate((el:HTMLElement)=>el.inert)).toBe(true)
  await page.getByRole('button',{name:'关闭，返回对局',exact:true}).click()
  await expect(page.getByRole('dialog',{name:'手动存读档'})).toHaveCount(0)
  expect(await page.locator('.fullscreen-toolbar').evaluate((el:HTMLElement)=>el.inert)).toBe(false)
  await mkdir(evidence,{recursive:true})
  await page.screenshot({path:`${evidence}/fullscreen-tools.png`})
  await page.getByRole('button',{name:'退出全屏',exact:true}).click()
  await expect.poll(()=>page.evaluate(()=>document.fullscreenElement===null)).toBe(true)
  expect(await page.getByTestId('game-state-fingerprint').getAttribute('data-state-json')).toBe(before)
  await expect(page.getByRole('button',{name:'继续对局',exact:true})).toBeVisible()
  await revealGameDetails(page); await page.getByRole('button',{name:'全屏',exact:true}).click()
  await expect.poll(()=>page.evaluate(()=>!!document.fullscreenElement)).toBe(true)
  await page.keyboard.press('Escape')
  await expect.poll(()=>page.evaluate(()=>document.fullscreenElement===null)).toBe(true)
  expect(await page.getByTestId('game-state-fingerprint').getAttribute('data-state-json')).toBe(before)
})

test('矩形地图随窗口和侧栏伸缩，保持暂停的同一局且不拉伸像素', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 })
  await start(page, 'hd', 153, [1])
  const before = await page.getByTestId('game-state-fingerprint').getAttribute('data-state-json')
  for (const viewport of [{ width: 1920, height: 1080 }, { width: 1100, height: 720 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport)
    await expect.poll(() => page.locator('canvas').evaluate(canvas => {
      const bounds = canvas.getBoundingClientRect(), surface = canvas.closest('.board-surface')!.getBoundingClientRect()
      return Math.max(Math.abs(bounds.width-surface.width),Math.abs(bounds.height-surface.height))
    })).toBeLessThan(1)
    await expect.poll(() => page.locator('canvas').evaluate((canvas: HTMLCanvasElement) => Math.abs(canvas.width/canvas.clientWidth-canvas.height/canvas.clientHeight))).toBeLessThan(.01)
    expect(await page.getByTestId('game-state-fingerprint').getAttribute('data-state-json')).toBe(before)
  }
  await page.setViewportSize({ width: 1366, height: 768 })
  await revealGameDetails(page)
  await expect.poll(() => page.locator('canvas').evaluate(canvas => Math.abs(canvas.getBoundingClientRect().width-canvas.closest('.board-surface')!.getBoundingClientRect().width))).toBeLessThan(1)
  expect(await page.getByTestId('game-state-fingerprint').getAttribute('data-state-json')).toBe(before)
})

test('1366×768高清魔法门的原图文字/选择区完整可见',async({browser})=>{
  const context=await browser.newContext({viewport:{width:1366,height:768},deviceScaleFactor:2})
  const page=await context.newPage()
  try {
    await start(page,'hd',4,[1],false)
    await revealGameDetails(page); await page.getByLabel('速度').selectOption('2')
    await playUntil(page,()=>page.getByTestId('portal-1').count().then(Boolean),700)
    await expect(page.getByTestId('portal-1')).toBeEnabled()
    await page.getByRole('button',{name:'暂停对局',exact:true}).click()
    const panel=await page.getByTestId('portal-original').boundingBox()
    const board=await page.locator('.board-area').boundingBox()
    expect(panel!.x).toBeGreaterThanOrEqual(board!.x)
    expect(panel!.x+panel!.width).toBeLessThanOrEqual(board!.x+board!.width)
    expect(panel!.y+panel!.height).toBeLessThanOrEqual(board!.y+board!.height)
    expect(await page.getByTestId('portal-original').locator('foreignObject').count()).toBeGreaterThan(0)
    await mkdir(evidence,{recursive:true});await page.screenshot({path:`${evidence}/portal-1366-dpr2.png`})
  }finally{await context.close()}
})

test('高清游乐场DPR2使用1600×1200物理画布，保留800×600逻辑玩法',async({browser})=>{
  test.setTimeout(180_000)
  const context=await browser.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:2})
  const page=await context.newPage()
  try {
    await start(page,'hd',104,[1],false)
    await revealGameDetails(page); await page.getByLabel('速度').selectOption('2')
    await playUntil(page,()=>page.getByTestId('carnival-original').count().then(Boolean),3500)
    const canvas=page.getByTestId('carnival-original').locator('canvas')
    await expect(canvas).toBeVisible()
    await page.getByRole('button',{name:'暂停对局',exact:true}).click()
    expect(await canvas.evaluate((el:HTMLCanvasElement)=>[el.width,el.height])).toEqual([1600,1200])
    const box=await canvas.boundingBox();expect(box!.width/box!.height).toBeCloseTo(4/3,2)
    await mkdir(evidence,{recursive:true});await page.screenshot({path:`${evidence}/carnival-dpr2.png`})
  }finally{await context.close()}
})
