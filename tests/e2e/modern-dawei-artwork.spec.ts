import{test,expect,type Page}from'@playwright/test'
import{readFile,mkdir,writeFile}from'node:fs/promises'
import artwork from'../../src/modern/data/dawei-complete.json' with{type:'json'}
import cases from'../fixtures/dawei-cases.json' with{type:'json'}
import{revealGameDetails,playUntil}from'./modern-play'
import {expectPresentedMap} from './modern-artwork-visibility'
const out='/tmp/starcat-dawei-game'
test.use({viewport:{width:1440,height:1000},launchOptions:{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:[]}})
const state=async(p:Page)=>JSON.parse((await p.getByTestId('game-state-fingerprint').getAttribute('data-state-json'))!)
async function load(page:Page,name:string,profile='hd'){
 await mkdir(out,{recursive:true});const snapshot=JSON.parse(await readFile(new URL('../fixtures/dawei-'+name+'.json',import.meta.url),'utf8'))
 await page.route('**/api/session',r=>r.fulfill({json:{csrfToken:'fixture-only'}}))
 await page.route('**/api/saves',r=>r.fulfill({json:{slots:[{slot:1,revision:1,savedAt:snapshot.savedAt,summary:{round:1,date:'大尾与卷毛实测',players:snapshot.state.players.map((p:any)=>p.name)}},{slot:2,revision:0,savedAt:null,summary:null},{slot:3,revision:0,savedAt:null,summary:null}]}}))
 await page.route('**/api/saves/1',r=>r.fulfill({json:{slot:1,revision:1,snapshot}}))
 await page.addInitScript(profile=>localStorage.setItem('star-cat-monopoly:asset-profile',profile),profile)
 await page.goto('/modern.html');await expect(page.getByTestId('character-8')).toBeVisible();await expect(page.getByTestId('asset-profile-busy')).toHaveCount(0)
 if(profile==='hd')await expect(page.getByTestId('character-8').locator('img')).toHaveAttribute('src',/characters-25\/role-08\/thumbnail/)
 await page.getByRole('button',{name:'读取存档',exact:true}).click();await page.getByTestId('load-slot-1').click()
 await expect(page.getByRole('status')).toContainText('对局已载入',{timeout:90000});await revealGameDetails(page);await expectPresentedMap(page)
}
async function hashImage(page:Page,selector:string){return page.locator(selector).evaluate(async(image:HTMLImageElement)=>{const bytes=await(await fetch(image.currentSrc)).arrayBuffer();return[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('')})}
function health(page:Page){const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});return errors}
for(const profile of['hd','original'])test('Dawei + Juanmao '+profile+' real movement, support contact, pause and UI',async({page})=>{
 test.setTimeout(150000);const errors=health(page);await load(page,'pair',profile);const canvas=page.locator('canvas').first()
 if(profile==='hd'){
  const a=JSON.parse((await canvas.getAttribute('data-character25'))!)[0],j=JSON.parse((await canvas.getAttribute('data-character24'))!)[0]
  expect(a.characterId).toBe(8);expect(a.contacts).toHaveLength(2);expect(a.registration).toEqual([28,20]);expect(j.registration).toEqual([28,20])
 }else{await expect(canvas).toHaveAttribute('data-character25','[]');await expect(canvas).toHaveAttribute('data-character24','[]')}
 await page.screenshot({path:out+'/'+profile+'-pair-neutral.png'})
 await page.evaluate(()=>{const w=window as any;w.pairSamples=[];const tick=()=>{const c=document.querySelector('canvas')!;w.pairSamples.push({t:performance.now(),a:JSON.parse(c.dataset.character25??'[]')[0],j:JSON.parse(c.dataset.character24??'[]')[0]});requestAnimationFrame(tick)};requestAnimationFrame(tick)})
 await page.getByRole('button',{name:'掷骰',exact:true}).click()
 if(profile==='hd')await expect.poll(()=>page.evaluate(()=>(window as any).pairSamples.filter((s:any)=>s.a?.action==='walk').length),{intervals:[10,20]}).toBeGreaterThan(4)
 await page.getByRole('button',{name:'暂停对局',exact:true}).click();const frozen=[await canvas.getAttribute('data-character24'),await canvas.getAttribute('data-character25')]
 await page.waitForTimeout(180);expect([await canvas.getAttribute('data-character24'),await canvas.getAttribute('data-character25')]).toEqual(frozen)
 await page.screenshot({path:out+'/'+profile+'-pair-paused.png'});await page.getByRole('button',{name:'继续对局',exact:true}).click()
 await playUntil(page,async()=>{const s=await state(page);return s.activePlayerIndex===1&&s.phase==='awaiting-roll'},80)
 await page.getByRole('button',{name:'掷骰',exact:true}).click()
 await playUntil(page,async()=>{const s=await state(page);return s.activePlayerIndex===2&&s.phase==='awaiting-roll'},80)
 if(profile==='hd'){
  const samples=await page.evaluate(()=>(window as any).pairSamples);const stats=[]
  await writeFile(out+'/pair-motion-samples.json',JSON.stringify(samples))
  for(const[key,stride,prefix]of[['a',18,'main/'],['j',24,'']]as const){
   const moving=samples.filter((s:any)=>s[key]?.action==='walk');expect(moving.length).toBeGreaterThan(8);let count=0,drift=0
   if(key==='a'){
    for(let i=1;i<samples.length;i++)for(const f of samples[i].a?.contacts??[]){const previous=samples[i-1].a?.contacts?.find((p:any)=>p.key===f.key);if(f.support&&previous?.support&&f.contactId===previous.contactId){drift=Math.max(drift,Math.hypot(f.x-previous.x,f.y-previous.y));count++}}
   }else{
   for(let i=1;i<moving.length;i++){const a=moving[i-1][key],b=moving[i][key];if(a.facing!==b.facing||b.distance<=a.distance||b.distance-a.distance>stride/2)continue
    for(const[side,start,end]of[['left',0,stride/2],['right',stride/2,stride]]as const){const pa=a.distance%stride,pb=b.distance%stride;if(pa<start||pb>=end||pb<pa)continue
     const x=a.parts.find((p:any)=>p[0]===prefix+side+'Foot'),y=b.parts.find((p:any)=>p[0]===prefix+side+'Foot');if(!x||!y)continue
     drift=Math.max(drift,Math.hypot(b.x+y[1]-a.x-x[1],b.y+y[2]-a.y-x[2]));count++}
   }
   }
   console.log(JSON.stringify({actor:key,moving:moving.length,supportChecks:count,drift}));expect(count).toBeGreaterThan(4);expect(drift).toBeLessThan(.01)
   const times=moving.slice(1).map((b:any,i:number)=>b.t-moving[i].t).filter((t:number)=>t<100).sort((a:number,b:number)=>a-b)
   expect(times[Math.floor(times.length*.95)]).toBeLessThan(50);stats.push({actor:key,samples:moving.length,supportChecks:count,maxSupportDrift:drift,rafMedianMs:times[Math.floor(times.length*.5)],rafP95Ms:times[Math.floor(times.length*.95)]})
  }
  await writeFile(out+'/pair-motion-evidence.json',JSON.stringify(stats,null,2));console.log(JSON.stringify(stats))
 }
 expect(errors).toEqual([])
})
for(const route of cases.walkTurns)test('Dawei continuous6cell turn route '+route.scenario,async({page})=>{
 test.setTimeout(150000);const errors=health(page);await load(page,route.scenario)
 await page.evaluate(()=>{const w=window as any;w.turnSamples=[];const tick=()=>{const a=JSON.parse(document.querySelector('canvas')!.dataset.character25??'[]')[0];if(a)w.turnSamples.push({...a,t:performance.now()});requestAnimationFrame(tick)};requestAnimationFrame(tick)})
 await page.getByRole('button',{name:'掷骰',exact:true}).click();await expect.poll(()=>page.evaluate(()=>(window as any).turnSamples.filter((a:any)=>a.distance>350).length),{timeout:15000,intervals:[20,40]}).toBeGreaterThan(0)
 await page.waitForTimeout(300)
 const samples=await page.evaluate(()=>(window as any).turnSamples),facings=new Set(samples.filter((s:any)=>s.distance>0).map((s:any)=>s.facing));expect(facings.size).toBeGreaterThan(1)
 let checks=0,maxDrift=0
 for(let i=1;i<samples.length;i++)for(const f of samples[i].contacts??[]){const p=samples[i-1].contacts?.find((p:any)=>p.key===f.key);if(p?.support&&f.support&&p.contactId===f.contactId){maxDrift=Math.max(maxDrift,Math.hypot(f.x-p.x,f.y-p.y));checks++}}
 await writeFile(out+'/'+route.scenario+'-contacts.json',JSON.stringify({checks,maxDrift,facings:[...facings],sourceDirections:route.directions,samples},null,2));expect(checks).toBeGreaterThan(30);expect(maxDrift).toBeLessThan(.01)
 await page.screenshot({path:out+'/'+route.scenario+'.png'});expect(errors).toEqual([])
})
test('Dawei six possession overlays use their new decoded artwork in the actual map',async({page})=>{
 test.setTimeout(180000);const errors=health(page)
 for(const id of[2,3,4,5,10,11]){
  await page.unrouteAll();await load(page,'god-'+id)
  await expect.poll(async()=>JSON.parse((await page.locator('canvas').first().getAttribute('data-character25'))!)[0]?.god).toMatchObject({id,visible:true,url:'hd-characters/characters-25/role-02/god-'+id+'.webp'})
  await page.screenshot({path:out+'/god-'+id+'.png'})
 }
 expect(errors).toEqual([])
})
for(const name of['happy','sad','hurt'])test('Dawei real '+name+' reaction and pause',async({page})=>{
 test.setTimeout(150000);const errors=health(page);await load(page,name)
 await page.getByRole('button',{name:'掷骰',exact:true}).click()
 await expect.poll(async()=>JSON.parse((await page.locator('canvas').first().getAttribute('data-character25'))!)[0]?.action,{intervals:[10,20],timeout:20000}).toBe(name)
 await page.waitForTimeout(name==='hurt'?800:500);await page.getByRole('button',{name:'暂停对局',exact:true}).click()
 const frozen=await page.locator('canvas').first().getAttribute('data-character25');await page.waitForTimeout(160);await expect(page.locator('canvas').first()).toHaveAttribute('data-character25',frozen!)
 await page.screenshot({path:out+'/reaction-'+name+'.png'});expect(errors).toEqual([])
})
for(const c of cases.portals)test('Dawei native flight heading '+c.heading,async({page})=>{
 test.setTimeout(150000);const errors=health(page);await load(page,c.scenario);await page.getByRole('button',{name:'掷骰',exact:true}).click()
 await page.getByTestId('portal-'+c.destination).click();const canvas=page.locator('canvas').first()
 await expect(canvas).toHaveAttribute('data-activity-clip','fly-8-'+c.heading,{timeout:15000});await expect(canvas).toHaveAttribute('data-activity-url','hd-characters/characters-25/role-08/fly-'+c.heading+'.webp')
 await page.waitForTimeout(450);await page.getByRole('button',{name:'暂停对局',exact:true}).click();const before=await state(page);await page.waitForTimeout(160);expect(await state(page)).toEqual(before)
 await page.screenshot({path:out+'/flight-'+c.heading+'.png'});await page.getByRole('button',{name:'继续对局',exact:true}).click();await expect(page.getByTestId('interaction-acknowledge')).toBeVisible({timeout:20000});expect(errors).toEqual([])
})
test('Dawei carnival uses120Hz source-registered running, keyboard movement, pause, scoring and cheer',async({page})=>{
 test.setTimeout(150000);const errors=health(page);await load(page,'carnival');await page.getByRole('button',{name:'掷骰',exact:true}).click();const stage=page.getByTestId('carnival-original')
 await expect(stage).toBeVisible();await expect(stage).toHaveAttribute('data-stage','play',{timeout:15000})
 await stage.getByRole('application').focus();await page.keyboard.down('ArrowRight');await page.waitForTimeout(450)
 await expect(stage.locator('canvas')).toHaveAttribute('data-carnival-boy-url',/role-08\/carnival-right-/)
 await page.keyboard.up('ArrowRight');await page.keyboard.down('ArrowLeft');await page.waitForTimeout(450)
 await expect(stage.locator('canvas')).toHaveAttribute('data-carnival-boy-url',/role-08\/carnival-left-/)
 await page.keyboard.up('ArrowLeft');await page.getByRole('button',{name:'暂停对局',exact:true}).click();const before=await state(page)
 // WebGL clears its readback buffer after presentation; compare visible compositor pixels.
 const pixels=await stage.locator('canvas').screenshot();await page.waitForTimeout(180);expect(await state(page)).toEqual(before)
 const after=await stage.locator('canvas').screenshot();if(!after.equals(pixels)){await writeFile(out+'/pause-before.png',pixels);await writeFile(out+'/pause-after.png',after)}expect(after.equals(pixels)).toBe(true)
 await page.screenshot({path:out+'/carnival-paused.png'});await page.getByRole('button',{name:'继续对局',exact:true}).click()
 await expect.poll(async()=>JSON.parse((await page.locator('canvas').first().getAttribute('data-character25'))!)[0]?.action,{timeout:35000,intervals:[20,40]}).toBe('cheer')
 await page.waitForTimeout(650);await page.getByRole('button',{name:'暂停对局',exact:true}).click();await page.screenshot({path:out+'/carnival-cheer.png'});expect(errors).toEqual([])
})
test('Dawei monthly, wallet and actual outcome use the same canonical champion image',async({page})=>{
 test.setTimeout(180000);const errors=health(page);await load(page,'monthly');await page.getByRole('button',{name:'掷骰',exact:true}).click()
 await expect(page.getByTestId('monthly-champion')).toBeVisible({timeout:15000});const expected=artwork.assets.find(a=>a.source==='assets/monthly/champions/8.png')!.sha256
 expect(await hashImage(page,'[data-testid="monthly-champion"] img')).toBe(expected);await page.screenshot({path:out+'/monthly.png'})
 await page.unrouteAll();await load(page,'endgame');await expect(page.getByTestId('endgame-panel')).toBeVisible();expect(await hashImage(page,'[data-testid="endgame-actor-art"]')).toBe(expected);await page.screenshot({path:out+'/outcome.png'});expect(errors).toEqual([])
})
