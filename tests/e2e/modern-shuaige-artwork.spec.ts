import{test,expect,type Page}from'@playwright/test'
import{readFile,mkdir,writeFile}from'node:fs/promises'
import artwork from'../../src/modern/data/shuaige-complete.json' with{type:'json'}
import cases from'../fixtures/shuaige-cases.json' with{type:'json'}
import{revealGameDetails,playUntil}from'./modern-play'
import {expectPresentedMap} from './modern-artwork-visibility'
const out='/tmp/starcat-shuaige-game'
test.use({viewport:{width:1440,height:1000},launchOptions:{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:[]}})
const state=async(p:Page)=>JSON.parse((await p.getByTestId('game-state-fingerprint').getAttribute('data-state-json'))!)
async function load(page:Page,name:string,profile='hd'){
 await mkdir(out,{recursive:true});const snapshot=JSON.parse(await readFile(new URL('../fixtures/shuaige-'+name+'.json',import.meta.url),'utf8'))
 await page.route('**/api/session',r=>r.fulfill({json:{csrfToken:'fixture-only'}}))
 await page.route('**/api/saves',r=>r.fulfill({json:{slots:[{slot:1,revision:1,savedAt:snapshot.savedAt,summary:{round:1,date:'帅戈与卷毛实测',players:snapshot.state.players.map((p:any)=>p.name)}},{slot:2,revision:0,savedAt:null,summary:null},{slot:3,revision:0,savedAt:null,summary:null}]}}))
 await page.route('**/api/saves/1',r=>r.fulfill({json:{slot:1,revision:1,snapshot}}))
 await page.addInitScript(profile=>localStorage.setItem('star-cat-monopoly:asset-profile',profile),profile)
 await page.goto('/modern.html');await expect(page.getByTestId('character-7')).toBeVisible();await expect(page.getByTestId('asset-profile-busy')).toHaveCount(0)
 if(profile==='hd')await expect(page.getByTestId('character-7').locator('img')).toHaveAttribute('src',/characters-25\/role-07\/thumbnail/)
 await page.getByRole('button',{name:'读取存档',exact:true}).click();await page.getByTestId('load-slot-1').click()
 await expect(page.getByRole('status')).toContainText('对局已载入',{timeout:90000});await revealGameDetails(page);await expectPresentedMap(page)
}
async function hashImage(page:Page,selector:string){return page.locator(selector).evaluate(async(image:HTMLImageElement)=>{const bytes=await(await fetch(image.currentSrc)).arrayBuffer();return[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('')})}
function health(page:Page){const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});return errors}

function floatingEvidence(samples:any[]){
 const moving=samples.filter(s=>s.a?.action==='walk'&&s.a.visible)
 expect(moving.length).toBeGreaterThan(10)
 let checks=0,maxPanVelocity=0
 for(const s of moving){
  expect(s.a.contacts).toEqual([]);expect(s.a.parts.find((p:any)=>p[0]==='main/head')[3]).toBe(0)
  const pans=s.a.parts.filter((p:any)=>/^main\/(left|right)Pan$/.test(p[0]));expect(pans).toHaveLength(2)
  for(const p of pans)expect(p[3]).toBe(0)
 }
 for(let i=1;i<moving.length;i++){
  const a=moving[i-1],b=moving[i],dt=b.t-a.t
  if(dt<=0||dt>100||a.a.facing!==b.a.facing)continue
  for(const key of['main/leftPan','main/rightPan']){
   const old=a.a.parts.find((p:any)=>p[0]===key),now=b.a.parts.find((p:any)=>p[0]===key)
   maxPanVelocity=Math.max(maxPanVelocity,Math.hypot(now[1]-old[1],now[2]-old[2])/dt);checks++
  }
 }
 const y=moving.map(s=>s.a.parts.find((p:any)=>p[0]==='main/leftPan')[2]),panRange=Math.max(...y)-Math.min(...y)
 expect(panRange).toBeGreaterThan(.1);expect(checks).toBeGreaterThan(8);expect(maxPanVelocity).toBeLessThan(.06)
 const intervals=moving.slice(1).map((s:any,i:number)=>s.t-moving[i].t).filter((t:number)=>t>0).sort((a:number,b:number)=>a-b)
 const rafMedianMs=intervals[Math.floor(intervals.length*.5)],rafP95Ms=intervals[Math.floor(intervals.length*.95)]
 expect(rafP95Ms).toBeLessThan(50)
 return{moving:moving.length,checks,maxPanVelocity,headRoll:0,panRoll:0,panRange,rafMedianMs,rafP95Ms}
}
for(const profile of ['hd','original'])test('Shuaige + Juanmao '+profile+' native floating motion, pause and UI',async({page})=>{
 test.setTimeout(150000);const errors=health(page);await load(page,'pair',profile);const canvas=page.locator('canvas').first()
 if(profile==='hd')expect(JSON.parse((await canvas.getAttribute('data-character25'))!)[0].characterId).toBe(7)
 else{await expect(canvas).toHaveAttribute('data-character25','[]');await expect(canvas).toHaveAttribute('data-character24','[]')}
 await page.screenshot({path:out+'/'+profile+'-pair-neutral.png'})
 await page.evaluate(()=>{const w=window as any;w.floatSamples=[];const tick=()=>{const c=document.querySelector('canvas')!;w.floatSamples.push({t:performance.now(),a:JSON.parse(c.dataset.character25??'[]')[0]});requestAnimationFrame(tick)};requestAnimationFrame(tick)})
 await page.getByRole('button',{name:'掷骰',exact:true}).click()
 if(profile==='hd')await expect.poll(()=>page.evaluate(()=>(window as any).floatSamples.filter((s:any)=>s.a?.action==='walk').length),{intervals:[10,20]}).toBeGreaterThan(4)
 await page.getByRole('button',{name:'暂停对局',exact:true}).click();const frozen=await canvas.getAttribute('data-character25');const pixels=await canvas.screenshot();await page.waitForTimeout(160);expect(await canvas.getAttribute('data-character25')).toBe(frozen);expect((await canvas.screenshot()).equals(pixels)).toBe(true)
 await page.screenshot({path:out+'/'+profile+'-pair-paused.png'});await page.getByRole('button',{name:'继续对局',exact:true}).click()
 await playUntil(page,async()=>{const s=await state(page);return s.activePlayerIndex===1&&s.phase==='awaiting-roll'},80)
 await page.getByRole('button',{name:'掷骰',exact:true}).click();await playUntil(page,async()=>{const s=await state(page);return s.activePlayerIndex===2&&s.phase==='awaiting-roll'},80)
 if(profile==='hd'){const evidence=floatingEvidence(await page.evaluate(()=>(window as any).floatSamples));await writeFile(out+'/pair-floating.json',JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence))}
 expect(errors).toEqual([])
})
for(const route of cases.walkTurns)test('Shuaige continuous6cell floating turn '+route.scenario,async({page})=>{
 test.setTimeout(150000);const errors=health(page);await load(page,route.scenario)
 await page.evaluate(()=>{const w=window as any;w.floatSamples=[];const tick=()=>{const a=JSON.parse(document.querySelector('canvas')!.dataset.character25??'[]')[0];if(a)w.floatSamples.push({a,t:performance.now()});requestAnimationFrame(tick)};requestAnimationFrame(tick)})
 await page.getByRole('button',{name:'掷骰',exact:true}).click()
 await expect.poll(()=>page.evaluate(()=>(window as any).floatSamples.some((s:any)=>s.a.distance>350)),{timeout:18000,intervals:[20,40]}).toBe(true)
 await page.waitForTimeout(200);const samples=await page.evaluate(()=>(window as any).floatSamples),evidence=floatingEvidence(samples)
 const facings=[...new Set(samples.filter((s:any)=>s.a.distance>0).map((s:any)=>s.a.facing))];expect(facings.length).toBeGreaterThan(1)
 await writeFile(out+'/'+route.scenario+'-floating.json',JSON.stringify({...evidence,facings,samples},null,2));await page.screenshot({path:out+'/'+route.scenario+'.png'});expect(errors).toEqual([])
})
test('Shuaige six possession overlays use their new decoded artwork in the actual map',async({page})=>{
 test.setTimeout(180000);const errors=health(page)
 for(const id of[2,3,4,5,10,11]){
  await page.unrouteAll();await load(page,'god-'+id)
  await expect.poll(async()=>JSON.parse((await page.locator('canvas').first().getAttribute('data-character25'))!)[0]?.god).toMatchObject({id,visible:true,url:'hd-characters/characters-25/role-02/god-'+id+'.webp'})
  await page.screenshot({path:out+'/god-'+id+'.png'})
 }
 expect(errors).toEqual([])
})
for(const name of['happy','sad','hurt'])test('Shuaige real '+name+' reaction and pause',async({page})=>{
 test.setTimeout(150000);const errors=health(page);await load(page,name)
 await page.getByRole('button',{name:'掷骰',exact:true}).click()
 await expect.poll(async()=>JSON.parse((await page.locator('canvas').first().getAttribute('data-character25'))!)[0]?.action,{intervals:[10,20],timeout:20000}).toBe(name)
 await page.waitForTimeout(name==='hurt'?800:500);await page.getByRole('button',{name:'暂停对局',exact:true}).click()
 const frozen=await page.locator('canvas').first().getAttribute('data-character25');await page.waitForTimeout(160);await expect(page.locator('canvas').first()).toHaveAttribute('data-character25',frozen!)
 await page.screenshot({path:out+'/reaction-'+name+'.png'});expect(errors).toEqual([])
})
for(const c of cases.portals)test('Shuaige native flight heading '+c.heading,async({page})=>{
 test.setTimeout(150000);const errors=health(page);await load(page,c.scenario);await page.getByRole('button',{name:'掷骰',exact:true}).click()
 await page.getByTestId('portal-'+c.destination).click();const canvas=page.locator('canvas').first()
 await expect(canvas).toHaveAttribute('data-activity-clip','fly-7-'+c.heading,{timeout:15000});await expect(canvas).toHaveAttribute('data-activity-url','hd-characters/characters-25/role-07/fly-'+c.heading+'.webp')
 await page.waitForTimeout(450);await page.getByRole('button',{name:'暂停对局',exact:true}).click();const before=await state(page);await page.waitForTimeout(160);expect(await state(page)).toEqual(before)
 await page.screenshot({path:out+'/flight-'+c.heading+'.png'});await page.getByRole('button',{name:'继续对局',exact:true}).click();await expect(page.getByTestId('interaction-acknowledge')).toBeVisible({timeout:20000});expect(errors).toEqual([])
})
test('Shuaige carnival uses120Hz source-registered floating, keyboard movement, pause, scoring and cheer',async({page})=>{
 test.setTimeout(150000);const errors=health(page);await load(page,'carnival');await page.getByRole('button',{name:'掷骰',exact:true}).click();const stage=page.getByTestId('carnival-original')
 await expect(stage).toBeVisible();await expect(stage).toHaveAttribute('data-stage','play',{timeout:15000})
 await stage.getByRole('application').focus();await page.keyboard.down('ArrowRight');await page.waitForTimeout(450)
 await expect(stage.locator('canvas')).toHaveAttribute('data-carnival-boy-url',/role-07\/carnival-right-/)
 await page.keyboard.up('ArrowRight');await page.keyboard.down('ArrowLeft');await page.waitForTimeout(450)
 await expect(stage.locator('canvas')).toHaveAttribute('data-carnival-boy-url',/role-07\/carnival-left-/)
 await page.keyboard.up('ArrowLeft');await page.getByRole('button',{name:'暂停对局',exact:true}).click();const before=await state(page)
 // WebGL clears its readback buffer after presentation; compare visible compositor pixels.
 const pixels=await stage.locator('canvas').screenshot();await page.waitForTimeout(180);expect(await state(page)).toEqual(before)
 const after=await stage.locator('canvas').screenshot();if(!after.equals(pixels)){await writeFile(out+'/pause-before.png',pixels);await writeFile(out+'/pause-after.png',after)}expect(after.equals(pixels)).toBe(true)
 await page.screenshot({path:out+'/carnival-paused.png'});await page.getByRole('button',{name:'继续对局',exact:true}).click()
 await expect.poll(async()=>JSON.parse((await page.locator('canvas').first().getAttribute('data-character25'))!)[0]?.action,{timeout:35000,intervals:[20,40]}).toBe('cheer')
 await page.waitForTimeout(650);await page.getByRole('button',{name:'暂停对局',exact:true}).click();await page.screenshot({path:out+'/carnival-cheer.png'});expect(errors).toEqual([])
})
test('Shuaige monthly, wallet and actual outcome use the same canonical champion image',async({page})=>{
 test.setTimeout(180000);const errors=health(page);await load(page,'monthly');await page.getByRole('button',{name:'掷骰',exact:true}).click()
 await expect(page.getByTestId('monthly-champion')).toBeVisible({timeout:15000});const expected=artwork.assets.find(a=>a.source==='assets/monthly/champions/7.png')!.sha256
 expect(await hashImage(page,'[data-testid="monthly-champion"] img')).toBe(expected);await page.screenshot({path:out+'/monthly.png'})
 await page.unrouteAll();await load(page,'endgame');await expect(page.getByTestId('endgame-panel')).toBeVisible();expect(await hashImage(page,'[data-testid="endgame-actor-art"]')).toBe(expected);await page.screenshot({path:out+'/outcome.png'});expect(errors).toEqual([])
})
