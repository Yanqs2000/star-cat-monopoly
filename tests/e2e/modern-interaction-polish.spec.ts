import { test, expect } from '@playwright/test'

for (const viewport of [{width:1366,height:768},{width:390,height:844}]) for (const scenario of ['bank','stock','shop','dice','credit','target','bank-result','credit-result','god']) test(`${viewport.width}px ${scenario}图文交互检查`, async({page})=>{
 await page.setViewportSize(viewport);await page.goto(`/tests/fixtures/modern-interaction-polish.html?scenario=${scenario}`)
 const panel=page.getByTestId('interaction-panel');await expect(panel).toBeVisible()
 const failures:string[]=[];page.on('pageerror',error=>failures.push(error.message));page.on('console',msg=>{if(msg.type()==='error')failures.push(msg.text())})
 await expect.poll(()=>panel.locator('img').evaluateAll(images=>images.every(image=>(image as HTMLImageElement).complete&&(image as HTMLImageElement).naturalWidth>0))).toBe(true)
 if(scenario==='bank'){await page.getByTestId('bank-operation').selectOption('deposit');await page.getByTestId('bank-amount').fill('250')}
 if(scenario==='stock')await page.getByTestId('stock-shares').fill('3')
 await page.screenshot({path:`/tmp/interaction-polish-${scenario}-${viewport.width}.png`})
 if(scenario==='bank')await expect(panel.getByTestId('player-wallet')).toBeVisible()
 else if(scenario==='stock')await expect(panel.getByTestId('stock-quote')).toBeVisible()
 else if(scenario==='dice')await expect(panel.locator('.dice img')).toHaveCount(6)
 else if(scenario==='target')await expect(panel.locator('.targets img')).toHaveCount(3)
 else if(scenario==='bank-result')await expect(panel.locator('.finance-change')).toHaveCount(2)
 else if(scenario==='credit-result')await expect(panel.getByTestId('notice-art')).toHaveAttribute('alt','信用卡')
 else if(scenario==='god')await expect(panel.getByTestId('notice-art')).toBeVisible()
 if(scenario==='shop'){const card=panel.getByTestId('shop-slot').first();const price=(await card.locator('small').boundingBox())!,box=(await card.boundingBox())!;expect(price.y+price.height).toBeLessThanOrEqual(box.y+box.height-1)}
 for(const button of await panel.locator('.actions>button,button.result-continue').all()){const box=(await button.boundingBox())!,stage=(await page.locator('.board-surface').boundingBox())!;expect(box.y+box.height).toBeLessThanOrEqual(stage.y+stage.height);expect(await button.evaluate(element=>{const b=element.getBoundingClientRect();return element.contains(document.elementFromPoint(b.x+b.width/2,b.y+b.height/2))})).toBe(true)}
 expect(failures).toEqual([])
})
