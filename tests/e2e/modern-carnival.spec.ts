import { test,expect,type Page } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { playUntil } from './modern-play'
async function start(page:Page){
 await page.addInitScript(()=>{const original=crypto.getRandomValues.bind(crypto);crypto.getRandomValues=a=>{if(a instanceof Uint32Array&&a.length===1){a[0]=104;return a}return original(a)};Date.prototype.getDay=()=>1;Date.prototype.getFullYear=()=>2026;Date.prototype.getMonth=()=>8;Date.prototype.getDate=()=>28})
 await page.goto('/modern.html');await page.setViewportSize({width:1440,height:1000});await page.getByTestId('character-1').click();await page.getByRole('button',{name:'开始对局'}).click();await expect(page.getByRole('status')).toContainText('对局已载入');await page.getByLabel('速度').selectOption('2')
}
const humanEntry=async(page:Page)=>{const who=await page.getByTestId('current-player').textContent();return !!who&&!who.includes('AI')&&await page.getByTestId('carnival-original').count()>0}
test('自然seed104第1轮真20秒接物：原Pixi素材、键鼠、暂停、发券与释放输入',async({page})=>{
 test.setTimeout(360_000);await mkdir('.analysis-cache/acceptance-3c',{recursive:true});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.stack ?? e.message));await start(page)
 await playUntil(page,()=>humanEntry(page),7000)
 const stage=page.getByTestId('carnival-original');await expect(stage.locator('canvas')).toBeVisible({timeout:15000});await expect(stage).toHaveAttribute('data-stage','play',{timeout:10000})
 const started=Date.now();await page.keyboard.down('ArrowLeft');await page.waitForTimeout(250);await expect(stage).toHaveAttribute('data-boy-pose','2');await expect.poll(async()=>Number(await stage.getAttribute('data-boy-frame'))).toBeGreaterThan(2);await page.screenshot({path:'.analysis-cache/acceptance-3c/seed104-carnival-walking-1440x1000.png'});await page.keyboard.up('ArrowLeft')
 await expect.poll(async()=>Number(await stage.getAttribute('data-x'))).toBeLessThan(400)
 await page.getByRole('button',{name:'暂停对局',exact:true}).click();const frame=await stage.getAttribute('data-frame');await page.waitForTimeout(250);await expect(stage).toHaveAttribute('data-frame',frame!)
 await page.screenshot({path:'.analysis-cache/acceptance-3c/seed104-carnival-pause-1440x1000.png'});await page.getByRole('button',{name:'继续对局',exact:true}).click()
 const box=await stage.boundingBox();await page.mouse.move(box!.x+box!.width*700/800,box!.y+box!.height/2)
 await expect.poll(async()=>Number(await stage.getAttribute('data-x'))).toBe(700)
 await page.waitForTimeout(3000);await expect(stage).toHaveAttribute('data-stage','play');await page.screenshot({path:'.analysis-cache/acceptance-3c/seed104-carnival-play-1440x1000.png'})
 await expect(stage).toHaveAttribute('data-stage','tally',{timeout:22000});expect(Date.now()-started).toBeGreaterThan(18500)
 await expect(page.getByTestId('interaction-panel')).toContainText('游乐场奖券到账',{timeout:15000});await page.screenshot({path:'.analysis-cache/acceptance-3c/seed104-carnival-result-1440x1000.png'});await expect(page.getByLabel('速度')).toHaveValue('2')
 await page.getByTestId('interaction-acknowledge').click();await playUntil(page,()=>page.getByRole('button',{name:'掷骰',exact:true}).isEnabled(),3000)
 await page.keyboard.press('ArrowUp');await expect(page.getByRole('button',{name:'掷骰',exact:true})).toBeDisabled();expect(errors).toEqual([])
})
test('自然游乐场入场和暂停时已发券反馈各404恢复，可继续且不重复开始或发券',async({page})=>{
 test.setTimeout(360_000);let broken=true,brokenReward=false,rewardRequested=false;let releaseReward:(()=>void)|undefined;let creditedTickets:number|null=null;const errors:string[]=[];page.on('pageerror',e=>errors.push(e.stack ?? e.message))
 await page.route('**/assets/activities/carnival-boy-1/3.png',route=>broken?route.fulfill({status:404,body:''}):route.continue())
 await page.route('**/assets/characters/1/reactions/happy/*/57.png',async route=>{
  if(!brokenReward){await route.continue();return}
  rewardRequested=true;await new Promise<void>(resolve=>{releaseReward=resolve})
  const text=await page.getByTestId('player-list').locator('li').first().textContent()
  creditedTickets=Number(text?.match(/奖券 (\d+)/)?.[1]);await route.fulfill({status:404,body:''})
 });await start(page)
 await playUntil(page,()=>page.getByRole('alert').allTextContents().then(items=>items.some(s=>s.includes('carnival-boy-1/3.png'))),7000)
 broken=false;brokenReward=true;await page.getByRole('button',{name:'重试载入'}).click();await expect(page.getByRole('status')).toContainText('对局已载入');await expect(page.getByLabel('速度')).toHaveValue('2')
 await expect(page.getByTestId('carnival-original')).toHaveAttribute('data-stage','intro')
 await expect.poll(()=>rewardRequested,{timeout:45000}).toBe(true)
 await page.getByRole('button',{name:'暂停对局',exact:true}).click();releaseReward!()
 await expect(page.getByRole('alert')).toContainText('reactions/happy/',{timeout:45000});expect(creditedTickets).not.toBeNull()
 brokenReward=false;await page.getByRole('button',{name:'重试载入'}).click()
 await expect(page.getByRole('status')).toContainText('对局已载入')
 await expect(page.getByRole('button',{name:'继续对局',exact:true})).toBeVisible()
 await expect(page.getByTestId('interaction-panel')).toHaveCount(0)
 await page.getByRole('button',{name:'继续对局',exact:true}).click()
 await expect(page.getByTestId('interaction-panel')).toContainText('游乐场奖券到账')
 await expect(page.getByTestId('player-list').locator('li').first()).toContainText(`奖券 ${creditedTickets}`)
 await expect(page.getByLabel('速度')).toHaveValue('2');expect(errors).toEqual([])
})
