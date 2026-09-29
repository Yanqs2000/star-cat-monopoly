import { test,expect } from '@playwright/test'
for(const [scenario,url] of [['carnival-mid','carnival-ball-3/17.png'],['ludo-paid','ludo-dice/17.png']] as const) {
 test(`明确标注的${scenario}保存恢复夹具：真实原素材404冻结，重试保持资金与随机`,async({page})=>{
  test.setTimeout(60000);let broken=true;const errors:string[]=[];page.on('pageerror',e=>errors.push(e.stack ?? e.message))
  await page.route(`**/assets/activities/${url}`,route=>broken?route.fulfill({status:404,body:''}):route.continue())
  await page.goto(`/tests/fixtures/modern-activity-recovery.html?scenario=${scenario}`)
  await expect(page.getByRole('heading',{level:1})).toContainText('已保存的游戏恢复测试夹具')
  await expect(page.getByRole('alert')).toContainText(url)
  const summary=page.getByTestId('recovery-summary'),saved=JSON.parse((await summary.textContent())!)
  expect(saved.phase).toBe(scenario==='carnival-mid'?'play':'payout');expect(saved.paid).toBe(scenario==='ludo-paid')
  await page.getByTestId('recovery-advance').click();expect(JSON.parse((await summary.textContent())!)).toEqual(saved)
  broken=false;await page.getByTestId('recovery-retry').click();await expect(page.getByTestId('recovery-ready')).toHaveText('原素材已准备')
  const restored=JSON.parse((await summary.textContent())!);expect(restored).toEqual(saved)
  await page.getByTestId('recovery-advance').click();const advanced=JSON.parse((await summary.textContent())!)
  expect(advanced.frame).toBeGreaterThan(saved.frame);expect(advanced.tickets).toBe(saved.tickets)
  if(scenario==='ludo-paid') {await page.getByTestId('recovery-finish').click();const done=JSON.parse((await summary.textContent())!);expect(done.phase).toBe('notice');expect(done.tickets).toBe(saved.tickets);expect(done.rng).toBe(saved.rng)}
  expect(errors).toEqual([])
 })
}
