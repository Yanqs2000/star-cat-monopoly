import { expect, test } from '@playwright/test'
import { playUntil, revealGameDetails } from './modern-play'

for (const profile of ['original','hd']) test(`${profile}开局进度完成后遇到恶犬直接显示原画，不再请求动画或闪加载画面`,async({page})=>{
 test.setTimeout(180_000)
 await page.setViewportSize(profile==='hd'?{width:390,height:844}:{width:1366,height:768})
 await page.addInitScript(profile=>{
  const original=crypto.getRandomValues.bind(crypto)
  crypto.getRandomValues=(array:any)=>{if(array instanceof Uint32Array&&array.length===1){array[0]=133;return array}return original(array)}
  Date.prototype.getDay=()=>1;Date.prototype.getFullYear=()=>2026;Date.prototype.getMonth=()=>8;Date.prototype.getDate=()=>28
  localStorage.setItem('star-cat-monopoly:asset-profile',profile)
 },profile)
 let release!:()=>void;const held=new Promise<void>(resolve=>{release=resolve})
 const dogRequests:string[]=[]
 await page.route('**/activities/trait-9/*',async route=>{dogRequests.push(route.request().url());await held;await route.continue()})
 await page.goto('/modern.html');await page.getByTestId('character-1').click();await page.getByRole('button',{name:'开始对局',exact:true}).click()
 await expect(page.getByRole('progressbar',{name:'开局素材加载进度'})).toBeVisible({timeout:5000})
 await expect(page.getByRole('button',{name:'掷骰',exact:true})).toHaveCount(0)
 await expect.poll(()=>page.locator('.loading-players img').evaluateAll(images=>images.every(image=>(image as HTMLImageElement).complete&&(image as HTMLImageElement).naturalWidth>0))).toBe(true)
 await page.screenshot({path:`/tmp/starcat-animation-loading-${profile}.png`})
 release()
 await expect(page.getByRole('status').filter({hasText:'对局已载入'})).toBeVisible({timeout:90_000})
 expect(dogRequests).toHaveLength(1)
 await page.unroute('**/activities/trait-9/*')
 const lateRequests:string[]=[]
 await page.route('**/activities/**',async route=>{lateRequests.push(route.request().url());await route.abort()})
 await page.evaluate(()=>{
  ;(window as any).__dogLoadingFlashes=0
  new MutationObserver(()=>{if(document.querySelector('[data-clip="trait-9"][aria-busy="true"]'))(window as any).__dogLoadingFlashes++}).observe(document,{subtree:true,childList:true,attributes:true,attributeFilter:['aria-busy']})
 })
 await revealGameDetails(page);await page.getByLabel('速度',{exact:true}).selectOption('2')
 if(profile==='hd')await page.getByTestId('toggle-game-details').click()
 await playUntil(page,async()=>await page.locator('[data-clip="trait-9"]').count()>0,2200)
 await expect(page.locator('[data-clip="trait-9"]')).toHaveAttribute('aria-busy','false')
 await expect(page.getByRole('status',{name:'活动素材加载'})).toHaveCount(0)
 expect(await page.evaluate(()=>(window as any).__dogLoadingFlashes)).toBe(0)
 expect(lateRequests).toEqual([])
 await page.getByRole('button',{name:'暂停对局',exact:true}).click()
 await page.screenshot({path:`/tmp/starcat-animation-preloaded-${profile}.png`})
})

test('开局动画失败停在加载页，重试保留同一阵容和首回合',async({page})=>{
 test.setTimeout(120_000)
 await page.addInitScript(()=>{const original=crypto.getRandomValues.bind(crypto);crypto.getRandomValues=(array:any)=>{if(array instanceof Uint32Array&&array.length===1){array[0]=133;return array}return original(array)};localStorage.setItem('star-cat-monopoly:asset-profile','hd')})
 let broken=true
 await page.route('**/assets-hd/activities/trait-9/1.webp',route=>broken?route.fulfill({status:404,body:''}):route.continue())
 await page.goto('/modern.html');await page.getByTestId('character-1').click();await page.getByRole('button',{name:'开始对局',exact:true}).click()
 await expect(page.getByRole('alert')).toContainText('trait-9/1.webp')
 const lineup=await page.getByTestId('pending-lineup').textContent()
 await expect(page.getByRole('button',{name:'掷骰',exact:true})).toHaveCount(0)
 broken=false;await page.getByRole('button',{name:'重试载入',exact:true}).click()
 await expect(page.getByRole('status').filter({hasText:'对局已载入'})).toBeVisible({timeout:90000})
 await revealGameDetails(page)
 expect((await page.getByTestId('player-list').locator('li strong').allTextContents()).join(' · ')).toBe(lineup)
 await expect(page.getByTestId('round')).toContainText('1')
 await expect(page.getByTestId('player-list').locator('li').first()).toContainText('现金 100000 · 存款 100000')
})
