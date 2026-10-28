import {expect,test,type Page}from'@playwright/test'
import{mkdir,writeFile,readFile}from'node:fs/promises'
import{createHash}from'node:crypto'
import type{SaveSnapshot}from'../../src/modern/features/saves/snapshot-types'
import{playUntil,revealGameDetails,revealGameSettings}from'./modern-play'
const evidence='/tmp/starcat-effects-e2e';test.use({viewport:{width:1440,height:1000},video:{mode:'on',size:{width:1440,height:1000}}})
type Effect={id:string;frame:number;elapsedMs:number;delayMs:number;x:number;y:number;visible:boolean}
const frames=async(page:Page):Promise<Effect[]>=>JSON.parse(await page.locator('canvas').getAttribute('data-effect-frames')??'[]')
async function start(page:Page,seed:number){
 await mkdir(evidence,{recursive:true});await page.addInitScript(seed=>{localStorage.setItem('star-cat-monopoly:asset-profile','hd');const original=crypto.getRandomValues.bind(crypto);crypto.getRandomValues=array=>{if(array instanceof Uint32Array&&array.length===1){array[0]=seed;return array}return original(array)};Date.prototype.getDay=()=>1;Date.prototype.getFullYear=()=>2026;Date.prototype.getMonth=()=>8;Date.prototype.getDate=()=>27},seed)
 await page.goto('/modern.html');await page.getByLabel('素材画质').selectOption('hd');await page.getByTestId('character-1').click();await page.getByRole('button',{name:'开始对局',exact:true}).click();await expect(page.getByRole('status')).toContainText('对局已载入',{timeout:90000});await revealGameDetails(page)
 await expect(page.locator('canvas')).toHaveAttribute('data-effect-frames','[]',{timeout:5000})
}
// Read the actual canvas in the render callback, before WebGL clears its drawing buffer.
// Element screenshots also include compositor antialiasing at rounded ancestor edges.
async function canvasPixels(page:Page){return page.locator('canvas').evaluate(element=>{const canvas=element as HTMLCanvasElement;return new Promise<{png:string;visible:number}>(resolve=>requestAnimationFrame(()=>{const copy=document.createElement('canvas');copy.width=canvas.width;copy.height=canvas.height;const ctx=copy.getContext('2d')!;ctx.drawImage(canvas,0,0);const rgba=ctx.getImageData(0,0,copy.width,copy.height).data;let visible=0;for(let i=3;i<rgba.length;i+=4)if(rgba[i])visible++;resolve({png:copy.toDataURL(),visible})}))}) }
async function freeze(page:Page,id:string,resumeSpeed?:number){
 await page.getByRole('button',{name:'暂停对局',exact:true}).click()
 const before=await frames(page),image=await canvasPixels(page)
 expect(image.visible).toBeGreaterThan(1000)
 await page.waitForTimeout(220)
 expect(await frames(page)).toEqual(before)
 const after=await canvasPixels(page)
 expect(after.visible).toBe(image.visible)
 expect(createHash('sha256').update(after.png).digest('hex')).toBe(createHash('sha256').update(image.png).digest('hex'))
 await page.screenshot({path:`${evidence}/${id}-paused.png`})
 if(resumeSpeed)await page.getByLabel('速度',{exact:true}).selectOption(String(resumeSpeed))
 await page.getByRole('button',{name:'继续对局',exact:true}).click()
}

for(const[id,seed]of[['card-gain',40],['ticket-gain',131]]as const)test(`${id}自然获得后显示60fps、暂停冻结且结束清理`,async({page})=>{
 test.setTimeout(150000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await start(page,seed);await playUntil(page,async()=>Boolean((await frames(page)).find(f=>f.id===id&&f.visible)),600);await page.waitForTimeout(180);const active=(await frames(page)).find(f=>f.id===id)!;expect(active.frame).toBeGreaterThan(2);await page.screenshot({path:`${evidence}/${id}-playing.png`});await freeze(page,id,2);const reward=JSON.parse((await page.getByTestId('game-state-fingerprint').getAttribute('data-state-json'))!);if(id==='card-gain')expect(reward.inventories[1].length).toBe(6);else expect(reward.tickets[1]).toBe(210);await expect.poll(async()=>(await frames(page)).some(f=>f.id===id),{timeout:6000}).toBe(false);const after=JSON.parse((await page.getByTestId('game-state-fingerprint').getAttribute('data-state-json'))!);if(id==='card-gain')expect(after.inventories[1]).toEqual(reward.inventories[1]);else expect(after.tickets[1]).toBe(reward.tickets[1]);expect(errors).toEqual([])
})
test('fog自然帐篷过程保留源15帧开窗和18/19帧业务时钟',async({page})=>{
 test.setTimeout(150000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await start(page,103);const observed:{source:number;display:number}[]=[];await page.evaluate(()=>{const canvas=document.querySelector('canvas')!;(window as any).fogFrames=[];new MutationObserver(()=>{if(canvas.getAttribute('data-activity-clip')==='fog')(window as any).fogFrames.push({source:+canvas.getAttribute('data-activity-source-frame')!,display:+canvas.getAttribute('data-activity-frame')!})}).observe(canvas,{attributes:true})});await playUntil(page,()=>page.getByTestId('exchange-form').count().then(Boolean),1500);observed.push(...await page.evaluate(()=>(window as any).fogFrames));expect(observed.length).toBeGreaterThan(4);expect(observed.every(f=>f.source>=1&&f.source<=19&&f.display>=f.source*2-1&&f.display<=f.source*2)).toBe(true);expect(observed.some(f=>f.display%2===0)).toBe(true);await page.screenshot({path:evidence+'/fog-exchange-open.png'});await writeFile(evidence+'/fog-source-display-frames.json',JSON.stringify(observed));expect(errors).toEqual([])
})
test('火箭真实发射：原点到目标，80帧后爆炸，暂停和倍速不重复扣卡送医',async({page})=>{
 test.setTimeout(150000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await start(page,153);await page.getByRole('button',{name:'全图',exact:true}).click();const hand=page.getByTestId('hand-panel');const before=JSON.parse((await page.getByTestId('game-state-fingerprint').getAttribute('data-state-json'))!);await hand.locator('[data-card-id="9"]').click();await page.getByTestId('interaction-confirm').click();await page.getByTestId('target-player-4').click();await expect(page.getByTestId('interaction-panel')).toContainText('飞弹已经发射');await expect.poll(async()=>(await frames(page)).some(f=>f.id==='rocket'&&f.visible)).toBe(true);const beginning=await frames(page),blast=beginning.find(f=>f.id==='explosion')!;expect(blast.visible).toBe(false);const launch=beginning.find(f=>f.id==='rocket')!;expect([launch.x,launch.y]).toEqual([before.players[0].position.column*56,before.players[0].position.row*40]);expect([blast.x,blast.y]).toEqual([before.players[3].position.column*56,before.players[3].position.row*40]);expect(blast.delayMs).toBeCloseTo(8000/3);await page.screenshot({path:evidence+'/rocket-launch.png'});await freeze(page,'rocket');await page.getByLabel('速度',{exact:true}).selectOption('2');await expect.poll(async()=>(await frames(page)).some(f=>f.id==='explosion'&&f.visible),{timeout:6000}).toBe(true);await page.screenshot({path:evidence+'/explosion-impact.png'});await expect(page.getByTestId('player-list').getByRole('listitem').nth(3)).toContainText('住院 3天');await expect(hand.getByTestId('hand-card')).toHaveCount(4);await expect.poll(async()=>(await frames(page)).length,{timeout:7000}).toBe(0);await expect(hand.getByTestId('hand-card')).toHaveCount(4);expect(errors).toEqual([])
})
test('通过正常读档入口构造踩雷局，实际掷骰触发爆炸和唯一送医',async({page})=>{
 test.setTimeout(150000);await mkdir(evidence,{recursive:true});const snapshot=JSON.parse(await readFile(new URL('../fixtures/effects-mine-snapshot.json',import.meta.url),'utf8'))as SaveSnapshot,game=snapshot.state,stamp=snapshot.savedAt
 await page.route('**/api/session',r=>r.fulfill({json:{csrfToken:'fixture-only'}}));await page.route('**/api/saves',r=>r.fulfill({json:{slots:[{slot:1,revision:1,savedAt:stamp,summary:{round:1,date:'踩雷验证',players:game.players.map(p=>p.name)}},{slot:2,revision:0,savedAt:null,summary:null},{slot:3,revision:0,savedAt:null,summary:null}]}}));await page.route('**/api/saves/1',r=>r.fulfill({json:{slot:1,revision:1,snapshot}}));await page.addInitScript(()=>localStorage.setItem('star-cat-monopoly:asset-profile','hd'));await page.goto('/modern.html');await expect(page.getByTestId('asset-profile-busy')).toHaveCount(0);await expect(page.getByTestId('character-1')).toBeVisible();await page.getByRole('button',{name:'读取存档',exact:true}).click();await page.getByTestId('load-slot-1').click();await expect(page.getByRole('status')).toContainText('对局已载入',{timeout:90000});await revealGameDetails(page);await page.getByRole('button',{name:'全图',exact:true}).click();await page.getByRole('button',{name:'掷骰',exact:true}).click();await expect.poll(async()=>(await frames(page)).some(f=>f.id==='explosion'&&f.visible),{timeout:15000}).toBe(true);await page.screenshot({path:evidence+'/mine-explosion.png'});await freeze(page,'mine-explosion');await expect(page.getByTestId('interaction-panel')).toContainText('踩中地雷，已送往医院');await expect(page.getByTestId('player-list').getByRole('listitem').first()).toContainText('住院 3天');await expect.poll(async()=>(await frames(page)).some(f=>f.id==='explosion'),{timeout:7000}).toBe(false)
})

test('飞弹确认后暂停切换原版与高清，保留未到时的爆炸和精确播放进度',async({page})=>{
 test.setTimeout(210000);await start(page,153)
 await page.getByTestId('hand-panel').locator('[data-card-id="9"]').click()
 await page.getByTestId('interaction-confirm').click();await page.getByTestId('target-player-4').click()
 await page.getByTestId('interaction-acknowledge').click()
 await page.getByRole('button',{name:'暂停对局',exact:true}).click()
 const before=await frames(page),state=await page.getByTestId('game-state-fingerprint').getAttribute('data-fingerprint')
 expect(before.find(f=>f.id==='explosion')?.visible).toBe(false)
 expect(before.find(f=>f.id==='explosion')!.elapsedMs).toBeLessThan(8000/3)
 await revealGameSettings(page)
 const selector=page.getByLabel('对局素材画质')
 await expect(selector).toBeEnabled()
 for(const profile of ['original','hd']){
  await selector.selectOption(profile)
  await expect.poll(()=>page.evaluate(()=>localStorage.getItem('star-cat-monopoly:asset-profile')),{timeout:90000}).toBe(profile)
  await expect(page.getByTestId('asset-profile-busy')).toHaveCount(0)
  const restored=await frames(page)
  expect(restored.map(({frame,...rest})=>rest)).toEqual(before.map(({frame,...rest})=>rest))
  expect(await page.getByTestId('game-state-fingerprint').getAttribute('data-fingerprint')).toBe(state)
 }
 await page.screenshot({path:evidence+'/missile-profile-restored.png'})
 await page.getByRole('button',{name:'继续对局',exact:true}).click()
 await expect.poll(async()=>(await frames(page)).some(f=>f.id==='explosion'&&f.visible),{timeout:6000}).toBe(true)
 await expect.poll(async()=>(await frames(page)).length,{timeout:7000}).toBe(0)
})

for(const kind of ['self','public'] as const)test(`飞弹${kind}边界实际命中多名玩家，迁移前原点固定、只扣一张卡`,async({page})=>{
 test.setTimeout(150000);await mkdir(evidence,{recursive:true})
 const snapshot=JSON.parse(await readFile(new URL(`../fixtures/effects-missile-${kind}-snapshot.json`,import.meta.url),'utf8'))as SaveSnapshot
 const initial=snapshot.state,stamp=snapshot.savedAt,origin=initial.players[0]!.position,impact=initial.players[1]!.position
 await page.route('**/api/session',r=>r.fulfill({json:{csrfToken:'fixture-only'}}))
 await page.route('**/api/saves',r=>r.fulfill({json:{slots:[{slot:1,revision:1,savedAt:stamp,summary:{round:1,date:'飞弹边界验证',players:initial.players.map(p=>p.name)}},{slot:2,revision:0,savedAt:null,summary:null},{slot:3,revision:0,savedAt:null,summary:null}]}}))
 await page.route('**/api/saves/1',r=>r.fulfill({json:{slot:1,revision:1,snapshot}}))
 await page.addInitScript(()=>localStorage.setItem('star-cat-monopoly:asset-profile','hd'))
 await page.goto('/modern.html');await expect(page.getByTestId('character-1')).toBeVisible();await expect(page.getByTestId('asset-profile-busy')).toHaveCount(0)
 await page.getByRole('button',{name:'读取存档',exact:true}).click();await page.getByTestId('load-slot-1').click()
 await expect(page.getByRole('status')).toContainText('对局已载入',{timeout:90000});await revealGameDetails(page)
 await page.getByTestId('hand-panel').locator('[data-card-id="9"]').click();await page.getByTestId('interaction-confirm').click();await page.getByTestId('target-player-2').click()
 await page.getByRole('button',{name:'暂停对局',exact:true}).click()
 const active=await frames(page)
 expect(active).toHaveLength(2)
 expect([active.find(f=>f.id==='rocket')!.x,active.find(f=>f.id==='rocket')!.y]).toEqual([origin.column*56,origin.row*40])
 expect([active.find(f=>f.id==='explosion')!.x,active.find(f=>f.id==='explosion')!.y]).toEqual([impact.column*56,impact.row*40])
 const state=JSON.parse((await page.getByTestId('game-state-fingerprint').getAttribute('data-state-json'))!)
 expect(state.world.statuses[1].state).toBe(kind==='self'?3:2)
 expect(state.world.statuses[2]).toMatchObject({state:3,days:3})
 if(kind==='public')expect(state.world.statuses[3]).toMatchObject({state:3,days:3})
 expect(state.inventories[1]).toEqual([])
 await page.screenshot({path:`${evidence}/missile-${kind}-origin.png`})
 await page.getByRole('button',{name:'继续对局',exact:true}).click()
 await page.getByLabel('速度',{exact:true}).selectOption('2')
 await expect.poll(async()=>(await frames(page)).some(f=>f.id==='explosion'&&f.visible),{timeout:6000}).toBe(true)
 await expect.poll(async()=>(await frames(page)).length,{timeout:7000}).toBe(0)
 expect(JSON.parse((await page.getByTestId('game-state-fingerprint').getAttribute('data-state-json'))!).inventories[1]).toEqual([])
})

test('高清传送飞行暂停和两倍速保持原目的地',async({page})=>{
 test.setTimeout(150000);await start(page,4);await page.getByLabel('速度',{exact:true}).selectOption('2')
 await page.evaluate(()=>{const canvas=document.querySelector('canvas')!;(window as any).fogFrames=[];new MutationObserver(()=>{if(canvas.getAttribute('data-activity-clip')==='fog')(window as any).fogFrames.push({source:+canvas.getAttribute('data-activity-source-frame')!,display:+canvas.getAttribute('data-activity-frame')!})}).observe(canvas,{attributes:true})})
 await playUntil(page,()=>page.getByTestId('portal-1').count().then(Boolean))
 await page.getByTestId('portal-1').click();await expect(page.getByTestId('portal-flight')).toBeVisible()
 await freeze(page,'hd-portal')
 await expect(page.getByTestId('interaction-panel')).toContainText('已抵达目的地',{timeout:15000})
 await expect(page.getByTestId('player-list').locator('li').first()).toContainText('31,7')
})

test('AI帐篷实际调用18帧烟雾，高清显示不进入第19源帧',async({page})=>{
 test.setTimeout(150000)
 const snapshot=JSON.parse(await readFile(new URL('../fixtures/effects-ai-fog-snapshot.json',import.meta.url),'utf8'))as SaveSnapshot,initial=snapshot.state,stamp=snapshot.savedAt
 await page.route('**/api/session',r=>r.fulfill({json:{csrfToken:'fixture-only'}}))
 await page.route('**/api/saves',r=>r.fulfill({json:{slots:[{slot:1,revision:1,savedAt:stamp,summary:{round:1,date:'AI帐篷验证',players:initial.players.map(p=>p.name)}},{slot:2,revision:0,savedAt:null,summary:null},{slot:3,revision:0,savedAt:null,summary:null}]}}))
 await page.route('**/api/saves/1',r=>r.fulfill({json:{slot:1,revision:1,snapshot}}))
 await page.addInitScript(()=>{
  localStorage.setItem('star-cat-monopoly:asset-profile','hd');(window as any).fogFrames=[]
  new MutationObserver(records=>{for(const r of records){const c=r.target;if(c instanceof HTMLCanvasElement&&c.dataset.activityClip==='fog')(window as any).fogFrames.push({source:+c.dataset.activitySourceFrame!,display:+c.dataset.activityFrame!})}}).observe(document,{attributes:true,subtree:true,attributeFilter:['data-activity-clip','data-activity-source-frame','data-activity-frame']})
 })
 await page.goto('/modern.html');await expect(page.getByTestId('character-1')).toBeVisible();await expect(page.getByTestId('asset-profile-busy')).toHaveCount(0)
 await page.getByRole('button',{name:'读取存档',exact:true}).click();await page.getByTestId('load-slot-1').click()
 await expect(page.getByRole('status')).toContainText('对局已载入',{timeout:90000})
 await expect.poll(()=>page.evaluate(()=>(window as any).fogFrames.some((f:any)=>f.source===18)),{timeout:15000}).toBe(true)
 await page.getByRole('button',{name:'暂停对局',exact:true}).click()
 const samples=await page.evaluate(()=>(window as any).fogFrames)as {source:number;display:number}[]
 expect(samples.every(f=>f.source>=1&&f.source<=18&&f.display>=f.source*2-1&&f.display<=f.source*2)).toBe(true)
 await writeFile(evidence+'/fog-ai-18-frames.json',JSON.stringify(samples))
})
