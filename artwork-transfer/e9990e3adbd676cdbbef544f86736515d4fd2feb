import { expect,test,type Page } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { playUntil } from './modern-play'
const evidenceDir='.analysis-cache/acceptance-3c'
async function start(page:Page,seed:number) {
  await page.addInitScript(seed=>{
    const original=crypto.getRandomValues.bind(crypto)
    crypto.getRandomValues=array=>{if(array instanceof Uint32Array&&array.length===1){array[0]=seed;return array}return original(array)}
    Date.prototype.getDay=()=>1;Date.prototype.getFullYear=()=>2026;Date.prototype.getMonth=()=>8;Date.prototype.getDate=()=>28
  },seed)
  await page.goto('/modern.html');await page.setViewportSize({width:1440,height:1000})
  await page.getByTestId('character-1').click();await page.getByRole('button',{name:'开始对局'}).click()
  await expect(page.getByRole('status')).toContainText('对局已载入');await page.getByLabel('速度').selectOption('2')
}
test('自然seed4首轮魔法门原分布图、头像、飞行暂停和东站到达',async({page})=>{
  test.setTimeout(120_000);const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message))
  await mkdir(evidenceDir,{recursive:true});await start(page,4)
  await playUntil(page,()=>page.getByTestId('portal-1').count().then(Boolean))
  await expect(page.getByTestId('portal-1')).toBeEnabled()
  await expect(page.getByTestId('portal-original').locator('image')).toHaveCount(82)
  await page.screenshot({path:`${evidenceDir}/seed4-portal-map-1440x1000.png`})
  await page.getByTestId('portal-1').evaluate((button:HTMLButtonElement)=>{button.click();button.click()})
  await expect(page.getByTestId('portal-flight')).toHaveCount(1)
  await expect.poll(async()=>Number(await page.getByTestId('portal-flight').getAttribute('data-frame'))).toBeGreaterThan(5)
  await page.getByRole('button',{name:'暂停对局',exact:true}).click()
  const frame=await page.getByTestId('portal-flight').getAttribute('data-frame')
  await page.waitForTimeout(150);await expect(page.getByTestId('portal-flight')).toHaveAttribute('data-frame',frame!)
  await page.screenshot({path:`${evidenceDir}/seed4-portal-flight-1440x1000.png`})
  await page.getByRole('button',{name:'继续对局',exact:true}).click()
  await expect(page.getByTestId('interaction-panel')).toContainText('已抵达目的地',{timeout:15_000})
  await expect(page.getByTestId('current-player')).toContainText('卷毛')
  await expect(page.getByTestId('player-list').locator('li').first()).toContainText('31,7')
  expect(errors).toEqual([])
})
test('自然seed4飞行原图404后重试继续同一目的地并保留两倍速',async({page})=>{
  test.setTimeout(150_000);let broken=true
  await page.route('**/assets/activities/fly-1-4/1.png',route=>broken?route.fulfill({status:404,body:''}):route.continue())
  await start(page,4);await playUntil(page,()=>page.getByTestId('portal-1').count().then(Boolean))
  await expect(page.getByTestId('portal-1')).toBeEnabled();await page.getByTestId('portal-1').click()
  await expect(page.getByRole('alert')).toContainText('fly-1-4/1.png')
  broken=false;await page.getByRole('button',{name:'重试载入'}).click()
  await expect(page.getByRole('status')).toContainText('对局已载入')
  await expect(page.getByLabel('速度')).toHaveValue('2')
  await expect(page.getByTestId('interaction-panel')).toContainText('已抵达目的地',{timeout:15_000})
  await expect(page.getByTestId('player-list').locator('li').first()).toContainText('31,7')
})
test('自然seed150法院合法被告、原案件面板和实际判决',async({page})=>{
  test.setTimeout(360_000);await mkdir(evidenceDir,{recursive:true});await start(page,150)
  await playUntil(page,async()=>{
    const [who]=await page.getByTestId('current-player').allTextContents()
    return !!who && !who.includes('AI') && await page.locator('[data-testid^="court-target-"]').count()>0
  },5000)
  const target=page.locator('[data-testid^="court-target-"]').first()
  await expect(target).toBeEnabled()
  await page.screenshot({path:`${evidenceDir}/seed150-court-target-1440x1000.png`})
  await target.click();await expect(page.getByTestId('court-case-0')).toBeEnabled()
  await page.screenshot({path:`${evidenceDir}/seed150-court-case-1440x1000.png`})
  await page.getByTestId('court-case-0').click()
  await expect(page.getByTestId('interaction-acknowledge')).toBeVisible({timeout:20_000})
  await expect(page.getByTestId('interaction-panel')).toContainText(/原告胜诉|庭外和解|原告败诉/)
  await page.screenshot({path:`${evidenceDir}/seed150-court-result-1440x1000.png`})
})

test('自然seed4当前北站和保持原地均不飞行',async({page})=>{
  test.setTimeout(120_000)
  for(const destination of [4,5]) {
    await start(page,4);await playUntil(page,()=>page.getByTestId(`portal-${destination}`).count().then(Boolean))
    await expect(page.getByTestId(`portal-${destination}`)).toBeEnabled();await page.getByTestId(`portal-${destination}`).click()
    await expect(page.getByTestId('interaction-acknowledge')).toBeVisible({timeout:10_000})
    await expect(page.getByTestId('interaction-panel')).toContainText('保持原地')
    await expect(page.getByTestId('portal-flight')).toHaveCount(0)
    await expect(page.getByTestId('player-list').locator('li').first()).toContainText('8,14')
  }
})

test('自然seed446法院胜诉转运素材失败恢复，拘留2天后重新入场',async({page})=>{
  test.setTimeout(360_000)
  let brokenCase=false,brokenCar=false
  await page.route('**/assets/activities/court-case/1.png',route=>brokenCase?route.fulfill({status:404,body:''}):route.continue())
  await page.route('**/assets/activities/car1/80.png',route=>brokenCar?route.fulfill({status:404,body:''}):route.continue())
  await start(page,446)
  await playUntil(page,async()=>{
    const [who]=await page.getByTestId('current-player').allTextContents()
    return !!who&&!who.includes('AI')&&await page.locator('[data-testid^="court-target-"]').count()>0
  },5000)
  const target=page.locator('[data-testid^="court-target-"]').first()
  const targetId=Number((await target.getAttribute('data-testid'))?.replace('court-target-',''))
  await expect(target).toBeEnabled();brokenCase=true;await target.click()
  await expect(page.getByRole('alert')).toContainText('court-case/1.png')
  brokenCase=false;brokenCar=true
  await page.getByRole('button',{name:'重试载入'}).click()
  await expect(page.getByTestId('court-case-0')).toBeEnabled();await page.getByTestId('court-case-0').click()
  await expect(page.getByRole('alert')).toContainText('car1/80.png',{timeout:20_000})
  brokenCar=false;await page.getByRole('button',{name:'重试载入'}).click()
  await expect(page.getByTestId('interaction-panel')).toContainText('原告胜诉',{timeout:20_000})
  await expect(page.getByLabel('速度')).toHaveValue('2')
  const defendant=page.getByTestId('player-list').locator('li').nth(targetId-1)
  await expect(defendant).toContainText('拘留 2天')
  await page.getByTestId('interaction-acknowledge').click()
  await playUntil(page,()=>defendant.textContent().then(text=>!!text&&!text.includes('拘留')),2500)
  await expect(defendant).toContainText('21,41')
})
