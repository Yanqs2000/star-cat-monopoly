import { test,expect } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { playUntil } from './modern-play'
test('自然seed0第三轮原36格下注、暂停、三骰与唯一结算后继续日期',async({page})=>{
 test.setTimeout(180_000);await mkdir('.analysis-cache/acceptance-3c',{recursive:true})
 await page.addInitScript(()=>{const original=crypto.getRandomValues.bind(crypto);crypto.getRandomValues=a=>{if(a instanceof Uint32Array&&a.length===1){a[0]=0;return a}return original(a)};Date.prototype.getDay=()=>1;Date.prototype.getFullYear=()=>2026;Date.prototype.getMonth=()=>8;Date.prototype.getDate=()=>28})
 await page.goto('/modern.html');await page.setViewportSize({width:1440,height:1000});await page.getByTestId('character-1').click();await page.getByRole('button',{name:'开始对局'}).click();await expect(page.getByRole('status')).toContainText('对局已载入');await page.getByLabel('速度').selectOption('2')
 await playUntil(page,async()=>{const who=await page.getByTestId('current-player').textContent();return !!who&&!who.includes('AI')&&await page.getByTestId('ludo-cell-7').count()>0},2500)
 await expect(page.getByTestId('ludo-cell-7')).toBeEnabled();await expect(page.locator('[data-testid^="ludo-cell-"]')).toHaveCount(36)
 await page.getByRole('button',{name:'暂停对局',exact:true}).click();await expect(page.getByTestId('ludo-cell-7')).toBeDisabled();await page.getByRole('button',{name:'继续对局',exact:true}).click()
 await page.getByTestId('ludo-cell-7').click();await page.screenshot({path:'.analysis-cache/acceptance-3c/seed0-ludo-betting-1440x1000.png'})
 await page.getByTestId('ludo-confirm').evaluate((e:HTMLButtonElement)=>{e.click();e.click()})
 await expect.poll(async()=>Number(await page.getByTestId('ludo-original').getAttribute('data-frame'))).toBeGreaterThan(10)
 await page.getByRole('button',{name:'暂停对局',exact:true}).click();const frame=await page.getByTestId('ludo-original').getAttribute('data-frame');await page.waitForTimeout(200);await expect(page.getByTestId('ludo-original')).toHaveAttribute('data-frame',frame!)
 await page.screenshot({path:'.analysis-cache/acceptance-3c/seed0-ludo-dice-1440x1000.png'});await page.getByRole('button',{name:'继续对局',exact:true}).click()
 await expect(page.getByTestId('interaction-panel')).toContainText('投注结果',{timeout:15_000});await expect(page.getByTestId('activity-receipt')).toContainText('奖券')
 await page.screenshot({path:'.analysis-cache/acceptance-3c/seed0-ludo-result-1440x1000.png'});await expect(page.getByLabel('速度')).toHaveValue('2')
 await page.getByTestId('interaction-acknowledge').click();await playUntil(page,()=>page.getByRole('button',{name:'掷骰',exact:true}).isEnabled());await expect(page.getByTestId('round')).toContainText('4')
})

test('自然投注确认后原素材404恢复保留已扣券和下注，重复确认无效',async({page})=>{
 test.setTimeout(180_000);let broken=false
 await page.route('**/assets/activities/ludo-game/1.png',route=>broken?route.fulfill({status:404,body:''}):route.continue())
 await page.addInitScript(()=>{const original=crypto.getRandomValues.bind(crypto);crypto.getRandomValues=a=>{if(a instanceof Uint32Array&&a.length===1){a[0]=0;return a}return original(a)};Date.prototype.getDay=()=>1;Date.prototype.getFullYear=()=>2026;Date.prototype.getMonth=()=>8;Date.prototype.getDate=()=>28})
 await page.goto('/modern.html');await page.setViewportSize({width:1440,height:1000});await page.getByTestId('character-1').click();await page.getByRole('button',{name:'开始对局'}).click();await expect(page.getByRole('status')).toContainText('对局已载入');await page.getByLabel('速度').selectOption('2')
 await playUntil(page,async()=>{const who=await page.getByTestId('current-player').textContent();return !!who&&!who.includes('AI')&&await page.getByTestId('ludo-cell-7').count()>0},2500)
 await expect(page.getByTestId('ludo-cell-7')).toBeEnabled();await page.getByTestId('ludo-cell-7').click();broken=true
 await page.getByTestId('ludo-confirm').click();await expect(page.getByRole('alert')).toContainText('ludo-game/1.png')
 broken=false;await page.getByRole('button',{name:'重试载入'}).click();await expect(page.getByRole('status')).toContainText('对局已载入')
 await expect(page.getByLabel('速度')).toHaveValue('2');await expect(page.getByTestId('ludo-confirm')).toHaveCount(0)
 await expect(page.getByTestId('interaction-panel')).toContainText('投注结果',{timeout:15000})
})
