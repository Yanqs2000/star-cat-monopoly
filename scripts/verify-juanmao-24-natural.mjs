import {chromium} from 'playwright'
import {spawn} from 'node:child_process'
import {writeFile} from 'node:fs/promises'
import path from 'node:path'
const out=path.resolve('public/hd-review/character-24'),base=process.env.JUANMAO_24_BASE_URL??'http://127.0.0.1:64869'
const browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage({viewport:{width:1320,height:1030}})
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())})
await page.goto(`${base}/hd-review/character-24/index.html`);await page.waitForFunction(()=>window.juanmao24Review?.ready)
await page.getByRole('button',{name:'自然移动',exact:true}).click()
await page.evaluate(()=>window.juanmao24Review.beginNatural())
const speed=Math.hypot(56,40)/(16000/30)*1000
const samples=[]
for(const d of [2,3,5,7,10]){
 await page.evaluate(t=>window.juanmao24Review.sampleNatural(t),d/speed*1000)
 samples.push(await page.evaluate(()=>window.juanmao24Review.footWorldPositions()))
}
let maxSupportDrift=0
for(let i=1;i<samples.length;i++)for(let direction=0;direction<4;direction++){
 const a=samples[0][direction].feet[0],b=samples[i][direction].feet[0]
 maxSupportDrift=Math.max(maxSupportDrift,Math.hypot(b.x-a.x,b.y-a.y))
}
if(maxSupportDrift>0.000001)throw new Error(`World foot slip ${maxSupportDrift}`)
await page.evaluate(()=>window.juanmao24Review.beginNatural())
const encoder=spawn('/opt/homebrew/bin/ffmpeg',['-y','-loglevel','error','-f','image2pipe','-vcodec','png','-framerate','60','-i','-','-vf','pad=ceil(iw/2)*2:ceil(ih/2)*2','-c:v','libx264','-pix_fmt','yuv420p','-crf','18',path.join(out,'juanmao-24-natural-60fps.mp4')],{stdio:['pipe','ignore','pipe']})
let encodeError='';encoder.stderr.on('data',c=>encodeError+=c);encoder.stdin.on('error',e=>console.error(e.message,encodeError))
for(let frame=0;frame<240;frame++){
 await page.evaluate(t=>window.juanmao24Review.sampleNatural(t),frame*1000/60)
 if(frame===75)await page.screenshot({path:path.join(out,'natural-world-grounded-desktop.png')})
 if(!encoder.stdin.write(await page.locator('canvas').screenshot()))await new Promise(r=>encoder.stdin.once('drain',r))
}
encoder.stdin.end();const code=await new Promise(r=>encoder.once('close',r));if(code!==0)throw new Error(encodeError)
const verification={checkedAt:new Date().toISOString(),status:'candidate-awaiting-user-review',flow:'controller 533.333ms for diagonal grid movement (56,40); same-frame actual root position drives 24px gait cycle',sceneSpeedPxPerSecond:speed,adaptiveCycleMs:24000/speed,standaloneCycleMs:800,maxSupportFootWorldDriftPx:maxSupportDrift,footAnchorSamples:samples,video:{file:'juanmao-24-natural-60fps.mp4',fps:60,frames:240},errors,scope:'bundled candidate natural movement harness using real controller speed; final MapScene integration checked separately'}
await writeFile(path.join(out,'natural-movement-verification.json'),JSON.stringify(verification,null,2)+'\n')
console.log(JSON.stringify({...verification,footAnchorSamples:undefined}))
await browser.close();if(errors.length)process.exitCode=1
