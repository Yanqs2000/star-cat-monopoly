import {test,expect} from '@playwright/test'
import {readFile,mkdir,writeFile} from 'node:fs/promises'
import {revealGameDetails,playUntil} from './modern-play'
const out='/tmp/starcat-guaika-weiwei/quartet'
test.use({viewport:{width:1440,height:1000},launchOptions:{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:[]}})

test('both complete candidates and accepted Juanmao/A-Niu play four native turns together',async({page})=>{
 test.setTimeout(180000);await mkdir(out,{recursive:true})
 const snapshot=JSON.parse(await readFile(new URL('../fixtures/next-character-quartet.json',import.meta.url),'utf8')),errors:string[]=[]
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())})
 await page.route('**/api/session',r=>r.fulfill({json:{csrfToken:'fixture-only'}}))
 await page.route('**/api/saves',r=>r.fulfill({json:{slots:[{slot:1,revision:1,savedAt:snapshot.savedAt,summary:{round:1,date:'四人高清兼容',players:snapshot.state.players.map((p:any)=>p.name)}},{slot:2,revision:0,savedAt:null,summary:null},{slot:3,revision:0,savedAt:null,summary:null}]}}))
 await page.route('**/api/saves/1',r=>r.fulfill({json:{slot:1,revision:1,snapshot}}))
 await page.addInitScript(()=>localStorage.setItem('star-cat-monopoly:asset-profile','hd'))
 await page.goto('/modern.html');await expect(page.getByTestId('character-11').locator('img')).toHaveAttribute('src',/role-11\/thumbnail/);await expect(page.getByTestId('character-6').locator('img')).toHaveAttribute('src',/role-06\/thumbnail/)
 await expect(page.getByTestId('asset-profile-busy')).toHaveCount(0);await page.getByRole('button',{name:'读取存档',exact:true}).click();await page.getByTestId('load-slot-1').click();await expect(page.getByRole('status')).toContainText('对局已载入',{timeout:90000});await revealGameDetails(page)
 const canvas=page.locator('canvas').first(),actors=JSON.parse((await canvas.getAttribute('data-character25'))!)
 expect(actors.map((a:any)=>a.characterId).sort((a:number,b:number)=>a-b)).toEqual([2,6,11]);expect(JSON.parse((await canvas.getAttribute('data-character24'))!)).toHaveLength(1)
 await page.evaluate(()=>{const w=window as any;w.quartet=[];const tick=()=>{const c=document.querySelector('canvas')!;w.quartet.push({t:performance.now(),actors:JSON.parse(c.dataset.character25??'[]'),juanmao:JSON.parse(c.dataset.character24??'[]')});requestAnimationFrame(tick)};requestAnimationFrame(tick)})
 const state=async()=>JSON.parse((await page.getByTestId('game-state-fingerprint').getAttribute('data-state-json'))!)
 for(let turn=0;turn<4;turn++){
  await expect(page.getByRole('button',{name:'掷骰',exact:true})).toBeEnabled();await page.getByRole('button',{name:'掷骰',exact:true}).click()
  await playUntil(page,async()=>{const s=await state();return s.activePlayerIndex===(turn+1)%4&&s.phase==='awaiting-roll'},100)
  await page.screenshot({path:out+'/turn-'+(turn+1)+'.png'})
 }
 const samples=await page.evaluate(()=>(window as any).quartet),counts:Record<string,number>={}
 for(const id of [11,6,2]){const moving=samples.flatMap((s:any)=>s.actors.filter((a:any)=>a.characterId===id&&a.action==='walk'&&a.distance>0));counts[id]=moving.length;expect(moving.length).toBeGreaterThan(8);if(id===6)for(const a of moving)expect(a.contacts).toEqual([])}
 counts[1]=samples.flatMap((s:any)=>s.juanmao.filter((a:any)=>a.action==='walk'&&a.distance>0)).length;expect(counts[1]).toBeGreaterThan(8)
 await writeFile(out+'/evidence.json',JSON.stringify({counts,errors},null,2));expect(errors).toEqual([])
})
