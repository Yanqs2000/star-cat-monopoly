import { test,expect,type Page } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { revealGameDetails, playUntil } from './modern-play'
async function start(page:Page){
 await page.addInitScript(()=>{const original=crypto.getRandomValues.bind(crypto);crypto.getRandomValues=a=>{if(a instanceof Uint32Array&&a.length===1){a[0]=104;return a}return original(a)};Date.prototype.getDay=()=>1;Date.prototype.getFullYear=()=>2026;Date.prototype.getMonth=()=>8;Date.prototype.getDate=()=>28})
 await page.goto('/modern.html');await page.setViewportSize({width:1440,height:1000});await page.getByTestId('character-1').click();await page.getByRole('button',{name:'开始对局'}).click();await expect(page.getByRole('status')).toContainText('对局已载入');await revealGameDetails(page); await page.getByLabel('速度').selectOption('2')
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
test('游乐场与发券反馈预加载后断网仍能暂停、完成与唯一发券',async({page})=>{
 test.setTimeout(180_000);await start(page)
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));let lateRequests=0
 for(const pattern of ['**/assets/activities/**','**/assets/characters/*/reactions/**'])await page.route(pattern,route=>{lateRequests++;return route.fulfill({status:404,body:''})})
 await playUntil(page,()=>humanEntry(page),7000)
 const stage=page.getByTestId('carnival-original')
 await expect(stage.locator('canvas')).toBeVisible()
 await expect(page.getByRole('status',{name:'活动素材加载'})).toHaveCount(0)
 await page.getByRole('button',{name:'暂停对局',exact:true}).click();const frame=await stage.getAttribute('data-frame')
 await page.waitForTimeout(250);await expect(stage).toHaveAttribute('data-frame',frame!)
 await page.getByRole('button',{name:'继续对局',exact:true}).click()
 await expect(page.getByTestId('interaction-panel')).toContainText('游乐场奖券到账',{timeout:45000})
 const credited=await page.getByTestId('player-list').locator('li').first().textContent()
 await page.getByRole('button',{name:'暂停对局',exact:true}).click();await page.waitForTimeout(250)
 expect(await page.getByTestId('player-list').locator('li').first().textContent()).toBe(credited)
 await expect(page.getByRole('alert')).toHaveCount(0);expect(lateRequests).toBe(0);expect(errors).toEqual([])
})
