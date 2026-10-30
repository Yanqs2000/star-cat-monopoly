import {chromium}from'playwright'
import {mkdir,writeFile}from'node:fs/promises'
import assert from'node:assert/strict'
const base=process.env.CHARACTER_REVIEW_URL??'http://127.0.0.1:64867/hd-review/characters-22-24/index.html'
const out='/tmp/starcat-22-24-review';await mkdir(out,{recursive:true})
const browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],failed=[]
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('response',r=>{if(r.status()>=400)failed.push([r.status(),r.url()])})
await page.goto(base);await page.waitForFunction(()=>window.CharacterArtworkReview?.ready)
assert.match(await page.title(),/22–24/);assert.equal(await page.locator('#npcs .card').count(),11);assert.equal(await page.locator('#icons .card').count(),11);assert.equal(await page.locator('#traits .card').count(),6)
const bounds=await page.evaluate(()=>{
 const {npc,original}=window.CharacterArtworkReview.data;const failures=[];let samples=0
 for(const c of [...npc.worldClips,...original.world]){
  const m=npc.motion.find(m=>m.id===c.id),dy=c.frames[0].url.startsWith('hd-characters/')?Math.min(...m.outerTrack.map(t=>t.y)):0
  for(const f of c.frames){samples++;if(75+f.offsetX<0||75+f.offsetX+f.width>210||130+f.offsetY+dy<0||130+f.offsetY+f.height>210)failures.push([c.id,f])}
 }return{samples,failures}
});assert.deepEqual(bounds.failures,[])
for(const time of [0,150,450,733,1350,2500,3500,35999]){
 await page.evaluate(t=>window.CharacterArtworkReview.setTime(t),time)
 await page.locator('#npcs').screenshot({path:out+'/npc-'+time+'.png'})
}
await page.locator('#pause').click();await page.waitForTimeout(150);assert.ok(await page.evaluate(()=>window.CharacterArtworkReview.elapsed>35999))
await page.getByLabel('NPC时间轴').fill('850');await page.getByLabel('NPC时间轴').dispatchEvent('input')
assert.equal(await page.evaluate(()=>window.CharacterArtworkReview.elapsed),850)
const frozen=await page.locator('#npcs canvas').first().evaluate(c=>c.toDataURL());await page.waitForTimeout(120);assert.equal(await page.locator('#npcs canvas').first().evaluate(c=>c.toDataURL()),frozen)
await page.locator('#traits').screenshot({path:out+'/traits.png'})
await page.locator('#character24').scrollIntoViewIfNeeded()
const frame=page.frames().find(f=>f.url().includes('/character-24/index.html'));assert.ok(frame)
await frame.waitForFunction(()=>window.juanmao24Review?.ready)
for(const action of ['neutral','ready','walk','happy','sad','hurt','cheer']){
 await frame.evaluate(a=>window.juanmao24Review.sample(a,900),action)
 await frame.locator('canvas').screenshot({path:out+'/juanmao-'+action+'.png'})
}
await frame.getByRole('button',{name:'自然移动',exact:true}).click()
assert.match(await frame.locator('#status').innerText(),/自然移动/)
await frame.locator('canvas').screenshot({path:out+'/juanmao-natural.png'})
await page.setViewportSize({width:390,height:844});await page.goto(base);await page.waitForFunction(()=>window.CharacterArtworkReview?.ready)
assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
await page.screenshot({path:out+'/mobile.png'})
assert.deepEqual(errors,[]);assert.deepEqual(failed,[])
const result={url:base,browser:'local Chrome / Playwright; Browser plugin unavailable',viewports:['1440x1000','390x844'],npcCards:11,canonicalIcons:11,staticNarratives:6,bounds,playPauseSeek:true,sevenActionsFourDirections:true,errors,failed}
await writeFile(out+'/verification.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));await browser.close()
