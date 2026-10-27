import {chromium} from '/Users/yanqs/Documents/GitHub/vibe_coding/chat/star-cat-monopoly/.worktrees/non-character-assets/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
const OUT=process.cwd()+'/.analysis-cache/map-continuation-20261023-batch29';
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const all=[];
for(const profile of ['hd','original']){
 const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(['error','warning'].includes(m.type()))errors.push(m.type()+': '+m.text())});
 await page.route('**/src/modern/features/map/MapScene.ts',async route=>{const r=await route.fetch();let body=await r.text();const needle='\t\treturn {\n\t\t\tfocus,';if(!body.includes(needle))throw new Error('instrumentation target missing');body=body.replace(needle,'\t\twindow.__walkingReview={app,world,viewport,actors,follow,setPlayers,restoreCameraState,read:()=>({movement:movement?{...movement}:null,camera:getCameraState(),actors:actors.map(a=>({id:a.playerId,x:a.view.x,y:a.view.y,facing:a.facing,visible:a.view.visible}))})};\n'+needle);await route.fulfill({response:r,body});});
 await page.addInitScript(()=>{const original=crypto.getRandomValues.bind(crypto);crypto.getRandomValues=a=>{if(a instanceof Uint32Array&&a.length===1){a[0]=123456789;return a;}return original(a)};Date.prototype.getDay=()=>1;Date.prototype.getFullYear=()=>2026;Date.prototype.getMonth=()=>8;Date.prototype.getDate=()=>28;});
 await page.goto('http://127.0.0.1:5198/modern.html');
 await page.getByLabel('素材画质',{exact:true}).selectOption(profile);for(const id of [1,2,3,4]) await page.getByTestId(`character-${id}`).click();await page.getByRole('button',{name:'开始对局',exact:true}).click();await page.getByRole('status').filter({hasText:'对局已载入'}).waitFor({timeout:90000});
 await page.getByLabel('速度',{exact:true}).selectOption('1').catch(()=>{});
 const state=async()=>JSON.parse(await page.getByTestId('game-state-fingerprint').getAttribute('data-state-json'));
 const before=await state();await page.screenshot({path:`${OUT}/${profile}-natural-start.png`});
 const log={profile,before,rolls:[],errors};
 for(let roll=1;roll<=4;roll++){
  for(let tries=0;tries<300;tries++){
   if(await page.getByRole('button',{name:'掷骰',exact:true}).isEnabled().catch(()=>false))break;
   let acted=false;
   for(const tid of ['property-acknowledge','property-accept','interaction-acknowledge','monthly-acknowledge','portal-5','ludo-confirm']){const l=page.getByTestId(tid);if(await l.count() && await l.isEnabled()){await l.click({timeout:1000});acted=true;break}}
   if(!acted)for(const name of ['继续动画','离开卡片屋','离开银行','离开股市','离开公司']){const l=page.getByRole('button',{name,exact:true});if(await l.count() && await l.isEnabled()){await l.click({timeout:1000});acted=true;break}}
   await page.waitForTimeout(100);
  }
  if(!await page.getByRole('button',{name:'掷骰',exact:true}).isEnabled().catch(()=>false)){log.blocked=await page.locator('body').innerText();break}
  const r={roll,before:await state(),samples:[]};await page.getByRole('button',{name:'掷骰',exact:true}).click();let seen=false,screenshot=false;
  for(let i=0;i<150;i++){
   const sample=await page.evaluate(()=>window.__walkingReview.read());r.samples.push(sample);
   if(sample.movement){seen=true;if(!screenshot && sample.movement.elapsedMs>sample.movement.durationMs*.25){await page.screenshot({path:`${OUT}/${profile}-natural-roll${roll}-moving.png`});screenshot=true;}}
   if(seen && !sample.movement && (await state()).phase !== 'moving'){r.arrival=sample;break;}
   await page.waitForTimeout(60);
  }
  r.after=await state();await page.screenshot({path:`${OUT}/${profile}-natural-roll${roll}-arrival.png`});log.rolls.push(r);await fs.writeFile(`${OUT}/${profile}-progress.json`,JSON.stringify(log,null,2));
 }
 log.finalBody=await page.locator('body').innerText();all.push(log);await fs.writeFile(`${OUT}/natural-results.json`,JSON.stringify(all,null,2));await page.close();
}
await browser.close();console.log(JSON.stringify(all.map(p=>({profile:p.profile,rolls:p.rolls.map(r=>({roll:r.roll,position:r.after.players.map(p=>p.position),movingSamples:r.samples.filter(s=>s.movement).length})),errors:p.errors,blocked:p.blocked})),null,2));
