import{test,expect,type Page}from'@playwright/test'
import{readFile,mkdir}from'node:fs/promises'
import{revealGameDetails}from'./modern-play'
const out='/tmp/starcat-22-24-game'
test.use({viewport:{width:1440,height:1000},launchOptions:{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:[]}})
async function load(page:Page,scenario:string,profile='hd'){
 await mkdir(out,{recursive:true})
 const snapshot=JSON.parse(await readFile(new URL('../fixtures/character-22-24-'+scenario+'.json',import.meta.url),'utf8'))
 await page.route('**/api/session',r=>r.fulfill({json:{csrfToken:'fixture-only'}}))
 await page.route('**/api/saves',r=>r.fulfill({json:{slots:[{slot:1,revision:1,savedAt:snapshot.savedAt,summary:{round:1,date:'artwork fixture',players:snapshot.state.players.map((p:any)=>p.name)}},{slot:2,revision:0,savedAt:null,summary:null},{slot:3,revision:0,savedAt:null,summary:null}]}}))
 await page.route('**/api/saves/1',r=>r.fulfill({json:{slot:1,revision:1,snapshot}}))
 await page.addInitScript(p=>localStorage.setItem('star-cat-monopoly:asset-profile',p),profile)
 await page.goto('/modern.html');await expect(page.getByTestId('character-1')).toBeVisible();await expect(page.getByTestId('asset-profile-busy')).toHaveCount(0)
 await page.getByRole('button',{name:'读取存档',exact:true}).click();await page.getByTestId('load-slot-1').click()
 await expect(page.getByRole('status')).toContainText('对局已载入',{timeout:90000});await revealGameDetails(page)
}
for(const profile of ['hd','original'])test('22/24 '+profile+' production world, movement, registration and pause',async({page})=>{
 test.setTimeout(150000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await load(page,'world',profile)
 const canvas=page.locator('canvas');if(profile==='hd')await page.waitForTimeout(3800)
 if(profile==='original'){
  await expect(canvas).toHaveAttribute('data-npc22','[]');await expect(canvas).toHaveAttribute('data-character24','[]')
 }else{
  await expect.poll(async()=>JSON.parse((await canvas.getAttribute('data-npc22'))!).length).toBe(11)
  const npc=JSON.parse((await canvas.getAttribute('data-npc22'))!)
  expect(npc.every((n:any)=>n.url.startsWith('hd-characters/npc-22/'))).toBe(true)
  const actor=JSON.parse((await canvas.getAttribute('data-character24'))!)[0];expect(actor.registration).toEqual([28,20])
 }
 await page.evaluate(()=>{const w=window as any;w.characterSamples=[];function sample(){const c=document.querySelector('canvas'),a=JSON.parse(c?.getAttribute('data-character24')??'[]')[0];if(a?.action==='walk')w.characterSamples.push({...a,rafTime:performance.now()});requestAnimationFrame(sample)}requestAnimationFrame(sample)})
 await page.getByRole('button',{name:'掷骰',exact:true}).click()
 if(profile==='hd')await expect.poll(async()=>page.evaluate(()=>(window as any).characterSamples.length),{intervals:[10,20,30]}).toBeGreaterThan(4)
 await page.getByRole('button',{name:'暂停对局',exact:true}).click()
 const actors=await canvas.getAttribute('data-character24'),npcs=await canvas.getAttribute('data-npc22')
 await page.waitForTimeout(150);await expect(canvas).toHaveAttribute('data-character24',actors!);await expect(canvas).toHaveAttribute('data-npc22',npcs!)
 await page.screenshot({path:out+'/'+profile+'-map-paused.png'})
 await page.getByRole('button',{name:'继续对局',exact:true}).click();await page.waitForTimeout(900)
 if(profile==='hd'){
  const samples=await page.evaluate(()=>(window as any).characterSamples);let checks=0,maxDrift=0
  for(let i=1;i<samples.length;i++){
   const a=samples[i-1],b=samples[i];if(a.facing!==b.facing||b.distance<=a.distance||b.distance-a.distance>5)continue
   for(const [side,start,end]of [['left',0,12],['right',12,24]]as const){
    const pa=a.distance%24,pb=b.distance%24;if(pa<start||pb>=end||pb<pa)continue
    const x=a.parts.find((p:any)=>p[0]===side+'Foot'),y=b.parts.find((p:any)=>p[0]===side+'Foot');if(!x||!y)continue
    const drift=Math.hypot((b.x+y[1])-(a.x+x[1]),(b.y+y[2])-(a.y+x[2]));maxDrift=Math.max(maxDrift,drift);checks++
   }
  }
  expect(checks).toBeGreaterThan(4);expect(maxDrift).toBeLessThan(.01);const intervals=samples.slice(1).flatMap((b:any,i:number)=>b.distance>samples[i].distance&&b.facing===samples[i].facing?[b.rafTime-samples[i].rafTime]:[]).sort((a:number,b:number)=>a-b);const renderer=await page.evaluate(()=>{const gl=document.querySelector('canvas')!.getContext('webgl2');if(!gl)return 'unknown';const ext=gl.getExtension('WEBGL_debug_renderer_info');return gl.getParameter(ext?ext.UNMASKED_RENDERER_WEBGL:gl.RENDERER)});console.log(JSON.stringify({renderer,profile,samples:samples.length,supportChecks:checks,maxSupportDriftPx:maxDrift,rafMedianMs:intervals[Math.floor(intervals.length*.5)],rafP95Ms:intervals[Math.floor(intervals.length*.95)]}))
 }
 expect(errors).toEqual([])
})
for(const [scenario,id]of [['npc9',9],['npc12',12],['npc13',13],['npc14',14],['npc15',15],['lost23',23]]as const)test('23 actual '+scenario+' narrative text, pause and completion',async({page})=>{
 test.setTimeout(150000);const errors:string[]=[],requests:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('/hd-characters/npc-23/'))requests.push(r.url())})
 await load(page,scenario);await page.getByRole('button',{name:'掷骰',exact:true}).click()
 const panel=page.locator('svg[data-clip="trait-'+id+'"]');await expect(panel).toBeVisible({timeout:20000})
 await page.getByRole('button',{name:'暂停对局',exact:true}).click()
 expect(requests.some(url=>url.endsWith('/trait-'+id+'.webp'))).toBe(true)
 const text=await panel.locator('.original-text').allTextContents();expect(text.some(t=>t.trim().length>0)).toBe(true)
 const frame=await panel.getAttribute('data-display-frame');await page.waitForTimeout(120);await expect(panel).toHaveAttribute('data-display-frame',frame!)
 await panel.screenshot({path:out+'/trait-'+id+'-live-text.png'})
 await page.getByRole('button',{name:'继续对局',exact:true}).click()
 await expect(page.getByTestId('interaction-acknowledge')).toBeVisible({timeout:20000});expect(errors).toEqual([])
})
