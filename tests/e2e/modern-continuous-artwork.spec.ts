import{expect,test,type Page}from'@playwright/test'
import{readFile,mkdir}from'node:fs/promises'
import{revealGameDetails}from'./modern-play'
const evidence='/tmp/starcat-18-21-game'
test.use({viewport:{width:1440,height:1000}})
const state=async(page:Page)=>JSON.parse((await page.getByTestId('game-state-fingerprint').getAttribute('data-state-json'))!)
async function load(page:Page,scenario:string,profile='hd'){
 await mkdir(evidence,{recursive:true})
 const snapshot=JSON.parse(await readFile(new URL('../fixtures/continuous-'+scenario+'-snapshot.json',import.meta.url),'utf8')),stamp=snapshot.savedAt
 await page.route('**/api/session',r=>r.fulfill({json:{csrfToken:'fixture-only'}}))
 await page.route('**/api/saves',r=>r.fulfill({json:{slots:[{slot:1,revision:1,savedAt:stamp,summary:{round:1,date:'连续动画回放',players:snapshot.state.players.map((p:{name:string})=>p.name)}},{slot:2,revision:0,savedAt:null,summary:null},{slot:3,revision:0,savedAt:null,summary:null}]}}))
 await page.route('**/api/saves/1',r=>r.fulfill({json:{slot:1,revision:1,snapshot}}))
 await page.addInitScript(profile=>localStorage.setItem('star-cat-monopoly:asset-profile',profile),profile)
 await page.goto('/modern.html');await expect(page.getByTestId('character-1')).toBeVisible();await expect(page.getByTestId('asset-profile-busy')).toHaveCount(0)
 await page.getByRole('button',{name:'读取存档',exact:true}).click();await page.getByTestId('load-slot-1').click()
 await expect(page.getByRole('status')).toContainText('对局已载入',{timeout:90000});await revealGameDetails(page)
}
async function pause(page:Page){await page.getByRole('button',{name:'暂停对局',exact:true}).click()}
async function resume(page:Page){await page.getByRole('button',{name:'继续对局',exact:true}).click()}
async function watch(page:Page){
 await page.evaluate(()=>{
  const w=window as any;w.continuousSamples=[];w.diceBounds=[]
  function checkDice(){
   const ludo=document.querySelector('[data-testid="ludo-original"]'),svg=ludo?.querySelector('svg');
   if(svg&&ludo!.getAttribute('data-stage')!=='betting'){
    const viewport=svg.getBoundingClientRect(),dice=[...svg.querySelectorAll('[data-placement]')].map(e=>e.getBoundingClientRect());
    if(dice.length)w.diceBounds.push({source:ludo!.getAttribute('data-stage')==='rolling'?Number(ludo!.getAttribute('data-frame')):40,clipped:dice.some(r=>r.left<viewport.left-1||r.top<viewport.top-1||r.right>viewport.right+1||r.bottom>viewport.bottom+1)});
   }requestAnimationFrame(checkDice);
  }requestAnimationFrame(checkDice)
  new MutationObserver(()=>{
   const canvas=document.querySelector('canvas')!,ludo=document.querySelector('[data-testid="ludo-original"]'),dice=ludo?.querySelector('[data-overlay-clip="ludo-dice"]')
   if(dice)w.continuousSamples.push({id:'ludo-dice',source:Number(ludo!.getAttribute('data-frame')),display:Number(dice.getAttribute('data-display-frame')),pose:ludo!.querySelector('[data-placement="tz1"]')?.getAttribute('transform')})
   const id=canvas?.getAttribute('data-activity-clip');if(id==='car1'||id==='car2')w.continuousSamples.push({id,source:Number(canvas.getAttribute('data-activity-source-frame')),display:Number(canvas.getAttribute('data-activity-frame'))})
  }).observe(document.body,{attributes:true,subtree:true,attributeFilter:['data-frame','data-display-frame','data-activity-frame','data-activity-source-frame']})
 })
}
for(const profile of ['hd','original'])test(profile+'真实三骰下注开奖：连续位移、暂停冻结、点数和奖券只结算一次',async({page})=>{
 test.setTimeout(150000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await load(page,'ludo',profile);await watch(page)
 await page.getByRole('button',{name:'掷骰',exact:true}).click();await expect(page.getByTestId('ludo-cell-7')).toBeEnabled()
 const before=await state(page);await page.getByTestId('ludo-cell-7').click();await page.getByTestId('ludo-confirm').click()
 await expect.poll(async()=>Number(await page.getByTestId('ludo-original').getAttribute('data-frame')),{intervals:[10,20,30]}).toBeGreaterThan(5)
 await pause(page)
 const transforms=await page.locator('[data-placement]').evaluateAll(es=>es.map(e=>e.getAttribute('transform'))),frozen=await state(page)
 await page.waitForTimeout(180);expect(await page.locator('[data-placement]').evaluateAll(es=>es.map(e=>e.getAttribute('transform')))).toEqual(transforms);expect(await state(page)).toEqual(frozen)
 await page.screenshot({path:evidence+'/'+profile+'-dice-paused.png'});await resume(page)
 await expect(page.getByTestId('interaction-panel')).toContainText('投注结果',{timeout:12000})
 const paid=await state(page);expect(paid.interaction.notice.receipt.ticketDebit).toBe(100);expect(before.tickets[1]).toBe(100)
 await page.waitForTimeout(180);expect((await state(page)).tickets).toEqual(paid.tickets)
 if(profile==='hd'){
  const samples=await page.evaluate(()=>(window as any).continuousSamples.filter((s:any)=>s.id==='ludo-dice'))
  expect(samples.some((s:any)=>s.display%2===0&&s.source<17)).toBe(true)
  expect(samples.some((s:any,i:number)=>i>0&&s.source===samples[i-1].source&&s.pose!==samples[i-1].pose)).toBe(true)
 }
 const bounds=await page.evaluate(()=>(window as any).diceBounds);expect(bounds.length).toBeGreaterThan(10);expect(bounds.some((b:any)=>b.source===40)).toBe(true);expect(bounds.filter((b:any)=>b.clipped)).toEqual([]);console.log(profile+' dice bounds: '+bounds.length+' samples,0 clipped')
 await page.screenshot({path:evidence+'/'+profile+'-dice-result.png'});expect(errors).toEqual([])
})
for(const [scenario,id]of [['dog','car2'],['court','car1']] as const)test('21 '+id+'真实进场转运：60Hz子帧、暂停冻结和原业务时点',async({page})=>{
 test.setTimeout(150000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await load(page,scenario);await watch(page)
 await page.getByRole('button',{name:'掷骰',exact:true}).click()
 if(scenario==='court'){await page.getByTestId('court-target-2').click();await page.getByTestId('court-case-0').click()}
 const canvas=page.locator('canvas');await expect(canvas).toHaveAttribute('data-activity-clip',id,{timeout:20000})
 await expect.poll(async()=>Number(await canvas.getAttribute('data-activity-source-frame')),{intervals:[10,20,30]}).toBeGreaterThan(8)
 await pause(page);const source=await canvas.getAttribute('data-activity-source-frame'),display=await canvas.getAttribute('data-activity-frame'),frozen=await state(page)
 await page.waitForTimeout(180);await expect(canvas).toHaveAttribute('data-activity-source-frame',source!);await expect(canvas).toHaveAttribute('data-activity-frame',display!);expect(await state(page)).toEqual(frozen)
 await page.screenshot({path:evidence+'/'+id+'-paused.png'});await resume(page);await page.getByLabel('速度',{exact:true}).selectOption('2')
 await expect(page.getByTestId('interaction-acknowledge')).toBeVisible({timeout:15000})
 const samples=await page.evaluate(id=>(window as any).continuousSamples.filter((s:any)=>s.id===id),id)
 expect(samples.some((s:any)=>s.display%2===0)).toBe(true)
 const after=await state(page),statuses=Object.values(after.world.statuses) as any[]
 expect(statuses.some(s=>s.state===(scenario==='dog'?3:2))).toBe(true)
 await page.screenshot({path:evidence+'/'+id+'-complete.png'});expect(errors).toEqual([])
})
for(const [scenario,id]of [['portal','show2'],['theft','show-npc4']] as const)test('19 '+id+'真实提示文字保持登记、可暂停并继续',async({page})=>{
 test.setTimeout(150000);await load(page,scenario);await page.getByRole('button',{name:'掷骰',exact:true}).click()
 if(scenario==='portal')await page.getByTestId('portal-5').click()
 const panel=page.locator('svg[data-clip="'+id+'"]');await expect(panel).toBeVisible({timeout:15000});await pause(page)
 const text=await panel.locator('.original-text').allTextContents();expect(text.some(t=>t.trim().length>0)).toBe(true)
 const image=await panel.locator('image').first().getAttribute('href');await page.waitForTimeout(160);await expect(panel.locator('image').first()).toHaveAttribute('href',image!)
 await page.screenshot({path:evidence+'/'+id+'-actual-text.png'});await resume(page);await expect(page.getByTestId('interaction-acknowledge')).toBeVisible({timeout:10000})
})
